from src.llm.llm_client import client
from src.prompts.prompts import QUERY_REWRITE_TEMPLATE




async def query_rewrite(query:str):
    prompt = QUERY_REWRITE_TEMPLATE.format(user_query=query)
    response = client.models.generate_content(
    model="gemini-3.5-flash",
    contents=prompt)
    return response.text