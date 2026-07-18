from fastapi import Depends
from . db import get_session
from typing import Annotated
from sqlmodel.ext.asyncio.session import AsyncSession
from arq import ArqRedis
from fastapi import Depends, HTTPException, Request, status

sessionCreator = Annotated[AsyncSession, Depends(get_session)]


def arq_pool(request: Request) -> ArqRedis:
    """The arq Redis pool set up at startup. 503 if Redis was unavailable."""
    pool = getattr(request.app.state, "arq_pool", None)
    if pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Job queue unavailable",
        )
    return pool

ArqPool = Annotated[ArqRedis, Depends(arq_pool)]