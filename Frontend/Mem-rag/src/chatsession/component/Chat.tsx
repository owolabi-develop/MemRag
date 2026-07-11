import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  SendHorizontal,
  FileText,
  X,
  Loader2,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Building2,
  Search,
  Copy,
  Check,
  Menu,
  Home,
  LogOut,
} from "lucide-react";
import {
  useCreateSessionMutation,
  useDepartmentQuery,
  useFeedbackMutation,
  useSendMessageMutation,
  useSessionQuery,
  useSessionsQuery,
} from "../../shared/hooks/useChat";
import { useChatUiStore } from "../../shared/store/chatUiStore";
import type { ChatSessionSummary, ConversationTurn, FeedbackValue } from "../../chatsession/type/type";

// TODO: replace with real session/auth data once wired up, e.g.
//   const { user } = useAuthStore();
const mockUser = { name: "Owolabi Akintan", email: "owolabi@company.com" };

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatRelativeTime(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 24) return "Today";
  if (diffHours < 48) return "Yesterday";
  if (diffHours < 24 * 7) return "Previous 7 days";
  return "Older";
}

function groupSessions(sessions: ChatSessionSummary[]) {
  const groups: Record<string, ChatSessionSummary[]> = {};
  for (const session of sessions) {
    const bucket = formatRelativeTime(session.created_at);
    groups[bucket] = groups[bucket] ? [...groups[bucket], session] : [session];
  }
  const order = ["Today", "Yesterday", "Previous 7 days", "Older"];
  return order.filter((key) => groups[key]?.length).map((key) => ({ label: key, sessions: groups[key] }));
}

function SessionListSkeleton() {
  return (
    <div className="space-y-1 px-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded-lg bg-white/5" />
      ))}
    </div>
  );
}

/**
 * Left panel — dark navigation rail, matching the reference: plain
 * text nav rows (no filled CTA), no per-item icons, account footer
 * with a working "back to dashboard" and "log out". Fixed-width,
 * full-height, static on md+; a slide-over drawer with its own
 * in-panel collapse icon on small screens.
 */
import groundly_logo from "../../assets/images/Groundly-logo.png"; // adjust path to match your project structure

