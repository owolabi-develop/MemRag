from typing import List, Dict
import uuid


async def recursive_chunking( text: str, max_chunk_size: int = 1000, overlap: int = 100
) -> List[str]:
    """
    Recursive text splitter with overlap support.
    """

    text = text.strip()

    if not text:
        return []

    if len(text) <= max_chunk_size:
        return [text]

    separators = ["\n\n", "\n", ". ", " "]

    for separator in separators:

        if separator not in text:
            continue

        parts = text.split(separator)

        chunks = []
        current = ""

        for part in parts:
            candidate = (
                current + separator + part
                if current
                else part
            )

            if len(candidate) <= max_chunk_size:
                current = candidate
            else:
                if current:
                    chunks.append(current.strip())

                current = part

        if current:
            chunks.append(current.strip())

        final_chunks = []

        for chunk in chunks:
            if len(chunk) > max_chunk_size:
                final_chunks.extend(
                    await recursive_chunking(
                        chunk,
                        max_chunk_size=max_chunk_size,
                        overlap=overlap
                    )
                )
            else:
                final_chunks.append(chunk)

        # Add overlap
        overlapped = []

        for i, chunk in enumerate(final_chunks):

            if i > 0:
                previous = final_chunks[i - 1]

                overlap_text = previous[-overlap:]

                chunk = overlap_text + " " + chunk

            overlapped.append(chunk)
        return overlapped
    # Fallback: hard split
    chunks = []
    start = 0
    while start < len(text):

        end = start + max_chunk_size

        chunks.append(text[start:end])

        start += max_chunk_size - overlap

    return chunks