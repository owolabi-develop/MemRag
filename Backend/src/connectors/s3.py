import asyncio
import boto3
from botocore.exceptions import ClientError, NoCredentialsError,EndpointConnectionError

from src.connectors.base import BaseConnector, RemoteItem, ConnectorAuthError


class S3Connector(BaseConnector):
    """
    Expects credentials: access_key_id, secret_access_key, bucket_name, region
    (matches the S3 connector form fields on the frontend exactly).
    """

    def __init__(self, credentials: dict[str, str]):
        super().__init__(credentials)
        self.bucket_name = credentials.get("bucket_name", "")
        self._client = None

    async def authenticate(self) -> None:
        def _build_client():
            if self.credentials.get("endpoint_url"):
                return boto3.client(
                    "s3",
                    aws_access_key_id=self.credentials.get("access_key_id"),
                    aws_secret_access_key=self.credentials.get("secret_access_key"),
                    region_name=self.credentials.get("region") or "us-east-1",
                   endpoint_url=self.credentials.get("endpoint_url")
                )
            else:
                 return boto3.client(
                    "s3",
                    aws_access_key_id=self.credentials.get("access_key_id"),
                    aws_secret_access_key=self.credentials.get("secret_access_key"),
                    region_name=self.credentials.get("region") or "us-east-1",
                )
                

        self._client = await asyncio.to_thread(_build_client)

        def _check_bucket():
            self._client.head_bucket(Bucket=self.bucket_name)

        try:
            await asyncio.to_thread(_check_bucket)
        except (ClientError, NoCredentialsError,EndpointConnectionError) as e:
            raise ConnectorAuthError(f"Could not access bucket '{self.bucket_name}': {e}")

    async def list_file(self) -> list[RemoteItem]:
        def _list():
            paginator = self._client.get_paginator("list_objects_v2")
            items: list[RemoteItem] = []
            for page in paginator.paginate(Bucket=self.bucket_name):
                for obj in page.get("Contents", []):
                    key = obj["Key"]
                    if key.endswith("/"):
                        continue  # skip S3's "folder marker" objects
                    items.append(
                        RemoteItem(
                            name=key.split("/")[-1],
                            path=key,
                            type="file",
                            size_bytes=obj.get("Size"),
                        )
                    )
            return items

        return await asyncio.to_thread(_list)

    async def download_file(self, path: str) -> tuple[bytes, str]:
        def _download():
            response = self._client.get_object(Bucket=self.bucket_name, Key=path)
            return response["Body"].read()

        content = await asyncio.to_thread(_download)
        return content, path.split("/")[-1]