function ChatSessionList({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const sessionsQuery = useSessionsQuery();
  const createSessionMutation = useCreateSessionMutation();
  const activeSessionId = useChatUiStore((s) => s.activeSessionId);
  const setActiveSessionId = useChatUiStore((s) => s.setActiveSessionId);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  function handleNewChat() {
    createSessionMutation.mutate(undefined, {
      onSuccess: (session) => {
        setActiveSessionId(session.id);
        onClose();
      },
    });
  }

  function handleSelectSession(id: string) {
    setActiveSessionId(id);
    onClose();
  }

  function handleBackToDashboard() {
    // TODO: adjust if this chat route isn't nested one level under
    // the tenant dashboard route — ".." walks up to the parent route.
    navigate("/dashboard/overview");
  }

  function handleLogOut() {
    // TODO: clear the auth store / session here before redirecting,
    // e.g. useAuthStore.getState().clearAuth();
    navigate("/login");
  }

  const filteredSessions = (sessionsQuery.data ?? []).filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const groups = groupSessions(filteredSessions);

  return (
    <>
      {/* Backdrop — mobile/tablet only, sits within the chat area (not the whole viewport) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="absolute inset-0 z-20 bg-neutral-900/20 md:hidden"
          aria-hidden="true"
        />
      )}

      <div
        className={`absolute inset-y-0 left-0 z-30 flex h-full w-72 min-h-0 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 ease-out md:static md:z-auto md:h-full md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Fixed — never scrolls */}
        <div className="flex-shrink-0">
          <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-3.5">
            <div className="flex items-center gap-2">
              <img src={groundly_logo} alt="Groundly" className="h-10 w-10 shrink-0" />
              <span className="text-[15px] font-semibold text-neutral-900">Groundly</span>
            </div>
            {/* In-panel collapse icon — mobile only, per rule 1 */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Collapse sidebar"
              className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 md:hidden"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-2 pb-2 pt-2">
            <button
              type="button"
              onClick={handleNewChat}
              disabled={createSessionMutation.isPending}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
            >
              {createSessionMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              New chat
            </button>

            <div className="relative mt-1.5">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations"
                className="h-8 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-8 pr-3 text-sm text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Only this list scrolls */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {sessionsQuery.isLoading ? (
            <SessionListSkeleton />
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <MessageSquare size={20} className="text-neutral-300" />
              <p className="mt-2 text-sm text-neutral-400">
                {searchTerm ? "No matching conversations" : "No conversations yet"}
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="px-2.5 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.sessions.map((session) => {
                    const isActive = session.id === activeSessionId;
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => handleSelectSession(session.id)}
                        className={`block w-full truncate rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                          isActive
                            ? "bg-neutral-100 text-neutral-900"
                            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                        }`}
                      >
                        {session.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Account footer — fixed, never scrolls */}
        <div className="flex-shrink-0 border-t border-neutral-200 px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white">
              {getInitials(mockUser.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900">{mockUser.name}</p>
              <p className="truncate text-xs text-neutral-500">{mockUser.email}</p>
            </div>
            <button
              type="button"
              onClick={handleBackToDashboard}
              aria-label="Back to dashboard"
              title="Back to dashboard"
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Home size={15} />
            </button>
            <button
              type="button"
              onClick={handleLogOut}
              aria-label="Log out"
              title="Log out"
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
/** Hover-revealed action row under an assistant response: copy + feedback */
function MessageActions({
  turn,
  onFeedback,
}: {
  turn: ConversationTurn;
  onFeedback: (feedback: FeedbackValue) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(turn.ai_response);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied — silently ignore, nothing critical breaks.
    }
  }

  return (
    <div className="mt-2 flex items-center gap-0.5 opacity-100 md:opacity-0 md:transition-opacity md:group-hover/turn:opacity-100">
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy response"
        className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
      <button
        type="button"
        onClick={() => onFeedback(turn.feedback === "up" ? null : "up")}
        aria-label="Good response"
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
          turn.feedback === "up" ? "text-neutral-900" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        }`}
      >
        <ThumbsUp size={13} fill={turn.feedback === "up" ? "currentColor" : "none"} />
      </button>
      <button
        type="button"
        onClick={() => onFeedback(turn.feedback === "down" ? null : "down")}
        aria-label="Bad response"
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
          turn.feedback === "down" ? "text-neutral-900" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        }`}
      >
        <ThumbsDown size={13} fill={turn.feedback === "down" ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

/** Renders one Q&A pair — user bubble, then plain assistant text with citations + actions */
function ConversationTurnView({
  turn,
  onFeedback,
}: {
  turn: ConversationTurn;
  onFeedback: (conversationId: string, feedback: FeedbackValue) => void;
}) {
  const openCitation = useChatUiStore((s) => s.openCitation);
  const activeCitation = useChatUiStore((s) => s.activeCitation);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      {/* User query */}
      <div className="flex justify-end py-3">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-neutral-100 px-4 py-2.5 text-[15px] leading-relaxed text-neutral-900 sm:max-w-[75%]">
          {turn.user_query}
        </div>
      </div>

      {/* Assistant response */}
      <div className="group/turn py-3">
        <p className="whitespace-pre-wrap text-[15px] leading-7 text-neutral-800">{turn.ai_response}</p>

        {turn.citations.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Sources
            </p>
            <div className="flex flex-wrap gap-1.5">
              {turn.citations.map((citation) => {
                const isOpen = activeCitation?.id === citation.id;
                return (
                  <button
                    key={citation.id}
                    type="button"
                    onClick={() => openCitation(citation)}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      isOpen
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
                    }`}
                  >
                    <FileText size={11} className="flex-shrink-0" />
                    <span className="max-w-[140px] truncate">{citation.documentName}</span>
                    <span className={isOpen ? "text-neutral-300" : "text-neutral-400"}>p.{citation.page}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <MessageActions turn={turn} onFeedback={(feedback) => onFeedback(turn.id, feedback)} />
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
      <div className="flex items-center gap-1 py-1.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300" />
      </div>
    </div>
  );
}

/** Centered greeting shown inside the scrollable message area when there's no conversation yet */
function EmptyStateGreeting() {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center px-4 text-center sm:px-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
        <img src={groundly_logo} alt="Groundly" className="h-12 w-12 shrink-0" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-neutral-900 sm:text-2xl">
        Ask anything grounded in your documents
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-neutral-500">
        Answers are pulled from documents synced into your department, with sources you can
        open alongside the conversation.
      </p>
    </div>
  );
}

/** Top bar: mobile menu toggle + session title + department scope */
function ConversationHeader({
  title,
  onOpenSidebar,
}: {
  title: string | null;
  onOpenSidebar: () => void;
}) {
  const departmentQuery = useDepartmentQuery();

  return (
    <div className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-3 sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Show conversations"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 md:hidden"
      >
        <Menu size={18} />
      </button>

      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-900">
        {title ?? "New chat"}
      </h1>

      {departmentQuery.data && (
        <span className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600">
          <Building2 size={12} className="text-neutral-400" />
          <span className="hidden sm:inline">{departmentQuery.data.name}</span>
        </span>
      )}
    </div>
  );
}

interface ComposerProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

/**
 * Always docked to the bottom of the conversation panel — never
 * centered, regardless of whether there's an active conversation.
 */
function Composer({ draft, onDraftChange, onSubmit, isPending, textareaRef }: ComposerProps) {
  function autoGrowTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="flex-shrink-0 border-t border-neutral-200 bg-white p-3 sm:p-4">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-[28px] border border-neutral-200 bg-white px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-colors focus-within:border-neutral-300 focus-within:shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => {
              onDraftChange(e.target.value);
              autoGrowTextarea();
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask a question about your documents..."
            className="max-h-[200px] flex-1 resize-none py-1 text-[15px] leading-relaxed outline-none placeholder:text-neutral-400"
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={!draft.trim() || isPending}
            aria-label="Send message"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition-colors hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <SendHorizontal size={14} />}
          </button>
        </div>
        <p className="mt-2 hidden text-center text-xs text-neutral-400 sm:block">
          Responses are grounded in your connected documents and may include citations.
        </p>
      </div>
    </div>
  );
}

/**
 * Center panel: header (fixed) + conversation (the ONLY thing that
 * scrolls) + composer (fixed to the bottom at all times, including
 * the empty state).
 */
function ConversationView({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const activeSessionId = useChatUiStore((s) => s.activeSessionId);
  const setActiveSessionId = useChatUiStore((s) => s.setActiveSessionId);
  const sessionQuery = useSessionQuery(activeSessionId);
  const sendMessageMutation = useSendMessageMutation(activeSessionId);
  const feedbackMutation = useFeedbackMutation(activeSessionId);
  const createSessionMutation = useCreateSessionMutation();

  const [draft, setDraft] = useState("");
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const conversations = sessionQuery.data?.conversations ?? [];

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations.length, sendMessageMutation.isPending]);

  async function submitQuery(query: string) {
    if (!query.trim() || sendMessageMutation.isPending) return;

    setDraft("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    let sessionId = activeSessionId;
    if (!sessionId) {
      const session = await createSessionMutation.mutateAsync();
      sessionId = session.id;
      setActiveSessionId(sessionId);
    }

    sendMessageMutation.mutate(query);
  }

  function handleFeedback(conversationId: string, feedback: FeedbackValue) {
    feedbackMutation.mutate({ conversationId, feedback });
  }

  const showEmptyState = !activeSessionId && conversations.length === 0;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-white">
      <ConversationHeader title={sessionQuery.data?.title ?? null} onOpenSidebar={onOpenSidebar} />

      {/* This is the only scrollable region in the whole panel */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {showEmptyState ? (
          <EmptyStateGreeting />
        ) : sessionQuery.isLoading ? (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="ml-auto h-9 w-2/5 animate-pulse rounded-2xl bg-neutral-100" />
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6">
            {conversations.map((turn) => (
              <ConversationTurnView key={turn.id} turn={turn} onFeedback={handleFeedback} />
            ))}

            {sendMessageMutation.isPending && <TypingIndicator />}

            <div ref={scrollAnchorRef} />
          </div>
        )}
      </div>

      {/* Always docked at the bottom — empty state included */}
      <Composer
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={() => submitQuery(draft)}
        isPending={sendMessageMutation.isPending || createSessionMutation.isPending}
        textareaRef={textareaRef}
      />
    </div>
  );
}

/**
 * Right panel: full-screen overlay on small/medium screens, static
 * full-height side panel on large screens. Explicitly h-full at
 * every level so the PDF iframe always fills the available height
 * regardless of document length.
 */
function CitationDrawer() {
  const activeCitation = useChatUiStore((s) => s.activeCitation);
  const closeCitation = useChatUiStore((s) => s.closeCitation);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeCitation();
    }
    document.addEventListener("keydown", handleEscape as unknown as EventListener);
    return () => document.removeEventListener("keydown", handleEscape as unknown as EventListener);
  }, [closeCitation]);

  if (!activeCitation) return null;

  return (
    <div className="absolute inset-0 z-40 h-full min-h-0 lg:static lg:inset-auto lg:z-auto lg:flex-shrink-0">
      {/* Backdrop — small/medium screens only */}
      <div className="absolute inset-0 bg-neutral-900/20 lg:hidden" onClick={closeCitation} aria-hidden="true" />

      <div className="absolute inset-y-0 right-0 flex h-full w-full min-h-0 max-w-md flex-col border-l border-neutral-200 bg-white lg:static lg:h-full lg:w-[380px] lg:max-w-none">
        <div className="flex h-14 flex-shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
              <FileText size={15} className="text-neutral-500" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">{activeCitation.documentName}</p>
              <p className="text-xs text-neutral-500">Page {activeCitation.page}</p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1">
            <a
              href={activeCitation.filePath}
              target="_blank"
              rel="noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              title="Open in new tab"
            >
              <ExternalLink size={14} />
            </a>
            <button
              type="button"
              onClick={closeCitation}
              aria-label="Close source panel"
              className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 border-b border-neutral-100 bg-neutral-50/60 px-4 py-3.5">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Cited passage
          </p>
          <p className="text-sm italic leading-relaxed text-neutral-700">&ldquo;{activeCitation.snippet}&rdquo;</p>
        </div>

        {/* PDF viewer fills all remaining height, full height by default */}
        <div className="min-h-0 flex-1 bg-neutral-100">
          <iframe
            key={activeCitation.id}
            src={`${activeCitation.filePath}#page=${activeCitation.page}`}
            title={activeCitation.documentName}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Root shell — self-bounding on purpose. Uses h-screen rather than
 * h-full so this component never depends on an ancestor happening
 * to provide a real pixel height; the page itself can never scroll.
 * Only two things scroll inside it: ChatSessionList's own session
 * list, and ConversationView's own message area. Everything else
 * (header, composer, citation panel chrome, sidebar chrome) is
 * flex-shrink-0 and fixed in place.
 */
export default function ChatComponent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-screen w-full min-h-0 overflow-hidden">
      <ChatSessionList isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <ConversationView onOpenSidebar={() => setIsSidebarOpen(true)} />
      <CitationDrawer />
    </div>
  );
}