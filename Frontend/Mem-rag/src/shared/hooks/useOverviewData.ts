// hooks/useOverviewData.ts

import { useQuery, useQueries } from "@tanstack/react-query";
import {getInviteUser } from "../api/inviteUser.api";
import { getDepartments } from "../api/department.api";
import {
  getTenantDocumentCount,
  getDepartmentDocumentCount,
} from "../api/document.api";
import { useAuthStore } from "../store/authStore";
import type { DepartmentOption } from "../types/department";

export function useInvitedUsersCountQuery() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["invitedUsers"],
    queryFn: () => getInviteUser(token!),
    enabled: !!token,
  });
}

export function useDepartmentsListQuery() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });
}

export function useTenantDocumentCountQuery() {
  return useQuery({
    queryKey: ["documents", "tenant-count"],
    queryFn: getTenantDocumentCount,
  });
}

export function useDepartmentDocumentCounts(departments: DepartmentOption[]) {
  return useQueries({
    queries: departments.map((d) => ({
      queryKey: ["documents", "department-count", d.id],
      queryFn: () => getDepartmentDocumentCount(d.id),
      enabled: !!d.id,
    })),
  });
}