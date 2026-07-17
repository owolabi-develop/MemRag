# routers/connectors.py

import uuid
from contextlib import asynccontextmanager
from typing import Annotated, get_args
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status,UploadFile, File
from pydantic import BaseModel

from app.models import User
from app.security import get_current_active_user
from app.dependencies import sessionCreator
from src.connectors.base import RemoteItem, ConnectorAuthError
from src.connectors.factory import get_connector
from app.models import SyncJob, SyncJobFile, SyncStatus, SyncJobPublic, SyncJobFilePublic
from src.Ingestion.loaders import load_document
from sqlmodel import select
import json

router = APIRouter(prefix="/connectors", tags=["connectors"])

_session_dependency = get_args(sessionCreator)[1].dependency
get_session_context = asynccontextmanager(_session_dependency)

from datetime import datetime, timezone


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


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


class SyncStartResponse(BaseModel):
    job_id: uuid.UUID
    status: SyncStatus
    total_files: int


@router.post("/google_drive/connect-file", response_model=ConnectResponse)
async def connect_google_drive_with_file(
    credentials_file: UploadFile = File(...),
    current_user: Annotated[User, Depends(get_current_active_user)] = None,
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


@router.post("/{connector_id}/connect", response_model=ConnectResponse)
async def connect(
    connector_id: str,
    body: ConnectRequest,
    # current_user: Annotated[User, Depends(get_current_active_user)],
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


@router.post("/sync", response_model=SyncStartResponse, status_code=status.HTTP_202_ACCEPTED)
async def start_sync(
    body: SyncRequest,
    background_tasks: BackgroundTasks,
    session: sessionCreator,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    if not body.file_paths:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Select at least one file.")

    try:
        connector = get_connector(body.connector_id, body.credentials)
    except ValueError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Unknown connector")

    try:
        await connector.authenticate()
    except ConnectorAuthError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))

    job = SyncJob(
        tenant_id=current_user.tenant_id,
        department_id=body.department_id,
        connector_id=body.connector_id,
        total_files=len(body.file_paths),
    )
    session.add(job)
    await session.flush()

    for path in body.file_paths:
        session.add(SyncJobFile(job_id=job.id, path=path, name=path.split("/")[-1]))

    await session.commit()
    await session.refresh(job)

    background_tasks.add_task(
        run_sync_job,
        job.id,
        connector,
        body.file_paths,
        current_user.tenant_id,
        body.department_id,
    )

    return SyncStartResponse(job_id=job.id, status=job.status, total_files=job.total_files)


@router.get("/sync/{job_id}", response_model=SyncJobPublic)
async def get_sync_job(
    job_id: uuid.UUID,
    session: sessionCreator,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    job = await session.get(SyncJob, job_id)
    if job is None or job.tenant_id != current_user.tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Sync job not found")

    return SyncJobPublic(
        id=job.id,
        status=job.status,
        total_files=job.total_files,
        completed_files=job.completed_files,
        failed_files=job.failed_files,
        files=[
            SyncJobFilePublic(path=f.path, name=f.name, status=f.status, error=f.error)
            for f in job.files
        ],
    )


async def run_sync_job(job_id, connector, file_paths, tenant_id, department_id,department):
    """
    Runs in the background, outside the request/response cycle — opens
    its own DB session via get_session_context (derived from
    sessionCreator above) since the request-scoped `session` is gone by
    the time this executes.
    """
    async with get_session_context() as session:
        job = await session.get(SyncJob, job_id)
        job.status = SyncStatus.RUNNING
        await session.commit()

        job_files = (
            await session.exec(select(SyncJobFile).where(SyncJobFile.job_id == job_id))
        ).all()
        file_by_path = {f.path: f for f in job_files}

        for path in file_paths:
            job_file = file_by_path[path]
            try:
                file_bytes, filename = await connector.download_file(path)
                job_file.name = filename

                await load_document(
                    file_bytes=file_bytes,
                    department=department,
                    tenant_id=tenant_id,
                    department_id=department_id,
                )

                job_file.status = SyncStatus.SUCCESS
                job.completed_files += 1
            except Exception as e:
                job_file.status = SyncStatus.FAILED
                job_file.error = str(e)[:500]
                job.failed_files += 1

            session.add(job_file)
            session.add(job)
            await session.commit()

        job.status = (
            SyncStatus.FAILED if job.failed_files == job.total_files else SyncStatus.SUCCESS
        )
        job.finished_at = get_datetime_utc()
        session.add(job)
        await session.commit()
        

@router.post("/google_drive/connect-file", response_model=ConnectResponse)
async def connect_google_drive_with_file(
    credentials_file: UploadFile = File(...),
    current_user: Annotated[User, Depends(get_current_active_user)] = None,
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