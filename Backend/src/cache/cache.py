import warnings
warnings.filterwarnings('ignore')
import os
import uuid
from dotenv import load_dotenv
load_dotenv()
import json
from langcache.utils import BackoffStrategy, RetryConfig
from langcache import LangCache
from langcache.models import SearchStrategy


async def check_cache(prompt: str, thread_id: str, user_id: uuid.UUID,
tenant_id: uuid.UUID):
    print("checking ... cache..")
    async with LangCache(
        server_url=os.getenv("LANGCACHE_API_URL"),
        api_key=os.getenv("LANGCACHE_API_KEY"),
        cache_id=os.getenv("LANGCACHE_CACHE_ID"),
        retry_config=RetryConfig("backoff", BackoffStrategy(1, 50, 1.1, 100), False),
       
    ) as lc:
        result = await lc.search_async(
            prompt=prompt,
            attributes={"tenant_id": str(tenant_id), "user_id":str(user_id), "thread_id": thread_id},
             search_strategies=[SearchStrategy.EXACT, SearchStrategy.SEMANTIC],
             similarity_threshold=0.9,
        )
    if result.data:
        print("cache hit")
        citations = result.data[0].attributes['metadata']
        response = result.data[0].response
        return {"citations":citations,"response":response}
    print("cache miss")
    return None
        


async def store_cache(prompt: str,thread_id: str,response: str,
    user_id: uuid.UUID,tenant_id: uuid.UUID, citation_data:uuid.UUID):
    print("saving to cache")
    
    async with LangCache(
        server_url=os.getenv("LANGCACHE_API_URL"),
        api_key=os.getenv("LANGCACHE_API_KEY"),
        cache_id=os.getenv("LANGCACHE_CACHE_ID"),
        retry_config=RetryConfig("backoff", BackoffStrategy(1, 50, 1.1, 100), False),
       
    ) as lc:
        await lc.set_async(
            prompt=prompt,
            response=response,
            attributes={"tenant_id": str(tenant_id), "user_id":str(user_id), "thread_id": thread_id,"metadata":str(citation_data)},
            ttl_millis=86400
        )
    print("saving to cache")
    


async def clear_cache():
    print("flushing... cache")
    async with LangCache(
        server_url=os.getenv("LANGCACHE_API_URL"),
        api_key=os.getenv("LANGCACHE_API_KEY"),
        cache_id=os.getenv("LANGCACHE_CACHE_ID"),
        retry_config=RetryConfig("backoff", BackoffStrategy(1, 50, 1.1, 100), False),
       
    ) as lc:
        await lc.flush_async()
    print("cache flushed")
   
    


