// Sports Admin -> Students / players register. Real listStudents() (full
// school roster, search only -- this schema has no dedicated "sports player"
// flag; sport participation itself lives per-sport in listSportsProfiles(),
// surfaced per student via a link into that sport's profile list) plus a
// quick per-sport enrolled-count summary sourced from real profile data.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatTile } from "@/components/sports-ui/primitives";
import { orDash } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listSports, listSportsProfiles, listStudents } from "@/lib/sports-admin-api";

export default async function SportsAdminStudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  try {
    const [sports, studentsResult] = await Promise.all([
      listSports(),
      listStudents(q ? { search: q } : {}),
    ]);
    const profilesPerSport = await Promise.all(sports.map((s) => listSportsProfiles(s.id).catch(() => [])));
    const enrolledStudentIds = new Set(profilesPerSport.flat().map((p) => p.studentId));

    return (
      <div className="sports-scope">
        <div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Students &amp; players</div>
          <div style={{ fontSize: 14.5, color: "var(--sport-tertiary)", marginTop: 8 }}>{studentsResult.meta.total} students in the school roster</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(sports.length || 1, 4)}, minmax(0,1fr))`, gap: 14, marginTop: 22 }}>
          {sports.map((s, i) => (
            <StatTile key={s.id} label={s.name} value={profilesPerSport[i]?.length ?? 0} sub="players enrolled" />
          ))}
        </div>

        <form style={{ marginTop: 22 }}>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name or admission no."
            style={{ width: 340, height: 44, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 14px", fontSize: 14, fontFamily: "inherit" }}
          />
        </form>

        {studentsResult.data.length === 0 ? (
          <div style={{ marginTop: 20 }}><EmptyPanel label="No students match this search." /></div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, marginTop: 18, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 1fr 0.9fr", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--sport-divider)" }}>
              {["NAME", "ADM NO.", "GRADE / SECTION", "SPORTS"].map((h) => (
                <span key={h} style={{ fontSize: 11, letterSpacing: "0.09em", fontWeight: 700, color: "var(--sport-tertiary)" }}>{h}</span>
              ))}
            </div>
            {studentsResult.data.map((s, i) => (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 1fr 0.9fr", gap: 14, padding: "14px 20px", borderTop: i > 0 ? "1px solid var(--sport-divider)" : undefined, alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>{s.firstName} {orDash(s.lastName)}</span>
                <span style={{ fontFamily: "var(--sport-mono)", fontSize: 13, color: "var(--sport-body)" }}>{s.admissionNo}</span>
                <span style={{ fontSize: 13.5, color: "var(--sport-body)" }}>{s.gradeName ? `${s.gradeName}${s.sectionName ? ` ${s.sectionName}` : ""}` : "—"}</span>
                <span style={{ fontSize: 13, color: enrolledStudentIds.has(s.id) ? "var(--sport-green)" : "var(--sport-tertiary)", fontWeight: 700 }}>
                  {enrolledStudentIds.has(s.id) ? "Enrolled" : "Not enrolled"}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <Link href="/sports-admin/teams" style={{ fontSize: 13, fontWeight: 700, color: "var(--sport-primary)", textDecoration: "none" }}>
            Manage squad rosters →
          </Link>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load students."} />;
  }
}
