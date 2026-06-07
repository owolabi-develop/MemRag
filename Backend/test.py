import asyncio
from src.connection.connections import get_db_pool
from src.embeddings.embedder import google_embedding
from src.vectordb.vectordb import StoreManager


async def main():
    pool = await get_db_pool()
    await StoreManager(pool).create_db()
    

asyncio.run(main())