// Authenticated backend access for Server Actions / Route Handlers.
//
// Tokens live only in httpOnly cookies -- the browser never holds them and never
// calls the backend directly, so every authenticated call in this app goes through
// a Server Action or Route Handler, which is also the only place Next.js allows
// cookie writes from. That's why the silent-refresh logic lives here rather than in
// middleware: refreshing needs to persist the new pair back to cookies, and this is
// the layer that's actually allowed to do that.

import { cookies } from "next/headers";

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

/** No valid session could be established -- caller should redirect to /login. */
export class AuthExpiredError extends Error {
  constructor() {
    super("Session expired, please sign in again.");
    this.name = "AuthExpiredError";
  }
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/** Reads exp out of the JWT payload without verifying it -- only ever used to decide
 * a cookie's own maxAge / whether to proactively refresh, never for authorization. */
function decodeAccessTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const decoded = JSON.parse(json) as { exp?: unknown };
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

const EXPIRY_SKEW_SECONDS = 30;

function isExpiredOrExpiringSoon(token: string): boolean {
  const exp = decodeAccessTokenExpiry(token);
  if (exp === null) return true;
  return exp - Math.floor(Date.now() / 1000) <= EXPIRY_SKEW_SECONDS;
}

async function refreshTokens(refreshToken: string): Promise<TokenPair | null> {
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  if (!res.ok) return null;

  const body = await res.json().catch(() => null);
  const data = body?.data;
  if (typeof data?.accessToken !== "string" || typeof data?.refreshToken !== "string") {
    return null;
  }
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}

/** Sets both cookies from a fresh token pair -- used on login and on every refresh. */
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
    maxAge: 60 * 60 * 24 * 30, // matches the backend's user_session TTL default
  });
}

export async function clearAuthCookies(cookieStore: CookieStore): Promise<void> {
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

/**
 * Returns a currently-valid access token, transparently refreshing (and persisting
 * the new pair back to cookies, WHEN this call happens to run inside a Server Action
 * or Route Handler) if the stored one is missing, expired, or within
 * EXPIRY_SKEW_SECONDS of expiring.
 *
 * getCurrentActor()/apiFetch are called from plain page/layout Server Components too
 * (every page needs the caller's role to render its nav/actions) — and Next.js
 * throws if `cookies().set()`/`.delete()` run outside a Server Action or Route
 * Handler. Without the try/catch below, a page load that happens to land inside the
 * ~30s-before-expiry refresh window (the access token is only 15 minutes, so this
 * recurs constantly) would throw mid-render and surface as a generic "Couldn't load
 * this page" error — not an auth problem at all, just an unpersisted cookie write.
 * The refreshed token is still valid and used for *this* request either way; if the
 * write couldn't land, the next Server Action or Route Handler call simply refreshes
 * again (one extra round-trip, never a broken page).
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
    setAuthCookies(cookieStore, refreshed);
  } catch {
    // Same "not writable here" case, but this time refresh itself succeeded — use
    // the fresh token for this request regardless of whether the write landed.
  }
  return refreshed.accessToken;
}

/**
 * Authenticated fetch against the backend: attaches a guaranteed-fresh access token
 * and retries once on a 401 in case the session was revoked between the freshness
 * check and the call (e.g. logged out from another device in that instant).
 */
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
