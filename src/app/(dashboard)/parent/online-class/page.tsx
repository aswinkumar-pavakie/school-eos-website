// Online class -- pixel-rebuilt from the design's own isOnlineClass screen
// (Upcoming/Completed/Cancelled tabs). Real ParentOnlineClassesService data
// (listOnlineClasses/joinOnlineClass) -- a real Google Meet link, not a
// custom video call/waiting-room mockup: Join opens the real meetingUrl in
// a new tab, same integration pattern Faculty's own Online class screen
// already uses. Scoped to every one of this account's active wards at once
// (the real backend has no per-child filter on this endpoint -- it's
// section-derived from all active guardian_links), so grade/section on
// each row identifies which child it belongs to.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatusPill, type PillTone } from "@/components/parent-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { listOnlineClasses, type OnlineClassStatus, type OnlineClassView } from "@/lib/parent-api";
import { JoinButton } from "./JoinButton";

const TABS: { key: OnlineClassView; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_TONE: Record<OnlineClassStatus, PillTone> = {
  DRAFT: "gray",
  SCHEDULED: "blue",
  LIVE: "red",
  COMPLETED: "gray",
  CANCELLED: "red",
};

function time(value: string): string {
  return value.slice(0, 5);
}

export default async function ParentOnlineClassPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  try {
    const { view } = await searchParams;
    const activeView: OnlineClassView = view === "completed" || view === "cancelled" ? view : "upcoming";
    const classes = await listOnlineClasses(activeView);

    return (
      <div className="parent-scope">
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6, color: "var(--par-ink)" }}>Online class</div>
          <div style={{ fontSize: 15, color: "var(--par-body-muted)" }}>Join live classes and revisit recordings.</div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {TABS.map((t) => (
            <a key={t.key} href={`/parent/online-class?view=${t.key}`} style={{ textDecoration: "none" }}>
              <span style={{ display: "inline-block", borderRadius: 9, padding: "10px 18px", fontSize: 14, fontWeight: 700, background: activeView === t.key ? "var(--par-navy)" : "#fff", color: activeView === t.key ? "#fff" : "var(--par-ink)", border: activeView === t.key ? undefined : "1px solid var(--par-border)" }}>
                {t.label}
              </span>
            </a>
          ))}
        </div>

        {classes.length === 0 ? (
          <EmptyPanel label={`No ${activeView} classes.`} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {classes.map((c) => (
              <div key={c.id} style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card-sm)", padding: "18px 22px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>
                      {c.subjectName} · {c.gradeName}-{c.sectionName}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--par-ink)" }}>{c.topic}</div>
                    <div style={{ fontSize: 12.5, color: "var(--par-body-muted)", marginTop: 2 }}>{formatDate(c.scheduledDate)} · {time(c.startTime)} – {time(c.endTime)}</div>
                  </div>
                  <StatusPill label={c.status} tone={STATUS_TONE[c.status]} />
                </div>

                {c.description && <div style={{ fontSize: 14, color: "var(--par-body)", marginBottom: 10 }}>{c.description}</div>}
                {c.status === "CANCELLED" && c.cancellationReason && (
                  <div style={{ fontSize: 13, color: "var(--par-red)", marginBottom: 10 }}>Cancelled: {c.cancellationReason}</div>
                )}

                {(c.status === "SCHEDULED" || c.status === "LIVE") && (
                  <JoinButton classId={c.id} label={c.status === "LIVE" ? "Join now" : "Join when live"} />
                )}
                {c.status === "COMPLETED" && c.recordingUrl && (
                  <a href={c.recordingUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--par-primary)" }}>
                    Watch recording
                  </a>
                )}
                {c.status === "COMPLETED" && !c.recordingUrl && (
                  <div style={{ fontSize: 12.5, color: "var(--par-tertiary-2)" }}>No recording available.</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load online classes."} />;
  }
}
