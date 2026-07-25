import asyncio
import warnings
warnings.filterwarnings('ignore')
from redisvl.extensions.cache.llm import SemanticCache
from redisvl.utils.vectorize import HFTextVectorizer
from redisvl.extensions.cache.embeddings import EmbeddingsCache
import os
from redisvl.query.filter import Tag
import uuid
import redis
os.environ["TOKENIZERS_PARALLELISM"] = "False"

r = redis.Redis.from_url(os.getenv("REDIS_CREDENTIAL"), )
cache_embed = HFTextVectorizer(
    model="redis/langcache-embed-v1",
    cache=EmbeddingsCache(redis_client=r, ttl=3600),
    device="cpu")


mem_cache = SemanticCache(
    name="mem-cache",                                        
    redis_client=r,                     
    distance_threshold=0.3, 
    ttl=86400,                             
    vectorizer=cache_embed,
    filterable_fields=[{"name": "tenant_id", "type": "tag"},
                       {"name": "user_id", "type": "tag"},
                        {"name": "thread_id", "type": "tag"}]
)


async def store_cache(prompt:str,thread_id:str,response:str,user_id:uuid.UUID,tenant_id:uuid.UUID,metadata:dict):
    print("saving to cache")
    mem_cache.store(
        prompt=prompt,
        response=response,
        ttl=3600,
        metadata=metadata,
        filters={"tenant_id":str(tenant_id),"user_id":str(user_id),
               "thread_id":thread_id}   
    )
    print("saved to cache")
    

async def check_cache(prompt:str,thread_id:str,user_id:uuid.UUID,tenant_id:uuid.UUID):
    print("checking ... cache..")
    tenant_filter = Tag("tenant_id") == str(tenant_id)
    user_filter = Tag("user_id") == str(user_id)
    thread = Tag("thread_id") == thread_id
    combine_filter = tenant_filter & user_filter & thread
   
    response = mem_cache.check(prompt=prompt,
                                filter_expression=combine_filter,
                                 return_fields=["response","metadata"])
    print(f'found {len(response)} entry')
    return response
    
    



