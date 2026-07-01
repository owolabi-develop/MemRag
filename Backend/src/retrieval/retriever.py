from sqlmodel import text
from src.embeddings.embedder import hug_embedding
from src.prompts.compress_prompt import compress_prompt
from app.db import async_session_pool
from sqlalchemy import bindparam
from pgvector.sqlalchemy import VECTOR



async def hybrid_search_retriever(query:str, department_id: str, tenant_id: str, k: int=5):
    sql = text("""
            WITH semantic_search AS (
                SELECT id,content,kb_metadata, RANK () OVER (ORDER BY embedding <=> :embedding) AS rank
                FROM semantic_memory
                WHERE department_id = :department_id AND tenant_id = :tenant_id 
                ORDER BY embedding <=> :embedding
                LIMIT 10
            ),
            keyword_search AS (
                SELECT id,content,kb_metadata, RANK () OVER (ORDER BY ts_rank_cd(to_tsvector('english', content), query) DESC)
                FROM semantic_memory, plainto_tsquery('english', :query) query
                WHERE to_tsvector('english', content) @@ query 
                AND department_id = :department_id AND tenant_id = :tenant_id
                ORDER BY ts_rank_cd(to_tsvector('english', content), query) DESC
                LIMIT 10
            )
            SELECT
                COALESCE(semantic_search.content, keyword_search.content) as content,
                COALESCE(semantic_search.kb_metadata, keyword_search.kb_metadata) as kb_metadata,
                COALESCE(1.0 / (:k + semantic_search.rank), 0.0) +
                COALESCE(1.0 / (:k + keyword_search.rank), 0.0) AS score
            FROM semantic_search
            FULL OUTER JOIN keyword_search ON semantic_search.id = keyword_search.id
            ORDER BY score DESC
            LIMIT :k
            """).bindparams(bindparam("embedding", type_=VECTOR(768)))

    embedding = await hug_embedding(query)
    async with async_session_pool() as session:
        results_proxy = await session.exec(sql,
                                     params={
                                         "query": query,
                                         "embedding":embedding,
                                         "k":k,
                                         "department_id":department_id,
                                         "tenant_id":tenant_id
                                     })
        results = results_proxy.all()
    
        
    result ="\n".join([f"Context:\n {content[0]} \n Source: {content[1].get('source', 'Unknown')} \n Page number: {content[1].get('page_number', 'Unknown')}\n Department: {content[1].get('department', 'Unknown')}" for content in results])
    
    compress_result = await compress_prompt(result,query)
    return compress_result
        
       