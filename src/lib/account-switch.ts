// Faculty <-> Class Teacher account switching, web side. Tokens live only in
// httpOnly cookies (see src/lib/api.ts), so "saved accounts" are httpOnly
// cookies too: one cookie per non-active account (kept separate so no single
// cookie nears the 4KB limit), plus one small cookie recording which identity
// the ACTIVE token pair belongs to. Mirrors the mobile app's account list
// (school-eos-mobile/src/lib/auth.ts): switching swaps the active pair with a
// saved one, so switching back never asks for the password again.
//
// Server-only: imported from Server Components and Server Actions, never from
// a Client Component.

import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, setAuthCookies, type TokenPair } from "./api";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export type IdentityLabel = "FACULTY" | "CLASS_TEACHER" | "OTHER";

export interface ActiveIdentity {
  label: IdentityLabel;
  identifier: string;
}

export interface SavedAccount extends ActiveIdentity, TokenPair {}

const ACTIVE_IDENTITY_COOKIE = "activeIdentity";
const SAVED_PREFIX = "otherAcct_"; // legacy: old builds saved the other account's tokens in cookies
const HOME_ACCOUNT_COOKIE = "homeAccount";
const ACTIVE_CLASS_COOKIE = "activeClass";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** The only roles the switcher links -- it exists for the Faculty <-> Class
 * Teacher pair, not as a general "sign in as anyone" list. */
export const SWITCHABLE_ROLES = ["FACULTY", "CLASS_ADVISOR"];

export function labelForRoles(roles: string[]): IdentityLabel {
  if (roles.includes("FACULTY")) return "FACULTY";
  if (roles.includes("CLASS_ADVISOR")) return "CLASS_TEACHER";
  return "OTHER";
}

function cookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: THIRTY_DAYS,
  };
}

function savedCookieName(identifier: string): string {
  return `${SAVED_PREFIX}${identifier.replace(/[^A-Za-z0-9_-]/g, "_")}`;
}

function parseJson<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isSavedAccount(v: unknown): v is SavedAccount {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.identifier === "string" &&
    typeof o.label === "string" &&
    typeof o.accessToken === "string" &&
    typeof o.refreshToken === "string"
  );
}

export function readActiveIdentity(cookieStore: CookieStore): ActiveIdentity | null {
  const parsed = parseJson<ActiveIdentity>(cookieStore.get(ACTIVE_IDENTITY_COOKIE)?.value);
  return parsed && typeof parsed.identifier === "string" && typeof parsed.label === "string" ? parsed : null;
}

export function setActiveIdentity(cookieStore: CookieStore, identity: ActiveIdentity): void {
  cookieStore.set(ACTIVE_IDENTITY_COOKIE, JSON.stringify(identity), cookieOptions());
}

export function listSavedAccounts(cookieStore: CookieStore): SavedAccount[] {
  return cookieStore
    .getAll()
    .filter((c) => c.name.startsWith(SAVED_PREFIX))
    .map((c) => parseJson<unknown>(c.value))
    .filter(isSavedAccount);
}

export function saveAccount(cookieStore: CookieStore, account: SavedAccount): void {
  cookieStore.set(savedCookieName(account.identifier), JSON.stringify(account), cookieOptions());
}

export function removeSavedAccount(cookieStore: CookieStore, identifier: string): void {
  cookieStore.delete(savedCookieName(identifier));
}

export function clearSavedAccounts(cookieStore: CookieStore): void {
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith(SAVED_PREFIX)) cookieStore.delete(c.name);
  }
}

/** The pair currently in the ACTIVE cookies, if both are present. */
export function readActiveTokens(cookieStore: CookieStore): TokenPair | null {
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
}

/** Makes `account` the active session. */
export function activateAccount(cookieStore: CookieStore, account: SavedAccount): void {
  setAuthCookies(cookieStore, { accessToken: account.accessToken, refreshToken: account.refreshToken });
  setActiveIdentity(cookieStore, { label: account.label, identifier: account.identifier });
}

// ---- Linked account switching (server-backed) ---------------------------------------
// This browser keeps tokens for the ACTIVE account only. The account we switched OUT of
// is remembered by id (never by token) so the switcher can offer "back"; the server
// decides whether a switch is allowed. Design: rnd-linked-account-switching.md.

export interface HomeAccount {
  personId: string;
  label: IdentityLabel;
  title: string;
}

export function readHomeAccount(cookieStore: CookieStore): HomeAccount | null {
  const v = parseJson<HomeAccount>(cookieStore.get(HOME_ACCOUNT_COOKIE)?.value);
  return v && typeof v.personId === "string" && typeof v.title === "string" ? v : null;
}

export function setHomeAccount(cookieStore: CookieStore, home: HomeAccount): void {
  cookieStore.set(HOME_ACCOUNT_COOKIE, JSON.stringify(home), cookieOptions());
}

export function clearHomeAccount(cookieStore: CookieStore): void {
  cookieStore.delete(HOME_ACCOUNT_COOKIE);
  cookieStore.delete(ACTIVE_CLASS_COOKIE);
}

/** e.g. "5-B" while signed into a class account (display only). */
export function readActiveClass(cookieStore: CookieStore): string | null {
  return cookieStore.get(ACTIVE_CLASS_COOKIE)?.value ?? null;
}

export function setActiveClass(cookieStore: CookieStore, className: string): void {
  cookieStore.set(ACTIVE_CLASS_COOKIE, className, cookieOptions());
}

/** Login/logout paths call this so a fresh sign-in never inherits another person's
 * switch state (and any legacy saved-account cookies are dropped). */
export function resetSwitchState(cookieStore: CookieStore): void {
  clearSavedAccounts(cookieStore);
  clearHomeAccount(cookieStore);
  cookieStore.delete(ACTIVE_IDENTITY_COOKIE);
}
