import asyncio
import warnings
warnings.filterwarnings('ignore')
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

from redisvl.utils.vectorize import HFTextVectorizer
from redisvl.extensions.cache.llm import SemanticCache
from redisvl.query.filter import Tag
from redis.retry import Retry
from redis.backoff import ExponentialBackoff
import redis
from redis.exceptions import (
   BusyLoadingError,
   ConnectionError,
   TimeoutError
)

os.environ["TOKENIZERS_PARALLELISM"] = "False"
os.environ["ORT_DISABLE_AUTOMATIC_DEVICE_DETECTION"] = "1"

REDIS_HOST = os.getenv("REDIS_SERVER")
REDIS_PORT = os.getenv("REDIS_PORT")

if not REDIS_HOST or not REDIS_PORT:
    raise RuntimeError(
        f"REDIS_SERVER/REDIS_PORT not set (got REDIS_SERVER={REDIS_HOST!r}, "
        f"REDIS_PORT={REDIS_PORT!r}). Check your .env is present and loaded "
        f"before this module is imported."
    )

REDIS_PORT = int(REDIS_PORT)
REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}"

retry = Retry(ExponentialBackoff(), 10)

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0,
                retry_on_error=[BusyLoadingError, ConnectionError, TimeoutError],retry=retry)

try:
    r.ping()
    print(f"[redis] connected OK -> {REDIS_HOST}:{REDIS_PORT}")
except redis.exceptions.ConnectionError as e:
    raise RuntimeError(
        f"[redis] could not connect to {REDIS_HOST}:{REDIS_PORT} — {e}"
    ) from e

cache_embed = HFTextVectorizer(
    model="redis/langcache-embed-v1")

mem_cache = SemanticCache(
    name="groundly-cache-db",
    redis_client=r,
    distance_threshold=0.3,
    ttl=86400,
    vectorizer=cache_embed,
    filterable_fields=[
        {"name": "tenant_id", "type": "tag"},
        {"name": "user_id", "type": "tag"},
        {"name": "thread_id", "type": "tag"},
    ]
)


async def store_cache(
    prompt: str,
    thread_id: str,
    response: str,
    user_id: uuid.UUID,
    tenant_id: uuid.UUID,
    metadata: dict
):
    print("saving to cache")
    
    mem_cache.a
    await mem_cache.astore(
        prompt=prompt,
        response=response,
        ttl=3600,
        metadata=metadata,
        filters={
            "tenant_id": str(tenant_id),
            "user_id": str(user_id),
            "thread_id": thread_id,
        }
    )
    print("saved to cache")


async def check_cache(
    prompt: str,
    thread_id: str,
    user_id: uuid.UUID,
    tenant_id: uuid.UUID
):
    print("checking ... cache..")
    tenant_filter = Tag("tenant_id") == str(tenant_id)
    user_filter = Tag("user_id") == str(user_id)
    thread = Tag("thread_id") == thread_id
    combine_filter = tenant_filter & user_filter & thread

    response = await mem_cache.acheck(
        prompt=prompt,
        filter_expression=combine_filter,
        return_fields=["response", "metadata"]
    )
    print(f'found {len(response)} entry')
    return response