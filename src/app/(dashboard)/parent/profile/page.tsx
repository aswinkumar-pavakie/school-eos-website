// Profile -- pixel-rebuilt from the design's own isProfile screen. The
// selected child's own basic-info profile: read-only, real getStudentProfile
// data. Bus route pulled in as one stat only, from the same
// getBusAllocation the /parent/bus page shows in full.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getBusAllocation, getStudentProfile, listChildren, resolveSelectedChild } from "@/lib/parent-api";
import { logoutAction } from "@/app/(dashboard)/admin/actions";
import { SignOutButton } from "./SignOutButton";

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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--par-divider)" }}>
      <span style={{ fontSize: 13.5, color: "var(--par-body-muted)" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--par-ink)" }}>{value}</span>
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

    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");

    return (
      <div className="parent-scope">
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 20, color: "var(--par-ink)" }}>Profile</div>

        <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card)", padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            {profile.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoUrl} alt={fullName} style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 88, height: 88, borderRadius: "50%", background: "var(--par-tint)", color: "var(--par-primary)", fontSize: 28, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {initialsOf(fullName)}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--par-ink)", marginBottom: 4 }}>{fullName}</div>
              <div style={{ fontSize: 14, color: "var(--par-body-muted)", marginBottom: 10 }}>
                {profile.gradeName ? `${profile.gradeName} · Section ${profile.sectionName ?? "—"}${profile.rollNo !== null ? ` · Roll ${profile.rollNo}` : ""}` : "Not enrolled in a class yet"}
              </div>
              <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, background: "var(--par-panel)", color: "var(--par-body)", padding: "5px 12px", borderRadius: 20 }}>
                Admission {profile.admissionNo}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12, marginTop: 20 }}>
            <div style={{ background: "var(--par-panel-2)", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>Blood group</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--par-ink)" }}>{profile.bloodGroup ?? "—"}</div>
            </div>
            <div style={{ background: "var(--par-panel-2)", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>Age</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--par-ink)" }}>{computeAge(profile.dateOfBirth)}</div>
            </div>
            <div style={{ background: "var(--par-panel-2)", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>Bus route</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--par-ink)" }}>{bus?.routeName ?? "—"}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 20 }}>
          <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card-sm)", padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--par-ink)", marginBottom: 4 }}>School</div>
            <div>
              <InfoRow label="Admission no." value={profile.admissionNo} />
              <InfoRow label="Grade" value={profile.gradeName ?? "—"} />
              <InfoRow label="Section" value={profile.sectionName ?? "—"} />
              <InfoRow label="Medium" value={profile.mediumName ?? "—"} />
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card-sm)", padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--par-ink)", marginBottom: 4 }}>Personal</div>
            <div>
              <InfoRow label="Date of birth" value={formatDate(profile.dateOfBirth)} />
              <InfoRow label="Gender" value={profile.gender ?? "—"} />
              <InfoRow label="Blood group" value={profile.bloodGroup ?? "—"} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <SignOutButton onSignOut={logoutAction} />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load this profile."} />;
  }
}
