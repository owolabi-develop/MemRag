
import { useAuthStore } from "../store/authStore";
import {apiRequest,apiFileRequest } from "./httpClient";

export interface RemoteItem {
  name: string;
  path: string;
  type: "file" | "folder";
  size_bytes: number | null;
}

export interface ConnectorStatusResponse {
  status: "connected" | "disconnected";
  items: RemoteItem[];
}

export interface SyncPayload {
  connectorId: ConnectorId;
  departmentId: string;
  filePaths: string[];
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


export async function getConnectorStatus(
  _connectorId: ConnectorId
): Promise<ConnectorStatusResponse> {
  await wait(400);
  return { status: "disconnected", items: [] };
}


export async function connectConnector(
  connectorId: ConnectorId,
  credentials: Record<string, string>
): Promise<ConnectorStatusResponse> {
  const token = useAuthStore.getState().accessToken;
  const hasEmptyField = Object.values(credentials).some((value) => !value?.trim());
  if (hasEmptyField) {
    throw new Error("Please fill in all fields.");
  }
   return apiRequest<ConnectorStatusResponse>(`/connectors/${connectorId}/connect`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({credentials}),
  });
}


export async function disconnectConnector(_connectorId: ConnectorId): Promise<void> {
  await wait(500);
}


export async function connectGoogleDriveWithFile(
  formData: FormData
): Promise<{ status: string; items: RemoteItem[] }> {
  const token = useAuthStore.getState().accessToken;

  return apiFileRequest<{ status: string; items: RemoteItem[] }>(
    "/connectors/google_drive/connect-file",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export interface RemoteItem {
  name: string;
  path: string;
  type: "file" | "folder";
  size_bytes: number | null;
}

export type ConnectorId = "amazon_s3" | "dropbox" | "google_drive";

export interface IngestJob {
  job_id: string;
  status: string;
}

export interface SyncDocumentsPayload {
  connectorId: ConnectorId;
  credentials: Record<string, string>;
  departmentId: string;
  filePaths: string[];
}

export async function syncDocuments(
  payload: SyncDocumentsPayload
): Promise<IngestJob[]> {
  const token = useAuthStore.getState().accessToken;

  const response = await apiRequest<IngestJob | IngestJob[]>("/connectors/sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      connector_id: payload.connectorId,
      credentials: payload.credentials,
      department_id: payload.departmentId,
      file_paths: payload.filePaths,
    }),
  });


  return Array.isArray(response) ? response : [response];
}
