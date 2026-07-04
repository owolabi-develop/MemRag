from fastapi import APIRouter,status
from fastapi import Depends, HTTPException
from app.dependencies import sessionCreator
from app.models import User, Tenant, Conversation
from fastapi import UploadFile, Form
from typing import Annotated
from app.security import get_current_active_user
from src.agent_call import call_agent

router = APIRouter()
from src.utils.helper import get_current_user_dpt,get_current_user_dpt_name

@router.post("/chat",tags=["chat"])
async def chatAgent(user_query: Annotated[str, Form()],current_user:Annotated[User, Depends(get_current_active_user)]):
    if current_user.departments is None or len(current_user.departments) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {current_user.first_name} does not belong to any department.")
    user_dpt_name = await get_current_user_dpt_name(current_user.departments)
   
    current_user_details = f"{current_user.first_name}"
    
    user_dpt = await get_current_user_dpt(current_user.departments)
    response = await call_agent(user_query, user_dpt,user_dpt_name,current_user_details,current_user.tenant_id, current_user.id)
    
   
    return {"response": response}
