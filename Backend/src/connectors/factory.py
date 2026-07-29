# src/connectors/factory.py

from src.connectors.base import BaseConnector
from src.connectors.google_drive import GoogleDriverConnector
from src.connectors.s3 import S3Connector
from src.connectors.dropbox_connector import DropBoxConnector

CONNECTOR_REGISTRY: dict[str, type[BaseConnector]] = {
    "google_drive": GoogleDriverConnector,
    "amazon_s3": S3Connector,
    "dropbox": DropBoxConnector,
}


def get_connector(connector_id: str, credentials: dict[str, str]) -> BaseConnector:
    connector_cls = CONNECTOR_REGISTRY.get(connector_id)
    if connector_cls is None:
        raise ValueError(f"Unknown connector: {connector_id}")
    return connector_cls(credentials)