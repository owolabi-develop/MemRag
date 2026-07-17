import httpx
import msal

from src.connectors.base import BaseConnector, RemoteItem, ConnectorAuthError

GRAPH_BASE = "https://microsoft.com"
class OneDriveConnector(BaseConnector):
    """
    Expects credentials: client_id, client_secret, tenant_id.
    """

    def __init__(self, credentials: dict[str, str]):
        super().__init__(credentials)
        self._token: str | None = None

        self.user_id = "owolabidevelop84@gmail.com"

    async def authenticate(self) -> None:
        tenant_id = self.credentials.get("tenant_id")
        client_id = self.credentials.get("client_id")
        client_secret = self.credentials.get("client_secret")
        
        app = msal.ConfidentialClientApplication(
            client_id,
            authority=f"https://login.microsoftonline.com/{tenant_id}",
            client_credential=client_secret,
        )
        
        result = app.acquire_token_for_client(
            scopes=["https://graph.microsoft.com/.default"]
        )

        if "access_token" not in result:
            raise ConnectorAuthError(
                f"OneDrive authentication failed: {result.get('error_description', result.get('error'))}"
            )
        self._token = result["access_token"]

    async def list_file(self) -> list[RemoteItem]:
        headers = {"Authorization": f"Bearer {self._token}"}
        async with httpx.AsyncClient() as client:
            try:
                url = f"{GRAPH_BASE}/users/{self.user_id}/drive/root/children"
                resp = await client.get(url, headers=headers)
                resp.raise_for_status()
            except httpx.HTTPStatusError as e:
                raise ConnectorAuthError(f"Could not list OneDrive files: {e}")

            items: list[RemoteItem] = []
            for entry in resp.json().get("value", []):
                is_folder = "folder" in entry
                items.append(
                    RemoteItem(
                        name=entry["name"],
                        path=entry["id"], 
                        type="folder" if is_folder else "file",
                        size_bytes=entry.get("size"),
                    )
                )
            return items

    async def download_file(self, path: str) -> tuple[bytes, str]:
        headers = {"Authorization": f"Bearer {self._token}"}
        async with httpx.AsyncClient() as client:
            try:
                meta_url = f"{GRAPH_BASE}/users/{self.user_id}/drive/items/{path}"
                meta_resp = await client.get(meta_url, headers=headers)
                meta_resp.raise_for_status()
                filename = meta_resp.json()["name"]

                content_url = f"{GRAPH_BASE}/users/{self.user_id}/drive/items/{path}/content"
                content_resp = await client.get(content_url, headers=headers)
                content_resp.raise_for_status()
                return content_resp.content, filename
            except httpx.HTTPStatusError as e:
                raise ConnectorAuthError(f"Could not download OneDrive file: {e}")
