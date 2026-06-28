from fastapi import Depends
from . db import get_session
from typing import Annotated
from sqlmodel.ext.asyncio.session import AsyncSession


sessionCreator = Annotated[AsyncSession, Depends(get_session)]



