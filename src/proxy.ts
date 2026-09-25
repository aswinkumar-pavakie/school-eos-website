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
import { DEVICE_ID_COOKIE, deviceCookieOptions, newDeviceId, readDeviceId } from "@/lib/device-id";
import type { NextRequest } from "next/server";
import { decodeAccessTokenRoles, isExpiredOrExpiringSoon, refreshTokens } from "@/lib/token-refresh";

const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";

// The only /faculty screens a Class Teacher login (CLASS_ADVISOR without
// FACULTY) can use -- kept in step with buildClassTeacherNavGroups. Any other
// /faculty URL (homework, marks entry, employee screens...) needs the FACULTY
// role on the backend, so it is sent back to the Class Teacher dashboard
// instead of a wall of 403 error boxes.
const CLASS_TEACHER_PATHS = [
  "/faculty/message",
  "/faculty/announcements",
  "/faculty/calendar",
  "/faculty/timetable",
  "/faculty/students",
  "/faculty/class-teacher",
  "/faculty/attendance",
  "/faculty/class-exams",
  "/faculty/fees",
  "/faculty/student-leave",
  "/faculty/parent-meetings",
  "/faculty/profile",
  "/faculty/ai-chat",
];

function isAllowedForClassTeacher(pathname: string): boolean {
  if (pathname === "/faculty" || pathname === "/faculty/") return true;
  return CLASS_TEACHER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

async function handle(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const { pathname } = request.nextUrl;
  if (accessToken && pathname.startsWith("/faculty")) {
    const roles = decodeAccessTokenRoles(accessToken);
    if (roles && roles.includes("CLASS_ADVISOR") && !roles.includes("FACULTY") && !isAllowedForClassTeacher(pathname)) {
      return NextResponse.redirect(new URL("/faculty", request.url));
    }
  }

  if (!refreshToken || (accessToken && !isExpiredOrExpiringSoon(accessToken))) {
    return NextResponse.next();
  }

  const refreshed = await refreshTokens(refreshToken, readDeviceId(request.cookies));
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

/** Every covered page load also makes sure this browser has a device id (an old session
 * binds to it at its next token refresh). */
export async function proxy(request: NextRequest) {
  const response = await handle(request);
  if (!readDeviceId(request.cookies)) {
    response.cookies.set(DEVICE_ID_COOKIE, newDeviceId(), deviceCookieOptions());
  }
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/print/:path*",
    "/library/:path*",
    "/finance/:path*",
    "/community/:path*",
    "/faculty/:path*",
    "/parent/:path*",
    "/media/:path*",
    "/sports/:path*",
    "/health-incharge/:path*",
  ],
};
