export interface Citation {
  id: string;
  documentName: string;
  filePath: string;
  page: number;
  snippet: string;
}

export type FeedbackValue = "up" | "down" | null;

/** One user question + AI answer pair, as returned inside a session's `conversations` array. */
export interface ConversationTurn {
  id: string;
  user_query: string;
  ai_response: string;
  citations: Citation[];
  feedback: FeedbackValue;
  created_at: string;
}

/** Shape returned by the sessions list endpoint. */
export interface ChatSessionSummary {
  id: string;
  title: string;
  created_at: string;
}

/** Shape returned when fetching a single session by id. */
export interface ChatSessionDetail extends ChatSessionSummary {
  conversations: ConversationTurn[];
}

export interface Department {
  id: string;
  name: string;
}