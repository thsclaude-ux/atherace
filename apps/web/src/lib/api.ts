const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  etag?: string;
  skipRefresh?: boolean;
}

export interface ConditionalResult<T> {
  data: T | null;
  etag: string | null;
  notModified: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Refresh failed");
    const json = await res.json();
    const tokens = json.data;
    storeTokens(tokens.accessToken, tokens.refreshToken ?? refreshToken);
    return tokens.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

async function request(path: string, opts: ApiOptions, token?: string | null): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...opts.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.etag) headers["If-None-Match"] = opts.etag;

  return fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "include",
  });
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  let token = opts.token ?? getStoredToken();
  let res = await request(path, opts, token);

  if (res.status === 401 && !opts.skipRefresh && getStoredRefreshToken()) {
    if (!refreshInFlight) {
      refreshInFlight = refreshAccessToken().finally(() => { refreshInFlight = null; });
    }
    token = await refreshInFlight;
    if (token) res = await request(path, opts, token);
  }

  if (res.status === 304) {
    return null as T;
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json.data ?? json;
}

export async function apiConditional<T>(path: string, opts: ApiOptions = {}): Promise<ConditionalResult<T>> {
  let token = opts.token ?? getStoredToken();
  let res = await request(path, opts, token);

  if (res.status === 401 && !opts.skipRefresh && getStoredRefreshToken()) {
    if (!refreshInFlight) {
      refreshInFlight = refreshAccessToken().finally(() => { refreshInFlight = null; });
    }
    token = await refreshInFlight;
    if (token) res = await request(path, opts, token);
  }

  const etag = res.headers.get("ETag");

  if (res.status === 304) {
    return { data: null, etag, notModified: true };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Request failed");
  return { data: json.data ?? json, etag, notModified: false };
}

export function getStoredToken(): string | null {
  return localStorage.getItem("atr_access_token");
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem("atr_refresh_token");
}

export function storeTokens(access: string, refresh: string) {
  localStorage.setItem("atr_access_token", access);
  localStorage.setItem("atr_refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("atr_access_token");
  localStorage.removeItem("atr_refresh_token");
}

export function getOrCreateUserId(): string {
  let id = localStorage.getItem("atr_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("atr_user_id", id);
  }
  return id;
}

export function getSessionToken(): string | null {
  return localStorage.getItem("atr_session_token");
}

export function storeSessionToken(token: string) {
  localStorage.setItem("atr_session_token", token);
}
