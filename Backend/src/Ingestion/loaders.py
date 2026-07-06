from datetime import datetime
import hashlib
import uuid
import pymupdf4llm
import pymupdf
from langchain_text_splitters import MarkdownTextSplitter
from src.embeddings.embedder import hug_embedding
from src.connection.connections import get_db_pool


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


async def load_document(file, department: str, department_id: uuid.UUID, tenant_id: uuid.UUID):
    print(f"loading document: {file.filename} for department: {department} and tenant_id: {tenant_id}")
    content = await file.read()
    doc_id = _make_doc_id(content)

    doc = pymupdf.open(stream=content, filetype="pdf")
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
                    "source": file.filename,
                    "doc_id": doc_id,
                    "department": department,
                    "department_id": str(department_id),
                    "tenant_id": str(tenant_id),
                    "page": page_number,
                    "section_title": section_title,
                    "bbox": bbox,
                    "char_start": start,
                    "char_end": end,
                    "chunk_index": idx,
                    "timestamp": datetime.now().isoformat(),
                },
            })

    print(f"ingesting {len(all_chunks)} chunks...")
    pool = await get_db_pool()
    async with pool.acquire() as con:
        for _chunk in all_chunks:
            emb = await hug_embedding(_chunk["text"])
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
                department,
                tenant_id,
                department_id,
                _chunk["metadata"],
                emb,
            )

    print(f"all {file.filename} documents ingested to {department} successfully")