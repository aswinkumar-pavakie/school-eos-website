"use server";

// Server Actions behind the Faculty <-> Class Teacher account switcher. All
// session movement happens here (cookies are only writable from an Action);
// see src/lib/account-switch.ts for the cookie layout.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { refreshTokens } from "@/lib/token-refresh";
import {
  SWITCHABLE_ROLES,
  activateAccount,
  labelForRoles,
  listSavedAccounts,
  readActiveIdentity,
  readActiveTokens,
  removeSavedAccount,
  saveAccount,
  type ActiveIdentity,
} from "@/lib/account-switch";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

export interface SwitchResult {
  error?: string;
  /** The saved session is gone/expired -- the UI should ask for the password
   * again instead of retrying the instant switch. */
  needsPassword?: boolean;
}

export interface AddAccountState {
  error?: string;
}

interface MeBody {
  data: { person: { id: string; email?: string | null }; roles: { role_code: string }[] };
}

async function fetchMe(): Promise<{ personId: string; email: string | null; roles: string[] } | null> {
  const res = await apiFetch("/auth/me").catch(() => null);
  if (!res || !res.ok) return null;
  const body = (await res.json().catch(() => null)) as MeBody | null;
  if (!body) return null;
  return {
    personId: body.data.person.id,
    email: body.data.person.email ?? null,
    roles: body.data.roles.map((r) => r.role_code),
  };
}

/** Which identity the ACTIVE cookies hold -- the recorded one, or (for a
 * session that predates the switcher) derived from the live account. */
async function resolveActiveIdentity(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<ActiveIdentity | null> {
  const stored = readActiveIdentity(cookieStore);
  if (stored) return stored;
  const me = await fetchMe();
  if (!me) return null;
  return { label: labelForRoles(me.roles), identifier: me.email ?? `person-${me.personId}` };
}

async function revokeSession(refreshToken: string): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  }).catch(() => {
    // Best-effort server-side revoke; the local copy is dropped regardless.
  });
}

/** Instant switch to an account already saved on this device. */
export async function switchAccountAction(identifier: string): Promise<SwitchResult> {
  const cookieStore = await cookies();
  const target = listSavedAccounts(cookieStore).find((a) => a.identifier === identifier);
  if (!target) {
    return { error: "That account isn't saved on this device. Enter its password to add it.", needsPassword: true };
  }

  // A saved access token is long expired by now -- refresh it before making
  // it active, so a dead session is caught here (and offered a password
  // prompt) instead of bouncing the user to /login mid-navigation.
  const refreshed = await refreshTokens(target.refreshToken);
  if (!refreshed) {
    removeSavedAccount(cookieStore, target.identifier);
    return { error: "That session has expired. Enter its password to sign in again.", needsPassword: true };
  }

  const currentIdentity = await resolveActiveIdentity(cookieStore);
  const currentTokens = readActiveTokens(cookieStore);

  removeSavedAccount(cookieStore, target.identifier);
  if (currentIdentity && currentTokens) {
    saveAccount(cookieStore, { ...currentIdentity, ...currentTokens });
  }
  activateAccount(cookieStore, { label: target.label, identifier: target.identifier, ...refreshed });

  revalidatePath("/faculty", "layout");
  redirect("/faculty");
}

/** First-time add: a real login against the other account's own credentials
 * (Admin hands the Class Teacher email/password to the faculty member, same
 * as the mobile flow). The current session is kept as a saved account. */
export async function addAccountAction(_prev: AddAccountState, formData: FormData): Promise<AddAccountState> {
  const rawIdentifier = formData.get("identifier");
  const password = formData.get("password");
  if (typeof rawIdentifier !== "string" || rawIdentifier.trim() === "") {
    return { error: "Email or mobile number is required." };
  }
  if (typeof password !== "string" || password === "") {
    return { error: "Password is required." };
  }
  const identifier = rawIdentifier.trim();

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
      cache: "no-store",
    });
  } catch {
    return { error: "Unable to reach the server. Please try again." };
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) return { error: body?.message ?? "Sign-in failed." };

  const { accessToken, refreshToken, roles, person } = body.data as {
    accessToken: string;
    refreshToken: string;
    roles: { role_code: string }[];
    person: { id: string };
  };
  const roleCodes = roles.map((r) => r.role_code);

  if (!roleCodes.some((r) => SWITCHABLE_ROLES.includes(r))) {
    await revokeSession(refreshToken);
    return { error: "Only Faculty and Class Teacher accounts can be added here." };
  }

  const cookieStore = await cookies();
  const me = await fetchMe();
  if (me && me.personId === person.id) {
    await revokeSession(refreshToken);
    return { error: "You're already signed in as this account." };
  }

  const currentIdentity = await resolveActiveIdentity(cookieStore);
  const currentTokens = readActiveTokens(cookieStore);

  // Re-adding an account that was already saved replaces its old session.
  const stale = listSavedAccounts(cookieStore).find((a) => a.identifier === identifier);
  if (stale) {
    await revokeSession(stale.refreshToken);
    removeSavedAccount(cookieStore, stale.identifier);
  }
  if (currentIdentity && currentTokens) {
    saveAccount(cookieStore, { ...currentIdentity, ...currentTokens });
  }
  activateAccount(cookieStore, { label: labelForRoles(roleCodes), identifier, accessToken, refreshToken });

  revalidatePath("/faculty", "layout");
  redirect("/faculty");
}

/** Forget a saved account on this device (and revoke its session). */
export async function removeAccountAction(identifier: string): Promise<void> {
  const cookieStore = await cookies();
  const target = listSavedAccounts(cookieStore).find((a) => a.identifier === identifier);
  if (!target) return;
  await revokeSession(target.refreshToken);
  removeSavedAccount(cookieStore, target.identifier);
  revalidatePath("/faculty", "layout");
}
