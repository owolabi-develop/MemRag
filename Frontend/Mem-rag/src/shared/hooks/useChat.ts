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

/**
 * Shared by both toConversationTurns (history, from session detail)
 * and useSendMessageMutation (a freshly-sent message) so citation
 * mapping stays identical regardless of which endpoint it came from.
 */
function mapCitations(raw: RawCitation[] | undefined): Citation[] {
  return (raw ?? []).map((c, idx) => ({
    id: `${c.document_id ?? c.source}-${c.page}-${idx}`,
    documentName: c.source,
    page: c.page,
    filePath: `/documents/${c.source}`, // placeholder until openCitation gets the real url from the view endpoint
    snippet: "", // TODO: not provided by either endpoint
    documentId: c.document_id ?? "",
    marker: c.marker,
    bbox: c.bbox ?? null,
  }));
}

/**
 * Pairs the backend's flat, alternating user/assistant message list
 * into the { user_query, ai_response } turns the UI actually renders.
 * feedback/feedbackId start null — there's no GET-existing-feedback
 * data on this endpoint, so history doesn't carry prior feedback
 * state; each turn starts fresh per page load.
 */
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
  });
}

/**
 * POST /chat/ (form-urlencoded: user_query + session_id). On success,
 * appends the new turn straight into the session query cache — no
 * refetch, shows up instantly. No message id comes back from this
 * endpoint, so the turn's id is client-generated; if you reload the
 * page, the session-detail refetch will replace it with the server's
 * real ids for that same exchange, so this is only a transient id
 * for the current tab session, not something to rely on elsewhere.
 */
export function useSendMessageMutation(sessionId: string | null) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation<
    { answer: string; citations: Citation[] },
    ApiError,
    string,
    { tempId: string }
  >({
    mutationFn: async (userQuery) => {
      if (!accessToken) throw new ApiError(401, "Not authenticated");
      if (!sessionId) throw new ApiError(400, "No session selected");

      const data = await sendMessage(sessionId, userQuery, accessToken);
      return {
        answer: data.response.answer,
        citations: mapCitations(data.response.citations),
      };
    },
    // Show the user's own message the instant they hit send — don't
    // wait for the response to render anything. ai_response starts
    // empty; ConversationTurnView renders typing dots in that exact
    // spot for any turn whose ai_response is still "".
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
    onSuccess: (result, _userQuery, context) => {
      // Fill in the same turn that onMutate created — same id, so
      // this replaces the typing dots with the real answer instead
      // of appending a second entry.
      queryClient.setQueryData<SessionQueryData | undefined>(sessionQueryKey(sessionId), (old) => {
        if (!old) return old;
        return {
          ...old,
          conversations: old.conversations.map((t) =>
            t.id === context?.tempId ? { ...t, ai_response: result.answer, citations: result.citations } : t
          ),
        };
      });

      // The backend can rename a session (e.g. "new" -> a generated
      // title) once it's seen the first exchange. The sessions list
      // isn't touched by the optimistic update above, so without
      // this it stays showing the stale title until something else
      // happens to refetch it (a full page reload). Invalidating
      // here — rather than setQueryData — triggers a silent
      // background refetch: the sidebar keeps showing the current
      // title until the fresh one arrives, no flicker either way.
      queryClient.invalidateQueries({ queryKey: sessionQueryKey(sessionId) });
      queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
    },
    onError: (err, _userQuery, context) => {
      // Leave the user's message visible rather than making it
      // vanish — replace the typing dots with an inline error
      // instead of a detached banner elsewhere on the page.
      queryClient.setQueryData<SessionQueryData | undefined>(sessionQueryKey(sessionId), (old) => {
        if (!old) return old;
        return {
          ...old,
          conversations: old.conversations.map((t) =>
            t.id === context?.tempId
              ? { ...t, ai_response: err.message || "Couldn't get a response. Please try again." }
              : t
          ),
        };
      });
    },
  });
}

/**
 * First feedback on a turn -> POST /chat/feedback (creates a record,
 * response includes the id). Changing it afterward -> PATCH
 * /chat/feedback/{id}. Which one fires is decided by whether the
 * turn already has a feedbackId, which onSuccess writes into the
 * session query cache directly (no refetch needed).
 */
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

/**
 * Fetches the real viewable URL for a citation's source document,
 * keyed by the citation's document_id.
 */
export function useDocumentViewMutation() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation<DocumentViewResponse, ApiError, string>({
    mutationFn: (documentId) => {
      if (!accessToken) throw new ApiError(401, "Not authenticated");
      return getDocumentViewUrl(documentId, accessToken);
    },
  });
}