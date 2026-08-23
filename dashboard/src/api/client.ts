const TOKEN_KEY = "dashboard_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth) {
    setToken(null);
    window.location.href = "/login";
    throw new ApiError("Unauthorized", 401);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const message = (data && typeof data === "object" && "error" in data ? (data as any).error : null) ?? "حدث خطأ غير متوقع";
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  loginRequest: (username: string, password: string) =>
    request<{ token: string; admin: { id: number; username: string } }>("/auth/login", {
      method: "POST",
      body: { username, password },
      auth: false,
    }),
};
