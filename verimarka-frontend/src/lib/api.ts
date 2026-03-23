import { clearTokens, getAccessToken, getRefreshToken, setAccessToken, setTokens } from "./token";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const AUTH_REFRESH_SUCCESS_EVENT = "verimarka:auth-refresh-success";
export const AUTH_REFRESH_FAILED_EVENT = "verimarka:auth-refresh-failed";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
  _retryAfterRefresh?: boolean;
}

interface RefreshResponse {
  access: string;
  refresh?: string;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      clearTokens();
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh }),
    });

    const data = (await response.json().catch(() => ({}))) as RefreshResponse & {
      detail?: string;
      message?: string;
    };

    if (!response.ok || !data.access) {
      clearTokens();
      window.dispatchEvent(new CustomEvent(AUTH_REFRESH_FAILED_EVENT));
      return null;
    }

    if (data.refresh) {
      setTokens(data.access, data.refresh);
    } else {
      setAccessToken(data.access);
    }

    window.dispatchEvent(new CustomEvent(AUTH_REFRESH_SUCCESS_EVENT));
    return data.access;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = false, _retryAfterRefresh = false } = options;

  const headers: Record<string, string> = {};
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (auth && response.status === 401 && !_retryAfterRefresh) {
    const nextAccessToken = await refreshAccessToken();
    if (nextAccessToken) {
      return apiRequest<T>(path, {
        ...options,
        _retryAfterRefresh: true,
      });
    }
  }

  if (!response.ok) {
    const flattenError = (value: unknown): string | null => {
      if (typeof value === "string") return value;
      if (Array.isArray(value)) {
        const messages = value
          .map((item) => flattenError(item))
          .filter((item): item is string => Boolean(item));
        return messages.length ? messages.join(" ") : null;
      }
      if (value && typeof value === "object") {
        const messages = Object.values(value as Record<string, unknown>)
          .map((item) => flattenError(item))
          .filter((item): item is string => Boolean(item));
        return messages.length ? messages.join(" ") : null;
      }
      return null;
    };

    const message =
      data?.detail ||
      data?.message ||
      flattenError(data) ||
      "요청 처리 중 오류가 발생했습니다.";
    throw new Error(message);
  }

  return data as T;
}
