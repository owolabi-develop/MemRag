# s3_storage.py — updated for DigitalOcean Spaces (S3-compatible)

import asyncio
import os
import uuid
import boto3
from botocore.exceptions import ClientError

SPACES_KEY = os.getenv("SPACES_KEY", "")
SPACES_SECRET = os.getenv("SPACES_SECRET", "")
SPACES_REGION = os.getenv("SPACES_REGION", "nyc3")
SPACES_ENDPOINT = os.getenv("SPACES_ENDPOINT", f"https://{SPACES_REGION}.digitaloceanspaces.com")
SPACES_BUCKET_NAME = os.getenv("SPACES_BUCKET_NAME_KB", "")

_s3_client = boto3.client(
    "s3",
    region_name=SPACES_REGION,
    endpoint_url=SPACES_ENDPOINT,
    aws_access_key_id=SPACES_KEY,
    aws_secret_access_key=SPACES_SECRET,
)


def build_object_key(
    tenant_id: uuid.UUID, department_id: uuid.UUID, document_id: uuid.UUID, filename: str
) -> str:
    safe_filename = filename.replace("/", "_")
    return f"{tenant_id}/{department_id}/{document_id}/{safe_filename}"


async def upload_file_to_s3(file_bytes: bytes, key: str, content_type: str) -> None:
    def _upload():
        _s3_client.put_object(
            Bucket=SPACES_BUCKET_NAME,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )

    try:
        await asyncio.to_thread(_upload)
    except ClientError as e:
        raise RuntimeError(f"Failed to upload file to Spaces: {e}")


async def generate_presigned_url(key: str, expires_in: int = 10000) -> str:
    def _generate():
        return _s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": SPACES_BUCKET_NAME, "Key": key},
            ExpiresIn=expires_in,
        )

    try:
        return await asyncio.to_thread(_generate)
    except ClientError as e:
        raise RuntimeError(f"Failed to generate presigned URL: {e}")