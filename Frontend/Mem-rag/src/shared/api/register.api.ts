import { apiRequest } from "../../shared/api/httpClient";
import type { RegisterFormValues, RegisterRequestPayload, RegisteredUser } from "../types/type";

export function registerUser(values: RegisterFormValues): Promise<RegisteredUser> {
  const payload: RegisterRequestPayload = {
    email: values.email,
    first_name: values.firstName,
    last_name: values.lastName,
    password: values.password,
    is_active: true,
    is_superuser: false,
    role: "admin",
    status: "main",
    must_change_password: false,
  };

  return apiRequest<RegisteredUser>("/users/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}