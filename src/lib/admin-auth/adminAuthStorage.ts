const ACCESS_KEY = "share-project:access-token";
const REFRESH_KEY = "share-project:refresh-token";
const USER_KEY = "share-project:user";

export type StoredUser = {
  id?: string | number;
  name?: string;
  email?: string;
  username?: string;
  role?: string;
  [key: string]: unknown;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return typeof window === "undefined" ? fallback : fn();
  } catch {
    return fallback;
  }
}

export function getStoredAccessToken(): string | null {
  return safe(() => localStorage.getItem(ACCESS_KEY), null);
}

export function getStoredRefreshToken(): string | null {
  return safe(() => localStorage.getItem(REFRESH_KEY), null);
}

export function getStoredUser(): StoredUser | null {
  return safe(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  }, null);
}

export function setStoredTokens(
  accessToken: string,
  refreshToken?: string | null,
  user?: StoredUser | null,
) {
  safe(() => {
    localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }, undefined);
}

export function clearStoredTokens() {
  safe(() => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }, undefined);
}
