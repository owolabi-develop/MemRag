from pprint import pprint
from datetime import datetime
import json
from pathlib import Path
from src.embeddings.embedder import hug_embedding
from src.connection.connections import get_db_pool
import pymupdf4llm
from langchain_text_splitters import MarkdownTextSplitter

async def load_document(file, department:str, tenant_id:str, table_name : str="SEMANTIC_MEMORY"):
    source = Path(file).name
    print(f"loading document: {source} for department: {department} and tenant_id: {tenant_id}")
    md_text = pymupdf4llm.to_markdown(file,page_chunks=True)
    splitter = MarkdownTextSplitter(chunk_size=1000, chunk_overlap=0)
    
    # get page data and metadata
    pages = [{"text": page['text'], "metadata":page['metadata']} for page in md_text]
    
    all_chunks = []
    for page in pages:
        chunks = splitter.split_text(page['text'])
        for idx, chunk in enumerate(chunks):
            all_chunks.append(
                {"text": chunk, 
                 "metadata":{"source":source, "department": department, "tenant_id": tenant_id, "page_number": page['metadata'].get('page_number'),"title": page['metadata'].get('title'), "chunk_index": idx, "timestamp": datetime.now().isoformat()}
            })
    pprint(all_chunks,indent=4)
    
    # ingest chunk documents and metadata to vector db
    pool = await get_db_pool()
    print("ingesting documents...")
    for _chunk in all_chunks:
        embedding = await hug_embedding(_chunk['text'])
        
        async with pool.acquire() as con:
                await con.execute(f"""
                    INSERT INTO {table_name} (content,department,tenant_id metadata, embedding)
                    VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE 
                    SET embedding = EXCLUDED.embedding;
                    """,_chunk['text'], json.dumps(_chunk['metadata']),embedding)
       
    print("all documents ingested successfully")
        
    
    
    #
        
       