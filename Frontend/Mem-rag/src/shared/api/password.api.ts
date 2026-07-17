// api/password.ts

import { apiRequest } from "../api/httpClient"; // adjust to match your actual path
import { useAuthStore } from "../store/authStore";

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface UpdatePasswordResponse {
  message?: string;
}

export async function updatePassword(
  data: UpdatePasswordRequest
): Promise<UpdatePasswordResponse> {
  const token = useAuthStore.getState().accessToken;
  return apiRequest<UpdatePasswordResponse>("/password/update-password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}