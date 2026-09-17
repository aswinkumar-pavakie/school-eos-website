// Sports Admin -> Teams & squads -- pixel-rebuilt from the design's own
// `teams` generic CRUD screen. Real data only: team.status is really just
// ACTIVE/INACTIVE (confirmed via a live DB check-constraint read) -- the
// design's own "Confirmed/Pending" tab labels don't match any real status
// this schema has, so this uses the real values instead of inventing a
// Confirmed/Pending distinction with nothing behind it.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatusPill } from "@/components/sports-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { listCoaches, listMyTeams, listTeamRoster } from "@/lib/sports-admin-api";
import { AddTeamPanel } from "./AddTeamPanel";

export default async function SportsAdminTeamsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  try {
    const [teams, coaches] = await Promise.all([listMyTeams(), listCoaches()]);
    const filtered = status ? teams.filter((t) => t.status === status) : teams;
    const rosterCounts = await Promise.all(filtered.map((t) => listTeamRoster(t.id).then((r) => r.length).catch(() => 0)));
    const coachByid = new Map(coaches.map((c) => [c.id, c.fullName]));

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Teams &amp; squads</div>
            <div style={{ fontSize: 14.5, color: "var(--sport-tertiary)", marginTop: 8 }}>{teams.length} squads across every sport</div>
          </div>
          <AddTeamPanel />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
          {[
            { label: "All", value: "" },
            { label: "Active", value: "ACTIVE" },
            { label: "Inactive", value: "INACTIVE" },
          ].map((t) => (
            <Link
              key={t.label}
              href={t.value ? `/sports-admin/teams?status=${t.value}` : "/sports-admin/teams"}
              style={{
                textDecoration: "none",
                border: "1px solid " + ((status ?? "") === t.value ? "var(--sport-primary)" : "var(--sport-input-border)"),
                background: (status ?? "") === t.value ? "var(--sport-primary)" : "#fff",
                color: (status ?? "") === t.value ? "#fff" : "var(--sport-ink)",
                borderRadius: 999,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ marginTop: 20 }}><EmptyPanel label="No squads match this filter." /></div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, marginTop: 18, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.1fr 1fr 0.7fr 0.8fr", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--sport-divider)" }}>
              {["SQUAD", "SPORT", "IN-CHARGE", "PLAYERS", "STATUS"].map((h) => (
                <span key={h} style={{ fontSize: 11, letterSpacing: "0.09em", fontWeight: 700, color: "var(--sport-tertiary)" }}>{h}</span>
              ))}
            </div>
            {filtered.map((team, i) => (
              <Link
                key={team.id}
                href={`/sports-admin/teams/${team.id}`}
                className="sport-row-hover"
                style={{ display: "grid", gridTemplateColumns: "1.6fr 1.1fr 1fr 0.7fr 0.8fr", gap: 14, padding: "14px 20px", borderTop: i > 0 ? "1px solid var(--sport-divider)" : undefined, textDecoration: "none", color: "inherit", alignItems: "center" }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>{team.name}</span>
                <span style={{ fontSize: 13.5, color: "var(--sport-body)" }}>{team.sportName}</span>
                <span style={{ fontSize: 13.5, color: "var(--sport-body)" }}>{team.coachId ? coachByid.get(team.coachId) ?? "—" : "—"}</span>
                <span style={{ fontFamily: "var(--sport-mono)", fontSize: 13, color: "var(--sport-ink)" }}>{rosterCounts[i]}</span>
                <StatusPill label={team.status === "ACTIVE" ? "Active" : "Inactive"} tone={team.status === "ACTIVE" ? "good" : "mute"} />
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load teams."} />;
  }
}
