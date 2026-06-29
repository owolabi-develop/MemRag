from fastapi import APIRouter
from fastapi import Depends, HTTPException
from app.dependencies import sessionCreator
from app.models import User, Tenant, TenantCreate, TenantPublic
from fastapi import UploadFile
from app.security import get_current_active_user
from typing import Annotated
from src.Ingestion.loaders import load_document
import asyncio

router = APIRouter(
    prefix="/documents/upload",
    tags=["documents"]
)

@router.post("/")
async def upload_documents(sales: UploadFile,insurance: UploadFile,
                           policy: UploadFile,technical: UploadFile,session:sessionCreator,current_user:Annotated[User,Depends(get_current_active_user)]):
    user_dpt = current_user.department
    user_tenant_id = str(current_user.tenant_id)
    
    ## load document concurrently
    try:
        async with asyncio.TaskGroup() as load_doc:
            load_doc.create_task(load_document(sales,user_dpt,user_tenant_id))
            load_doc.create_task(load_document(insurance,user_dpt,user_tenant_id))
            load_doc.create_task(load_document(policy,user_dpt,user_tenant_id))
            load_doc.create_task(load_document(technical,user_dpt,user_tenant_id))
    except* HTTPException as e:
        raise HTTPException(status_code=400, detail=f"Document processing failed{e}")
        
    return {"status":"success"}