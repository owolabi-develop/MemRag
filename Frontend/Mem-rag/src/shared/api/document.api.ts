// api/document.ts

import { ApiError,apiRequest } from "../api/httpClient"; // adjust to match your actual path
import { useAuthStore } from "../store/authStore";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export interface UploadedDocument {
  id: string;
  filename?: string;
  department_id?: string;
  [key: string]: unknown;
}

export async function uploadDocument(
  formData: FormData
): Promise<UploadedDocument> {
  const token = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_BASE_URL}/documents/upload/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = undefined;
    }
    const message =
      detail && typeof detail === "object" && "detail" in detail
        ? String((detail as Record<string, unknown>).detail)
        : `Upload failed (${res.status})`;
    throw new ApiError(res.status, message, detail);
  }

  return res.json();
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