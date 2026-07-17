// api/tenant.ts

import { apiRequest } from "../api/httpClient"; // adjust to wherever this file actually lives
import type { Tenant, TenantCreateRequest } from "../types/Tenant";
import { useAuthStore } from "../store/authStore";

export async function createTenant(
  data: TenantCreateRequest,
  token: string
): Promise<Tenant> {
  return apiRequest<Tenant>("/tenants/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}


export async function getTenant(): Promise<Tenant> {
  const token = useAuthStore.getState().accessToken;
  return apiRequest<Tenant>("/tenants/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}