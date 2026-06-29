from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from dotenv import load_dotenv
import os
load_dotenv(override=True)
from sqlmodel import SQLModel
from . models import User, Tenant, Conversation, Semantic_Memory, Workflow_Memory, Toolbox_Memory, Entity_Memory, Summary_Memory

# Create async engine and session maker
async_engine = create_async_engine(os.getenv("DATABASE_URL"), echo=True)
async_session_pool = async_sessionmaker(bind=async_engine, class_=AsyncSession, expire_on_commit=False)

# FastAPI dependency
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_pool() as session:
        yield session


async def init_db():
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)  # Create tables if 

