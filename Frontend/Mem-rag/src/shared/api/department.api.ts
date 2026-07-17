// api/department.ts

import { apiRequest } from "../api/httpClient"; // adjust to match your actual path
import { useAuthStore } from "../store/authStore";
import type { Department, DepartmentOption } from "../types/department";

function authHeader() {
  const token = useAuthStore.getState().accessToken;
  return { Authorization: `Bearer ${token}` };
}

export async function createDepartment(name: string): Promise<Department> {
  return apiRequest<Department>("/departments/create", {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ name }),
  });
}

export async function getDepartments(): Promise<DepartmentOption[]> {
  return apiRequest<DepartmentOption[]>("/departments/all", {
    method: "GET",
    headers: authHeader(),
  });
}

export async function addUserToDepartment(
  departmentId: string,
  userId: string
): Promise<Department> {
  return apiRequest<Department>(
    `/departments/add/user/${departmentId}/${userId}`,
    {
      method: "POST",
      headers: authHeader(),
    }
  );
}

export async function removeUserFromDepartment(
  departmentId: string,
  userId: string
): Promise<Department> {
  return apiRequest<Department>(
    `/departments/remove/user/${departmentId}/${userId}`,
    {
      method: "DELETE",
      headers: authHeader(),
    }
  );
}


export async function getDepartmentsForUser(): Promise<Department[]> {
  const token = useAuthStore.getState().accessToken;
  return apiRequest<Department[]>("/departments/per-user", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}