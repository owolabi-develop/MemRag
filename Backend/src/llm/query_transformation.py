from src.prompts.prompts import QUERY_REWRITE_EXPAND_TEMPLATE
from pydantic import BaseModel,Field
from google.genai import types
from google import genai
from src.exceptions.llm_except import LLMError,LLMRateLimitError,AuthenticationError,ResourceExhausted,InvalidArgumentError,UnavailableError
from google.genai import errors

class QueryResponse(BaseModel):
    user_query: str | None = Field(description="the user original question or the expanded query")
    expand: bool = Field(
        description="True if the query was successfully expanded for better search results, otherwise False"
    )



async def query_rewrite_expand(query:str,model:str,model_api_key:str):
    prompt = QUERY_REWRITE_EXPAND_TEMPLATE.format(user_query=query)
    client = genai.Client(api_key=model_api_key)
    try:
        response = await client.aio.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=QueryResponse,
            ),)
        return response.parsed.user_query
    except (errors.APIError,errors.ClientError,errors.ServerError) as e:
        print(f"{e} error query rewite")
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