
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const GEMINI_MODELS = [
 
  { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash", tier: "Gemini 3" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", tier: "Gemini 3" },
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite", tier: "Gemini 3" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite", tier: "Gemini 3" },

  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (Preview)", tier: "Gemini 3" },
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash (Preview)", tier: "Gemini 3" },

  // Gemini 2.5
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", tier: "Gemini 2.5" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", tier: "Gemini 2.5" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite", tier: "Gemini 2.5" },
] as const;

export type GeminiModelId = (typeof GEMINI_MODELS)[number]["id"];

interface GeminiSettingsState {
  apiKey: string;
  model: GeminiModelId;
  setGeminiSettings: (apiKey: string, model: GeminiModelId) => void;
  clearGeminiSettings: () => void;
}

export const useGeminiSettingsStore = create<GeminiSettingsState>()(
  persist(
    (set) => ({
      apiKey: "",
      model: "gemini-2.5-flash",
      setGeminiSettings: (apiKey, model) => set({ apiKey, model }),
      clearGeminiSettings: () => set({ apiKey: "", model: "gemini-2.5-flash" }),
    }),
    {
      name: "groundly:geminiSettings",
    }
  )
);