from src.llm.llm_client import client
from src.prompts.prompts import QUERY_REWRITE_EXPAND_TEMPLATE
from pydantic import BaseModel,Field
from google.genai import types


class QueryResponse(BaseModel):
    user_query: str | None = Field(description="the user original question or the expanded query")
    expand: bool = Field(
        description="True if the query was successfully expanded for better search results, otherwise False"
    )



async def query_rewrite_expand(query:str):
    prompt = QUERY_REWRITE_EXPAND_TEMPLATE.format(user_query=query)
    response = client.models.generate_content(
    model="gemini-3.5-flash",
    contents=prompt,
    config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=QueryResponse,
        ),)
    return response.parsed.user_query