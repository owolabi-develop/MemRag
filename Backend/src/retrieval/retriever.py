from sqlmodel import text
from src.embeddings.embedder import hug_embedding
from app.db import async_session_pool
from src.connection.connections import get_db_pool
from sqlalchemy import bindparam
from pgvector.sqlalchemy import VECTOR
import uuid
import json
from sqlalchemy.dialects.postgresql import UUID,ARRAY
from sentence_transformers import CrossEncoder
from src.prompts.compress_prompt import compress_prompt
import os
import torch
import os
from sentence_transformers import CrossEncoder
import time
from app.metrics.metrics import reranker_duration,retrieval_duration,embedding_duration
num_cores = "4" 
os.environ["MKL_NUM_THREADS"] = num_cores
os.environ["OMP_NUM_THREADS"] = num_cores
torch.set_num_threads(int(num_cores))

# Enable fast, lower-precision math for CPU if supported
torch.set_float32_matmul_precision('high') 




LOCAL_CROSS_ENCODER_PATH = os.path.join(os.path.dirname(__file__), "ms_marco_minilm_l6_v2_local")
HUB_CROSS_ENCODER_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"

if os.path.isdir(LOCAL_CROSS_ENCODER_PATH):
  
    encoder = CrossEncoder(LOCAL_CROSS_ENCODER_PATH, device="cpu")
else:
   
    encoder = CrossEncoder(HUB_CROSS_ENCODER_NAME, device="cpu")
    encoder.save(LOCAL_CROSS_ENCODER_PATH)

      
def re_rank(query: str, documents: list[dict], top_k: int = 5) -> list[dict]:
    
    passages = [doc["content"] for doc in documents]
    ranked = encoder.rank(query, passages, top_k=top_k, return_documents=False)
    return [documents[item["corpus_id"]] for item in ranked]

async def hybrid_search_retriever(query:str, department_ids:list[uuid.UUID], tenant_id: uuid.UUID, k: int=3):
    
    
    print("department_ids",department_ids,"tanant",tenant_id)
    sql = """
    WITH semantic_search AS (
    SELECT id,content,metadata, RANK () OVER (ORDER BY embedding <=> $2) AS rank
    FROM semantic_memory
        WHERE tenant_id = $4 AND department_id = ANY($3)
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
    # track embedding
    emb_start = time.perf_counter()
    embedding = await hug_embedding(query)
    emb_end = time.perf_counter()
    embedding_duration.observe(emb_end - emb_start)
    
      ## track retriever
    start_retriever = time.perf_counter()
    pool = await get_db_pool()
    async with pool.acquire() as con:
       
        results = await con.fetch(sql,query,embedding,
                                      department_ids, tenant_id,k)
        
        if not results:
            return json.dumps({"documents": [], "message": "No relevant documents found."})
    

    compressed_docs = []
    
    for r in results:
        meta = r['metadata'] if isinstance(r['metadata'], dict) else json.loads(r['metadata'] or '{}')
        raw_content = await compress_prompt(r["content"],query)
        
            
        doc_entry = {
            "content": raw_content,
            "metadata": {
                "bbox":meta.get('bbox',[]),
                "source": meta.get('source', 'Unknown'),
                "section_title": meta.get("section_title"),
                "page": meta.get('page', 'Unknown'),
                "department": meta.get('department', 'Unknown'),
                "document_id": meta.get('document_id', 'Unknown')
            }
        }
        compressed_docs.append(doc_entry)
        
    end_retriever = time.perf_counter()
    retrieval_duration.observe(end_retriever - start_retriever)
    
    ## track re-ranker duration
    start_r = time.perf_counter()
    compressed_docs = re_rank(query,compressed_docs)
    end_r = time.perf_counter()
    reranker_duration.observe(end_r - start_r)
    return json.dumps({"documents": compressed_docs})


        
       