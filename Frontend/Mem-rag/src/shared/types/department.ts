
import type { Department, DepartmentUser } from "../types/Tenant";

export type { Department, DepartmentUser };

// Lightweight shape returned by GET /departments/all — adjust if the
// real response includes more fields than just id/name.
export interface DepartmentOption {
  id: string;
  name: string;
}