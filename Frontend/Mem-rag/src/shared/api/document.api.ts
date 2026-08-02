
import {apiRequest,apiFileRequest } from "../api/httpClient"; // adjust to 
import { useAuthStore } from "../store/authStore";
import { useGeminiSettingsStore } from "../store/geminiSettingsStore";


export interface UploadDocumentResponse {
  job_id: string;
  status: "queued" | "in_progress" | "complete" | "error";
}

export interface IngestStatusResponse {
  status: "queued" | "in_progress" | "complete" | "error";
  success: boolean | null;
  result: unknown;
  error: string | null;
}


export interface UploadedDocument {
  id: string;
  filename?: string;
  department_id?: string;
  [key: string]: unknown;
}

export async function uploadDocument(
  formData: FormData
): Promise<UploadDocumentResponse> {
  const token = useAuthStore.getState().accessToken;
   const modelApikey = useGeminiSettingsStore.getState().apiKey
  return apiFileRequest<UploadDocumentResponse>("/documents/upload/", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-gemini-api-key":modelApikey,
    },
  });
}

export async function getIngestStatus(jobId: string): Promise<IngestStatusResponse> {
  return apiRequest<IngestStatusResponse>(
    `/documents/upload/ingest/status/${jobId}`,
    { method: "GET" }
  );
}

export interface DocumentCountResponse {
  total_documents: number;
}

export async function getTenantDocumentCount(): Promise<DocumentCountResponse> {
  const token = useAuthStore.getState().accessToken;
  return apiRequest<DocumentCountResponse>("/documents/upload/documents/count", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getDepartmentDocumentCount(
  departmentId: string
): Promise<DocumentCountResponse> {
  const token = useAuthStore.getState().accessToken;
  return apiRequest<DocumentCountResponse>(
    `/documents/upload/${departmentId}/documents/count`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}