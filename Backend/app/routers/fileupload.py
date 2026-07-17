from fastapi import APIRouter,status
from fastapi import Depends, HTTPException
from app.dependencies import sessionCreator
from app.models import User,UserRole,Department,Document,DocumentStatus,DepartmentPublicWithDocuments
from fastapi import UploadFile,Form
from app.security import get_current_active_user
from typing import Annotated
from src.Ingestion.loaders import load_document
import asyncio
import uuid
from sqlmodel import select
from pydantic import BaseModel
from app.utils.s3_storage import  build_object_key, upload_file_to_s3, generate_presigned_url, SPACES_BUCKET_NAME

router = APIRouter(
    prefix="/documents/upload",
    tags=["documents"]
)

@router.post("/")
async def upload_documents(
    file: UploadFile,
    department_id: Annotated[uuid.UUID, Form()],
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: sessionCreator,
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization administrators can perform this action.",
        )

    department = await session.get(Department, department_id)
    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Department not found"
        )

    if department.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This department does not belong to your organization.",
        )

    tenant_id = current_user.tenant_id
    file_bytes = await file.read()

    document = Document(
        tenant_id=tenant_id,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        size=len(file_bytes),
        bucket=SPACES_BUCKET_NAME,
        object_key="",  # filled in below once document.id exists
        uploaded_by=current_user.id,
        status=DocumentStatus.UPLOADING,
    )

    department.documents.append(document)
    session.add(department)
    await session.commit()
    await session.refresh(document)  # document.id (and department_id) now available

    object_key = build_object_key(tenant_id, department_id, document.id, file.filename)

    try:
        await upload_file_to_s3(
            file_bytes, object_key, file.content_type or "application/octet-stream"
        )
    except RuntimeError as e:
        document.status = DocumentStatus.FAILED
        session.add(document)
        await session.commit()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))

    document.object_key = object_key
    document.status = DocumentStatus.PROCESSING
    session.add(document)
    await session.commit()
    await session.refresh(document)

    await file.seek(0)

    try:
        await load_document(file, department.name, department_id, tenant_id, document.id)
        document.status = DocumentStatus.READY
    except Exception as e:
        document.status = DocumentStatus.FAILED
        session.add(document)
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document processing failed: {e}",
        )

    session.add(document)
    await session.commit()

    return {"status": "success", "document_id": str(document.id)}


class DocumentCountPublic(BaseModel):
    total_documents: int


@router.get("/documents/count", response_model=DocumentCountPublic)
async def get_tenant_document_count(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: sessionCreator
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization administrators can perform this action.",
        )
    document_counts = await session.exec(select(Document).where(Document.tenant_id==current_user.tenant_id))
        

    total = len(document_counts.all())
    return DocumentCountPublic(total_documents=total)


@router.get("/{department_id}/documents/count", response_model=DocumentCountPublic)
async def get_department_document_count(
    department_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: sessionCreator
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization administrators can perform this action.",
        )
    department_doc = await session.get(Department,department_id)
    total = len(department_doc.documents)
    return DocumentCountPublic(total_documents=total)