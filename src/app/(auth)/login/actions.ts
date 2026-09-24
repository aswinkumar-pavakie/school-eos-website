"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { setAuthCookies } from "@/lib/api";
import { labelForRoles, resetSwitchState, setActiveIdentity } from "@/lib/account-switch";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

// (Phase 1: login only), Transport Manager, Faculty, Parent, Vice Principal,
// Hostel Warden, Academic Coordinator -- the web logins in the system. Vice
// Principal was mobile-only from 2026-09-03 until explicitly reversed by
// direct request -- see src/app/(dashboard)/vice-principal's own layout.tsx
// for why its nav is NOT a copy of Principal's: real backend @Roles audit
// across every controller found genuine differences (VP has real Attendance
// Sessions + Examinations oversight Principal's own web console doesn't; VP
// lacks the per-student Transport/Fees sub-views and vehicle
// documents/maintenance Principal has). Faculty was mobile-only too until
// the product decision on 2026-09-08 to bring the same module to the web
// (see src/app/(dashboard)/faculty); Parent got the same treatment right
// after (see src/app/(dashboard)/parent). FACULTY also covers Sports
// Faculty (Sports In-Charge) operations (see /sports's own layout.tsx) --
// the /sports module only ever shows data for sport(s) a SPORTS_FACULTY
// role_assignment scopes an account to, so a non-PT teacher's account just
// sees empty lists there (same "empty, not 403" convention the backend
// already uses); reached via the "Sports" nav item inside /faculty, not a
// separate login path. Hostel Warden was mobile-only until this same
// treatment was extended to it (see src/app/(dashboard)/hostel-warden) --
// this backend's own /hostel/* endpoints never restricted by client, so this
// list is the actual platform boundary, not something assumed from who the
// task said would use a given screen.
const WEB_ALLOWED_ROLES = [
  "ADMIN",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "FINANCE",
  "LIBRARY",
  "MEDIA_ROOM",
  "TRANSPORT_MANAGER",
  "FACULTY",
  "PARENT",
  "HOSTEL_WARDEN",
  // A genuinely separate coordinator-only login (see Admin's own "coordinator
  // login" flow, persons.service.ts's createAcademicCoordinatorLogin) --
  // carries ONLY this role_code, no FACULTY, in its own JWT. A faculty member
  // using their own shared FACULTY login for coordinator duties never needs
  // this entry to matter here (FACULTY already covers them; see the redirect
  // branch below).
  "ACADEMIC_COORDINATOR",
  // A genuinely new, separate real login (own person/login_identifier/
  // user_credential/role_assignment rows -- see backend query.md's
  // "Correspondent role" entry), not a second role on an existing Principal
  // account. Its web console (src/app/(dashboard)/correspondent/) is
  // Principal's own layout/pages cloned, since the SIS Correspondent
  // reference design is literally Principal Console.dc.html relabeled --
  // every backend endpoint Principal's console calls already had its own
  // @Roles widened to include CORRESPONDENT alongside PRINCIPAL.
  "CORRESPONDENT",
  // Sports Admin -- a genuinely separate, school-wide sports login (own
  // person/login_identifier/user_credential/role_assignment rows, is_core_login
  // true -- see database/migrations/0019_sports_admin_role.sql), distinct from
  // SPORTS_FACULTY (a scoped role_assignment on top of an existing FACULTY
  // login, not a login of its own). Missed here when the module was first
  // built -- login was silently blocked by this exact allowlist until fixed.
  "SPORTS_ADMIN",
  // Canteen counter -- a genuinely separate, device-scoped login (own
  // person/login_identifier/user_credential/role_assignment rows -- see
  // database/migrations/0027_canteen_vendor_role.sql). Two screens only
  // (Ledger, History); every real endpoint lives under
  // school-eos-backend/src/modules/canteen/, @Roles('CANTEEN_VENDOR') only.
  "CANTEEN_VENDOR",
  // A Class Teacher login -- a synthetic, per-section login (one per grade +
  // section, see backend class_teacher_login) carrying ONLY CLASS_ADVISOR. It
  // signs into the same /faculty console as Faculty, in its Class Teacher
  // view (see faculty/layout.tsx), and is what the Faculty <-> Class Teacher
  // account switcher swaps to.
  "CLASS_ADVISOR",
];

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
    return { error: "Email or mobile number is required." };
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
  // A fresh sign-in replaces the whole session: drop any accounts saved by a
  // previous person on this browser, and record who is active now.
  resetSwitchState(cookieStore);
  setActiveIdentity(cookieStore, {
    label: labelForRoles(roles.map((r) => r.role_code)),
    identifier: identifier.trim(),
  });

  // Each web-allowed role lands on the module built for it: Admin on the Admin
  // Console, Finance on the Finance module, Principal on its own Principal Console
  // (src/app/(dashboard)/principal/ — the full sidebar, not the narrow Purchase/
  // Service Requests + Approvals view Finance's layout still offers Principal by
  // direct URL). /dashboard is a defensive fallback only — every role that reaches
  // here already passed the WEB_ALLOWED_ROLES check above, so it should never
  // actually be hit.
  const roleCodes = roles.map((r) => r.role_code);
  if (roleCodes.includes("ADMIN")) {
    redirect("/admin");
  }
  if (roleCodes.includes("FINANCE")) {
    redirect("/finance");
  }
  if (roleCodes.includes("PRINCIPAL")) {
    redirect("/principal");
  }
  if (roleCodes.includes("CORRESPONDENT")) {
    redirect("/correspondent");
  }
  if (roleCodes.includes("VICE_PRINCIPAL")) {
    redirect("/vice-principal");
  }
  if (roleCodes.includes("LIBRARY")) {
    redirect("/library");
  }
  if (roleCodes.includes("MEDIA_ROOM")) {
    redirect("/media");
  }
  if (roleCodes.includes("TRANSPORT_MANAGER")) {
    redirect("/transport-manager");
  }
  if (roleCodes.includes("FACULTY")) {
    // Every FACULTY login (including Sports Faculty) lands on the general
    // Faculty Console -- Sports is reached from there via its own nav item
    // (see faculty/layout.tsx), not a separate landing page.
    redirect("/faculty");
  }
  if (roleCodes.includes("CLASS_ADVISOR")) {
    redirect("/faculty");
  }
  if (roleCodes.includes("PARENT")) {
    redirect("/parent");
  }
  if (roleCodes.includes("HOSTEL_WARDEN")) {
    redirect("/hostel-warden");
  }
  if (roleCodes.includes("SPORTS_ADMIN")) {
    redirect("/sports-admin");
  }
  if (roleCodes.includes("CANTEEN_VENDOR")) {
    redirect("/canteen");
  }
  // A coordinator-only login (no FACULTY role_code at all -- see
  // WEB_ALLOWED_ROLES's own comment above) lands directly on the Academic
  // Coordinator portal; a faculty member's own shared login already went to
  // /faculty above regardless of any coordinator grant they also hold.
  if (roleCodes.includes("ACADEMIC_COORDINATOR")) {
    redirect("/academic-coordinator");
  }
  redirect("/dashboard");
}
