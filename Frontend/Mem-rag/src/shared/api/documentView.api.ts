
import { apiRequest } from "./httpClient";
import type { DocumentViewResponse } from "../../chatsession/type/type";

export function getDocumentViewUrl(
  documentId: string,
  token: string
): Promise<DocumentViewResponse> {
  return apiRequest<DocumentViewResponse>(`/departments/documents/${documentId}/view`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}