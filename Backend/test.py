import os
import getpass
import time
import numpy as np
from src.llm.llm_client import client
import asyncio
import warnings
warnings.filterwarnings('ignore')
from redisvl.extensions.cache.llm import SemanticCache
from redisvl.utils.vectorize import HFTextVectorizer

os.environ["TOKENIZERS_PARALLELISM"] = "False"

llmcache = SemanticCache(
    name="llmcache",                                        
    redis_url=os.getenv("REDIS_CREDENTIAL"),                     
    distance_threshold=0.1,                                  
    vectorizer=HFTextVectorizer(device="cpu"), 
)





async def rag(query:str):
    result = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=query  
    )
    return result.text


async def main():
    
    
    query="tell me about love"
    llmcache.delete()
       
    
    
   
asyncio.run(main())