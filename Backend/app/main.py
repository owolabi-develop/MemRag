from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import init_db
from app.routers import fileupload,conversation,tenant,chat,users,login




app = FastAPI(title="Mem Agentic Rag",
              summary="Agentic Rag with advance memory with semantic tool management")
app.include_router(fileupload.router)
app.include_router(conversation.router)
app.include_router(tenant.router)
app.include_router(chat.router)
app.include_router(users.router)
app.include_router(login.router)

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
    # await register_common_tools()
    await init_db()
    print("starting")

    
    




