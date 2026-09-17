// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isProfile" screen.
// KNOWN GAP (see the plan): staff.controller.ts has a ready-shaped
// GET staff/me family, but the whole controller is
// ADMIN/PRINCIPAL/VICE_PRINCIPAL-only -- FACULTY excluded. Real name comes
// from /auth/me (already used sitewide); staff-specific details (employee
// no, qualifications, service record, teaching load) degrade to GapNotice.
// "Log out" is real -- reuses the same shared logoutAction the sidebar used
// before this rebuild.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError, apiFetch } from "@/lib/api";
import { logoutAction } from "@/app/(dashboard)/admin/actions";
import { GapNotice } from "@/components/faculty-ui/GapNotice";
import { BackButton } from "@/components/faculty-ui/BackButton";

export default async function ProfilePage() {
  try {
    const res = await apiFetch("/auth/me");
    const me = res.ok ? ((await res.json()) as { data: { person: { firstName: string; lastName: string | null } } }) : null;
    const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";
    const initials = personName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

    return (
      <div>
        <BackButton href="/faculty" label="Back to dashboard" />

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[320px_1fr]" style={{ marginTop: 18, alignItems: "start" }}>
          <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 24, textAlign: "center" }}>
            <div style={{ width: 104, height: 104, borderRadius: "50%", background: "var(--fac-navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "700 34px/1 var(--fac-font-sans)", margin: "0 auto" }}>
              {initials}
            </div>
            <div style={{ font: "700 22px/1.3 var(--fac-font-sans)", marginTop: 16 }}>{personName || "--"}</div>
            <div style={{ font: "400 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 4 }}>Faculty</div>
            <form action={logoutAction} style={{ marginTop: 20 }}>
              <button type="submit" style={{ width: "100%", border: "1px solid var(--fac-red-bg)", background: "var(--fac-white)", color: "var(--fac-red-text)", cursor: "pointer", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 9, padding: "13px 0" }}>
                Log out
              </button>
            </form>
          </div>
          <GapNotice feature="Employee details (staff ID, qualifications, service record, teaching load, recognition & training)" />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your profile. Nothing was changed -- try again." />;
  }
}
