// Shared JWT/refresh logic with no next/headers import, so both the
// Server Component/Action layer (src/lib/api.ts) and the Node-runtime
// proxy (src/proxy.ts) can use the same code -- the proxy is the only
// place that can actually persist a refreshed pair to the browser
// (see src/proxy.ts for why), but api.ts still needs to decode/refresh
// for the in-memory value it uses on the current request.

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

export const EXPIRY_SKEW_SECONDS = 30;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function decodeAccessTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const decoded = JSON.parse(json) as { exp?: unknown };
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

/** Role codes carried in the access token -- decoded for UX routing only
 * (never authorization; the backend re-checks every request). */
export function decodeAccessTokenRoles(token: string): string[] | null {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const decoded = JSON.parse(json) as { roles?: unknown };
    return Array.isArray(decoded.roles) ? decoded.roles.filter((r): r is string => typeof r === "string") : null;
  } catch {
    return null;
  }
}

export function isExpiredOrExpiringSoon(token: string): boolean {
  const exp = decodeAccessTokenExpiry(token);
  if (exp === null) return true;
  return exp - Math.floor(Date.now() / 1000) <= EXPIRY_SKEW_SECONDS;
}

// The backend rotates the refresh token on every use and the old one stops
// matching immediately, so two requests refreshing with the same expired
// session at once (two tabs, a prefetch, a background poll) made the loser
// fail and signed the user out. Concurrent callers with the same refresh token
// now share one backend call, and its result is reused for a few seconds for
// requests that were already in flight with the old cookie.
const REFRESH_SHARE_MS = 15_000;
const inFlightRefreshes = new Map<string, { promise: Promise<TokenPair | null>; at: number }>();

export async function refreshTokens(refreshToken: string, deviceId: string | null = null): Promise<TokenPair | null> {
  const now = Date.now();
  for (const [key, entry] of inFlightRefreshes) {
    if (now - entry.at > REFRESH_SHARE_MS) inFlightRefreshes.delete(key);
  }
  const existing = inFlightRefreshes.get(refreshToken);
  if (existing) return existing.promise;
  const promise = refreshTokensOnce(refreshToken, deviceId);
  inFlightRefreshes.set(refreshToken, { promise, at: now });
  promise.then(
    (pair) => {
      if (!pair) inFlightRefreshes.delete(refreshToken);
    },
    () => inFlightRefreshes.delete(refreshToken),
  );
  return promise;
}

// Returns null ONLY when the backend says the refresh token is invalid (4xx).
// A network failure or 5xx (backend down / restarting) throws instead, so the
// caller keeps the session cookies -- previously any failure returned null and
// signed every user out whenever the backend was briefly unreachable.
async function refreshTokensOnce(refreshToken: string, deviceId: string | null): Promise<TokenPair | null> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(deviceId ? { "X-Device-Id": deviceId } : {}) },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    throw new Error("The server is temporarily unreachable. Please try again in a moment.");
  }
  if (res.status >= 500) throw new Error("The server is temporarily unavailable. Please try again in a moment.");
  if (!res.ok) return null;
  const body = await res.json().catch(() => null);
  const data = body?.data;
  if (typeof data?.accessToken !== "string" || typeof data?.refreshToken !== "string") {
    return null;
  }
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}
