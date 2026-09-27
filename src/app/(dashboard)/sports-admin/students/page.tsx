// Sports Admin -> Students / players -- pixel-rebuilt from the design's own
// `students` screen (META.students: primary '+ Add player', secondary
// 'Export', filters Sport/Class, tabs All/Active/Injured/Rest, columns
// ['PLAYER','ADMISSION NO','CLASS · DISCIPLINE','PT ATTENDANCE','STATUS',
// 'MANAGE']). Real listStudents() (full school roster) + real per-sport
// enrollment (listSportsProfiles) resolved into a DISCIPLINE list per
// student. PT ATTENDANCE isn't tracked as a single number anywhere in this
// schema (attendance is per training-session, not a rolled-up player
// percentage), so it stays an honest dash rather than a fabricated figure.
// STATUS tabs are real: "Injured" cross-references the real
// sports_injury_incident table (open case = UNDER_CARE/OBSERVATION);
// "Active" is everyone else; "Rest" has no real backend signal anywhere in
// this schema (confirmed by audit) so it stays honestly empty rather than
// fabricated -- the tab exists for design parity, it just never has rows.
// "+ Add player" enrolls an existing student into a sport (the real
// capability this role has -- see actions.ts's own comment for why there's
// still no brand-new-student-creation action). MANAGE links to the real
// Student Detail page.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { StatTile, TableCard, toneOf, type TableCell } from "@/components/sports-ui/primitives";
import { ExportCsvButton } from "@/components/sports-ui/ExportCsvButton";
import { orDash } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listInjuries, listSports, listSportsProfiles, listStudentsByIds } from "@/lib/sports-admin-api";
import { AddPlayerPanel } from "./AddPlayerPanel";

const TABS = ["All", "Active", "Injured", "Rest"] as const;
type Tab = (typeof TABS)[number];

