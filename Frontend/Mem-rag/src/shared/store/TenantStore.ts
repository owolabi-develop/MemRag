import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UUID } from "crypto";

interface TenantState {
  id: UUID | null;
  setID: (id: UUID | null) => void;
  clearID: () => void;
}

// 2. Create the persisted store
export const useSTenantIDStore = create<TenantState>()(
  persist(
    (set) => ({
      id: null,
      setID: (id) => set({ id }),
      clearID: () => set({ id: null }),
    }),
    { 
      name: "tenantId", 
    }
  )
);
