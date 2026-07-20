from datetime import datetime
import hashlib
import uuid
import pymupdf4llm
import pymupdf
from langchain_text_splitters import MarkdownTextSplitter
from src.embeddings.embedder import hug_embedding
from src.connection.connections import get_db_pool
from app.db import async_session_pool
from app.models import Document,DocumentStatus,Department
from app.utils.s3_storage import  build_object_key, upload_file_to_s3, SPACES_BUCKET_NAME
from fastapi import Depends, HTTPException,status

import random
random.seed(42)

def _make_doc_id(content: bytes) -> str:
    """Content hash -> stable id across re-uploads/renames of the same file."""
    return hashlib.sha256(content).hexdigest()[:16]


def _make_chunk_id(doc_id: str, page: int, chunk_index: int) -> str:
    """Deterministic id -> re-ingesting the same file regenerates the same
    chunk_ids, so ON CONFLICT actually has something to match against."""
    return f"{doc_id}-p{page}-c{chunk_index}"


def _locate_chunk_span(page_text: str, chunk_text: str, search_from: int) -> tuple[int, int]:
    """
    MarkdownTextSplitter doesn't return offsets, so recover the chunk's
    position in the page's markdown text by searching for a prefix of it.
    Falls back to search_from if whitespace normalization broke the match.
    """
    anchor = chunk_text[:50].strip()
    start = page_text.find(anchor, search_from)
    if start == -1:
        start = page_text.find(anchor)  # retry from the beginning of the page
    if start == -1:
        start = search_from  # last resort: assume no drift
    end = start + len(chunk_text)
    return start, end


def _chunk_bbox_and_section(
    page_boxes: list[dict], start: int, end: int
) -> tuple[list | None, str | None]:
    """
    bbox: union of every box whose [pos_start, pos_end) overlaps this
    chunk's [start, end) span -- this is what a viewer highlights.
    section_title: nearest title/section-header box at or before `start`.
    """
    boxes_sorted = sorted(page_boxes, key=lambda b: b["pos"][0])

    overlapping = [b for b in boxes_sorted if b["pos"][0] < end and b["pos"][1] > start]
    bbox = None
    if overlapping:
        x0 = min(b["bbox"][0] for b in overlapping)
        y0 = min(b["bbox"][1] for b in overlapping)
        x1 = max(b["bbox"][2] for b in overlapping)
        y1 = max(b["bbox"][3] for b in overlapping)
        bbox = [round(x0, 1), round(y0, 1), round(x1, 1), round(y1, 1)]

    section_title = None
    for box in boxes_sorted:
        if box["class"] in ("title", "section-header") and box["pos"][0] <= start:
            section_title = box.get("_title_text")  # set below in caller
    return bbox, section_title


async def load_document(ctx:dict, filename,content_type,file_byte:bytes,department_name: str, department_id: uuid.UUID, tenant_id: uuid.UUID,current_user):
    print(f"loading document: {filename} for department: {department_name} and tenant_id: {tenant_id}")
    
    document_id = ""
    
    
    # handle s3 upload and open section
    # open db section
    async with async_session_pool() as session:
        
        department_obj = await session.get(Department, department_id)
        if department_obj is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Department not found"
            )
        
        document = Document(
        tenant_id=tenant_id,
        filename=filename,
        content_type=content_type or "application/octet-stream",
        size=len(file_byte),
        bucket=SPACES_BUCKET_NAME,
        object_key="",
        uploaded_by=current_user,
        status=DocumentStatus.UPLOADING,
    )

        department_obj.documents.append(document)
        session.add(department_obj)
        await session.commit()
        await session.refresh(document)  
        
        # reference the document id
        document_id = document.id

        object_key = build_object_key(tenant_id, department_id, document.id, filename)

        try:
            await upload_file_to_s3(
                file_byte,object_key,content_type or "application/octet-stream"
            )
        except RuntimeError as e:
            document.status = DocumentStatus.FAILED
            session.add(document)
            await session.commit()
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))

        document.object_key = object_key
        document.status = DocumentStatus.READY
        session.add(document)
        await session.commit()
        await session.refresh(document)
    
    
    doc_id = _make_doc_id(file_byte)

    doc = pymupdf.open(stream=file_byte, filetype="pdf")
    md_pages = pymupdf4llm.to_markdown(doc, page_chunks=True)
    splitter = MarkdownTextSplitter(chunk_size=1000, chunk_overlap=100)

    all_chunks = []

    for page in md_pages:
        page_text = page["text"]
        page_number = page["metadata"].get("page_number")
        page_boxes = sorted(page.get("page_boxes", []), key=lambda b: b["pos"][0])

        # pre-extract heading text once per box so section lookup doesn't
        # re-slice page_text on every chunk
        for box in page_boxes:
            if box["class"] in ("title", "section-header"):
                box["_title_text"] = (
                    page_text[box["pos"][0]:box["pos"][1]].strip().lstrip("#").strip()
                )

        chunks = splitter.split_text(page_text)
        search_from = 0

        for idx, chunk_text in enumerate(chunks):
            start, end = _locate_chunk_span(page_text, chunk_text, search_from)
            search_from = max(search_from, end - 100)  # allow for chunk_overlap=100

            bbox, section_title = _chunk_bbox_and_section(page_boxes, start, end)

            all_chunks.append({
                "chunk_id": _make_chunk_id(doc_id, page_number, idx),
                "text": chunk_text,
                "metadata": {
                    "source": filename,
                    "doc_id": doc_id,
                    "department": department_name,
                    "department_id": str(department_id),
                    "tenant_id": str(tenant_id),
                    "page": page_number,
                    "section_title": section_title,
                    "bbox": bbox,
                    "char_start": start,
                    "char_end": end,
                    "chunk_index": idx,
                    "document_id":str(document_id),
                    "timestamp": datetime.now().isoformat(),
                },
            })

    print(f"ingesting {len(all_chunks)} chunks...")
    pool = await get_db_pool()
    async with pool.acquire() as con:
        for _chunk in all_chunks:
            emb = await hug_embedding(_chunk["text"])
            # emb = [round(random.uniform(-1.0, 1.0), 4) for _ in range(768)]
            await con.execute(
                """
                INSERT INTO SEMANTIC_MEMORY
                    (content, department_name, tenant_id, department_id, metadata, embedding)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO UPDATE SET
                    content = EXCLUDED.content,
                    metadata = EXCLUDED.metadata,
                    embedding = EXCLUDED.embedding
                """,
                _chunk["text"],
                department_name,
                tenant_id,
                department_id,
                _chunk["metadata"],
                emb,
            )

    print(f"all {filename} documents ingested to {department_name} successfully")
    

