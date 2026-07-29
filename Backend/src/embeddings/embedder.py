from src.llm.llm_client import client
import asyncio
from google.genai import types
from sentence_transformers import SentenceTransformer
import os

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

HF_TOKEN = os.getenv("HF_TOKEN")

async def google_embedding(content:str,model_output_dimensionality:int=1536):    
    result = client.models.embed_content(
    model="gemini-embedding-001",
    contents=content,
    config=types.EmbedContentConfig(
        output_dimensionality=model_output_dimensionality))
    [embedding_obj] = result.embeddings
    return embedding_obj.values



LOCAL_MODEL_PATH = "./mpnet_base_v2_local"
HUB_MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"

if os.path.isdir(LOCAL_MODEL_PATH):

    model = SentenceTransformer(LOCAL_MODEL_PATH,device="cpu")
else:
    model = SentenceTransformer(HUB_MODEL_NAME,device="cpu")
    model.save(LOCAL_MODEL_PATH)


async def hug_embedding(content: str):
    loop = asyncio.get_running_loop()
    embedding = await loop.run_in_executor(
        None,
        lambda: model.encode(content, normalize_embeddings=True)
    )
    return embedding.tolist()