/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1`
    : "http://localhost:5002/realbizpro/api/v1");

export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/realbizpro\/api\/v1\/?$/, "")
    : "http://localhost:5002");

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("admin_access_token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    null
  );
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extraHeaders,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function crmFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers || {});

  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let urlStr =
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : (input as Request).url;

  // If url is relative or starts with /crm or /realbizpro, resolve properly
  if (urlStr.startsWith("/crm")) {
    urlStr = `${API_BASE}${urlStr}`;
  } else if (urlStr.startsWith("/realbizpro/api/v1")) {
    urlStr = `${API_ORIGIN}${urlStr}`;
  } else if (urlStr.startsWith("/")) {
    urlStr = `${API_BASE}${urlStr}`;
  }

  return fetch(urlStr, {
    ...init,
    headers,
  });
}
