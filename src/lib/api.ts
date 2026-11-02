const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002").replace(/\/+$/, "");

function makeError(message: string, response?: { data: unknown; status: number }) {
  const err = new Error(message) as Error & { response?: { data: unknown; status: number } };
  err.response = response;
  return err;
}

async function request(method: string, path: string, body?: unknown, config?: { headers?: Record<string, string> }) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config?.headers || {}),
  };
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("share-project:access-token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const payload = data && typeof data === "object" ? (data as Record<string, unknown>) : undefined;
    if (typeof window !== "undefined" && (res.status === 401 || res.status === 403)) {
      window.localStorage.removeItem("share-project:access-token");
      window.localStorage.removeItem("share-project:refresh-token");
      window.localStorage.removeItem("share-project:user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    throw makeError(
      typeof payload?.message === "string" ? payload.message : res.statusText || `Request failed (${res.status})`,
      { data, status: res.status },
    );
  }
  return { data, status: res.status };
}

const api = {
  get: (path: string, config?: { headers?: Record<string, string> }) => request("GET", path, undefined, config),
  post: (path: string, body?: unknown, config?: { headers?: Record<string, string> }) => request("POST", path, body, config),
  put: (path: string, body?: unknown, config?: { headers?: Record<string, string> }) => request("PUT", path, body, config),
  patch: (path: string, body?: unknown, config?: { headers?: Record<string, string> }) => request("PATCH", path, body, config),
  delete: (path: string, config?: { headers?: Record<string, string> }) => request("DELETE", path, undefined, config),
};

export default api;
