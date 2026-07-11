from src.llm.llm_client import client
from google.genai import types
from src.llm.query_transformation import query_rewrite_expand
from src.utils.helper import calculate_context_usage, offload_to_summary
import json as json_lib
from src.prompts.prompts import AGENT_SYSTEM_PROMPT
import asyncio
import uuid
from src.connection.connections import get_db_pool
from src.memory.memory_manager import MemoryManager
from src.tools.tool import (
    TOOL_BY_NAME,
    summarize_conversation,
    summarize_and_store,
    read_toolbox,
    read_knowledge_base,
    expand_summary,
)
from src.citations.resolver import resolve_citations

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


async def call_gemini_chat(messages: list, tools: list = None, model: str = "gemini-3.5-flash"
):
    """Call Gemini Chat generation API with tools."""
    config = types.GenerateContentConfig(
        system_instruction=AGENT_SYSTEM_PROMPT,
        tools=[types.Tool(function_declarations=tools)]
        if tools else None
    )
    res = client.models.generate_content(
            model=model, config=config, contents=messages
        )
    return res


async def call_agent(user_query: str, department_id: list[uuid.UUID],
    departments: list[str],user_details: str, tenant_id: uuid.UUID,
    owner_id: uuid.UUID,session_id: uuid.UUID,max_iterations: int = 10) -> dict:
    """Agent loop with context window monitoring and summarization.

    Returns {"answer": str, "citations": list[dict]} instead of a bare
    string, so callers can render inline markers and a source panel.
    """

    query = await query_rewrite_expand(user_query) 
    print("query.......")
    print(query)
    thread_id = str(owner_id)
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

    context = f"# Question\n{query}\n\n Department ID{department_id}\n\n #Tenant ID{tenant_id}\n\n{memory_context} \n Department Name: {departments}\n current userName: {user_details}"

    dynamic_tools = await memory_manager.read_toolbox(query, k=6)
    print("Tools:")

    async with asyncio.TaskGroup() as store_msg_enti:
        store_msg_enti.create_task(memory_manager.write_conversational_memory(
                query, "user", thread_id, tenant_id, owner_id, session_id,{}
            )
        )

    messages = [context]
    final_answer = ""

    for iteration in range(max_iterations):

        response = await call_gemini_chat(messages, tools=dynamic_tools)
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

            try:
                result = await execute_tool(
                    tool_name, tool_args, current_thread_id=thread_id
                )
                status = "success"
                error_message = None
                steps.append(f"{tool_name}({args_display}) → success")
            except Exception as e:
                result = f"Error: {e}"
                status = "failed"
                error_message = str(e)
                steps.append(f"{tool_name}({args_display}) → failed")

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
            messages.append(types.Content(role="tool", parts=[function_response_part]))
        else:
            final_answer = msg.text or ""
            if not final_answer:
                candidate = msg.candidates[0]
                
            break
    else:
       
        final_answer = (
            "I wasn't able to finish processing your request in time. "
            "Could you try rephrasing your question, or asking something more specific?"
        )

    if steps:
        async with asyncio.TaskGroup() as save_wrk_flow_enti:
            save_wrk_flow_enti.create_task(memory_manager.write_workflow(query, tenant_id, department_id, steps, final_answer))

    resolved = resolve_citations(final_answer, all_retrieved_docs)

    await memory_manager.write_conversational_memory(
        final_answer,
        "assistant",
        thread_id,
        tenant_id,
        owner_id,
        session_id,
        metadata={"citations": resolved["citations"]},
    )

    return resolved