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
  return safe(
    () =>
      localStorage.getItem(ACCESS_KEY) ||
      localStorage.getItem("admin_access_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token"),
    null,
  );
}

export function getStoredRefreshToken(): string | null {
  return safe(() => localStorage.getItem(REFRESH_KEY) || localStorage.getItem("admin_refresh_token"), null);
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
    localStorage.setItem("admin_access_token", accessToken);
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("token", accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
      localStorage.setItem("admin_refresh_token", refreshToken);
    }
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (typeof document !== "undefined") {
      document.cookie = `${ACCESS_KEY}=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `admin_access_token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `access_token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
    }
  }, undefined);
}

export function clearStoredTokens() {
  safe(() => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    if (typeof document !== "undefined") {
      document.cookie = `${ACCESS_KEY}=; path=/; max-age=0`;
      document.cookie = "admin_access_token=; path=/; max-age=0";
      document.cookie = "access_token=; path=/; max-age=0";
      document.cookie = "token=; path=/; max-age=0";
    }
  }, undefined);
}
