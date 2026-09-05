// Next.js 16 renamed middleware.ts -> proxy.ts (same runtime, same
// capabilities, just a clearer name -- see node_modules/next/dist/docs/
// 01-app/03-api-reference/03-file-conventions/proxy.md).
//
// Why this file has to exist at all: every authenticated page in this app is a
// plain Server Component calling apiFetch()/getValidAccessToken() (src/lib/api.ts).
// Next.js does not allow a Server Component render to persist cookies (`cookies()
// .set()` there is a no-op against the browser -- see node_modules/next/dist/docs/
// 01-app/03-api-reference/04-functions/cookies.md: "Setting cookies is not
// supported during Server Component rendering"). So when a Server Component
// silently refreshed an expired access token to serve its own request, the new
// pair never reached the browser -- the old, soon-to-be-invalid tokens stayed in
// the cookie jar, and the very next navigation failed the same way again,
// bouncing the admin back to /login on a loop.
//
// Proxy runs before the route renders and CAN write cookies on both sides: onto
// `request.cookies` (so this render's `cookies().get()` sees the fresh token) and
// onto the outgoing response (so the browser actually keeps it). That's the fix:
// do the refresh-and-persist here, once, before the page ever renders.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isExpiredOrExpiringSoon, refreshTokens } from "@/lib/token-refresh";

const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken || (accessToken && !isExpiredOrExpiringSoon(accessToken))) {
    return NextResponse.next();
  }

  const refreshed = await refreshTokens(refreshToken);
  if (!refreshed) {
    // Refresh token is gone/invalid -- let the page's own auth check redirect
    // to /login rather than duplicating that logic here.
    return NextResponse.next();
  }

  request.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken);
  request.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.refreshToken);

  const response = NextResponse.next({ request: { headers: request.headers } });
  const common = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  response.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken, { ...common, maxAge: 15 * 60 });
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.refreshToken, {
    ...common,
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/print/:path*"],
};
