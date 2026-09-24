"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { REFRESH_TOKEN_COOKIE, clearAuthCookies } from "@/lib/api";
import { listSavedAccounts, resetSwitchState } from "@/lib/account-switch";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => {
      // Best-effort server-side revoke; cookies get cleared either way below.
    });
  }

  // Signing out signs out of EVERY account saved by the Faculty <-> Class
  // Teacher switcher too -- never leave a saved session usable behind a
  // handed-back browser.
  await Promise.all(
    listSavedAccounts(cookieStore).map((a) =>
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: a.refreshToken }),
        cache: "no-store",
      }).catch(() => {}),
    ),
  );
  resetSwitchState(cookieStore);
  await clearAuthCookies(cookieStore);
  redirect("/login");
}
