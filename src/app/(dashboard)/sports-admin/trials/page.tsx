// Sports Admin -> Trials & selection. Pixel-rebuilt from the design's own
// `trials` screen (EDITABLE.trials: columns ['CANDIDATE','CLASS',
// 'DISCIPLINE · ROUND','TRIAL DATE','SCORE','STATUS']; META.trials: primary
// '+ Schedule trial', secondary 'Export', filters Sport/Class, tabs
// All/pending/selected/hold). Real, dedicated backend this build adds (see
// migration 0022_sports_trials.sql) -- this was a confirmed genuine gap,
// not something that could have been wired to an existing table. Status
// tabs use the real TrialStatus enum already backing TrialStatusAction.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { TableCard, type TableCell } from "@/components/sports-ui/primitives";
import { ExportCsvButton } from "@/components/sports-ui/ExportCsvButton";
import { formatDate } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listSports, listTrials, TRIAL_STATUSES, type TrialStatus } from "@/lib/sports-admin-api";
import { AddTrialPanel } from "./AddTrialPanel";
import { TrialRowActions } from "./TrialRowActions";

const ROUND_LABEL: Record<string, string> = { ROUND_1: "Round 1", ROUND_2: "Round 2", FINAL_ROUND: "Final round" };
const STATUS_LABEL: Record<TrialStatus, string> = { PENDING: "Pending", HOLD: "Hold", SELECTED: "Selected", NOT_SELECTED: "Not selected" };
const TABS: { key: TrialStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "SELECTED", label: "Selected" },
  { key: "HOLD", label: "Hold" },
];

export default async function SportsAdminTrialsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sport?: string; cls?: string; status?: string }>;
}) {
  const { q, sport, cls, status } = await searchParams;
  try {
    const [allTrials, sports] = await Promise.all([listTrials(), listSports()]);
    const activeTab: TrialStatus | "ALL" = TRIAL_STATUSES.includes(status as TrialStatus) ? (status as TrialStatus) : "ALL";
    const classOptions = Array.from(new Set(allTrials.map((t) => t.gradeName).filter(Boolean))) as string[];
    classOptions.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const needle = (q ?? "").trim().toLowerCase();
    const trials = allTrials
      .filter((t) => activeTab === "ALL" || t.status === activeTab)
      .filter((t) => !sport || t.sportId === sport)
      .filter((t) => !cls || t.gradeName === cls)
      .filter((t) => !needle || `${t.studentFirstName} ${t.studentLastName ?? ""} ${t.sportName}`.toLowerCase().includes(needle));

    const rows = trials.map((t) => {
      const cells: TableCell[] = [
        { kind: "plain", text: `${t.studentFirstName} ${t.studentLastName ?? ""}`, bold: true },
        { kind: "plain", text: t.gradeName ? `${t.gradeName}${t.sectionName ? " " + t.sectionName : ""}` : "—" },
        { kind: "plain", text: `${t.sportName} · ${ROUND_LABEL[t.round] ?? t.round}` },
        { kind: "plain", text: formatDate(t.trialDate), mono: true },
        { kind: "plain", text: t.score ?? "—", mono: true },
        { kind: "node", node: <TrialRowActions trial={t} /> },
      ];
      return { key: t.id, cells };
    });

    const exportRows = trials.map((t) => [
      `${t.studentFirstName} ${t.studentLastName ?? ""}`,
      t.gradeName ? `${t.gradeName}${t.sectionName ? " " + t.sectionName : ""}` : "—",
      `${t.sportName} · ${ROUND_LABEL[t.round] ?? t.round}`,
      formatDate(t.trialDate),
      t.score ?? "—",
      STATUS_LABEL[t.status],
    ]);

    function tabHref(t: TrialStatus | "ALL") {
      const params = new URLSearchParams();
      if (t !== "ALL") params.set("status", t);
      if (sport) params.set("sport", sport);
      if (cls) params.set("cls", cls);
      if (q) params.set("q", q);
      const qs = params.toString();
      return `/sports-admin/trials${qs ? `?${qs}` : ""}`;
    }

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Trials &amp; selection</h1>
            <p style={{ margin: 0, fontSize: 15, color: "var(--sport-muted-2)" }}>{allTrials.length} trial{allTrials.length === 1 ? "" : "s"} on record</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 6 }}>
            <ExportCsvButton
              filename="trials-register.csv"
              headers={["Candidate", "Class", "Discipline · Round", "Trial date", "Score", "Status"]}
              rows={exportRows}
            />
            <AddTrialPanel sports={sports} />
          </div>
        </div>

        <form style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 24 }}>
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search candidates by name or sport"
            style={{ flex: 1, minWidth: 260, height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 14px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
          />
          <select name="sport" defaultValue={sport ?? ""} style={{ height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}>
            <option value="">All sports</option>
            {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select name="cls" defaultValue={cls ?? ""} style={{ height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}>
            <option value="">All classes</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid var(--sport-border)", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--sport-body)" }}>
            Filter
          </button>
        </form>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={tabHref(t.key)}
              style={{
                textDecoration: "none",
                fontSize: 12.5,
                fontWeight: 700,
                padding: "8px 14px",
                borderRadius: 20,
                border: `1px solid ${activeTab === t.key ? "var(--sport-primary)" : "var(--sport-border)"}`,
                background: activeTab === t.key ? "var(--sport-primary)" : "#fff",
                color: activeTab === t.key ? "#fff" : "var(--sport-body)",
              }}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <TableCard
            title="Trial register"
            meta={`${trials.length} of ${allTrials.length}`}
            columns={["CANDIDATE", "CLASS", "DISCIPLINE · ROUND", "TRIAL DATE", "SCORE", "STATUS"]}
            rows={rows}
            emptyLabel="No trials match this search."
          />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load trials."} />;
  }
}
