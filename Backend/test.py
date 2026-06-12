import asyncio
from src.connection.connections import get_db_pool
from src.embeddings.embedder import google_embedding,hug_embedding
from src.vectordb.vectordb import StoreManager
from src.Ingestion.loaders import load_document
from src.retrieval.retriever import hybrid_search_retriever
from src.llm.query_transformation import query_rewrite


async def main():
    # file = r"C:\Users\user\Desktop\MemRag\Backend\src\sampleDoc\report.pdf"
  
    # await load_document(file)
    res = await query_rewrite("don’t work in the real world. Scripted sales pitches")
    print(res)
    
   
asyncio.run(main())