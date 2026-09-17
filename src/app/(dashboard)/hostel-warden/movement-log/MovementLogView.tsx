"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import { Chip, EmptyRow, StatusPill, TableShell, Td, Th, type PillTone } from "@/components/hostel-warden-ui/primitives";
import { DecisionButtons } from "./DecisionButtons";

export interface MovementRow {
  id: string;
  kind: "gate-pass" | "emergency-exit";
  studentName: string;
  room: string;
  reason: string;
  destination: string | null;
  outFrom: string;
  expectedReturn: string;
  isOvernight: boolean;
  state: string;
  requestedByName: string;
}

const KIND_LABEL: Record<MovementRow["kind"], string> = {
  "gate-pass": "Gate pass",
  "emergency-exit": "Emergency exit",
};

// outing_request.state's real CHECK constraint is REQUESTED / APPROVED /
// REJECTED / CANCELLED / COMPLETED -- confirmed live against the real
// backend (a freshly parent-submitted request comes back "REQUESTED", not
// "PENDING"). COMPLETED is a real constraint value nothing in the codebase
// ever writes yet (no "mark as returned" action exists), so it never
// appears in practice but is handled below via the generic fallback anyway.
function statusDisplay(state: string): { label: string; tone: PillTone } {
  if (state === "REQUESTED") return { label: "Requested", tone: "amber" };
  if (state === "APPROVED") return { label: "Approved", tone: "blue" };
  if (state === "REJECTED") return { label: "Rejected", tone: "red" };
  if (state === "CANCELLED") return { label: "Withdrawn", tone: "gray" };
  return { label: state, tone: "gray" };
}

type StatusFilter = "REQUESTED" | "APPROVED" | "REJECTED" | "All";
type KindFilter = "All" | MovementRow["kind"];

export function MovementLogView({ rows }: { rows: MovementRow[] }) {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const [status, setStatus] = useState<StatusFilter>("REQUESTED");
  const [kind, setKind] = useState<KindFilter>("All");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (kind !== "All" && r.kind !== kind) return false;
      if (status !== "All" && r.state !== status) return false;
      if (q && !`${r.studentName} ${r.room} ${r.reason} ${r.destination ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, kind, status, q]);

  const pendingCount = rows.filter((r) => r.state === "REQUESTED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {(["REQUESTED", "APPROVED", "REJECTED", "All"] as StatusFilter[]).map((t) => (
          <Chip key={t} label={t === "REQUESTED" ? `Pending (${pendingCount})` : t === "All" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()} active={status === t} onClick={() => setStatus(t)} />
        ))}
        <span style={{ width: 1, height: 22, background: "var(--hw-divider)", margin: "0 6px" }} />
        {(["All", "gate-pass", "emergency-exit"] as KindFilter[]).map((t) => (
          <Chip key={t} label={t === "All" ? "All types" : KIND_LABEL[t]} active={kind === t} onClick={() => setKind(t)} />
        ))}
      </div>

      <div className="hw-lift" style={{ border: "1px solid var(--hw-divider)", borderRadius: "var(--hw-radius-md)", overflow: "hidden" }}>
        <TableShell>
          <thead>
            <tr>
              <Th>Purpose</Th>
              <Th>Student</Th>
              <Th>Room</Th>
              <Th>Reason</Th>
              <Th>Out from</Th>
              <Th>Expected return</Th>
              <Th>Requested by</Th>
              <Th>Status</Th>
              <Th align="right">Gate action</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const st = statusDisplay(r.state);
              const isPending = r.state === "REQUESTED";
              return (
                <tr key={r.id} className="hw-row-hover">
                  <Td>
                    <span style={{ display: "block", fontWeight: 600 }}>{KIND_LABEL[r.kind]}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--hw-text-faint)" }}>{r.id.slice(0, 8).toUpperCase()}</span>
                  </Td>
                  <Td style={{ fontWeight: 600 }}>{r.studentName}</Td>
                  <Td style={{ color: "var(--hw-text-muted)" }}>{r.room}</Td>
                  <Td style={{ minWidth: 220, lineHeight: 1.45 }}>
                    {r.reason}
                    {r.destination && <span style={{ display: "block", fontSize: 12, color: "var(--hw-text-faint)" }}>{r.destination}</span>}
                    {r.isOvernight && <span style={{ display: "inline-block", marginTop: 4, fontSize: 11, fontWeight: 700, color: "var(--hw-accent-700)" }}>Overnight</span>}
                  </Td>
                  <Td style={{ whiteSpace: "nowrap", color: "var(--hw-text-muted)" }}>{formatDateTime(r.outFrom)}</Td>
                  <Td style={{ whiteSpace: "nowrap", color: "var(--hw-text-muted)" }}>{formatDateTime(r.expectedReturn)}</Td>
                  <Td style={{ whiteSpace: "nowrap" }}>{r.requestedByName}</Td>
                  <Td>
                    <StatusPill label={st.label} tone={st.tone} />
                  </Td>
                  <Td align="right">
                    {isPending ? <DecisionButtons id={r.id} kind={r.kind} studentName={r.studentName} /> : <span style={{ color: "var(--hw-text-faint)" }}>—</span>}
                  </Td>
                </tr>
              );
            })}
            {filtered.length === 0 && <EmptyRow colSpan={9} label="No requests under this filter." />}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}
