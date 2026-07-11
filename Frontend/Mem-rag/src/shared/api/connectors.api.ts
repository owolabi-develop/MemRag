export type ConnectorId = "google_drive" | "amazon_s3" | "onedrive" | "dropbox";

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

// Mocks what the backend returns after connecting with credentials
// (e.g. Dropbox's access_token + folder_path).
const MOCK_ITEMS: Record<ConnectorId, RemoteItem[]> = {
  google_drive: [
    { name: "Sales-Policy.pdf", path: "/Sales-Policy.pdf", type: "file", size_bytes: 245000 },
    { name: "Onboarding-Guide.docx", path: "/Onboarding-Guide.docx", type: "file", size_bytes: 88000 },
    { name: "Q3-Leads.csv", path: "/Q3-Leads.csv", type: "file", size_bytes: 12000 },
  ],
  amazon_s3: [
    { name: "infra-runbook.pdf", path: "/infra-runbook.pdf", type: "file", size_bytes: 340000 },
    { name: "incident-log.csv", path: "/incident-log.csv", type: "file", size_bytes: 9000 },
  ],
  onedrive: [
    { name: "HR-Handbook.docx", path: "/HR-Handbook.docx", type: "file", size_bytes: 512000 },
    { name: "Benefits-Overview.pdf", path: "/Benefits-Overview.pdf", type: "file", size_bytes: 210000 },
  ],
  dropbox: [
    { name: "PDFs", path: "/pdfs", type: "folder", size_bytes: null },
    { name: "Q3_Report.pdf", path: "/q3_report.pdf", type: "file", size_bytes: 1048576 },
  ],
};

/**
 * GET-style check — call on mount so an already-connected provider shows as such.
 *
 * Real implementation will be:
 *   const res = await apiClient.get(`/connectors/${connectorId}/status`);
 *   return res.json();
 */
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
  await wait(MOCK_DELAY_MS);

  const hasEmptyField = Object.values(credentials).some((value) => !value?.trim());
  if (hasEmptyField) {
    throw new Error("Please fill in all fields.");
  }

  return { status: "connected", items: MOCK_ITEMS[connectorId] };
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