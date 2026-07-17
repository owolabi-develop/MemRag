# connectors/base.py

from typing import Literal
from pydantic import BaseModel


class RemoteItem(BaseModel):
    name: str
    path: str
    type: Literal["file", "folder"]
    size_bytes: int | None = None


class ConnectorAuthError(Exception):
    """Raised when credentials are invalid or authentication otherwise fails."""


class BaseConnector:
    def __init__(self, credentials: dict[str, str]):
        self.credentials = credentials

    async def authenticate(self) -> None:
        raise NotImplementedError

    async def list_file(self) -> list[RemoteItem]:
        raise NotImplementedError

    async def download_file(self, path: str) -> tuple[bytes, str]:
        """Returns (file_bytes, filename)."""
        raise NotImplementedError