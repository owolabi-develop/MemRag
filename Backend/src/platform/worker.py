
from arq.connections import RedisSettings
import os
from src.Ingestion.loaders import load_document
from app.routers.connectors import sync_connector_file
import json




class WorkerSettings:
    functions = [load_document,sync_connector_file]
    redis_settings = RedisSettings(host=os.getenv("REDIS_SERVER"),port=os.getenv("REDIS_PORT"))
    max_jobs = 10
    job_timeout = 700 