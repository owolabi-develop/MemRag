import asyncio
from langcache import LangCache
import os
from dotenv import load_dotenv
from langcache.models import SearchStrategy
load_dotenv()
import json
from langcache.utils import BackoffStrategy, RetryConfig
import httpx
from src.memory.memory_manager import MemoryManager
memory_manager = MemoryManager()
from src.cache.cache import store_cache,check_cache
import uuid
async def main():
    
    await store_cache("laugh","thread_2","lanug out loud","user_2","tenant_2","88a62958-ba0c-47b3-a6a7-3fe47dd67950")
    if data := await check_cache("laugh","thread_2","user_2","tenant_2"):
        print(uuid.UUID(data['citations']))
    # data  = await memory_manager.get_conversation_citations("88a62958-ba0c-47b3-a6a7-3fe47dd67950")
    # print(data)
  
    
    
  
    
    return 
    
  
        

    

asyncio.run(main())
