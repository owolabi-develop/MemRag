import re
def _citation_key(meta: dict) -> str:
    """
    The marker shown to the model and used in-line, e.g. "p.4".
    Falls back to source name if page is missing (scanned docs, non-paginated
    sources) so every chunk still gets a usable, unique-enough marker.
    """
    page = meta.get("page")
    if page not in (None, "Unknown", ""):
        return f"p.{page}"
    return meta.get("source", "Unknown")



_CITATION_PATTERN = re.compile(r"\[(p\.\d+|[^\[\]]+)\]")


def resolve_citations(answer_text: str, documents: list[dict]) -> dict:
    """
    """
    by_key: dict[str, list[dict]] = {}
    for doc in documents:
        by_key.setdefault(_citation_key(doc["metadata"]), []).append(doc)

    used_keys = []
    seen = set()
    for m in _CITATION_PATTERN.findall(answer_text):
        if m not in seen:
            seen.add(m)
            used_keys.append(m)

    citations = []
    for key in used_keys:
        docs = by_key.get(key)
        if not docs:
            continue 
        for doc in docs:
            meta = doc["metadata"]
            citations.append({
                "marker": key,
                "source": meta.get("source"),
                "page": meta.get("page"),
                "department": meta.get("department"),
                "section_title": meta.get("section_title"),
                "bbox": meta.get("bbox"),
                "chunk_id": meta.get("chunk_id"),
                "document_id": meta.get("document_id")
            })

    return {
        "answer": answer_text,
        "citations": citations,
    }