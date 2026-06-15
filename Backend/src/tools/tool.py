from datetime import datetime
import os
from src.connection.connections import get_db_pool
from .toolbox import ToolBox
from src.utils.helper import summarise_context_window, summarize_conversation
from src.vectordb.vectordb import StoreManager
from src.retrieval.retriever import hybrid_search_retriever
from src.memory.memory_manager import MemoryManager

manager = MemoryManager()

tool= ToolBox(manager)


async def read_toolbox(query: str, k: int = 3) -> list[str]:
    """
    Search the toolbox for functions that can help solve a problem or complete a task.
    
    Use this tool when:
    - You encounter an error or unexpected output and need a different approach
    - The currently available tools don't seem sufficient for the task
    - You need to discover what capabilities are available for a specific problem
    - You want to find alternative functions that might handle edge cases better
    
    Args:
        query: A natural language description of what you're trying to accomplish
               or the problem you're trying to solve. Be specific about the task
               or error you're encountering for better results.
        k: Number of relevant tools to return (default: 5)
    
    Returns:
        A list of tool definitions that semantically match your query,
        including their names, descriptions, and parameter schemas.
    
    Example queries:
        - "fetch and store document content"
        - "summarize long text and save to memory"
    """
    return await manager.read_toolbox(query, k=k)



async def expand_summary(summary_id: str) -> str:
    
    """
    Expand a summary reference to retrieve the original conversations.

    Use when you need more details from a [Summary ID: xxx] reference.
    Returns all original messages that were summarized, in chronological order with timestamps.
    """
    # Get the summary text for context
    summary_text = await manager.read_summary_memory(summary_id)

    # Get the original conversations that were summarized
    original_conversations = await manager.read_conversations_by_summary_id(summary_id)

    return f"""
            ## Summary Context
                {summary_text}

                {original_conversations}
            """
            
async def summarize_and_store(text: str, thread_id: str = None) -> str:
    """
    Summarize long text and store in memory.

    If thread_id is provided, summarize unsummarized conversation units from that thread
    and mark exactly those units with the generated summary_id.
    """
    if thread_id:
        result = await summarize_conversation(thread_id)
        if result.get("status") == "nothing_to_summarize":
            return f"No unsummarized messages found for thread {thread_id}."
        return f"Stored as [Summary ID: {result['id']}] {result['description']}"

    result = await summarise_context_window(text, manager)
    if result.get("status") == "nothing_to_summarize":
        return "No content to summarize."
    return f"Stored as [Summary ID: {result['id']}] {result['description']}"
            

async def read_knowledge_base_sales(query: str, k: int = 3) -> str:
    """
        Search for sale documents.
        Args:
            query: contain sale document topic 
            k: Number of relevant tools to return (default: 5)
        
        Returns:
          document contain sale details
            
        """

    results = await hybrid_search_retriever(query,table_name="semantic_memory_sales",k=k)
    return results


async def read_knowledge_base_insurance(query: str, k: int = 3) -> str:
    """
      Search for insurance documents.
            Args:
                query: contain insurance document topic 
                k: Number of relevant tools to return (default: 5)
            
            Returns:
              document contain insurance details
    """
    results = await hybrid_search_retriever(query,table_name="semantic_memory_insurance",k=k)
    return results


async def read_knowledge_base_policy(query: str, k: int = 3) -> str:
    """
          Search for policy documents.
                Args:
                    query: contain policy document topic 
                    k: Number of relevant tools to return (default: 5)
                
                Returns:
                  document contain policy details
        """
    results = await hybrid_search_retriever(query,table_name="semantic_memory_policy",k=k)
    return results

async def read_knowledge_base_technical(query: str, k: int = 3) -> str:
  
    """
        Search for technical documents.
            Args:
                query: contain technical document topic 
                k: Number of relevant tools to return (default: 5)
            
            Returns:
                document contain technical details
        """
    results = await hybrid_search_retriever(query,table_name="semantic_memory_technical",k=k)
    return results

async def register_common_tools(): 
    print("registering common tool and keep reference for lookup")
    await tool.register_tool(read_knowledge_base_technical)
    await tool.register_tool(read_knowledge_base_insurance)
    await tool.register_tool(read_knowledge_base_policy)
    await tool.register_tool(read_knowledge_base_sales)
    await tool.register_tool(summarize_and_store)
    await tool.register_tool(summarize_conversation)
    await tool.register_tool(read_toolbox)
    await tool.register_tool(expand_summary)
    

TOOL_BY_NAME = {
                "summarize_and_store":summarize_and_store,
                "summarize_conversation":summarize_conversation,
                "read_toolbox":read_toolbox,
                "expand_summary":expand_summary,
                "read_knowledge_base_insurance":read_knowledge_base_insurance,
                "read_knowledge_base_policy":read_knowledge_base_policy,
                "read_knowledge_base_sales":read_knowledge_base_sales,
                "read_knowledge_base_technical":read_knowledge_base_technical
                }