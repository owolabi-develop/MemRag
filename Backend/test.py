import asyncio
from src.connection.connections import get_db_pool
from src.embeddings.embedder import google_embedding,hug_embedding
from src.vectordb.vectordb import StoreManager
from src.Ingestion.loaders import load_document
from src.retrieval.retriever import hybrid_search_retriever
from src.llm.query_transformation import query_rewrite_expand
from pprint import pprint

from src.prompts.compress_prompt import compress_prompt

async def main():
    # file = r"C:\Users\user\Desktop\MemRag\Backend\src\sampleDoc\report.pdf"
  
    # await load_document(file)
    query = await query_rewrite_expand("don’t work in the real world. Scripted sales pitches")
    res = await hybrid_search_retriever(query,k=3)
    comp_p = await compress_prompt(res,query)
    pprint(comp_p,indent=4)
    post= comp_p.find(query)
    print(post)
    
    
   
asyncio.run(main())