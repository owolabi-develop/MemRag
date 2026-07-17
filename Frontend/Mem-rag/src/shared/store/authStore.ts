import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RegisteredUser } from "../types/type";

interface AuthState {
  accessToken: string | null;
  user: RegisteredUser | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, user: RegisteredUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: (accessToken, user) => set({ accessToken, user, isAuthenticated: true }),
      clearAuth: () => set({ accessToken: null, user: null, isAuthenticated: false }),
    }),
    { name: "groundly-auth" }
  )
);