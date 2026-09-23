// Shared "Leave" / "On-duty" feature screen shell -- the canonical pixel
// design ported from Faculty's own staff-leave/page.tsx (Faculty's screen
// is the source of truth), restyled to --eos-* tokens. Used identically for
// both Leave and OD requests (same visual language, just a different title/
// data/apply-form per caller) -- per instruction, no role gets a
// differently-labelled or differently-styled version of this screen.
//
// The Apply tab's form is passed in as `applySlot` rather than built once
// here: each role's own real backend write differs too much to force into
// one shape today (Faculty submits directly against its own staff record;
// Parent applies on behalf of a child with a file upload; Principal/VP use
// a modal instead of a full-page form) -- forcing a single form here would
// mean either breaking one of those real, working submissions or building
// backend capability that doesn't exist. The read-only shell (header, tabs,
// history cards) is what's genuinely identical everywhere, so that's what's
// shared; each real Apply experience stays intact underneath it.

export interface LeaveOdRequestRow {
  id: string;
  typeLabel: string;
  fromDate: string;
  toDate: string;
  reason: string;
  state: string;
  decidedLine?: string | null;
  /** Optional real per-row action (e.g. Principal/VP's real "Withdraw"
   * button while a request is still PENDING) -- omitted entirely renders
   * nothing, so Faculty's own read-only history rows are unaffected. */
  action?: React.ReactNode;
}

export function LeaveOdView({
  title,
  subtitle,
  basePath,
  activeTab,
  applySlot,
  requests,
}: {
  title: string;
  subtitle: string;
  basePath: string;
  activeTab: "Apply" | "History";
  applySlot: React.ReactNode;
  requests: LeaveOdRequestRow[];
}) {
  const sep = basePath.includes("?") ? "&" : "?";
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 style={{ margin: 0, font: "700 36px/1.1 var(--eos-font-sans)", letterSpacing: "-.02em", color: "var(--eos-ink)" }}>{title}</h1>
          <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>{subtitle}</p>
        </div>
        <div style={{ display: "flex", background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: 10, padding: 4, gap: 4 }}>
          <a href={`${basePath}${sep}tab=Apply`} style={{ border: 0, cursor: "pointer", borderRadius: 7, padding: "10px 20px", font: "600 14px/1 var(--eos-font-sans)", background: activeTab === "Apply" ? "var(--eos-primary)" : "transparent", color: activeTab === "Apply" ? "#fff" : "var(--eos-body)", textDecoration: "none" }}>
            Apply
          </a>
          <a href={`${basePath}${sep}tab=History`} style={{ border: 0, cursor: "pointer", borderRadius: 7, padding: "10px 20px", font: "600 14px/1 var(--eos-font-sans)", background: activeTab === "History" ? "var(--eos-primary)" : "transparent", color: activeTab === "History" ? "#fff" : "var(--eos-body)", textDecoration: "none" }}>
            History
          </a>
        </div>
      </div>

      {activeTab === "Apply" ? (
        applySlot
      ) : requests.length === 0 ? (
        <div style={{ marginTop: 18, padding: 40, textAlign: "center", background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", font: "400 14.5px/1.5 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>
          Nothing has been submitted yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3.5" style={{ marginTop: 18 }}>
          {requests.map((r) => (
            <div key={r.id} style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: "20px 22px" }}>
              <div className="flex items-start justify-between gap-3">
                <div style={{ font: "500 13px/1 var(--font-ibm-plex-mono), ui-monospace, monospace", color: "var(--eos-tertiary)" }}>{r.id.slice(0, 8).toUpperCase()}</div>
                <div className="flex flex-col items-end gap-2">
                  <span style={{ font: "600 11.5px/1 var(--eos-font-sans)", letterSpacing: ".06em", borderRadius: 20, padding: "7px 13px", background: r.state === "APPROVED" ? "var(--eos-tint)" : r.state === "REJECTED" ? "var(--eos-red-bg)" : "var(--eos-divider)", color: r.state === "APPROVED" ? "var(--eos-primary)" : r.state === "REJECTED" ? "var(--eos-red-text)" : "var(--eos-body)" }}>
                    {r.state}
                  </span>
                  {r.action}
                </div>
              </div>
              <div style={{ font: "700 19px/1.3 var(--eos-font-sans)", marginTop: 12, color: "var(--eos-ink)" }}>{r.typeLabel}</div>
              <div style={{ font: "500 14.5px/1.4 var(--eos-font-sans)", color: "var(--eos-body)", marginTop: 6 }}>
                {new Date(r.fromDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} &ndash; {new Date(r.toDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </div>
              <div style={{ font: "400 14.5px/1.5 var(--eos-font-sans)", color: "var(--eos-body-muted)", marginTop: 6 }}>{r.reason}</div>
              {r.decidedLine && (
                <div style={{ font: "400 13px/1.4 var(--eos-font-sans)", color: "var(--eos-tertiary)", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--eos-divider)" }}>
                  {r.decidedLine}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
