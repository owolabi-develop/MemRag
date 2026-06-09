from src.llm.llm_client import client
import asyncio
from google.genai import types
from sentence_transformers import SentenceTransformer


async def google_embedding(content:str,model_output_dimensionality:int=1536):    
    result = client.models.embed_content(
    model="gemini-embedding-001",
    contents=content,
    config=types.EmbedContentConfig(
        output_dimensionality=model_output_dimensionality))
    [embedding_obj] = result.embeddings
    return embedding_obj.values


model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")

async def hug_embedding(content: str):
  
    loop = asyncio.get_running_loop()

    embedding = await loop.run_in_executor(
        None,
        lambda: model.encode(content, normalize_embeddings=True)
    )

    return embedding.tolist()