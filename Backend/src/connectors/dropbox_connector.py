import asyncio
import dropbox
from dropbox.exceptions import AuthError, ApiError

from src.connectors.base import BaseConnector, RemoteItem, ConnectorAuthError


class DropBoxConnector(BaseConnector):
    """
    Expects credentials: access_token, folder_path
    (matches the Dropbox connector form fields on the frontend exactly).
    """

    def __init__(self, credentials: dict[str, str]):
        super().__init__(credentials)
        self.folder_path = credentials.get("folder_path", "") or ""
        self._client = None

    async def authenticate(self) -> None:
        access_token = self.credentials.get("access_token")

        def _build_client():
            client = dropbox.Dropbox(access_token)
            client.users_get_current_account()  # cheap call to validate the token
            return client

        try:
            self._client = await asyncio.to_thread(_build_client)
        except AuthError as e:
            raise ConnectorAuthError(f"Invalid Dropbox access token: {e}")

    async def list_file(self) -> list[RemoteItem]:
        def _list():
            items: list[RemoteItem] = []
            result = self._client.files_list_folder(f"/{self.folder_path}")
            while True:
                for entry in result.entries:
                    if isinstance(entry, dropbox.files.FileMetadata):
                        items.append(
                            RemoteItem(
                                name=entry.name,
                                path=entry.path_lower,
                                type="file",
                                size_bytes=entry.size,
                            )
                        )
                    elif isinstance(entry, dropbox.files.FolderMetadata):
                        items.append(
                            RemoteItem(name=entry.name, path=entry.path_lower, type="folder")
                        )
                if not result.has_more:
                    break
                result = self._client.files_list_folder_continue(result.cursor)
            return items

        try:
            return await asyncio.to_thread(_list)
        except ApiError as e:
            raise ConnectorAuthError(f"Could not list folder '{self.folder_path}': {e}")

    async def download_file(self, path: str) -> tuple[bytes, str]:
        def _download():
            _, response = self._client.files_download(path)
            return response.content

        content = await asyncio.to_thread(_download)
        return content, path.split("/")[-1]