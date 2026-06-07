from src.llm.llm_client import client
from google.genai import types



async def google_embedding(content:str,model_output_dimensionality:int=1536):    
    result = client.models.embed_content(
    model="gemini-embedding-001",
    contents=content,
    config=types.EmbedContentConfig(
        output_dimensionality=model_output_dimensionality))
    [embedding_obj] = result.embeddings
    return embedding_obj.values