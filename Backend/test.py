import asyncio
from src.connection.connections import get_db_pool
from src.embeddings.embedder import google_embedding,hug_embedding
from src.vectordb.vectordb import StoreManager
from src.Ingestion.loaders import load_document
from src.retrieval.retriever import hybrid_search_retriever
from src.llm.query_transformation import query_rewrite_expand
from pprint import pprint
from src.agent_call import call_agent
from src.tools.tool import register_common_tools
from src.memory.memory_manager import MemoryManager

from src.prompts.compress_prompt import compress_prompt

async def main():
   
    res = await call_agent("tell me about the debt including the legal notice/action through civil courts")
   
    print(res)
    
    
    
   
asyncio.run(main())