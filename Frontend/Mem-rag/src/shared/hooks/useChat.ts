import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDepartmentsPerUser,
  createSession,
  getUserSessions,
  getUserSessionDetail,
  sendMessage,
} from "../api/chat.api";
import { createFeedback, updateFeedback } from "../api/feedback.api";
import { getDocumentViewUrl } from "../api/documentView.api";
import { ApiError } from "../api/httpClient";
import { useAuthStore } from "../store/authStore";
import { useGeminiSettingsStore } from "../store/geminiSettingsStore";
import { useCohereSettingsStore } from "../store/cohereSettingsStore";

import type {
  ChatSessionSummary,
  Citation,
  ConversationTurn,
  Department,
  DocumentViewResponse,
  FeedbackRecord,
  RawCitation,
  RawMessage,
  SessionDetailResponse,
} from "../../chatsession/type/type";

export const departmentsQueryKey = ["departments", "per-user"] as const;
export const sessionsQueryKey = ["chat-sessions"] as const;
export const sessionQueryKey = (sessionId: string | null) =>
  ["chat-session", sessionId] as const;

type SessionQueryData = { title: string; conversations: ConversationTurn[] };

export function useDepartmentsQuery() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<Department[], ApiError>({
    queryKey: departmentsQueryKey,
    queryFn: () => {
      if (!accessToken) throw new ApiError(401, "Not authenticated");
      return getDepartmentsPerUser(accessToken);
    },
    enabled: Boolean(accessToken),
  });
}

export function useSessionsQuery() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<ChatSessionSummary[], ApiError>({
    queryKey: sessionsQueryKey,
    queryFn: () => {
      if (!accessToken) throw new ApiError(401, "Not authenticated");
      return getUserSessions(accessToken);
    },
    enabled: Boolean(accessToken),
  });
}

export function useCreateSessionMutation() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation<ChatSessionSummary, ApiError, void>({
    mutationFn: () => {
      if (!accessToken) throw new ApiError(401, "Not authenticated");
      return createSession("new", accessToken);
    },
    onSuccess: (newSession) => {
      queryClient.setQueryData<ChatSessionSummary[]>(sessionsQueryKey, (old) =>
        old ? [newSession, ...old] : [newSession]
      );
    },
  });
}

function mapCitations(raw: RawCitation[] | undefined): Citation[] {
  return (raw ?? []).map((c, idx) => ({
    id: `${c.document_id ?? c.source}-${c.page}-${idx}`,
    documentName: c.source,
    page: c.page,
    filePath: `/documents/${c.source}`,
    snippet: "",
    documentId: c.document_id ?? "",
    marker: c.marker,
    bbox: c.bbox ?? null,
  }));
}

function toConversationTurns(messages: RawMessage[]): ConversationTurn[] {
  const turns: ConversationTurn[] = [];

  for (let i = 0; i < messages.length; i++) {
    const current = messages[i];
    if (current.role !== "user") continue;

    const next = messages[i + 1];
    const isPaired = next?.role === "assistant";

    turns.push({
      id: isPaired ? next.id : current.id,
      user_query: current.content,
      ai_response: isPaired ? next.content : "",
      citations: mapCitations(isPaired ? next.con_metadata?.citations : undefined),
      feedback: null,
      feedbackId: null,
    });

    if (isPaired) i++;
  }

  return turns;
}

