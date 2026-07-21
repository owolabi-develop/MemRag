import asyncio
import warnings
warnings.filterwarnings('ignore')
from redisvl.extensions.cache.llm import SemanticCache
from redisvl.utils.vectorize import HFTextVectorizer
import os
from redisvl.query.filter import Tag
import uuid
os.environ["TOKENIZERS_PARALLELISM"] = "False"

mem_cache = SemanticCache(
    name="Mem-rag",                                        
    redis_url=os.getenv("REDIS_CREDENTIAL"),                     
    distance_threshold=0.1, 
    overwrite=True,                                 
    vectorizer=HFTextVectorizer(device="cpu"), 
    filterable_fields=[{"name": "tenant_id", "type": "tag"},
                       {"name": "user_id", "type": "tag"},
                        {"name": "thread_id", "type": "tag"},
                         {"name": "session_id", "type": "tag"}]
)


async def store_cache(prompt:str,thread_id:str,response:str,user_id:uuid.UUID,tenant_id:uuid.UUID,session_id:uuid.UUID,metadata:dict,ttl:int=60):
    await mem_cache.astore(
        prompt=prompt,
        response=response,
        ttl=ttl,
        metadata=metadata,
        filters={"tenant_id":str(tenant_id),"user_id":str(user_id),
               "thread_id":thread_id,
                 "session_id":str(session_id)}   
    )
    

async def check_cache(prompt:str,thread_id:str,user_id:uuid.UUID,tenant_id:uuid.UUID,session_id:uuid.UUID):
    mem_cache.set_threshold(0.3)
    tenant_filter = Tag("tenant_id") == str(tenant_id)
    user_filter = Tag("user_id") == str(user_id)
    thread = Tag("thread_id") == thread_id
    session = Tag("session_id") == str(session_id)
    combine_filter = tenant_filter & user_filter & thread & session
   
    response =await mem_cache.acheck(prompt=prompt,
                                filter_expression=combine_filter,
                                num_results=5,
                                 return_fields=["response","metadata"])
    print(f'found {len(response)} entry')
    return response
    
    



