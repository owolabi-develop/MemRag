

import { create } from "zustand";
import type { Citation } from "../../chatsession/type/type";

interface ChatUiState {
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  activeCitation: Citation | null;
  openCitation: (citation: Citation) => void;
  closeCitation: () => void;
}

export const useChatUiStore = create<ChatUiState>((set) => ({
  activeSessionId: null,
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  activeCitation: null,
  openCitation: (citation) => set({ activeCitation: citation }),
  closeCitation: () => set({ activeCitation: null }),
}));