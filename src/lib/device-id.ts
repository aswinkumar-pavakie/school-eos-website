// A random per-browser id in an httpOnly cookie, sent to the backend as X-Device-Id so
// a session and an account link can be tied to THIS browser. It only names the
// browser -- it grants nothing by itself. Design:
// school-eos-website/rnd-linked-account-switching.md.
//
// No next/headers import here: callers pass the cookie store (Server Actions may
// create it; Server Components and the proxy may only read it).

export const DEVICE_ID_COOKIE = "deviceId";
const ONE_YEAR = 60 * 60 * 24 * 365;

interface ReadableCookies {
  get(name: string): { value: string } | undefined;
}
interface WritableCookies extends ReadableCookies {
  set(name: string, value: string, options?: Record<string, unknown>): unknown;
}

/** Matches the backend's [A-Za-z0-9_-]{8,64}. */
export function newDeviceId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function deviceCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ONE_YEAR,
  };
}

export function readDeviceId(store: ReadableCookies): string | null {
  return store.get(DEVICE_ID_COOKIE)?.value ?? null;
}

/** Server Actions / Route Handlers only: returns the id, creating the cookie if absent. */
export function ensureDeviceId(store: WritableCookies): string {
  const existing = readDeviceId(store);
  if (existing) return existing;
  const fresh = newDeviceId();
  store.set(DEVICE_ID_COOKIE, fresh, deviceCookieOptions());
  return fresh;
}

export function deviceHeader(deviceId: string | null): Record<string, string> {
  return deviceId ? { "X-Device-Id": deviceId } : {};
}
