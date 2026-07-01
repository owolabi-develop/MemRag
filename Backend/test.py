import asyncio

from src.retrieval.retriever import hybrid_search_retriever
from src.llm.query_transformation import query_rewrite_expand
from pprint import pprint
from src.agent_call import call_agent


async def main():
   
    # res = await call_agent("tell me about the debt including the legal notice/action through civil courts")
    dpt = "036fa491-346e-4a2f-a02f-032dcbbaef4c"
    tnt = "6eb2269d-ac94-4c8d-bfd3-79f08e928811"
    res = await hybrid_search_retriever("tell me how most out of your marketing efforts,",dpt,tnt)
    print(res)
#  
   
    
   
    
    
   
asyncio.run(main())