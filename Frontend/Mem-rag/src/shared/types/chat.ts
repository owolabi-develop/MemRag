export interface Citation {
  id: string;
  documentName: string;
  page: number;
  filePath: string;
  snippet: string;
  documentId: string;
}

export type FeedbackValue = "up" | "down" | null;

export interface ConversationTurn {
  id: string;
  user_query: string;
  ai_response: string;
  citations: Citation[];
  feedback: FeedbackValue;
  feedbackId: string | null;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  created_at: string | null;
}

export interface Department {
  id: string;
  name: string;
  created_at: string;
}



export interface RawCitation {
  bbox: number[];
  page: number;
  marker: string;
  source: string;
  chunk_id: string | null;
  document_id: string;
  department: string | null;
  section_title: string | null;
}

export interface RawMessage {
  thread_id: string;
  summary_id: string | null;
  role: "user" | "assistant";
  content: string;
  tenant_id: string;
  con_timestamp: string;
  con_metadata: { citations?: RawCitation[] };
  id: string;
}

export interface SessionDetailResponse {
  title: string;
  id: string;
  created_at: string | null;
  conversations: RawMessage[];
}


export type ApiThumb = "like" | "dislike";

export interface FeedbackRecord {
  session_id: string;
  user_message: string;
  agent_response: string;
  thumb: ApiThumb;
  id: string;
  created_at: string;
}


export interface DocumentViewResponse {
  id: string;
  filename: string;
  url: string;
  content_type: string;
}