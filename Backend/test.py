import asyncio
import uuid
from src.retrieval.retriever import hybrid_search_retriever
from src.llm.query_transformation import query_rewrite_expand
from pprint import pprint
from src.agent_call import call_agent
from src.memory.memory_manager import MemoryManager
from src.llm.llm_client import client

async def main():
    
    res = await query_rewrite_expand("what is the total about sale make last week")   
    print(res) 
       
    
    
   
asyncio.run(main())