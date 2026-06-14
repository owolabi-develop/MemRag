from pypdf import PdfReader
from pprint import pprint
from src.chuncking.chunker import recursive_chunking
from datetime import datetime
import json
from src.embeddings.embedder import hug_embedding
from src.connection.connections import get_db_pool

async def load_document(file,table_name : str="SEMANTIC_MEMORY_SALES"):
    reader = PdfReader(file)
    meta = reader.metadata
    pages = []
    for page_num,page in enumerate(reader.pages):
        text = page.extract_text()
        pages.append(
            {"page": page_num +1,"text":text})

    all_chunks = []
    ## chunk documents and get metadata
    print("chunking documents ...")
    for page in pages:
        
        chunk = await recursive_chunking(page['text'])
        
        
        for chunk_idx, chunk in enumerate(chunk):
            all_chunks.append(
                {
                    "text":chunk,
                    "metadata":{
                        "source":"report.pdf",
                        "page":page["page"],
                        "chunk":chunk_idx,
                        "title":meta.get("/Title"),
                        "author":meta.get("/Author"),
                        "created_at":datetime.now().isoformat()
                    }
                }
            )
    
    ## ingest chunk documents and metadata to vector db
    pool = await get_db_pool()
    print("ingesting documents...")
    for _chunk in all_chunks:
        embedding = await hug_embedding(_chunk['text'])
        
        async with pool.acquire() as con:
                await con.execute(f"""
                    INSERT INTO {table_name} (content, metadata, embedding)
                    VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE 
                    SET embedding = EXCLUDED.embedding;
                    """,_chunk['text'], json.dumps(_chunk['metadata']),embedding)
       
    print("all documents ingested successfully")
        
    
    
    #
        
       