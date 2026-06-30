from fastapi import APIRouter,status
from fastapi import Depends, HTTPException
from app.dependencies import sessionCreator
from app.models import User,UserRole,Department
from fastapi import UploadFile,Form
from app.security import get_current_active_user
from typing import Annotated
from src.Ingestion.loaders import load_document
import asyncio

router = APIRouter(
    prefix="/documents/upload",
    tags=["documents"]
)

@router.post("/")
async def upload_documents(file: UploadFile,department_id:Annotated[str,Form()],
                current_user:Annotated[User,Depends(get_current_active_user)],
                session:sessionCreator):
    #get department name
    dpt_name =  await session.get(Department,department_id)
   
    tenant_id = str(current_user.tenant_id)
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only organization administrators can perform this action.")
    
    ## load document concurrently
    try:
        await load_document(file,dpt_name.name,department_id,tenant_id)
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=f"Document processing failed{e}")
        
    return {"status":"success"}