import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getInviteUser, postInviteUser } from "../api/inviteUser.api";
import type { InviteUserPayload, InviteUsers } from "../types/InviteUser";
import { ApiError } from "../api/httpClient";
import { useAuthStore } from "../store/authStore";
import { useSTenantIDStore } from "../store/TenantStore";

export const invitedUsersQueryKey = ["invited-users"] as const;

export function useInvitedUsersQuery() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<InviteUsers[], ApiError>({
    queryKey: invitedUsersQueryKey,
    queryFn: () => {
      if (!accessToken) {
        throw new ApiError(401, "Not authenticated");
      }
      return getInviteUser(accessToken);
    },
    enabled: Boolean(accessToken),
  });
}

export function useInviteUserMutation() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const tenantId = useSTenantIDStore((s) => s.id); 

  return useMutation<InviteUsers, ApiError, InviteUserPayload>({
    mutationFn: (payload) => {
      if (!accessToken) {
        throw new ApiError(401, "Not authenticated");
      }
      if (!tenantId) {                           
        throw new ApiError(400, "No workspace selected. Try refreshing the page.");
      }
      return postInviteUser(tenantId, payload, accessToken); 
    },
    onSuccess: (newInvite) => {
      queryClient.setQueryData<InviteUsers[]>(invitedUsersQueryKey, (old) =>
        old ? [newInvite, ...old] : [newInvite]
      );
    },
  });
}