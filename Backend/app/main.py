from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import init_db
from src.vectordb.vectordb import StoreManager
from app.routers import fileupload,conversation,tenant,chat,users,login,department,chatsession,password,connectors
from src.tools.tool import register_common_tools
from fastapi import FastAPI
from contextlib import asynccontextmanager
import os
import json
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from arq import create_pool, ArqRedis
from arq.connections import RedisSettings
from arq.jobs import Job, JobStatus, JobResult
from src.guardrails.guardrails import GuardrailViolation
from src.exceptions.llm_except import LLMError
from prometheus_fastapi_instrumentator import Instrumentator
from dotenv import load_dotenv
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
     await init_db()
     
    # create vector dbs and index
     await StoreManager().create_db()
     await register_common_tools()
    
     try:
        pool = await create_pool(RedisSettings(host=os.getenv("REDIS_SERVER"),port=6379))
        print("ARQ Redis pool successfully initialized.")
        app.state.arq_pool = pool
     except Exception:
        app.state.arq_pool = None

     yield

     if app.state.arq_pool:
        await app.state.arq_pool.close()
    
    
    


app = FastAPI(title="Mem Agentic Rag",
              summary="Agentic Rag with advance memory with semantic tool management",lifespan=lifespan,
              root_path="/api/v1")

Instrumentator().instrument(app).expose(app)

app.include_router(connectors.router)
app.include_router(fileupload.router)
app.include_router(department.router)
app.include_router(conversation.router)
app.include_router(tenant.router)
app.include_router(chat.router)
app.include_router(users.router)
app.include_router(login.router)
app.include_router(chatsession.router)
app.include_router(password.router)


@app.exception_handler(GuardrailViolation)
async def llm_exception_handler(request: Request, exc: GuardrailViolation):
    return JSONResponse(
        status_code=exc.status_code,
        content={"response":{"answer":exc.user_message,"citations":[]}},
    )

@app.exception_handler(LLMError)
async def unicorn_exception_handler(request: Request, exc: LLMError):
    return JSONResponse(
        status_code=exc.code,
        content={"detail":exc.error_message},
    )

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

    






