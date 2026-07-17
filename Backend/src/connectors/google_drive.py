# connectors/google_drive.py
# pip install google-api-python-client google-auth

import asyncio
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from googleapiclient.errors import HttpError

from src.connectors.base import BaseConnector, RemoteItem, ConnectorAuthError

GOOGLE_MIME_FOLDER = "application/vnd.google-apps.folder"


class GoogleDriverConnector(BaseConnector):
    """
    Expects credentials: client_email, private_key.

    IMPORTANT: a real Google service account key file has more fields than
    just these two (project_id, private_key_id, token_uri, client_id, etc.).
    This fills in the standard defaults for the ones that are always the
    same across all service accounts, but if authentication fails, the
    frontend form likely needs a project_id field added too.
    """

    TOKEN_URI = "https://oauth2.googleapis.com/token"
    SCOPES = ["https://www.googleapis.com/auth/drive.metadata.readonly"]

    def __init__(self, credentials: dict[str, str]):
        super().__init__(credentials)
        self._service = None

    async def authenticate(self) -> None:
        def _build_service():
            info = {
                "type": "service_account",
                "client_email": self.credentials.get("client_email"),
                "private_key": self.credentials.get("private_key", "").replace("\\n", "\n"),
                "universe_domain":self.credentials.get("universe_domain",""),
                "project_id":self.credentials.get("project_id",""),
                "private_key_id":self.credentials.get("private_key_id",""),
                "token_uri": self.TOKEN_URI,
                "auth_uri":self.credentials.get("auth_uri",""),
                "auth_provider_x509_cert_url":self.credentials.get("auth_provider_x509_cert_url",""),
                "client_x509_cert_url":self.credentials.get("client_x509_cert_url","")
            }
            creds = service_account.Credentials.from_service_account_info(
                info, scopes=self.SCOPES
            )
            return build("drive", "v3", credentials=creds, cache_discovery=False)

        try:
            self._service = await asyncio.to_thread(_build_service)
            # Cheap call to confirm the credentials actually work
            await asyncio.to_thread(
                lambda: self._service.files().list(pageSize=1).execute()
            )
        except (ValueError, HttpError) as e:
            raise ConnectorAuthError(f"Google Drive authentication failed: {e}")

    async def list_file(self) -> list[RemoteItem]:
        def _list():
            items: list[RemoteItem] = []
            page_token = None
            while True:
                response = (
                    self._service.files()
                    .list(
                        fields="nextPageToken, files(id, name, mimeType, size)",
                        pageToken=page_token,
                    )
                    .execute()
                )
                for f in response.get("files", []):
                    is_folder = f.get("mimeType") == GOOGLE_MIME_FOLDER
                    items.append(
                        RemoteItem(
                            name=f["name"],
                            path=f["id"],  # Drive has no real paths — use the file ID
                            type="folder" if is_folder else "file",
                            size_bytes=int(f["size"]) if f.get("size") else None,
                        )
                    )
                page_token = response.get("nextPageToken")
                if not page_token:
                    break
            return items

        return await asyncio.to_thread(_list)

    async def download_file(self, path: str) -> tuple[bytes, str]:
        # `path` is the Drive file ID here (see note in list_file)
        def _download():
            metadata = self._service.files().get(fileId=path, fields="name").execute()
            request = self._service.files().get_media(fileId=path)
            buffer = io.BytesIO()
            downloader = MediaIoBaseDownload(buffer, request)
            done = False
            while not done:
                _, done = downloader.next_chunk()
            return buffer.getvalue(), metadata["name"]

        return await asyncio.to_thread(_download)