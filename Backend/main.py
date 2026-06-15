from fastapi import FastAPI,Form
from typing import Annotated
from fastapi.middleware.cors import CORSMiddleware
from src.tools.tool import register_common_tools
from src.memory.memory_manager import MemoryManager
from src.agent_call import call_agent
import uuid

app = FastAPI(title="Mem Agent",
              summary="Agentic Rag with advance memory with semantic tool management")

# CORS (Cross-Origin Resource Sharing) config
origins = [
    "http://localhost:5173",
    "http://localhost",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await register_common_tools()
    
    print("starting")




@app.get("/load-conversation")
async def load_conversation():
    manager = MemoryManager()
    conversations = await manager.load_conversational_memory_history()
    return {"conversation_history":conversations}

@app.post("/chat")
async def chatAgent(user_query: Annotated[str, Form()]):
    thread_id = 5000
    res = await call_agent(user_query,thread_id)
    return {"response":res}


@app.post("/upload/documents")
async def upload_documents(user_query: Annotated[str, Form()]):
    pow


