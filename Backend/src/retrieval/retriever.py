from src.connection.connections import get_db_pool
from src.embeddings.embedder import hug_embedding
from src.prompts.compress_prompt import compress_prompt



async def hybrid_search_retriever(query:str, department: str | list[str], tenant_id: str, table_name: str="semantic_memory",  k: int=5):
    sql = f"""
            WITH semantic_search AS (
                SELECT id,content,metadata, RANK () OVER (ORDER BY embedding <=> $2) AS rank
                FROM {table_name}
                WHERE department IN $4 AND tenant_id = $5 
                ORDER BY embedding <=> $2
                LIMIT 10
            ),
            keyword_search AS (
                SELECT id,content,metadata, RANK () OVER (ORDER BY ts_rank_cd(to_tsvector('english', content), query) DESC)
                FROM {table_name}, plainto_tsquery('english', $1) query
                WHERE to_tsvector('english', content) @@ query 
                AND department IN $4 AND tenant = $5
                ORDER BY ts_rank_cd(to_tsvector('english', content), query) DESC
                LIMIT 10
            )
            SELECT
                COALESCE(semantic_search.content, keyword_search.content) as content,
                COALESCE(semantic_search.metadata, keyword_search.metadata) as metadata,
                COALESCE(1.0 / ($3 + semantic_search.rank), 0.0) +
                COALESCE(1.0 / ($3 + keyword_search.rank), 0.0) AS score
            FROM semantic_search
            FULL OUTER JOIN keyword_search ON semantic_search.id = keyword_search.id
            ORDER BY score DESC
            LIMIT $3
            """

    embedding = await hug_embedding(query)
    
    pool = await get_db_pool()
    async with pool.acquire() as con:
        results = await con.fetch(sql, query, embedding, k,department,tenant_id)
    result ="\n".join([f"Context: \n {content['content']}" for content in results])
    
    compress_result = await compress_prompt(result,query)
    return compress_result
        
       