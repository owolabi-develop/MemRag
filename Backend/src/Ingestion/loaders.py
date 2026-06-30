from pprint import pprint
from datetime import datetime
import json
from pathlib import Path
from src.embeddings.embedder import hug_embedding
import pymupdf4llm
from langchain_text_splitters import MarkdownTextSplitter
import pymupdf
from app.dependencies import sessionCreator
from app.models import Semantic_Memory
import asyncio
from app.db import async_session_pool

async def load_document(file, department:str, department_id:str, tenant_id:str):
    print(f"loading document: {file.filename} for department: {department} and tenant_id: {tenant_id}")
    content = await file.read()
    doc = pymupdf.open(stream=content,filetype="pdf")
    md_text = pymupdf4llm.to_markdown(doc,page_chunks=True)
    splitter = MarkdownTextSplitter(chunk_size=1000, chunk_overlap=0)
    
    # get page data and metadata
    pages = [{"text": page['text'], "metadata":page['metadata']} for page in md_text]
    
    all_chunks = []
    for page in pages:
        chunks = splitter.split_text(page['text'])
        for idx, chunk in enumerate(chunks):
            all_chunks.append(
                {"text": chunk, 
                 "metadata":{"source":file.filename, "department": department, "department_id": department_id,  "tenant_id": str(tenant_id), "page_number": page['metadata'].get('page_number'),"title": page['metadata'].get('title'), "chunk_index": idx, "timestamp": datetime.now().isoformat()}
            })
   
    # ingest chunk documents and metadata to vector db
    print("ingesting documents...")
    
    async with async_session_pool() as session:    
        doc_obj = []
        for _chunk in all_chunks:
            emb = await hug_embedding(_chunk['text'])
            doc_obj.append(
                Semantic_Memory(
                     department_id=department_id,
                     department_name=department,
                    tenant_id=str(tenant_id),
                    content=_chunk['text'],
                    embedding=emb,
                    kb_metadata=_chunk['metadata'])
                )
       
        session.add_all(doc_obj)
        await session.commit()
       
    print(f"all {file.filename} documents ingested to {department} successfully")
        
    
    
    #
        
       