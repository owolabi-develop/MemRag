from sqlmodel import text
from src.embeddings.embedder import hug_embedding
from src.prompts.compress_prompt import compress_prompt
from app.db import async_session_pool
from src.connection.connections import get_db_pool
from sqlalchemy import bindparam
from pgvector.sqlalchemy import VECTOR
import uuid
import json
from sqlalchemy.dialects.postgresql import UUID,ARRAY



async def hybrid_search_retriever(query:str, department_ids:list[uuid.UUID], tenant_id: uuid.UUID, k: int=3):
    
    

    print("department_ids",department_ids)
    sql = """
    WITH semantic_search AS (
    SELECT id,content,metadata, RANK () OVER (ORDER BY embedding <=> $2) AS rank
    FROM semantic_memory
        WHERE tenant_id = $4 AND department_id = ANY($3)
        AND (embedding <=> $2) < 0.30
        ORDER BY embedding <=> $2
        LIMIT 10),
    keyword_search AS (
    SELECT id,content,metadata, RANK () OVER (ORDER BY                         ts_rank_cd(to_tsvector('english', content), query) DESC)
        FROM semantic_memory, plainto_tsquery('english', $1) query
        WHERE to_tsvector('english', content) @@ query 
        AND tenant_id = $4 AND department_id = ANY($3)
        ORDER BY ts_rank_cd(to_tsvector('english', content), query) DESC
        LIMIT 10
    )
    SELECT
        COALESCE(semantic_search.content, keyword_search.content) as content,
        COALESCE(semantic_search.metadata, keyword_search.metadata) as metadata,
        COALESCE(1.0 / (60 + semantic_search.rank), 0.0) +
        COALESCE(1.0 / (60 + keyword_search.rank), 0.0) AS score
    FROM semantic_search
    FULL OUTER JOIN keyword_search ON semantic_search.id = keyword_search.id
    ORDER BY score DESC
    LIMIT $5
            """

    embedding = await hug_embedding(query)
    pool = await get_db_pool()
    async with pool.acquire() as con:
        
        results = await con.fetch(sql,query,embedding,
                                      department_ids, tenant_id,k)

        if not results:
            return json.dumps({"documents": [], "message": "No relevant documents found."})
    

    compressed_docs = []
    
    for r in results:
        meta = r['metadata'] if isinstance(r['metadata'], dict) else json.loads(r['metadata'] or '{}')
        raw_content = r["content"]
        
        # FIX 1: Only pass the raw text content chunk to LLMLingua
        # This stops LLMLingua from dropping or mixing up your metadata metrics
        compressed_content = await compress_prompt(raw_content, query)
        
        doc_entry = {
            "content": compressed_content,
            "metadata": {
                "bbox":meta.get('bbox',[]),
                "source": meta.get('source', 'Unknown'),
                "section_title": meta.get("section_title"),
                "page": meta.get('page', 'Unknown'),
                "department": meta.get('department', 'Unknown')
            }
        }
        compressed_docs.append(doc_entry)
    return json.dumps({"documents": compressed_docs})


        
       