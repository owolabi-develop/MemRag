import asyncio
from langcache import LangCache
import os
from dotenv import load_dotenv
from langcache.models import SearchStrategy
load_dotenv()
import json
from langcache.utils import BackoffStrategy, RetryConfig
import httpx


async def main():
    ## store
    custom_client = httpx.AsyncClient(timeout=30.0)
    async with LangCache(
        server_url=os.getenv("LANGCACHE_API_URL"),
        api_key=os.getenv("LANGCACHE_API_KEY"),
        cache_id=os.getenv("LANGCACHE_CACHE_ID"),
        retry_config=RetryConfig("backoff", BackoffStrategy(1, 50, 1.1, 100), False),
       
    ) as lc:
        
        # meta = json.dumps([{"source":"news"}])
        # await lc.set_async(
        #     prompt="who is the presdient of nigeria?",
        #     response="The capital of France is Paris.",
        #     attributes={"tenant_id": "tenant1", "user_id": "user1", "thread_id": "thread1","metadata":meta },
        # )
        
        ## check
        result = await lc.search_async(
            prompt="how is money made",
            attributes={"tenant_id": "tenant1", "user_id": "user1", "thread_id": "thread1"},
             search_strategies=[SearchStrategy.EXACT, SearchStrategy.SEMANTIC],
             similarity_threshold=0.9,
        )
        if result.data:
            print(json.loads(result.data[0].attributes['metadata'])['source'])  # Should print the cached response and metadata
            print(result.data[0].response)
    
    
  
    
    return 
    
  
        

    

asyncio.run(main())
