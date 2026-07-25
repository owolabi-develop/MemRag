import os
import getpass
import time
import numpy as np
from src.llm.llm_client import client
import asyncio
from google.genai import errors

os.environ['GEMINI_API_KEY'] = os.getenv("GOOGLE_GEMINI_API_KEY")


    



async def main():
    
   try:
      
            res = await client.aio.models.generate_content(
                model="gemini-3.6-flash",
                contents="tell me about zeus"
            )
            print(res.usage_metadata)
   except (errors.APIError,errors.ClientError,errors.ServerError) as e:
       if isinstance(e,errors.ClientError) and e.code == 404:
           print("yes")
       print(f"type {isinstance(e,errors.ServerError)}")
       print(f"detail {e.details}")
       print(f"message {e.message}")
       print(f"status {e.status}")
       print(f"code {e.code}")
    
    

asyncio.run(main())

# client error code 404, status = NOT_FOUND model not found
#client error code 400  satus =invalid INVALID_ARGUMENT apikey
#client error code 429  status = RESOURCE_EXHAUSTED