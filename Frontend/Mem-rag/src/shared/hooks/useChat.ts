import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSession,
  getCurrentDepartment,
  getSession,
  listSessions,
  sendChatMessage,
  submitFeedback,
} from "../../shared/api/chat.api";
import type {
  ChatSessionDetail,
  ChatSessionSummary,
  ConversationTurn,
  FeedbackValue,
} from "../../chatsession/type/type";

export function useSessionsQuery() {
  return useQuery({
    queryKey: ["chat-sessions"],
    queryFn: listSessions,
  });
}

export function useSessionQuery(sessionId: string | null) {
  return useQuery({
    queryKey: ["chat-session", sessionId],
    queryFn: () => getSession(sessionId as string),
    enabled: !!sessionId,
  });
}

export function useDepartmentQuery() {
  return useQuery({
    queryKey: ["current-department"],
    queryFn: getCurrentDepartment,
  });
}

export function useCreateSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: (session: ChatSessionSummary) => {
      queryClient.setQueryData<ChatSessionSummary[]>(["chat-sessions"], (prev) =>
        prev ? [session, ...prev] : [session]
      );
      queryClient.setQueryData<ChatSessionDetail>(["chat-session", session.id], {
        ...session,
        conversations: [],
      });
    },
  });
}

export function useSendMessageMutation(sessionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userQuery: string) => sendChatMessage(sessionId as string, userQuery),
    onSuccess: (turn: ConversationTurn) => {
      queryClient.setQueryData<ChatSessionDetail>(["chat-session", sessionId], (prev) =>
        prev ? { ...prev, conversations: [...prev.conversations, turn] } : prev
      );

      // Refresh sidebar since the title may have just been derived from
      // this message, and ordering is based on activity.
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
  });
}

export function useFeedbackMutation(sessionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, feedback }: { conversationId: string; feedback: FeedbackValue }) =>
      submitFeedback(conversationId, feedback),
    onMutate: async ({ conversationId, feedback }) => {
      // Optimistic update so the thumb fills in immediately.
      const previous = queryClient.getQueryData<ChatSessionDetail>(["chat-session", sessionId]);
      queryClient.setQueryData<ChatSessionDetail>(["chat-session", sessionId], (prev) =>
        prev
          ? {
              ...prev,
              conversations: prev.conversations.map((turn) =>
                turn.id === conversationId ? { ...turn, feedback } : turn
              ),
            }
          : prev
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["chat-session", sessionId], context.previous);
      }
    },
  });
}