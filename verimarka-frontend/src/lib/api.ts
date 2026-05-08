import { clearTokens, getAccessToken, hasRefreshSessionHint, setAccessToken } from "./token";
import { appLogger, createClientRequestId } from "./logger";
import { captureSentryMessage } from "./sentry";

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
}

export class ApiRequestError extends Error {
  status: number;
  requestId: string | null;
  responseId: string | null;
  errorCode: string | null;
  path: string;

  constructor(
    message: string,
    options: {
      status: number;
      requestId?: string | null;
      responseId?: string | null;
      errorCode?: string | null;
      path: string;
    },
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.requestId = options.requestId ?? null;
    this.responseId = options.responseId ?? null;
    this.errorCode = options.errorCode ?? null;
    this.path = options.path;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

function getNetworkErrorMessage() {
  return "서버에 연결할 수 없습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.";
}

function redactSensitiveBody(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveBody(item));
  }
  if (!value || typeof value !== "object" || value instanceof FormData) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => {
      if (/token|password|refresh|access/i.test(key)) {
        return [key, "[redacted]"];
      }
      return [key, redactSensitiveBody(item)];
    }),
  );
}

export async function refreshAccessToken(options: { dispatchEvents?: boolean } = {}): Promise<string | null> {
  const dispatchEvents = options.dispatchEvents ?? true;
  if (!getAccessToken() && !hasRefreshSessionHint()) {
    return null;
  }
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const requestId = createClientRequestId();
    appLogger.info("api.refresh.request", {
      request_id: requestId,
      path: "/auth/token/refresh/",
      method: "POST",
    });

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": requestId,
        },
        credentials: "include",
      });
    } catch (error) {
      appLogger.error("api.refresh.network_error", {
        request_id: requestId,
        path: "/auth/token/refresh/",
        error,
      });
      clearTokens();
      if (dispatchEvents) {
        window.dispatchEvent(new CustomEvent(AUTH_REFRESH_FAILED_EVENT));
      }
      return null;
    }

    const responseRequestId = response.headers.get("X-Request-Id");
    const responseId = response.headers.get("X-Response-Id");

    const data = (await response.json().catch(() => ({}))) as RefreshResponse & {
      detail?: string;
      message?: string;
    };

    appLogger.info("api.refresh.response", {
      request_id: responseRequestId || requestId,
      response_id: responseId,
      path: "/auth/token/refresh/",
      method: "POST",
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok || !data.access) {
      clearTokens();
      if (dispatchEvents) {
        window.dispatchEvent(new CustomEvent(AUTH_REFRESH_FAILED_EVENT));
      }
      return null;
    }

    setAccessToken(data.access);

    if (dispatchEvents) {
      window.dispatchEvent(new CustomEvent(AUTH_REFRESH_SUCCESS_EVENT));
    }
    return data.access;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: { retryAfterRefresh?: boolean } = {},
): Promise<Response> {
  const headers = new Headers(init.headers ?? {});
  const requestId = headers.get("X-Request-Id") || createClientRequestId();
  headers.set("X-Request-Id", requestId);
  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  appLogger.info("api.fetch.request", {
    request_id: requestId,
    url: typeof input === "string" ? input : input.toString(),
    method: init.method || "GET",
    auth: headers.has("Authorization"),
  });

  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers,
      credentials: init.credentials ?? "include",
    });
  } catch (error) {
    appLogger.error("api.fetch.network_error", {
      request_id: requestId,
      url: typeof input === "string" ? input : input.toString(),
      method: init.method || "GET",
      error,
    });
    throw new Error(getNetworkErrorMessage());
  }

  appLogger.info("api.fetch.response", {
    request_id: response.headers.get("X-Request-Id") || requestId,
    response_id: response.headers.get("X-Response-Id"),
    url: typeof input === "string" ? input : input.toString(),
    method: init.method || "GET",
    status: response.status,
    ok: response.ok,
  });

  if (response.status === 401 && !options.retryAfterRefresh) {
    const nextAccessToken = await refreshAccessToken();
    if (nextAccessToken) {
      const retryHeaders = new Headers(init.headers ?? {});
      retryHeaders.set("X-Request-Id", createClientRequestId());
      retryHeaders.set("Authorization", `Bearer ${nextAccessToken}`);
      try {
        return await fetch(input, {
          ...init,
          headers: retryHeaders,
          credentials: init.credentials ?? "include",
        });
      } catch (error) {
        appLogger.error("api.fetch.retry_network_error", {
          url: typeof input === "string" ? input : input.toString(),
          method: init.method || "GET",
          error,
        });
        throw new Error(getNetworkErrorMessage());
      }
    }
  }

  return response;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = false, _retryAfterRefresh = false } = options;

  const headers: Record<string, string> = {};
  const requestId = createClientRequestId();
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  headers["X-Request-Id"] = requestId;

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  appLogger.info("api.request", {
    request_id: requestId,
    path,
    method,
    auth,
    body: isFormData ? { kind: "FormData" } : redactSensitiveBody(body),
  });

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
      credentials: "include",
    });
  } catch (error) {
    const message = getNetworkErrorMessage();
    appLogger.error("api.network_error", {
      request_id: requestId,
      path,
      method,
      error,
    });
    throw new ApiRequestError(message, {
      status: 0,
      requestId,
      path,
      errorCode: "NETWORK_ERROR",
    });
  }

  const responseRequestId = response.headers.get("X-Request-Id") || requestId;
  const responseId = response.headers.get("X-Response-Id");

  const data = await response.json().catch(() => ({}));

  appLogger.info("api.response", {
    request_id: responseRequestId,
    response_id: responseId,
    path,
    method,
    status: response.status,
    ok: response.ok,
    error_code: typeof data?.error_code === "string" ? data.error_code : null,
  });

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
      data?.error_message ||
      data?.detail ||
      data?.message ||
      flattenError(data) ||
      (response.status >= 500
        ? "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        : "요청 처리 중 오류가 발생했습니다.");
    const error = new ApiRequestError(message, {
      status: response.status,
      requestId: responseRequestId,
      responseId,
      errorCode: typeof data?.error_code === "string" ? data.error_code : null,
      path,
    });
    appLogger.error("api.error", {
      path,
      method,
      status: response.status,
      request_id: responseRequestId,
      response_id: responseId,
      error_code: error.errorCode,
      message,
      response: data,
    });
    throw error;
  }

  if (path.includes("/mint/") && data && typeof data === "object") {
    const blockchain = (data as { blockchain?: Record<string, unknown> }).blockchain || {};
    const minted = Boolean(blockchain.minted);
    const tokenId = blockchain.token_id;
    const ownerAddress = typeof blockchain.owner_address === "string" ? blockchain.owner_address : "";
    const recipientAddress = typeof blockchain.recipient_address === "string" ? blockchain.recipient_address : "";
    const invalidTokenId = minted && (tokenId === 0 || tokenId === "0" || tokenId === null || typeof tokenId === "undefined");
    const invalidOwnerAddress =
      minted &&
      ownerAddress &&
      ownerAddress.toLowerCase() === "0x0000000000000000000000000000000000000000";

    if (invalidTokenId || invalidOwnerAddress) {
      captureSentryMessage("frontend.mint_response_anomaly", {
        level: "warning",
        extra: {
          path,
          method,
          request_id: responseRequestId,
          response_id: responseId,
          token_id: tokenId,
          owner_address: ownerAddress,
          recipient_address: recipientAddress,
          minted,
        },
      });
      appLogger.warn("api.mint_response_anomaly", {
        path,
        method,
        request_id: responseRequestId,
        response_id: responseId,
        token_id: tokenId,
        owner_address: ownerAddress,
        recipient_address: recipientAddress,
      });
    }
  }

  return data as T;
}
