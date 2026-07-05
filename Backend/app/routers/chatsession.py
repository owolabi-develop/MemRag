from fastapi import APIRouter,status
from fastapi import Depends, HTTPException
from app.dependencies import sessionCreator
from app.models import User,ChatSession,ChatSessionPublic,ChatSessionBase,ChatSessionPublicWithConversation
from typing import Annotated
import uuid
from app.security import get_current_active_user

router = APIRouter(prefix="/session",tags=["chat_session"])

@router.post("/create",response_model=ChatSessionPublic)
async def chat_session(create_session:ChatSessionBase,current_user:Annotated[User, Depends(get_current_active_user)],session:sessionCreator):
    
    if current_user.departments is None or len(current_user.departments) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {current_user.first_name} does not belong to any department.")
    
    session_obj = ChatSession.model_validate(create_session,update={"user":current_user})
    session.add(session_obj)
    await session.commit()
    await session.refresh(session_obj)
    
    return session_obj


@router.get("/user/sessions",response_model=list[ChatSessionPublic])
async def get_session(current_user:Annotated[User, Depends(get_current_active_user)]):
    
    if current_user.departments is None or len(current_user.departments) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {current_user.first_name} does not belong to any department.")
    user_sessions = current_user.chat_sessions
    
    return user_sessions

@router.get("/user/session/{session_id}",response_model=ChatSessionPublicWithConversation)
async def get_session(current_user:Annotated[User, Depends(get_current_active_user)],session_id:uuid.UUID,session:sessionCreator):
    
    if current_user.departments is None or len(current_user.departments) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {current_user.first_name} does not belong to any department.")
    user_sessions =  await session.get(ChatSession,str(session_id))
    
    return user_sessions
