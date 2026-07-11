import type {
  ChatSessionDetail,
  ChatSessionSummary,
  ConversationTurn,
  Department,
  FeedbackValue,
} from "../../chatsession/type/type";

const MOCK_DELAY_MS = 700;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function generateId() {
  return crypto.randomUUID();
}

function deriveTitle(query: string) {
  const trimmed = query.trim();
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed || "New chat";
}

let sessionsStore: ChatSessionDetail[] = [
  {
    id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    title: "Q3 sales discount policy",
    created_at: "2026-07-08T09:12:00Z",
    conversations: [
      {
        id: generateId(),
        user_query: "What's our current sales discount policy?",
        ai_response:
          "Discounts above 15% require manager approval, and anything above 30% needs VP sign-off, per the current sales policy.",
        citations: [
          {
            id: generateId(),
            documentName: "Sales-Policy.pdf",
            filePath: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            page: 4,
            snippet:
              "Discounts exceeding 15% require written approval from the regional sales manager before the quote is issued.",
          },
        ],
        feedback: null,
        created_at: "2026-07-08T09:12:30Z",
      },
    ],
  },
];

/**
 * GET /chat/sessions
 * Real implementation:
 *   const res = await apiClient.get("/chat/sessions");
 *   return res.json();
 */
export async function listSessions(): Promise<ChatSessionSummary[]> {
  await wait(400);
  return [...sessionsStore]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(({ id, title, created_at }) => ({ id, title, created_at }));
}

/**
 * GET /chat/sessions/{session_id}
 * Real implementation:
 *   const res = await apiClient.get(`/chat/sessions/${sessionId}`);
 *   return res.json();
 */
export async function getSession(sessionId: string): Promise<ChatSessionDetail> {
  await wait(400);
  const session = sessionsStore.find((s) => s.id === sessionId);
  if (!session) throw new Error("Session not found.");
  return session;
}

/**
 * POST /chat/sessions — creates an empty session so a session_id exists
 * before the first message is sent. Adjust this if your backend instead
 * auto-creates a session on the first /chat call when session_id is omitted.
 */
export async function createSession(): Promise<ChatSessionSummary> {
  await wait(300);
  const session: ChatSessionDetail = {
    id: generateId(),
    title: "New chat",
    created_at: new Date().toISOString(),
    conversations: [],
  };
  sessionsStore = [session, ...sessionsStore];
  return { id: session.id, title: session.title, created_at: session.created_at };
}

/**
 * POST /chat — required body: { session_id, user_query }.
 * Real implementation:
 *   const res = await apiClient.post("/chat", { session_id: sessionId, user_query: userQuery });
 *   return res.json();
 */
export async function sendChatMessage(
  sessionId: string,
  userQuery: string
): Promise<ConversationTurn> {
  await wait(MOCK_DELAY_MS);

  const session = sessionsStore.find((s) => s.id === sessionId);
  if (!session) throw new Error("Session not found.");

  const turn: ConversationTurn = {
    id: generateId(),
    user_query: userQuery,
    ai_response: `Based on the documents connected to this workspace, here's a grounded answer to "${userQuery}".`,
    citations: [
      {
        id: generateId(),
        documentName: "Onboarding-Guide.docx",
        filePath: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        page: 2,
        snippet: "New hires should complete all compliance training within their first two weeks of joining.",
      },
    ],
    feedback: null,
    created_at: new Date().toISOString(),
  };

  const isFirstMessage = session.conversations.length === 0;
  session.conversations = [...session.conversations, turn];
  if (isFirstMessage) session.title = deriveTitle(userQuery);

  return turn;
}

/**
 * POST /chat/{conversation_id}/feedback — body: { feedback: "up" | "down" }.
 * Real implementation:
 *   await apiClient.post(`/chat/${conversationId}/feedback`, { feedback });
 */
export async function submitFeedback(
  conversationId: string,
  feedback: FeedbackValue
): Promise<void> {
  await wait(300);
  for (const session of sessionsStore) {
    session.conversations = session.conversations.map((turn) =>
      turn.id === conversationId ? { ...turn, feedback } : turn
    );
  }
}

/**
 * GET /department/current — returns the department this workspace/user is
 * scoped to. Backend logic for this is already in place per your note;
 * this mock just stands in for the response shape.
 */
export async function getCurrentDepartment(): Promise<Department> {
  await wait(300);
  return { id: "1", name: "Engineering" };
}