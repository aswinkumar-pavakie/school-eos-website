"use server";

// Server Actions behind the Faculty <-> Class Teacher account switcher.
// The BACKEND decides who may switch to what (design:
// school-eos-website/rnd-linked-account-switching.md):
//  * addAccountAction  -- once per browser, from the Faculty account: needs the admin's
//    mapping AND the class login's own password (a leaked Faculty password alone
//    cannot do this).
//  * switchAccountAction -- every time after: no password, needs a live session on this
//    browser plus a link for this browser.
// This browser only ever holds the ACTIVE account's tokens (httpOnly cookies).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, setAuthCookies } from "@/lib/api";
import {
  clearHomeAccount,
  labelForRoles,
  readActiveIdentity,
  readHomeAccount,
  setActiveClass,
  setActiveIdentity,
  setHomeAccount,
} from "@/lib/account-switch";
import { ensureDeviceId } from "@/lib/device-id";

export interface SwitchResult {
  error?: string;
}

export interface AddAccountState {
  error?: string;
}

interface LoginBody {
  data: {
    accessToken: string;
    refreshToken: string;
    person: { id: string; email?: string | null };
    roles: { role_code: string }[];
    /** Set by POST /auth/linked-accounts: "5-B". */
    linkedLabel?: string | null;
  };
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? fallback;
}

async function currentPerson(): Promise<{ id: string } | null> {
  const res = await apiFetch("/auth/me").catch(() => null);
  if (!res || !res.ok) return null;
  const body = await res.json().catch(() => null);
  return body?.data?.person?.id ? { id: body.data.person.id as string } : null;
}

/** Common tail of add + switch: adopt the new session, remember where we came from. */
async function adoptSession(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  body: LoginBody,
  opts: { fromPersonId: string; fromTitle: string; className: string | null; goingHome: boolean },
): Promise<void> {
  const { accessToken, refreshToken, person, roles } = body.data;
  setAuthCookies(cookieStore, { accessToken, refreshToken });
  setActiveIdentity(cookieStore, {
    label: labelForRoles(roles.map((r) => r.role_code)),
    identifier: person.email ?? `person-${person.id}`,
  });
  if (opts.goingHome) {
    clearHomeAccount(cookieStore);
  } else {
    setHomeAccount(cookieStore, { personId: opts.fromPersonId, label: "FACULTY", title: opts.fromTitle });
    if (opts.className) setActiveClass(cookieStore, opts.className);
  }
}

/** Switch to an account already linked on this browser (or back to the one we came from). */
export async function switchAccountAction(targetPersonId: string, title: string, className: string | null): Promise<SwitchResult> {
  const cookieStore = await cookies();
  ensureDeviceId(cookieStore);
  // Warm-up call FIRST: it refreshes an expiring session, which rotates the refresh
  // token -- so the token sent to the backend must be read after it.
  const me = await currentPerson();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken || !me) return { error: "Your session has expired. Please sign in again." };

  const res = await apiFetch("/auth/switch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetPersonId, refreshToken }),
  }).catch(() => null);
  if (!res) return { error: "Unable to reach the server. Please try again." };
  if (!res.ok) {
    if (res.status === 403) {
      return { error: "That account is no longer linked on this browser. Add it again from your Faculty login." };
    }
    return { error: await errorMessage(res, "Could not switch accounts.") };
  }

  const home = readHomeAccount(cookieStore);
  await adoptSession(cookieStore, (await res.json()) as LoginBody, {
    fromPersonId: me.id,
    fromTitle: readActiveIdentity(cookieStore)?.label === "CLASS_TEACHER" ? "Class Teacher" : "Faculty",
    className,
    goingHome: home?.personId === targetPersonId,
  });

  revalidatePath("/faculty", "layout");
  redirect("/faculty");
}

/** First time on this browser: add a class account by its email + password. Faculty
 * account only. The backend accepts it only if the admin mapped that class to this teacher. */
export async function addAccountAction(_prev: AddAccountState, formData: FormData): Promise<AddAccountState> {
  const identifier = formData.get("identifier");
  const password = formData.get("password");
  if (typeof identifier !== "string" || identifier.trim() === "") return { error: "Enter the class login email." };
  if (typeof password !== "string" || password === "") return { error: "Enter the class login password." };

  const cookieStore = await cookies();
  const deviceId = ensureDeviceId(cookieStore);
  const me = await currentPerson();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!refreshToken || !me) return { error: "Your session has expired. Please sign in again." };

  const res = await apiFetch("/auth/linked-accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Device-Id": deviceId },
    body: JSON.stringify({ identifier: identifier.trim(), password, refreshToken, devicePlatform: "WEB", deviceLabel: "Web browser" }),
  }).catch(() => null);
  if (!res) return { error: "Unable to reach the server. Please try again." };
  if (!res.ok) {
    // One message for "unknown email", "not your class" and "wrong password" -- the
    // backend answers them identically on purpose.
    if (res.status === 401) return { error: "Those login details are not correct, or that class is not assigned to you." };
    return { error: await errorMessage(res, "Could not add the account.") };
  }

  const body = (await res.json()) as LoginBody;
  await adoptSession(cookieStore, body, {
    fromPersonId: me.id,
    fromTitle: "Faculty",
    className: body.data.linkedLabel ?? null,
    goingHome: false,
  });

  revalidatePath("/faculty", "layout");
  redirect("/faculty");
}
