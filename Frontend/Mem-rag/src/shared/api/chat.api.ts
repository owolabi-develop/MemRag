import { apiRequest, apiFormRequest } from "./httpClient";
import type {
  ChatSessionSummary,
  Department,
  SendMessageResponse,
  SessionDetailResponse,
} from "../../chatsession/type/type";

export function getDepartmentsPerUser(token: string): Promise<Department[]> {
  return apiRequest<Department[]>("/departments/per-user", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createSession(title: string, token: string): Promise<ChatSessionSummary> {
  return apiRequest<ChatSessionSummary>("/session/create", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title }),
  });
}

export function getUserSessions(token: string): Promise<ChatSessionSummary[]> {
  return apiRequest<ChatSessionSummary[]>("/session/user/sessions", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getUserSessionDetail(
  sessionId: string,
  token: string
): Promise<SessionDetailResponse> {
  return apiRequest<SessionDetailResponse>(`/session/user/session/${sessionId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function sendMessage(
  sessionId: string,
  userQuery: string,
  token: string
): Promise<SendMessageResponse> {
  const body = new URLSearchParams();
  body.set("user_query", userQuery);
  body.set("session_id", sessionId);

  return apiFormRequest<SendMessageResponse>("/chat/", body, {
    headers: { Authorization: `Bearer ${token}` },
  });
}