export function useSessionQuery(sessionId: string | null) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<SessionQueryData, ApiError>({
    queryKey: sessionQueryKey(sessionId),
    queryFn: async () => {
      if (!accessToken) throw new ApiError(401, "Not authenticated");
      if (!sessionId) throw new ApiError(400, "No session selected");
      const data: SessionDetailResponse = await getUserSessionDetail(sessionId, accessToken);
      return { title: data.title, conversations: toConversationTurns(data.conversations) };
    },
    enabled: Boolean(accessToken && sessionId),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}

export function useSendMessageMutation(sessionId: string | null) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const apiKey = useGeminiSettingsStore((s) => s.apiKey);
  const cohereApi = useCohereSettingsStore((s) => s.cohere);
  const model = useGeminiSettingsStore((s) => s.model);

  return useMutation<
    { answer: string; citations: Citation[] },
    ApiError,
    string,
    { tempId: string }
  >({
    mutationFn: async (userQuery) => {
      if (!accessToken) throw new ApiError(401, "Not authenticated");
      if (!sessionId) throw new ApiError(400, "No session selected");

      const data = await sendMessage(
        sessionId,
        userQuery,
        model,
        apiKey ?? "",
        accessToken,
        cohereApi ?? ""
      );
      return {
        answer: data.response.answer,
        citations: mapCitations(data.response.citations),
      };
    },
    onMutate: async (userQuery) => {
      const tempId = crypto.randomUUID();

      queryClient.setQueryData<SessionQueryData | undefined>(sessionQueryKey(sessionId), (old) => {
        const pendingTurn: ConversationTurn = {
          id: tempId,
          user_query: userQuery,
          ai_response: "",
          citations: [],
          feedback: null,
          feedbackId: null,
        };
        return old
          ? { ...old, conversations: [...old.conversations, pendingTurn] }
          : { title: "New chat", conversations: [pendingTurn] };
      });

      return { tempId };
    },
    onSuccess: (result, userQuery, context) => {
      queryClient.setQueryData<SessionQueryData | undefined>(sessionQueryKey(sessionId), (old) => {
        if (!old) {
          return {
            title: "New chat",
            conversations: [
              {
                id: context?.tempId ?? crypto.randomUUID(),
                user_query: userQuery,
                ai_response: result.answer,
                citations: result.citations,
                feedback: null,
                feedbackId: null,
              },
            ],
          };
        }

        const hasMatch = old.conversations.some((t) => t.id === context?.tempId);

        if (hasMatch) {
          return {
            ...old,
            conversations: old.conversations.map((t) =>
              t.id === context?.tempId
                ? { ...t, ai_response: result.answer, citations: result.citations }
                : t
            ),
          };
        }

        return {
          ...old,
          conversations: [
            ...old.conversations,
            {
              id: context?.tempId ?? crypto.randomUUID(),
              user_query: userQuery,
              ai_response: result.answer,
              citations: result.citations,
              feedback: null,
              feedbackId: null,
            },
          ],
        };
      });

      queryClient.invalidateQueries({
        queryKey: sessionQueryKey(sessionId),
        refetchType: "none",
      });

      queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
    },
    onError: (_err, _userQuery, context) => {
      queryClient.setQueryData<SessionQueryData | undefined>(sessionQueryKey(sessionId), (old) => {
        if (!old) return old;
        return {
          ...old,
          conversations: old.conversations.filter((t) => t.id !== context?.tempId),
        };
      });
    },
  });
}

export function useFeedbackMutation(sessionId: string | null) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation<
    FeedbackRecord,
    ApiError,
    { turn: ConversationTurn; thumb: "up" | "down" }
  >({
    mutationFn: ({ turn, thumb }) => {
      if (!accessToken) throw new ApiError(401, "Not authenticated");
      if (!sessionId) throw new ApiError(400, "No session selected");

      const apiThumb = thumb === "up" ? "like" : "dislike";

      if (turn.feedbackId) {
        return updateFeedback(turn.feedbackId, apiThumb, accessToken);
      }
      return createFeedback(
        {
          session_id: sessionId,
          user_message: turn.user_query,
          agent_response: turn.ai_response,
          thumb: apiThumb,
        },
        accessToken
      );
    },
    onSuccess: (record, { turn }) => {
      queryClient.setQueryData<SessionQueryData | undefined>(sessionQueryKey(sessionId), (old) => {
        if (!old) return old;
        return {
          ...old,
          conversations: old.conversations.map((t) =>
            t.id === turn.id
              ? { ...t, feedback: record.thumb === "like" ? "up" : "down", feedbackId: record.id }
              : t
          ),
        };
      });
    },
  });
}

export function useDocumentViewMutation() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation<DocumentViewResponse, ApiError, string>({
    mutationFn: (documentId) => {
      if (!accessToken) throw new ApiError(401, "Not authenticated");
      return getDocumentViewUrl(documentId, accessToken);
    },
  });
}