// Sports Admin -> Student detail. Pixel-matched to the design's own Student
// Detail screen (avatar+code, name+status, stat tiles, Personal details,
// Squads, Achievements-with-add). Real data only: getStudent (core record),
// real per-sport enrollment (listSports/listSportsProfiles -- the design's
// own "Squads" panel becomes "Sports enrolled" here, since squad
// membership is really tracked per-sport-profile/team-roster, not as a
// student-level field), and real achievements filtered to this student.
// This screen and its "+ Enroll in a sport" action (createSportsProfile,
// already granted to SPORTS_ADMIN) are what the design's own "MANAGE"
// column on the Students list links to -- confirmed real backend gap this
// build closes; a brand-new student RECORD is still Admin's own admissions
// workflow (no updateStudent/createStudent exists for this role), so this
// page never invents a name/admission-number edit capability.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { Card, StatTile, StatusPill, toneOf } from "@/components/sports-ui/primitives";
import { formatDate } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { getStudent, listAchievements, listSports, listSportsProfiles } from "@/lib/sports-admin-api";
import { EnrollSportPanel } from "./EnrollSportPanel";
import { SportsProfileRowActions } from "./SportsProfileRowActions";

export default async function StudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  try {
    const [student, sports, achievements] = await Promise.all([
      getStudent(studentId),
      listSports(),
      listAchievements(),
    ]);
    if (!student) notFound();

    const profilesPerSport = await Promise.all(sports.map((s) => listSportsProfiles(s.id).catch(() => [])));
    const enrolledProfiles = sports
      .map((s, i) => ({ sport: s, profile: profilesPerSport[i]?.find((p) => p.studentId === studentId) }))
      .filter((r): r is { sport: typeof r.sport; profile: NonNullable<typeof r.profile> } => !!r.profile);
    const enrolledSportIds = new Set(enrolledProfiles.map((r) => r.sport.id));
    const availableSports = sports.filter((s) => !enrolledSportIds.has(s.id));

    const studentAchievements = achievements.filter((a) => a.studentId === studentId);

    return (
      <div className="sports-scope">
        <Link href="/sports-admin/students" style={{ fontSize: 13, fontWeight: 700, color: "var(--sport-primary)", textDecoration: "none" }}>
          ← Back to students
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--sport-tint)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, color: "var(--sport-primary)" }}>
            {student.firstName[0]}
            {student.lastName?.[0] ?? ""}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>
                {student.firstName} {student.lastName ?? ""}
              </h1>
              <StatusPill label={student.status === "ACTIVE" ? "active" : "inactive"} tone={toneOf(student.status === "ACTIVE" ? "active" : "rest")} />
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--sport-muted-2)" }}>{student.admissionNo}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 24 }}>
          <StatTile label="REGISTER NO." value={student.admissionNo} />
          <StatTile label="CLASS" value={[student.gradeName, student.sectionName].filter(Boolean).join(" · ") || "—"} />
          <StatTile label="SPORTS ENROLLED" value={enrolledProfiles.length} />
          <StatTile label="ACHIEVEMENTS" value={studentAchievements.length} />
        </div>

        <Card style={{ padding: "20px 22px", marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <h2 style={{ margin: 0, flex: 1, fontSize: 19, fontWeight: 800, color: "var(--sport-heading)" }}>Sports enrolled</h2>
            <EnrollSportPanel studentId={studentId} availableSports={availableSports} />
          </div>
          {enrolledProfiles.length === 0 ? (
            <div style={{ fontSize: 13.5, color: "var(--sport-tertiary-3)" }}>Not enrolled in any sport yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {enrolledProfiles.map((r) => (
                <div key={r.profile.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--sport-divider)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--sport-ink)" }}>{r.sport.name}</div>
                    {r.profile.positionOrRole && <div style={{ fontSize: 12.5, color: "var(--sport-tertiary-2)" }}>{r.profile.positionOrRole}</div>}
                  </div>
                  <StatusPill label={r.profile.status === "ACTIVE" ? "active" : "inactive"} tone={toneOf(r.profile.status === "ACTIVE" ? "active" : "rest")} />
                  <SportsProfileRowActions studentId={studentId} profile={r.profile} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding: "20px 22px", marginTop: 16 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "var(--sport-heading)" }}>Achievements</h2>
          {studentAchievements.length === 0 ? (
            <div style={{ fontSize: 13.5, color: "var(--sport-tertiary-3)", marginTop: 12 }}>No achievements recorded yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {studentAchievements.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--sport-divider)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--sport-ink)" }}>{a.title ?? a.tournamentName ?? "Achievement"}</div>
                    <div style={{ fontSize: 12.5, color: "var(--sport-tertiary-2)" }}>{a.teamName ?? "—"} · {formatDate(a.awardedOn)}</div>
                  </div>
                  <StatusPill label={a.placement} tone={toneOf(a.placement)} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load this student."} />;
  }
}
