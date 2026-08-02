import asyncio
from google.genai import types
import os
from src.exceptions.llm_except import LLMError,LLMRateLimitError,AuthenticationError,ResourceExhausted,InvalidArgumentError,UnavailableError
from google import genai
from google.genai import errors

async def google_embedding(content:str,model_output_dimensionality:int=1536): 
    from src.utils.helper import context_api_key
    try:
        model_api_key = context_api_key.get() 
        client = genai.Client(api_key=model_api_key)
        result = await client.aio.models.embed_content(
        model="gemini-embedding-001",
        contents=content,
        config=types.EmbedContentConfig(
            output_dimensionality=model_output_dimensionality))
        [embedding_obj] = result.embeddings
        return embedding_obj.values
    except (errors.APIError,errors.ClientError,errors.ServerError) as e:
        print(f"{e} error ocure on chat")
        if isinstance(e,errors.ClientError) and e.code == 429:
            raise ResourceExhausted() from e
        elif isinstance(e,errors.ClientError) and e.code == 400:
            raise AuthenticationError() from e
        elif isinstance(e,errors.ClientError) and e.code == 401:
            raise AuthenticationError() from e
        elif isinstance(e,errors.ClientError) and e.code == 403:
            raise AuthenticationError() from e
        elif isinstance(e,errors.ClientError) and e.code == 404:
            raise InvalidArgumentError() from e
        
        elif isinstance(e,errors.ServerError) and e.code == 503:
            raise UnavailableError() from e



async def google_embedding_ingest(content:str,api_key:str,model_output_dimensionality:int=1536): 
    from src.utils.helper import context_api_key
    try:
        client = genai.Client(api_key=api_key)
        result = await client.aio.models.embed_content(
        model="gemini-embedding-001",
        contents=content,
        config=types.EmbedContentConfig(
            output_dimensionality=model_output_dimensionality))
        [embedding_obj] = result.embeddings
        return embedding_obj.values
    except (errors.APIError,errors.ClientError,errors.ServerError) as e:
        print(f"{e} error ocure on chat")
        if isinstance(e,errors.ClientError) and e.code == 429:
            raise ResourceExhausted() from e
        elif isinstance(e,errors.ClientError) and e.code == 400:
            raise AuthenticationError() from e
        elif isinstance(e,errors.ClientError) and e.code == 401:
            raise AuthenticationError() from e
        elif isinstance(e,errors.ClientError) and e.code == 403:
            raise AuthenticationError() from e
        elif isinstance(e,errors.ClientError) and e.code == 404:
            raise InvalidArgumentError() from e
        
        elif isinstance(e,errors.ServerError) and e.code == 503:
            raise UnavailableError() from e