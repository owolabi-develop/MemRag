

import { apiRequest } from "./httpClient";
import type { InviteUserPayload, InviteUsers } from "../types/InviteUser";



export async function getInviteUser(token: string): Promise<InviteUsers[]> {
  return apiRequest<InviteUsers[]>("/tenants/invited/users/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}



export async function postInviteUser(
  tenantId: string,
  payload: InviteUserPayload,
  token: string
): Promise<InviteUsers> {
  return apiRequest<InviteUsers>(`/users/add/${tenantId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...payload, status: "pending" }),
  });
}