export default async function SportsAdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; sport?: string; cls?: string }>;
}) {
  const { q, tab, sport, cls } = await searchParams;
  try {
    const [sports, injuries] = await Promise.all([listSports(), listInjuries().catch(() => [])]);
    const profilesPerSport = await Promise.all(sports.map((s) => listSportsProfiles(s.id).catch(() => [])));
    const disciplinesByStudent = new Map<string, string[]>();
    const sportIdsByStudent = new Map<string, Set<string>>();
    sports.forEach((s, i) => {
      profilesPerSport[i].forEach((p) => {
        const list = disciplinesByStudent.get(p.studentId) ?? [];
        list.push(s.name);
        disciplinesByStudent.set(p.studentId, list);
        const set = sportIdsByStudent.get(p.studentId) ?? new Set<string>();
        set.add(s.id);
        sportIdsByStudent.set(p.studentId, set);
      });
    });
    const injuredStudentIds = new Set(injuries.filter((i) => i.status !== "CLOSED").map((i) => i.studentId));

    // Register = every student enrolled in at least one sport. The students API
    // pages at 50 by default, so listing the whole school silently cut the
    // register to the first 50 alphabetical students (most not players at all).
    const players = await listStudentsByIds(Array.from(disciplinesByStudent.keys()));
    const needle = (q ?? "").trim().toLowerCase();
    const studentsResult = {
      data: players
        .filter((s) => {
          if (!needle) return true;
          const hay = [s.firstName, s.lastName, s.admissionNo, s.gradeName, s.sectionName, ...(disciplinesByStudent.get(s.id) ?? [])].join(" ").toLowerCase();
          return hay.includes(needle);
        })
        .sort((a, b) => `${a.firstName} ${a.lastName ?? ""}`.localeCompare(`${b.firstName} ${b.lastName ?? ""}`)),
    };

    const classOptions = Array.from(new Set(players.map((s) => s.gradeName).filter(Boolean))) as string[];
    classOptions.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const activeTab: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "All";

    const filtered = studentsResult.data.filter((s) => {
      if (sport && !sportIdsByStudent.get(s.id)?.has(sport)) return false;
      if (cls && s.gradeName !== cls) return false;
      const injured = injuredStudentIds.has(s.id);
      if (activeTab === "Injured") return injured;
      if (activeTab === "Rest") return false; // honest: no real "resting" signal in this schema
      if (activeTab === "Active") return !injured;
      return true;
    });

    const rows = filtered.map((s) => {
      const disciplines = disciplinesByStudent.get(s.id);
      const injured = injuredStudentIds.has(s.id);
      const gradeSection = s.gradeName ? `${s.gradeName}${s.sectionName ? ` ${s.sectionName}` : ""}` : "—";
      const statusLabel = injured ? "Injured" : "Active";
      const cells: TableCell[] = [
        { kind: "plain", text: `${s.firstName} ${orDash(s.lastName)}`, bold: true },
        { kind: "plain", text: s.admissionNo, mono: true },
        { kind: "plain", text: `${gradeSection} · ${disciplines?.join(", ") ?? "—"}` },
        { kind: "plain", text: "—", mono: true },
        { kind: "badge", text: statusLabel, tone: toneOf(injured ? "injured" : "active") },
        { kind: "node", node: <Link href={`/sports-admin/students/${s.id}`} style={{ fontSize: 13, fontWeight: 700, color: "var(--sport-primary)", textDecoration: "none" }}>Manage</Link> },
      ];
      return { key: s.id, cells };
    });

    const exportRows = filtered.map((s) => {
      const disciplines = disciplinesByStudent.get(s.id);
      const gradeSection = s.gradeName ? `${s.gradeName}${s.sectionName ? ` ${s.sectionName}` : ""}` : "—";
      return [
        `${s.firstName} ${orDash(s.lastName)}`,
        s.admissionNo,
        gradeSection,
        disciplines?.join(", ") ?? "—",
        injuredStudentIds.has(s.id) ? "Injured" : "Active",
      ];
    });

    function tabHref(t: Tab) {
      const params = new URLSearchParams();
      if (t !== "All") params.set("tab", t);
      if (sport) params.set("sport", sport);
      if (cls) params.set("cls", cls);
      if (q) params.set("q", q);
      const qs = params.toString();
      return `/sports-admin/students${qs ? `?${qs}` : ""}`;
    }

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Students / players</h1>
            <p style={{ margin: 0, marginTop: 8, fontSize: 15, color: "var(--sport-muted-2)" }}>Every player on the school sports roll</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", position: "relative" }}>
            <ExportCsvButton
              filename="players-register.csv"
              headers={["Player", "Admission no", "Class", "Discipline", "Status"]}
              rows={exportRows}
            />
            <AddPlayerPanel sports={sports} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(sports.length || 1, 4)}, minmax(0,1fr))`, gap: 14, marginTop: 24 }}>
          {sports.map((s, i) => (
            <StatTile key={s.id} label={s.name} value={profilesPerSport[i]?.length ?? 0} sub="players enrolled" />
          ))}
        </div>

        <form style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 20 }}>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search players by name, admission no., class or discipline"
            style={{ flex: 1, minWidth: 260, height: 44, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 14px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
          />
          <select name="sport" defaultValue={sport ?? ""} style={{ height: 44, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}>
            <option value="">All sports</option>
            {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select name="cls" defaultValue={cls ?? ""} style={{ height: 44, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}>
            <option value="">All classes</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" style={{ height: 44, padding: "0 16px", borderRadius: 10, border: "1px solid var(--sport-border)", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--sport-body)" }}>
            Filter
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {TABS.map((t) => (
              <Link
                key={t}
                href={tabHref(t)}
                style={{
                  textDecoration: "none",
                  fontSize: 12.5,
                  fontWeight: 700,
                  padding: "8px 14px",
                  borderRadius: 20,
                  border: `1px solid ${activeTab === t ? "var(--sport-primary)" : "var(--sport-border)"}`,
                  background: activeTab === t ? "var(--sport-primary)" : "#fff",
                  color: activeTab === t ? "#fff" : "var(--sport-body)",
                }}
              >
                {t}
              </Link>
            ))}
          </div>
          <Link href="/sports-admin/teams" style={{ fontSize: 13, fontWeight: 700, color: "var(--sport-primary)", textDecoration: "none", whiteSpace: "nowrap" }}>
            Manage squad rosters →
          </Link>
        </div>

        <div style={{ marginTop: 16 }}>
          <TableCard
            title="Players register"
            meta={`${filtered.length} students`}
            columns={["PLAYER", "ADMISSION NO", "CLASS · DISCIPLINE", "PT ATTENDANCE", "STATUS", "MANAGE"]}
            rows={rows}
            emptyLabel="No students match this search."
          />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load students."} />;
  }
}
