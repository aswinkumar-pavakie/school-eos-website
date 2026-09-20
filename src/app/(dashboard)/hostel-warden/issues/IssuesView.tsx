"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Chip, EmptyRow, StatusPill, TableShell, Td, Th, type PillTone } from "@/components/hostel-warden-ui/primitives";
import { formatDate } from "@/lib/format";
import { HOSTEL_ISSUE_TYPE_LABELS, type HostelComplaintState, type HostelIssueType } from "@/lib/hostel-warden-constants";
import { StatusTransition } from "./StatusTransition";

export interface IssueRow {
  id: string;
  subject: string;
  description: string;
  issueType: string;
  blockName: string | null;
  createdAt: string;
  state: HostelComplaintState;
}

const TONE: Record<HostelComplaintState, PillTone> = {
  OPEN: "amber",
  IN_PROGRESS: "blue",
  ESCALATED: "red",
  RESOLVED: "gray",
  CLOSED: "gray",
  REJECTED: "red",
};

type StatusFilter = "All" | HostelComplaintState;
const FILTERS: StatusFilter[] = ["All", "OPEN", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"];

export function IssuesView({ rows }: { rows: IssueRow[] }) {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const [status, setStatus] = useState<StatusFilter>("All");

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { All: rows.length, OPEN: 0, IN_PROGRESS: 0, ESCALATED: 0, RESOLVED: 0, CLOSED: 0, REJECTED: 0 };
    for (const r of rows) c[r.state] += 1;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status !== "All" && r.state !== status) return false;
      if (q && !`${r.subject} ${r.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, status, q]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={f === "All" ? `All (${counts.All})` : `${f.charAt(0) + f.slice(1).toLowerCase().replace("_", " ")} (${counts[f]})`}
            active={status === f}
            onClick={() => setStatus(f)}
          />
        ))}
      </div>

      <div className="hw-lift" style={{ border: "1px solid var(--hw-divider)", borderRadius: "var(--hw-radius-md)", overflow: "hidden" }}>
        <TableShell>
          <thead>
            <tr>
              <Th>Issue</Th>
              <Th>Type</Th>
              <Th>Location</Th>
              <Th>Raised</Th>
              <Th>Status</Th>
              <Th align="right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="hw-row-hover">
                <Td>
                  <span style={{ display: "block", fontWeight: 600 }}>{c.subject}</span>
                  <span style={{ display: "block", fontSize: 12, color: "var(--hw-text-faint)" }}>{c.description}</span>
                </Td>
                <Td style={{ color: "var(--hw-text-muted)" }}>{HOSTEL_ISSUE_TYPE_LABELS[c.issueType as HostelIssueType] ?? c.issueType}</Td>
                <Td style={{ color: "var(--hw-text-muted)" }}>{c.blockName ?? "—"}</Td>
                <Td style={{ whiteSpace: "nowrap", color: "var(--hw-text-muted)" }}>{formatDate(c.createdAt)}</Td>
                <Td>
                  <StatusPill label={c.state.replace("_", " ")} tone={TONE[c.state]} />
                </Td>
                <Td align="right">
                  <StatusTransition id={c.id} state={c.state} />
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && <EmptyRow colSpan={6} label={q || status !== "All" ? "No issues match this filter." : "No issues logged yet."} />}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}
