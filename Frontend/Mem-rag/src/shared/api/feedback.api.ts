
import { apiRequest } from "./httpClient";
import type { ApiThumb, FeedbackRecord } from "../../chatsession/type/type";

export interface CreateFeedbackPayload {
  session_id: string;
  user_message: string;
  agent_response: string;
  thumb: ApiThumb;
}

export function createFeedback(
  payload: CreateFeedbackPayload,
  token: string
): Promise<FeedbackRecord> {
  return apiRequest<FeedbackRecord>("/chat/feedback", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function updateFeedback(
  feedbackId: string,
  thumb: ApiThumb,
  token: string
): Promise<FeedbackRecord> {
  return apiRequest<FeedbackRecord>(`/chat/feedback/${feedbackId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ thumb }),
  });
}