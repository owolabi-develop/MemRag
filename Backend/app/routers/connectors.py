import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File,Header
from pydantic import BaseModel
import json
from app.models import User, Department, UserRole
from app.security import get_current_active_user
from app.dependencies import sessionCreator, ArqPool
from src.connectors.base import RemoteItem, ConnectorAuthError
from src.connectors.factory import get_connector
from src.Ingestion.loaders import load_document

router = APIRouter(prefix="/connectors", tags=["connectors"])

class ConnectRequest(BaseModel):
    credentials: dict[str, str]


class ConnectResponse(BaseModel):
    status: str
    items: list[RemoteItem]


class SyncRequest(BaseModel):
    connector_id: str
    credentials: dict[str, str]
    department_id: uuid.UUID
    file_paths: list[str]


class IngestJob(BaseModel):
    job_id: str
    status: str


@router.post("/{connector_id}/connect", response_model=ConnectResponse)
async def connect(
    connector_id: str,
    body: ConnectRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    try:
        connector = get_connector(connector_id, body.credentials)
    except ValueError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Unknown connector")

    try:
        await connector.authenticate()
        items = await connector.list_file()
    except ConnectorAuthError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))

    return ConnectResponse(status="connected", items=items)


@router.post("/google_drive/connect-file", response_model=ConnectResponse)
async def connect_google_drive_with_file(
    current_user: Annotated[User, Depends(get_current_active_user)],
    credentials_file: UploadFile = File(...),
):
    try:
        raw = await credentials_file.read()
        credentials = json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not valid JSON.",
        )

    connector = get_connector("google_drive", credentials)

    try:
        await connector.authenticate()
        items = await connector.list_file()
    except ConnectorAuthError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))

    return ConnectResponse(status="connected", items=items)


@router.post("/sync", response_model=list[IngestJob], status_code=status.HTTP_202_ACCEPTED)
async def start_sync(body: SyncRequest,session: sessionCreator,
    current_user: Annotated[User, Depends(get_current_active_user)],
    pool: ArqPool,x_gemini_api_key:Annotated[str | None, Header()]=None):
    
    if not x_gemini_api_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="failed to initialized upload, model API-Key is missing. check your settings page for update, then try again.")
    
    if not body.file_paths:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Select at least one file.")

    department = await session.get(Department, body.department_id)
    if department is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Department not found")

    if department.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="This department does not belong to your organization.",
        )
    try:
        connector = get_connector(body.connector_id, body.credentials)
    except ValueError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Unknown connector")

    try:
        await connector.authenticate()
    except ConnectorAuthError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))

    jobs: list[IngestJob] = []
    for path in body.file_paths:
        job = await pool.enqueue_job(
            "sync_connector_file",
            body.connector_id,
            body.credentials,
            path,
            department.name,
            str(body.department_id),
            str(current_user.tenant_id),
            str(current_user.id),
            x_gemini_api_key
        )
        jobs.append(IngestJob(job_id=job.job_id, status="queued"))

    return jobs

async def sync_connector_file(ctx,connector_id: str,credentials: dict,
    path: str,department_name: str,department_id: str,
    tenant_id: str,user_id: str,x_gemini_api_key:str
):
    connector = get_connector(connector_id, credentials)
    await connector.authenticate()

    file_bytes, filename = await connector.download_file(path)
    content_type = "application/octet-stream"

    await load_document(
        ctx,
        filename,
        content_type,
        file_bytes,
        department_name,
        department_id,
        tenant_id,
        user_id,
        x_gemini_api_key
    )