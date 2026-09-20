// Sports Admin -> Training sessions -- pixel-rebuilt from the design's own
// `sessions` screen (EDITABLE.sessions: columns ['SESSION','TIME · VENUE',
// 'IN-CHARGE','PLAYERS','ATTENDANCE','STATUS']). Real data: listTrainingSessions()
// + real per-session roster size (listTeamRoster) and attendance count
// (listTrainingAttendance) -- design's own PLAYERS/ATTENDANCE columns are
// numbers a real session actually has, not fabricated.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { TableCard, toneOf, type TableCell } from "@/components/sports-ui/primitives";
import { statusLabel } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listCoaches, listTeamRoster, listTrainingAttendance, listTrainingSessions } from "@/lib/sports-admin-api";
import { AddSessionPanel } from "./AddSessionPanel";
import { SessionRowActions } from "./SessionRowActions";

function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default async function SportsAdminSessionsPage({ searchParams }: { searchParams: Promise<{ q?: string; date?: string; all?: string }> }) {
  const { q, date, all } = await searchParams;
  try {
    const [allSessions, coaches] = await Promise.all([listTrainingSessions(), listCoaches()]);
    const needle = (q ?? "").trim().toLowerCase();
    const dateFilter = all ? null : (date ?? toDateInput(new Date()));
    const sessions = allSessions
      .filter((s) => !dateFilter || toDateInput(new Date(s.scheduledAt)) === dateFilter)
      .filter((s) => !needle || `${s.teamName} ${s.focus ?? ""} ${s.venue ?? ""}`.toLowerCase().includes(needle));
    const sorted = [...sessions].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    const coachById = new Map(coaches.map((c) => [c.id, c.fullName]));

    const [rosterCounts, attendanceCounts] = await Promise.all([
      Promise.all(sorted.map((s) => listTeamRoster(s.teamId).then((r) => r.length).catch(() => 0))),
      Promise.all(sorted.map((s) => listTrainingAttendance(s.id).then((a) => a.filter((e) => e.status === "PRESENT").length).catch(() => 0))),
    ]);

    const rows = sorted.map((s, i) => {
      const dt = new Date(s.scheduledAt);
      const timeVenue = `${dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}${s.venue ? ` · ${s.venue}` : ""}`;
      const dateLabel = dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      const cells: TableCell[] = [
        { kind: "plain", text: `${s.focus ?? "Training"} — ${s.teamName}`, bold: true },
        { kind: "plain", text: `${dateLabel} · ${timeVenue}`, mono: true },
        { kind: "plain", text: s.conductedByCoachId ? coachById.get(s.conductedByCoachId) ?? "—" : "—" },
        { kind: "plain", text: String(rosterCounts[i]), mono: true },
        { kind: "plain", text: s.status === "COMPLETED" ? `${attendanceCounts[i]} / ${rosterCounts[i]}` : "—", mono: true },
        { kind: "badge", text: statusLabel(s.status), tone: toneOf(s.status) },
        { kind: "node", node: <SessionRowActions session={s} coaches={coaches} /> },
      ];
      return { key: s.id, cells };
    });

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Training sessions</h1>
            <p style={{ margin: 0, fontSize: 15, color: "var(--sport-muted-2)" }}>Coaching and practice slots logged against squads</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 6 }}>
            <AddSessionPanel />
          </div>
        </div>

        <form style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 24 }}>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search sessions by squad, focus or venue"
            style={{ flex: 1, minWidth: 260, height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 14px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
          />
          <input type="date" name="date" defaultValue={dateFilter ?? ""} disabled={!!all} style={{ height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--sport-body)" }}>
            <input type="checkbox" name="all" value="1" defaultChecked={!!all} />
            All dates
          </label>
          <button type="submit" style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid var(--sport-border)", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--sport-body)" }}>
            Filter
          </button>
        </form>

        <div style={{ marginTop: 16 }}>
          <TableCard
            title={dateFilter ? `Sessions on ${new Date(dateFilter).toLocaleDateString("en-GB", { day: "2-digit", month: "long" })}` : "All sessions"}
            meta={`${sessions.length} of ${allSessions.length} logged`}
            columns={["SESSION", "TIME · VENUE", "IN-CHARGE", "PLAYERS", "ATTENDANCE", "STATUS", "MANAGE"]}
            rows={rows}
            emptyLabel="No training sessions match this search."
          />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load training sessions."} />;
  }
}
