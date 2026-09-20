"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import { Chip, EmptyRow, GhostButton, PrimaryButton, StatusPill, TableShell, Td, Th, type PillTone } from "@/components/hostel-warden-ui/primitives";
import { useFlash } from "@/components/hostel-warden-ui/FlashContext";
import type { HostelStructureBlock } from "@/lib/hostel-warden-api";
import {
  MOVEMENT_LOG_PURPOSE_LABELS,
  MOVEMENT_LOG_PURPOSES,
  type MovementLogPurpose,
} from "@/lib/hostel-warden-constants";
import { DecisionButtons } from "./DecisionButtons";
import { RecordExitForm } from "./RecordExitForm";
import { recordReturnAction } from "./actions";

export interface MovementRow {
  id: string;
  kind: "gate-pass" | "emergency-exit" | "movement-log";
  studentId: string;
  studentName: string;
  room: string;
  reason: string;
  destination: string | null;
  outFrom: string;
  expectedReturn: string;
  isOvernight: boolean;
  state: string;
  purposeCategory: MovementLogPurpose | null;
  actualReturnAt: string | null;
  requestedByName: string;
}

const KIND_LABEL: Record<MovementRow["kind"], string> = {
  "gate-pass": "Gate pass",
  "emergency-exit": "Emergency exit",
  "movement-log": "Warden-recorded exit",
};

// outing_request.state's real CHECK constraint is REQUESTED / APPROVED /
// REJECTED / CANCELLED / COMPLETED -- confirmed live against the real
// backend (a freshly parent-submitted request comes back "REQUESTED", not
// "PENDING"). Every Warden-recorded direct entry is created already
// APPROVED (see backend's createDirect) -- there is no review step for
// those, only Record return/Amend.
function statusDisplay(row: MovementRow): { label: string; tone: PillTone } {
  if (row.kind === "movement-log") {
    if (row.actualReturnAt) return { label: "Returned", tone: "gray" };
    return { label: "Away", tone: "blue" };
  }
  if (row.state === "REQUESTED") return { label: "Requested", tone: "amber" };
  if (row.state === "APPROVED") return { label: "Approved", tone: "blue" };
  if (row.state === "REJECTED") return { label: "Rejected", tone: "red" };
  if (row.state === "CANCELLED") return { label: "Withdrawn", tone: "gray" };
  return { label: row.state, tone: "gray" };
}

interface StudentOption {
  studentId: string;
  name: string;
  room: string;
}

export function MovementLogView({ rows, students, blocks }: { rows: MovementRow[]; students: StudentOption[]; blocks: HostelStructureBlock[] }) {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const [purposeFilter, setPurposeFilter] = useState<MovementLogPurpose | "All">("All");
  const [blockId, setBlockId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [pendingReturnId, setPendingReturnId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { showFlash } = useFlash();

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (purposeFilter !== "All" && r.purposeCategory !== purposeFilter) return false;
      if (blockId) {
        const block = blocks.find((b) => b.id === blockId);
        if (!block || !r.room.endsWith(block.name)) return false;
      }
      if (q && !`${r.studentName} ${r.room} ${r.reason} ${r.destination ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, purposeFilter, blockId, blocks, q]);

  const totalCount = rows.length;

  function recordReturn(id: string) {
    setPendingReturnId(id);
    startTransition(async () => {
      try {
        await recordReturnAction(id);
        showFlash("Return recorded.");
      } catch (err) {
        showFlash(err instanceof Error ? err.message : "Could not record the return.");
      } finally {
        setPendingReturnId(null);
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Chip label={`All (${totalCount})`} active={purposeFilter === "All"} onClick={() => setPurposeFilter("All")} />
        {MOVEMENT_LOG_PURPOSES.filter((p) => p !== "OTHER").map((p) => (
          <Chip key={p} label={MOVEMENT_LOG_PURPOSE_LABELS[p]} active={purposeFilter === p} onClick={() => setPurposeFilter(p)} />
        ))}
        <span style={{ width: 1, height: 22, background: "var(--hw-divider)", margin: "0 6px" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--hw-text-faint)", textTransform: "uppercase", letterSpacing: ".05em" }}>Block</span>
        <select className="input" value={blockId} onChange={(e) => setBlockId(e.target.value)} style={{ height: 32, width: 160 }}>
          <option value="">All blocks</option>
          {blocks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <span style={{ flex: 1 }} />
        {formOpen ? (
          <GhostButton type="button" onClick={() => setFormOpen(false)} style={{ height: 36 }}>
            Close entry form
          </GhostButton>
        ) : (
          <PrimaryButton type="button" onClick={() => setFormOpen(true)} style={{ height: 36 }}>
            Record exit
          </PrimaryButton>
        )}
      </div>

      <RecordExitForm students={students} open={formOpen} onClose={() => setFormOpen(false)} />

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
              const st = statusDisplay(r);
              const isPendingDecision = r.kind !== "movement-log" && r.state === "REQUESTED";
              const isOpenDirectEntry = r.kind === "movement-log" && !r.actualReturnAt;
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
                    {isPendingDecision ? (
                      <DecisionButtons id={r.id} kind={r.kind as "gate-pass" | "emergency-exit"} studentName={r.studentName} />
                    ) : isOpenDirectEntry ? (
                      <GhostButton
                        type="button"
                        onClick={() => recordReturn(r.id)}
                        disabled={pendingReturnId === r.id}
                        style={{ height: 30, fontSize: 12, padding: "0 12px" }}
                      >
                        {pendingReturnId === r.id ? "Saving…" : "Record return"}
                      </GhostButton>
                    ) : (
                      <span style={{ color: "var(--hw-text-faint)" }}>—</span>
                    )}
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
