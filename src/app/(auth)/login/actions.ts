"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { setAuthCookies } from "@/lib/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

// Admin, Principal (web half), Finance/Accounts, Library -- the only web logins in
// the system. Vice Principal moved to mobile-only per updated plan (2026-09-03) --
// see MOBILE_ALLOWED_ROLES in school-eos-mobile/src/lib/auth.ts. Faculty/Parent/
// Hostel Warden are mobile-only too; this backend endpoint itself doesn't restrict
// by client, so the platform boundary is enforced here, not assumed from who the
// task said would use this screen.
const WEB_ALLOWED_ROLES = ["ADMIN", "PRINCIPAL", "FINANCE", "LIBRARY"];

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const identifier = formData.get("identifier");
  const password = formData.get("password");

  if (typeof identifier !== "string" || identifier.trim() === "") {
    return { error: "Email is required." };
  }
  if (typeof password !== "string" || password === "") {
    return { error: "Password is required." };
  }

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

  if (!res.ok) {
    // Pass the backend's message through unchanged -- never rephrase it, never
    // distinguish wrong-password from unknown-email.
    return { error: body?.message ?? "Login failed." };
  }

  const { accessToken, refreshToken, roles } = body.data as {
    accessToken: string;
    refreshToken: string;
    roles: { role_code: string }[];
  };

  const hasWebAccess = roles.some((r) => WEB_ALLOWED_ROLES.includes(r.role_code));
  if (!hasWebAccess) {
    // Revoke the session we just issued -- this app never holds a valid token for a
    // role it doesn't serve, even briefly.
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => {});
    return { error: "This account does not have access to the web portal." };
  }

  const cookieStore = await cookies();
  setAuthCookies(cookieStore, { accessToken, refreshToken });

  // Each web-allowed role lands on the module built for it: Admin on the Admin
  // Console, Finance on the Finance module, Principal on Purchase/Service Requests +
  // the approvals routed to them. /dashboard is a defensive fallback only — every
  // role that reaches here already passed the WEB_ALLOWED_ROLES check above, so it
  // should never actually be hit.
  const roleCodes = roles.map((r) => r.role_code);
  if (roleCodes.includes("ADMIN")) {
    redirect("/admin");
  }
  if (roleCodes.includes("FINANCE")) {
    redirect("/finance");
  }
  if (roleCodes.includes("PRINCIPAL")) {
    redirect("/finance/purchase-requests");
  }
  if (roleCodes.includes("LIBRARY")) {
    redirect("/library");
  }
  redirect("/dashboard");
}
