from fastapi import APIRouter
from fastapi import Depends, HTTPException
from app.dependencies import sessionCreator
from app.models import User, Tenant, Conversation, Semantic_Memory, Workflow_Memory, Toolbox_Memory, Entity_Memory, Summary_Memory
from fastapi import UploadFile, Form
from typing import Annotated
from app.security import get_current_active_user

router = APIRouter()


@router.post("/chat",tags=["chat"])
async def chatAgent(user_query: Annotated[str, Form()],thread_id: Annotated[str, Form()],current_user:Annotated[User, Depends(get_current_active_user)]):
   
    return {"response":""}
