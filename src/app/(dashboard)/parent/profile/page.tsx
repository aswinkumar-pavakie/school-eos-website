// Profile -- pixel-rebuilt from the design's own isProfile screen. The
// selected child's own basic-info profile: read-only, real getStudentProfile
// data. Bus route pulled in as one stat only, from the same
// getBusAllocation the /parent/bus page shows in full.

import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError, apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getBusAllocation, getStudentProfile, listChildren, resolveSelectedChild } from "@/lib/parent-api";
import { logoutAction } from "@/app/(dashboard)/admin/actions";

function computeAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return "—";
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hadBirthdayThisYear = now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return `${age} yrs`;
}

function initialsOf(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--color-divider)" }}>
      <span style={{ font: "500 13.5px/1.4 var(--font-sans)", color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ font: "600 13.5px/1.4 var(--font-sans)", color: "var(--color-text)", textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "20px 22px" }}>
      <h2 style={{ font: "700 15px/1.2 var(--font-sans)", color: "var(--color-text)", margin: 0 }}>{title}</h2>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

export default async function ParentProfilePage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const [profile, bus] = await Promise.all([
      getStudentProfile(selected.studentId),
      getBusAllocation(selected.studentId).catch(() => null),
    ]);

    const meRes = await apiFetch("/auth/me").catch(() => null);
    const me = meRes && meRes.ok ? ((await meRes.json()) as { data: { person: { firstName: string; lastName: string | null; email?: string | null } } }) : null;
    const parentName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";
    const parentEmail = me?.data.person.email ?? null;

    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");

    return (
      <div className="parent-scope">
        <Link
          href={`/parent${selected.studentId ? `?studentId=${selected.studentId}` : ""}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid var(--color-border)", background: "var(--color-surface)", borderRadius: 10, padding: "10px 15px", font: "600 13.5px/1 var(--font-sans)", color: "var(--color-navy)", textDecoration: "none" }}
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Back to dashboard
        </Link>

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[320px_1fr]" style={{ marginTop: 18, alignItems: "start" }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 24, textAlign: "center" }}>
            <div style={{ width: 104, height: 104, borderRadius: "50%", background: "var(--color-navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "700 34px/1 var(--font-sans)", margin: "0 auto" }}>
              {initialsOf(parentName) || "?"}
            </div>
            <div style={{ font: "700 22px/1.3 var(--font-sans)", marginTop: 16, color: "var(--color-text)" }}>{parentName || "--"}</div>
            <div style={{ font: "400 13.5px/1.4 var(--font-sans)", color: "var(--color-text-tertiary)", marginTop: 4 }}>Parent</div>
            <form action={logoutAction} style={{ marginTop: 20 }}>
              <button type="submit" style={{ width: "100%", border: "1px solid var(--color-critical-bg)", background: "var(--color-surface)", color: "var(--color-critical-text)", cursor: "pointer", font: "600 14px/1 var(--font-sans)", borderRadius: 9, padding: "13px 0" }}>
                Log out
              </button>
            </form>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Card title="Account">
              <InfoRow label="Name" value={parentName || "—"} />
              <InfoRow label="Email" value={parentEmail ?? "—"} />
              <InfoRow label="Role" value="Parent" />
            </Card>
            <Card title={`Child · ${fullName}`}>
              <InfoRow label="Admission no." value={profile.admissionNo} />
              <InfoRow label="Grade" value={profile.gradeName ?? "—"} />
              <InfoRow label="Section" value={profile.sectionName ?? "—"} />
              <InfoRow label="Roll no." value={profile.rollNo !== null ? String(profile.rollNo) : "—"} />
              <InfoRow label="Medium" value={profile.mediumName ?? "—"} />
            </Card>
            <Card title="Child personal details">
              <InfoRow label="Date of birth" value={formatDate(profile.dateOfBirth)} />
              <InfoRow label="Age" value={computeAge(profile.dateOfBirth)} />
              <InfoRow label="Gender" value={profile.gender ?? "—"} />
              <InfoRow label="Blood group" value={profile.bloodGroup ?? "—"} />
              <InfoRow label="Bus route" value={bus?.routeName ?? "—"} />
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load this profile."} />;
  }
}
