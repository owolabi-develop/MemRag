// hooks/useDepartments.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createDepartment,
  getDepartments,
  addUserToDepartment,
  removeUserFromDepartment,
} from "../api/department.api";

export function useDepartmentsQuery() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });
}

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createDepartment(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
    },
  });
}

export function useAddUserToDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      departmentId,
      userId,
    }: {
      departmentId: string;
      userId: string;
    }) => addUserToDepartment(departmentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
    },
  });
}

export function useRemoveUserFromDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      departmentId,
      userId,
    }: {
      departmentId: string;
      userId: string;
    }) => removeUserFromDepartment(departmentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
    },
  });
}