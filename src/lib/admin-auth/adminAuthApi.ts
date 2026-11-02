import type { StoredUser } from "./adminAuthStorage";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002").replace(/\/+$/, "");
const LOGIN_PATH = process.env.NEXT_PUBLIC_LOGIN_PATH || "/realbizpro/api/v1/share-user/login";

export type LoginSession = {
  accessToken: string;
  refreshToken: string | null;
  user: StoredUser | null;
};

type Json = Record<string, unknown>;

const isObj = (v: unknown): v is Json => !!v && typeof v === "object" && !Array.isArray(v);

/** Walks nested `data` wrappers and returns the first object containing a token. */
function findSession(payload: unknown): LoginSession | null {
  let node: unknown = payload;
  for (let depth = 0; depth < 5 && isObj(node); depth++) {
    const access = node.accessToken ?? node.access_token ?? node.token;
    if (typeof access === "string" && access) {
      const refresh = node.refreshToken ?? node.refresh_token;
      return {
        accessToken: access,
        refreshToken: typeof refresh === "string" ? refresh : null,
        user: isObj(node.user) ? (node.user as StoredUser) : null,
      };
    }
    node = node.data;
  }
  return null;
}

/**
 * Login API call.
 *   POST {API_BASE}{LOGIN_PATH}  body: { identifier, email, username, password }
 * Adjust LOGIN_PATH / body fields here if your backend differs.
 */
export async function loginUniversalSession(identifier: string, password: string): Promise<LoginSession> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${LOGIN_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        email: identifier,
        password,
      }),
    });
  } catch {
    throw new Error("Cannot reach the server. Please check your connection and try again.");
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message = isObj(payload) && typeof payload.message === "string" ? payload.message : `Login failed (${response.status})`;
    throw new Error(message);
  }

  const session = findSession(payload);
  if (!session) throw new Error("Unexpected response from the server.");
  return session;
}
