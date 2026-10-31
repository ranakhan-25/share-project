const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

function makeError(message: string, response?: any) {
  const err: any = new Error(message);
  if (response) err.response = response;
  return err;
}

async function request(method: string, path: string, body?: any, config?: any) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(config?.headers || {}) };
  const token = typeof window !== "undefined" ? (window.localStorage.getItem("access_token") || window.localStorage.getItem("admin_access_token")) : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: any = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    throw makeError(data?.message || res.statusText, { data, status: res.status });
  }
  return { data, status: res.status };
}

const api: any = {
  get: (path: string, config?: any) => request("GET", path, undefined, config),
  post: (path: string, body?: any, config?: any) => request("POST", path, body, config),
  put: (path: string, body?: any, config?: any) => request("PUT", path, body, config),
  patch: (path: string, body?: any, config?: any) => request("PATCH", path, body, config),
  delete: (path: string, config?: any) => request("DELETE", path, undefined, config),
};

export default api;