export type ConnectorId = "google_drive" | "amazon_s3" | "onedrive" | "dropbox";
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

const MOCK_DELAY_MS = 900;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


export async function getConnectorStatus(
  _connectorId: ConnectorId
): Promise<ConnectorStatusResponse> {
  await wait(400);
  return { status: "disconnected", items: [] };
}

/**
 * POST credentials (access_token, folder_path, etc.) — backend validates them,
 * lists the given folder, and returns { success, items }.
 *
 * Real implementation will be:
 *   const res = await apiClient.post(`/connectors/${connectorId}/connect`, credentials);
 *   const data = await res.json();
 *   if (!data.success) throw new Error("Could not connect — check your token and folder path.");
 *   return { status: "connected", items: data.items };
 */
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

/**
 * Real implementation will be:
 *   await apiClient.post(`/connectors/${connectorId}/disconnect`);
 */
export async function disconnectConnector(_connectorId: ConnectorId): Promise<void> {
  await wait(500);
}

/** Sends department_id + the selected file paths for the backend to fetch and store. */
export async function syncDocuments(payload: SyncPayload): Promise<{ message: string }> {
  await wait(MOCK_DELAY_MS);

  if (!payload.departmentId || payload.filePaths.length === 0) {
    throw new Error("Department and at least one document are required.");
  }

  return { message: "Sync started — documents will appear in the department shortly." };
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
