from fastapi import APIRouter
from fastapi import Depends, HTTPException
from app.dependencies import sessionCreator
from app.models import User, Conversation,ConversationPublic
from typing import Annotated
from app.security import get_current_active_user

router = APIRouter(
    prefix='/conversations',
    tags=["conversations"]
)


@router.get("/", response_model=ConversationPublic)
async def get_conversation(current_user: Annotated[User, Depends(get_current_active_user)],session:sessionCreator):
     user_id = current_user.id




