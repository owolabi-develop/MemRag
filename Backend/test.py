import asyncio

from src.retrieval.retriever import hybrid_search_retriever
from src.llm.query_transformation import query_rewrite_expand
from pprint import pprint
from src.agent_call import call_agent


async def main():
   
    # res = await call_agent("tell me about the debt including the legal notice/action through civil courts")
    dpt = ["0058606a-d833-49d1-8c72-a05965eeb783","a5cb5c69-9732-4937-a75b-fb8e6ef3b98f"]
    tnt = "626ee0bf-f774-45f3-8607-f16547f37070"
    res = await hybrid_search_retriever("Insurance 2.0 Insurance Sales in the 21st Century,", dpt, tnt)
    print(res)
#  
   
    
   
    
    
   
asyncio.run(main())