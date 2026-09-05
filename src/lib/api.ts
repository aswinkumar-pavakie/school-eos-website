// Authenticated backend access for Server Actions / Route Handlers.
//
// Tokens live only in httpOnly cookies -- the browser never holds them and never
// calls the backend directly, so every authenticated call in this app goes through
// a Server Action or Route Handler, which is also the only place Next.js allows
// cookie writes from. That's why the actual refresh-and-persist step happens in
// src/proxy.ts (runs before Server Component rendering, and can write both the
// request's and the response's cookies) -- getValidAccessToken() below only
// refreshes the in-memory token for the current call as a fallback; it CANNOT
// reliably persist a new pair to the browser on its own when called from a plain
// Server Component render (Next.js disallows cookie writes there), which is what
// most page.tsx files in this app do.

import { cookies } from "next/headers";
import {
  decodeAccessTokenExpiry,
  isExpiredOrExpiringSoon,
  refreshTokens,
  type TokenPair,
} from "./token-refresh";

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

export class AuthExpiredError extends Error {
  constructor() {
    super("Session expired, please sign in again.");
    this.name = "AuthExpiredError";
  }
}

export type { TokenPair };

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export function setAuthCookies(cookieStore: CookieStore, tokens: TokenPair): void {
  const accessExp = decodeAccessTokenExpiry(tokens.accessToken);
  const accessMaxAge = accessExp
    ? Math.max(accessExp - Math.floor(Date.now() / 1000), 60)
    : 15 * 60;
  const common = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, { ...common, maxAge: accessMaxAge });
  cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...common,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookies(cookieStore: CookieStore): Promise<void> {
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

/**
 * Returns a currently-valid access token for the current call, refreshing it (and
 * best-effort persisting the new pair back to cookies — see file header, src/proxy.ts
 * is what makes that durable) if the stored one is missing, expired, or within
 * EXPIRY_SKEW_SECONDS of expiring.
 *
 * The try/catches below are a second line of defense on top of proxy.ts, not a
 * replacement for it: getCurrentActor()/apiFetch are still called directly from a few
 * places outside the proxied request path (e.g. a route the proxy doesn't cover), and
 * Next.js throws if `cookies().set()`/`.delete()` run outside a Server Action or Route
 * Handler. Without them, a call that happens to land in the ~30s-before-expiry refresh
 * window on one of those paths would throw mid-render and surface as a generic
 * "Couldn't load this page" error — not an auth problem at all, just an unpersisted
 * cookie write. The refreshed token is still valid and used for *this* request either
 * way; if the write couldn't land, the next Server Action or Route Handler call (or
 * the proxy, on the next navigation) simply refreshes again.
 */
export async function getValidAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken && !isExpiredOrExpiringSoon(accessToken)) {
    return accessToken;
  }
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    throw new AuthExpiredError();
  }
  const refreshed = await refreshTokens(refreshToken);
  if (!refreshed) {
    try {
      await clearAuthCookies(cookieStore);
    } catch {
      // Not writable from this render context — the stale cookies just expire
      // naturally on their own maxAge instead of being cleared early.
    }
    throw new AuthExpiredError();
  }

  try {
    // Best-effort only -- see file header. src/proxy.ts is what makes this durable.
    setAuthCookies(cookieStore, refreshed);
  } catch {
    // Same "not writable here" case, but this time refresh itself succeeded — use
    // the fresh token for this request regardless of whether the write landed.
  }
  return refreshed.accessToken;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const accessToken = await getValidAccessToken();
  const doFetch = (token: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  let res = await doFetch(accessToken);
  if (res.status === 401) {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshToken) throw new AuthExpiredError();
    const refreshed = await refreshTokens(refreshToken);
    if (!refreshed) {
      await clearAuthCookies(cookieStore);
      throw new AuthExpiredError();
    }
    setAuthCookies(cookieStore, refreshed);
    res = await doFetch(refreshed.accessToken);
  }
  return res;
}

export interface CurrentActor {
  personId: string;
  roles: string[];
}

/** The signed-in person's id + role codes — used to decide which actions a Finance page shows (real authorization is still enforced server-side regardless). */
export async function getCurrentActor(): Promise<CurrentActor> {
  const res = await apiFetch("/auth/me");
  if (!res.ok) throw new AuthExpiredError();
  const body = await res.json();
  const roles = (body.data.roles as { role_code: string }[]).map((r) => r.role_code);
  return { personId: body.data.person.id as string, roles };
}
