from google.genai import types
import time
from src.llm.query_transformation import query_rewrite_expand
from src.utils.helper import calculate_context_usage, offload_to_summary
import json as json_lib
from src.prompts.prompts import AGENT_SYSTEM_PROMPT
import asyncio
import uuid
from google import genai
from google.genai import errors
from src.exceptions.llm_except import LLMError,LLMRateLimitError,AuthenticationError,ResourceExhausted,InvalidArgumentError,UnavailableError
from src.connection.connections import get_db_pool
from src.memory.memory_manager import MemoryManager
from src.guardrails.guardrails import output_guard
from starlette.concurrency import run_in_threadpool
from src.tools.tool import (
    TOOL_BY_NAME,
    summarize_conversation,
    summarize_and_store,
    read_toolbox,
    read_knowledge_base,
    expand_summary,
)
from src.citations.resolver import resolve_citations
from src.cache.cache import check_cache,store_cache
from app.metrics.metrics import (cache_hit,cache_misses,
                                 total_tool_calls,tool_duration,agent_response_duration,
                                 agent_number_of_interations,
                                 agent_fail_response,
                                 tool_failures,completion_tokens,completion_tokens_total,total_tokens_count,
                                 model_prompt_tokens_count,tool_used_prompt_tokens_count)
## initialize the memory manager
memory_manager = MemoryManager()

KNOWLEDGE_BASE_TOOL_NAME = "read_knowledge_base"


async def execute_tool(
    tool_name: str, tool_args: dict, current_thread_id: str | None = None
) -> str:
    """Execute a tool by looking it up in the toolbox."""

    if tool_name not in TOOL_BY_NAME:
        return f"Error: Tool '{tool_name}' not found"

    args = dict(tool_args or {})

    # Ensure conversation summarization marks source rows in the active thread.
    if (
        tool_name == "summarize_and_store"
        and "thread_id" not in args
        and current_thread_id is not None
    ):
        args["thread_id"] = str(current_thread_id)
    return await TOOL_BY_NAME[tool_name](**args) or "Done"


async def call_gemini_chat(messages: list, tools: list = None, model: str = None,model_api_key: str = None
):
    """Call Gemini Chat generation API with tools."""
    try:
        client = genai.Client(api_key=model_api_key)
        config = types.GenerateContentConfig(
            system_instruction=AGENT_SYSTEM_PROMPT,
            tools=[types.Tool(function_declarations=tools)]
            if tools else None
        )
        res = await client.aio.models.generate_content(
                model=model, config=config, contents=messages
            )
     
        ## track llm token usage
        # tool_used_prompt_tokens_count.inc(res.usage_metadata.tool_use_prompt_token_count)
        model_prompt_tokens_count.inc(res.usage_metadata.prompt_token_count)
        total_tokens_count.inc(res.usage_metadata.total_token_count)
        completion_tokens.observe(res.usage_metadata.candidates_token_count)
        completion_tokens_total.inc(res.usage_metadata.candidates_token_count)
        return res
    except (errors.APIError,errors.ClientError,errors.ServerError) as e:
        print(f"{e} error ocure on chat")
        if isinstance(e,errors.ClientError) and e.code == 429:
            raise ResourceExhausted() from e
        elif isinstance(e,errors.ClientError) and e.code == 400:
            raise AuthenticationError() from e
        elif isinstance(e,errors.ClientError) and e.code == 401:
            raise AuthenticationError() from e
        elif isinstance(e,errors.ClientError) and e.code == 403:
            raise AuthenticationError() from e
        elif isinstance(e,errors.ClientError) and e.code == 404:
            raise InvalidArgumentError() from e
        
        elif isinstance(e,errors.ServerError) and e.code == 503:
            raise UnavailableError() from e
    


