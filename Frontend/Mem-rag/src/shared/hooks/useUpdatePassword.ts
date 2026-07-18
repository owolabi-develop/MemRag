

import { useMutation } from "@tanstack/react-query";
import { updatePassword, type UpdatePasswordRequest } from "../api/password.api";
import { ApiError } from "../api/httpClient"; 
export function useUpdatePasswordMutation() {
  return useMutation({
    mutationFn: (data: UpdatePasswordRequest) => updatePassword(data),
  });
}

export { ApiError };