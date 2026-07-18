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

from arq import create_pool, ArqRedis
from arq.connections import RedisSettings
from arq.jobs import Job, JobStatus, JobResult


@asynccontextmanager
async def lifespan(app: FastAPI):
     await init_db()
     
    # create vector dbs and index
    # await StoreManager().create_db()
    #await register_common_tools()
    
     try:
        pool = await create_pool(RedisSettings.from_dsn(os.getenv("REDIS_CONNECTION")))
        print("ARQ Redis pool successfully initialized.")
        app.state.arq_pool = pool
     except Exception:
        app.state.arq_pool = None

     yield

     if app.state.arq_pool:
        await app.state.arq_pool.close()
    
    
    


app = FastAPI(title="Mem Agentic Rag",
              summary="Agentic Rag with advance memory with semantic tool management",lifespan=lifespan)
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
async def startup_event():
   print('JobStatus:', [s.value for s in JobStatus])
   print('from_dsn ok:', RedisSettings.from_dsn(os.getenv("REDIS_CONNECTION")))
    






