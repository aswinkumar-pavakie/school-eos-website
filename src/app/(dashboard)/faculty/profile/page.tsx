// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isProfile" screen.
// Employee details (staff ID, qualifications, service record, teaching
// load, recognition & training) is now real -- GET /staff/me was already
// fully real and already selecting every one of these fields (see
// staff.repository.ts's own StaffRow comment: "Added so the Faculty
// profile detail view ... can show real contact/gender data instead of
// fabricating it"), it was just missing FACULTY on its own @Roles() list
// (staff.controller.ts, now fixed). Teaching load is computed from the
// same real scope endpoints the Faculty dashboard already uses
// (listAdvisorSections/listTeachingOfferings), not a new capability.
// "Log out" is real -- reuses the same shared logoutAction the sidebar used
// before this rebuild.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError, apiFetch, getCurrentActor } from "@/lib/api";
import { logoutAction } from "@/app/(dashboard)/admin/actions";
import { BackButton } from "@/components/faculty-ui/BackButton";
import { getMyStaffProfile, listAdvisorSections, listTeachingOfferings, type MyStaffProfile } from "@/lib/faculty-api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--fac-divider)" }}>
      <span style={{ font: "500 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>{label}</span>
      <span style={{ font: "600 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-ink)", textAlign: "right" }}>{value ?? "—"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "20px 22px" }}>
      <h2 style={{ font: "700 15px/1.2 var(--fac-font-sans)", color: "var(--fac-ink)", margin: 0 }}>{title}</h2>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

export default async function ProfilePage() {
  try {
    const [meRes, staffResult, advisorSections, teachingOfferings] = await Promise.all([
      apiFetch("/auth/me"),
      getMyStaffProfile()
        .then((data) => ({ data, error: null as string | null }))
        .catch((err) => ({ data: null as MyStaffProfile | null, error: err instanceof Error ? err.message : "Could not load employee details." })),
      listAdvisorSections().catch(() => []),
      listTeachingOfferings().catch(() => []),
    ]);

    const me = meRes.ok ? ((await meRes.json()) as { data: { person: { firstName: string; lastName: string | null } } }) : null;
    const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";
    const initials = personName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

    const staff = staffResult.data;
    // A Class Teacher login is a per-section login with no employee record
    // of its own -- the employee details live on the Faculty login.
    const isClassTeacherLogin = !(await getCurrentActor()).roles.includes("FACULTY");
    const subjectCount = new Set(teachingOfferings.map((o) => o.subjectId)).size;

    return (
      <div>
        <BackButton href="/faculty" label="Back to dashboard" />

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[320px_1fr]" style={{ marginTop: 18, alignItems: "start" }}>
          <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 24, textAlign: "center" }}>
            <div style={{ width: 104, height: 104, borderRadius: "50%", background: "var(--fac-navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "700 34px/1 var(--fac-font-sans)", margin: "0 auto" }}>
              {initials}
            </div>
            <div style={{ font: "700 22px/1.3 var(--fac-font-sans)", marginTop: 16 }}>{personName || "--"}</div>
            <div style={{ font: "400 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 4 }}>
              {staff?.designation ?? "Faculty"}
            </div>
            {staff && (
              <div className="fac-font-mono" style={{ font: "500 12px/1 var(--fac-font-mono)", color: "var(--fac-tertiary)", marginTop: 6 }}>
                {staff.employeeNo}
              </div>
            )}
            <form action={logoutAction} style={{ marginTop: 20 }}>
              <button type="submit" style={{ width: "100%", border: "1px solid var(--fac-red-bg)", background: "var(--fac-white)", color: "var(--fac-red-text)", cursor: "pointer", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 9, padding: "13px 0" }}>
                Log out
              </button>
            </form>
          </div>

          {!staff ? (
            <ErrorState
              message={
                isClassTeacherLogin
                  ? "This is a class login, so it has no employee record. Employee details are on your Faculty account -- use the switch button to change accounts."
                  : (staffResult.error ?? "Could not load employee details.")
              }
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Section title="Employment">
                <Row label="Staff ID" value={staff.employeeNo} />
                <Row label="Designation" value={staff.designation} />
                <Row label="Employment type" value={staff.employmentType} />
                <Row label="Date of joining" value={formatDate(staff.dateOfJoining)} />
                <Row label="Experience" value={staff.experienceYears !== null ? `${staff.experienceYears} year${staff.experienceYears === 1 ? "" : "s"}` : null} />
                <Row label="Staff room" value={staff.staffRoom} />
                <Row label="Status" value={staff.status} />
              </Section>

              <Section title="Teaching load">
                <Row
                  label="Classes I advise"
                  value={advisorSections.length > 0 ? advisorSections.map((s) => `${s.gradeName}-${s.sectionName}`).join(", ") : "Not a class advisor"}
                />
                <Row
                  label="Subjects I teach"
                  value={teachingOfferings.length > 0 ? `${subjectCount} subject${subjectCount === 1 ? "" : "s"} across ${teachingOfferings.length} class${teachingOfferings.length === 1 ? "" : "es"}` : "None assigned"}
                />
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
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your profile. Nothing was changed -- try again." />;
  }
}
