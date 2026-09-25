// The one profile page every role's sidebar name/avatar opens -- same layout as
// Faculty's own profile screen (Back button, identity card with Log out,
// detail sections), built on the shared design tokens so it is identical for
// every login. It only ever shows the signed-in user's OWN details: identity
// from /auth/me, plus their real employee record from /staff/me for the
// roles the backend already lets read it (Faculty, Principal, Vice Principal,
// Admin, Sports Admin, Hostel Warden). Roles without a readable employee
// record (e.g. Finance, Library, Media, Parent) show their account details
// only -- nothing is invented, and no backend permission is changed.

import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError, apiFetch } from "@/lib/api";
import { logoutAction } from "@/app/(dashboard)/admin/actions";
import { getMyStaffProfile, type MyStaffProfile } from "@/lib/faculty-api";

interface MeResponse {
  data: {
    person: { firstName: string; lastName: string | null; email?: string | null };
    roles: { role_code: string }[];
  };
}

function humanize(code: string): string {
  return code
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--color-divider)" }}>
      <span style={{ font: "500 13.5px/1.4 var(--font-sans)", color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ font: "600 13.5px/1.4 var(--font-sans)", color: "var(--color-text)", textAlign: "right" }}>{value ?? "—"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "20px 22px" }}>
      <h2 style={{ font: "700 15px/1.2 var(--font-sans)", color: "var(--color-text)", margin: 0 }}>{title}</h2>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

export async function RoleProfilePage({ backHref, roleLabel }: { backHref: string; roleLabel: string }) {
  let me: MeResponse | null;
  let staff: MyStaffProfile | null;
  try {
    const meRes = await apiFetch("/auth/me");
    me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
    staff = await getMyStaffProfile().catch(() => null);
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your profile. Nothing was changed -- try again." />;
  }

  const person = me?.data.person;
  const personName = person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : "";
  const initials =
    personName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";
  const accountRoles = (me?.data.roles ?? []).map((r) => humanize(r.role_code));

  return (
    <div>
      <Link
        href={backHref}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          borderRadius: 10,
          padding: "10px 15px",
          font: "600 13.5px/1 var(--font-sans)",
          color: "var(--color-navy)",
          textDecoration: "none",
        }}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Back to dashboard
      </Link>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[320px_1fr]" style={{ marginTop: 18, alignItems: "start" }}>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 24, textAlign: "center" }}>
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: "50%",
              background: "var(--color-navy)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: "700 34px/1 var(--font-sans)",
              margin: "0 auto",
            }}
          >
            {initials}
          </div>
          <div style={{ font: "700 22px/1.3 var(--font-sans)", marginTop: 16, color: "var(--color-text)" }}>{personName || "--"}</div>
          <div style={{ font: "400 13.5px/1.4 var(--font-sans)", color: "var(--color-text-tertiary)", marginTop: 4 }}>
            {staff?.designation ?? roleLabel}
          </div>
          {staff && (
            <div style={{ font: "500 12px/1 var(--font-mono)", color: "var(--color-text-tertiary)", marginTop: 6 }}>{staff.employeeNo}</div>
          )}
          <form action={logoutAction} style={{ marginTop: 20 }}>
            <button
              type="submit"
              style={{
                width: "100%",
                border: "1px solid var(--color-critical-bg)",
                background: "var(--color-surface)",
                color: "var(--color-critical-text)",
                cursor: "pointer",
                font: "600 14px/1 var(--font-sans)",
                borderRadius: 9,
                padding: "13px 0",
              }}
            >
              Log out
            </button>
          </form>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Section title="Account">
            <Row label="Name" value={personName || null} />
            <Row label="Email" value={person?.email ?? null} />
            <Row label="Role" value={roleLabel} />
            <Row label="Access" value={accountRoles.length > 0 ? accountRoles.join(", ") : null} />
          </Section>

          {staff && (
            <>
              <Section title="Employment">
                <Row label="Staff ID" value={staff.employeeNo} />
                <Row label="Designation" value={staff.designation} />
                <Row label="Employment type" value={staff.employmentType} />
                <Row label="Date of joining" value={staff.dateOfJoining ? formatDate(staff.dateOfJoining) : null} />
                <Row
                  label="Experience"
                  value={staff.experienceYears !== null ? `${staff.experienceYears} year${staff.experienceYears === 1 ? "" : "s"}` : null}
                />
                <Row label="Staff room" value={staff.staffRoom} />
                <Row label="Status" value={staff.status} />
              </Section>

              <Section title="Qualifications">
                <Row label="Highest qualification" value={staff.highestQualification} />
                <Row label="Specialization" value={staff.specialization} />
                <Row label="University" value={staff.university} />
                <Row label="Year of graduation" value={staff.yearOfGraduation !== null ? String(staff.yearOfGraduation) : null} />
                <Row label="TET/NET cleared" value={staff.tetNetCleared === null ? null : staff.tetNetCleared ? "Yes" : "No"} />
              </Section>

              <Section title="Recognition & training">
                <Row label="Areas of expertise" value={staff.areasOfExpertise} />
                <Row label="Certifications" value={staff.certifications} />
                <Row label="Workshops & training" value={staff.workshopsTraining} />
                <Row label="Achievements & awards" value={staff.achievementsAwards} />
              </Section>

              <Section title="Contact">
                <Row label="Email" value={staff.email} />
                <Row label="Mobile" value={staff.mobile} />
                <Row label="Blood group" value={staff.bloodGroup} />
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
