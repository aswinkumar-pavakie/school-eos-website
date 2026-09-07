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

export function isExpiredOrExpiringSoon(token: string): boolean {
  const exp = decodeAccessTokenExpiry(token);
  if (exp === null) return true;
  return exp - Math.floor(Date.now() / 1000) <= EXPIRY_SKEW_SECONDS;
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair | null> {
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
