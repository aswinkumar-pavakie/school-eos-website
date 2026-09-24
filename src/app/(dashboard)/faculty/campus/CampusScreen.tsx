// Shared layout for the Campus request screens: title, the request form on the
// left, "your requests" history on the right (the mobile screens' Apply and
// History tabs, side by side as this design's own two-column pattern).

import type { ReactNode } from "react";
import { Card } from "@/components/faculty-ui/Card";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { StatusPill } from "@/components/faculty-ui/StatusPill";

export interface CampusHistoryItem {
  id: string;
  title: string;
  subtitle: string;
  /** Shown as a pill; omit for items with no status (e.g. feedback). */
  status?: string;
  tag?: string;
}

function toneFor(status: string): "blue" | "red" | "gray" {
  if (status === "COMPLETED" || status === "CONFIRMED" || status === "READY") return "blue";
  if (status === "CANCELLED") return "red";
  return "gray";
}

export function CampusScreen({
  title,
  subtitle,
  formTitle,
  form,
  history,
  emptyText,
}: {
  title: string;
  subtitle: string;
  formTitle: string;
  form: ReactNode;
  history: CampusHistoryItem[];
  emptyText: string;
}) {
  return (
    <div>
      <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em", color: "var(--fac-navy)" }}>{title}</h1>
      <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>{subtitle}</p>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_1.2fr]" style={{ marginTop: 24, alignItems: "start" }}>
        <Card padding="22px">
          <h3 style={{ margin: "0 0 16px", font: "700 19px/1.2 var(--fac-font-sans)" }}>{formTitle}</h3>
          {form}
        </Card>

        <Card padding="6px 22px">
          <h3 style={{ margin: "16px 0 6px", font: "700 19px/1.2 var(--fac-font-sans)" }}>History</h3>
          {history.length === 0 ? (
            <div style={{ padding: "12px 0 18px" }}>
              <FacultyEmptyState message={emptyText} />
            </div>
          ) : (
            history.map((h) => (
              <div key={h.id} className="flex items-center gap-3" style={{ padding: "14px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "600 14.5px/1.35 var(--fac-font-sans)", color: "var(--fac-ink)", overflowWrap: "anywhere" }}>{h.title}</div>
                  <div style={{ font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)", marginTop: 3 }}>{h.subtitle}</div>
                </div>
                {h.status ? <StatusPill tone={toneFor(h.status)}>{h.status}</StatusPill> : null}
                {h.tag ? <StatusPill tone="navy">{h.tag}</StatusPill> : null}
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
