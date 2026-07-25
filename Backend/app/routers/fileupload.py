from fastapi import APIRouter,status
from fastapi import Depends, HTTPException
from app.dependencies import sessionCreator,ArqPool
from app.models import User,UserRole,Department,Document
from fastapi import UploadFile,Form
from app.security import get_current_active_user
from typing import Annotated
from src.Ingestion.loaders import load_document
import asyncio
import uuid
from sqlmodel import select
from pydantic import BaseModel
from app.utils.s3_storage import  build_object_key, upload_file_to_s3, generate_presigned_url, SPACES_BUCKET_NAME
from arq.jobs import Job, JobStatus, JobResult
import time 
from app.metrics.metrics import job_completed,job_failed,job_duration,active_jobs,job_started

class IngestJob(BaseModel):
    job_id: str
    status: str

router = APIRouter(
    prefix="/documents/upload",
    tags=["documents"]
)

async def hello():
    print("hello")

@router.post("/",response_model=IngestJob)
async def upload_documents(
    file: UploadFile,
    department_id: Annotated[uuid.UUID, Form()],
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: sessionCreator,
    pool: ArqPool
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
    file_byte = await file.read()
    print(file_byte)
    filename = file.filename
    content_type = file.content_type
    job = await pool.enqueue_job("load_document",filename,str(content_type),file_byte,department.name, str(department_id), str(tenant_id), str(current_user.id))
    
    return IngestJob(job_id=job.job_id, status="queued")


@active_jobs.track_inprogress()
@router.get("/ingest/status/{job_id}")
async def ingest_status(job_id: str, pool: ArqPool) -> dict:
    """Poll for job progress. Frontend polls this until status == 'complete'."""
    
    
    job = Job(job_id, pool)
    start_job_t = time.perf_counter()
    status = await job.status()
    if status == JobStatus.not_found:
          ## track total job fi
        job_failed.labels(job_id=job_id).inc()
        raise HTTPException(status_code=404, detail="Job not found")
    if status == JobStatus.complete:
        info = await job.result_info()
         ## track total job completed
        job_completed.labels(job_id=job_id).inc()
        return {
            "status": "complete",
            "success": info.success,
            "result": info.result if info.success else None,
            "error": str(info.result) if not info.success else None,
        }
    job_end_t = time.perf_counter()
    job_duration.labels(job_id=job_id).observe(job_end_t - job_started)
       
    return {"status": status.value}


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