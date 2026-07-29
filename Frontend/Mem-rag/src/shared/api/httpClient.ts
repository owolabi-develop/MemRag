import { useAuthStore } from "../store/authStore";
import { useSTenantIDStore } from "../store/TenantStore";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function extractErrorMessage(detail: unknown, fallback: string): string {
  if (detail && typeof detail === "object") {
    const d = detail as Record<string, unknown>;
    if (typeof d.detail === "string") return d.detail;
    if (Array.isArray(d.detail) && d.detail.length > 0) {
      const first = d.detail[0] as { msg?: string; loc?: unknown[] };
      if (first?.msg) {
        const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : undefined;
        return field ? `${field}: ${first.msg}` : first.msg;
      }
    }
  }
  return fallback;
}


function handleUnauthorized(): void {
  useAuthStore.getState().clearAuth();
  useSTenantIDStore.getState().clearID();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = undefined;
    }
    throw new ApiError(res.status, extractErrorMessage(detail, `Request failed (${res.status})`), detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (res.status === 401) {
    handleUnauthorized();

    throw new ApiError(401, "Session expired. Redirecting to sign in…");
  }

  return handleResponse<T>(res);
}

export async function apiFormRequest<T>(
  path: string,
  body: URLSearchParams,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: init.method ?? "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      ...init.headers,
    },
    body,
  });
  return handleResponse<T>(res);
}


export async function apiFileRequest<T>(
  path: string,
  body: FormData,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: init.method ?? "POST",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
    body,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, "Session expired. Redirecting to sign in…");
  }

  return handleResponse<T>(res);
}