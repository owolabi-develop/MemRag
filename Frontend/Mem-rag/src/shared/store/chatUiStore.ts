import { create } from "zustand";
import type { Citation } from "../../chatsession/type/type";

interface ChatUiState {
  activeSessionId: string | null;
  activeCitation: Citation | null;
  setActiveSessionId: (id: string | null) => void;
  openCitation: (citation: Citation) => void;
  closeCitation: () => void;
}

export const useChatUiStore = create<ChatUiState>((set) => ({
  activeSessionId: null,
  activeCitation: null,
  setActiveSessionId: (id) => set({ activeSessionId: id, activeCitation: null }),
  openCitation: (citation) => set({ activeCitation: citation }),
  closeCitation: () => set({ activeCitation: null }),
}));