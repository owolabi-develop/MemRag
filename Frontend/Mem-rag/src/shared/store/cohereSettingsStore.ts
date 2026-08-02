

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CohereSettingsState {
  cohere: string;
  setApiKey: (cohere: string) => void;
  clearApiKey: () => void;
}

export const useCohereSettingsStore = create<CohereSettingsState>()(
  persist(
    (set) => ({
      cohere:"",
      setApiKey: (cohere) => set({ cohere }),
      clearApiKey: () => set({ cohere: "" }),
    }),
    {
      name: "groundly:cohereSettings",
    }
  )
);