async def call_agent(user_query: str, department_id: list[uuid.UUID],
    departments: list[str],user_details: str, tenant_id: uuid.UUID,
    owner_id: uuid.UUID,session_id: uuid.UUID,model: str,model_api_key: str) -> dict:
    """Agent loop with context window monitoring and summarization.

    """
    max_iterations = 10
    # keep track of agent response time
    start = time.perf_counter()
    
    thread_id = str(owner_id)
    if results := await check_cache(user_query,thread_id,owner_id,tenant_id):
        response = {"answer":results[0]['response'],"citations":results[0]['metadata']['citations']}
        final_answer = response
         ## track cache hit
        cache_hit.inc()
        return final_answer
    else:
        ## track cache miss
        cache_misses.inc()
        query = await query_rewrite_expand(user_query,model,model_api_key) 
        
        steps = []

        all_retrieved_docs: list[dict] = []

        # Build context from memory
        print("\n" + "=" * 50)
        print("BUILDING CONTEXT...")

        async with asyncio.TaskGroup() as load_context:
            t1 = load_context.create_task(
                memory_manager.read_conversational_memory(thread_id, tenant_id, owner_id, session_id)
            )
            t2 = load_context.create_task(memory_manager.read_workflow(query, tenant_id))
            t3 = load_context.create_task(memory_manager.read_entity(query, tenant_id))
            t4 = load_context.create_task(
                memory_manager.read_summary_context(query, thread_id=thread_id)
            )

        memory_context = (
            f"{t1.result()}\n\n{t2.result()}\n\n{t3.result()}\n\n{t4.result()}\n"
        )

        usage = await calculate_context_usage(memory_context)
        if usage["percent"] > 80:
            memory_context, summaries = await offload_to_summary(
                memory_context,
                memory_manager,
                thread_id=thread_id,
            )
            usage = await calculate_context_usage(memory_context)

        context = f"# Question\n{query}\n\n Department IDS{department_id}\n\n #Tenant ID{tenant_id}\n\n{memory_context} \n Department Name: {departments}\n current userName: {user_details}"

        dynamic_tools = await memory_manager.read_toolbox(query, k=6)
        print("Tools:")

        async with asyncio.TaskGroup() as store_msg_enti:
            store_msg_enti.create_task(memory_manager.write_conversational_memory(
                    user_query, "user", thread_id, tenant_id, owner_id, session_id,{}
                )
            )

        messages = [context]
        final_answer = ""

        for iteration in range(max_iterations):

            response = await call_gemini_chat(messages, tools=dynamic_tools,model=model,model_api_key=model_api_key)
            msg = response
            if msg.candidates[0].content.parts[0].function_call:

                function_call = msg.candidates[0].content.parts[0].function_call
                messages.append(msg.candidates[0].content)

                tool_name = function_call.name
                tool_args = function_call.args
                args_display = {
                    k: (v[:50] + "..." if isinstance(v, str) and len(v) > 50 else v)
                    for k, v in tool_args.items()
                }
                print(f"{tool_name}")
                
                total_tool_calls.labels(tool_name=tool_name).inc()
            
                try:
                    start_tool_exc = time.perf_counter()
                    result = await execute_tool(
                        tool_name, tool_args, current_thread_id=thread_id
                    )
                    status = "success"
                    error_message = None
                    steps.append(f"{tool_name}({args_display}) → success")
                    tool_duration.labels(tool_name=tool_name,status=status).observe(time.perf_counter() - start_tool_exc)
                except Exception as e:
                    result = f"Error: {e}"
                    status = "failed"
                    error_message = str(e)
                    steps.append(f"{tool_name}({args_display}) → failed")
                    tool_failures.labels(tool_name=tool_name,status=status).inc()
                # Capture citation-eligible documents from the FULL, untruncated
                if tool_name == KNOWLEDGE_BASE_TOOL_NAME and status == "success":
                    try:
                        parsed = json_lib.loads(result)
                        
                        all_retrieved_docs.extend(parsed.get("documents", []))
                    except (json_lib.JSONDecodeError, AttributeError):
                        print(f"warning: could not parse {tool_name} result for citations")

                log_id = await memory_manager.write_tool_log(
                    thread_id=thread_id,
                    tool_call_id=function_call.id,
                    tool_name=tool_name,
                    tool_args=tool_args,
                    result=result,
                    status=status,
                    error_message=error_message,
                    metadata={"iteration": iteration + 1},)

                print(f"tool result: {result}")
                
                
                if len(result) > 3000:
                    result_for_llm = (result[:3000]+ f"\n\n[Truncated for context. Full output saved in TOOL_LOG_MEMORY as log_id: {log_id}]")
                else:
                    result_for_llm = result
                result_display = (result_for_llm[:200] + "..."
                    if len(result_for_llm) > 200
                    else result_for_llm)
                function_response_part = types.Part.from_function_response(
                    name=tool_name,
                    response={"result": result_for_llm},)
                messages.append(types.Content(role="user", parts=[function_response_part]))
            else:
                final_answer = msg.text or ""
                if not final_answer:
                    candidate = msg.candidates[0]
                    
                break
            
            ## track mask agent interation
            agent_number_of_interations.inc()
            
        else:
        
            final_answer = (
                "I wasn't able to finish processing your request in time. "
                "Could you try rephrasing your question, or asking something more specific?"
            )
            agent_fail_response.inc()

        if steps:
            async with asyncio.TaskGroup() as save_wrk_flow_enti:
                save_wrk_flow_enti.create_task(memory_manager.write_workflow(query, tenant_id, department_id, steps, final_answer))
        final = await run_in_threadpool(output_guard().validate,final_answer)

        resolved = resolve_citations(final.validated_output, all_retrieved_docs)
        
        # save data to cache
        await  store_cache(user_query,thread_id,final_answer,owner_id,tenant_id,{"citations": resolved["citations"]})
        
        # track agent response time
        
        agent_response_duration.observe(time.perf_counter() - start)
        
        await memory_manager.write_conversational_memory(
            final.validated_output,
            "assistant",
            thread_id,
            tenant_id,
            owner_id,
            session_id,
            metadata={"citations": resolved["citations"]},
        )

        return resolved