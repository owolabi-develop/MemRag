from fastapi import APIRouter
from fastapi import Depends, HTTPException
from app.dependencies import sessionCreator
from app.models import User, Tenant, TenantCreate, TenantPublic
from fastapi import UploadFile
from app.security import get_current_active_user
from typing import Annotated

router = APIRouter(
    prefix="/documents/upload",
    tags=["documents"]
)

@router.post("/")
async def upload_documents(sales: UploadFile,insurance: UploadFile,
                           policy: UploadFile,technical: UploadFile,session:sessionCreator,current_user:Annotated[User,Depends(get_current_active_user)]):
    user_id = current_user.id
    user_dpt = current_user.department