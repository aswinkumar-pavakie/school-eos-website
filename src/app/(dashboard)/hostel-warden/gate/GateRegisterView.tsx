"use client";

import { useMemo, useState, useTransition } from "react";
import { GhostButton, PrimaryButton, TableShell, Td, Th } from "@/components/hostel-warden-ui/primitives";
import { useFlash } from "@/components/hostel-warden-ui/FlashContext";
import { formatDateTime } from "@/lib/format";
import type { HostelStructureBlock } from "@/lib/hostel-warden-api";
import { recordGateReturnAction } from "./actions";
import { RecordReturnForm } from "./RecordReturnForm";

export interface GateRow {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  room: string;
  blockName: string;
  destination: string | null;
  reason: string;
  dueAt: string;
  returned: boolean;
}

export function GateRegisterView({ outRows, blocks }: { outRows: GateRow[]; blocks: HostelStructureBlock[] }) {
  const [register, setRegister] = useState<"check-out" | "check-in">("check-in");
  const [blockName, setBlockName] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { showFlash } = useFlash();

  const rows = useMemo(() => {
    return outRows
      .filter((r) => (register === "check-in" ? !r.returned : r.returned))
      .filter((r) => !blockName || r.blockName === blockName);
  }, [outRows, register, blockName]);

  const studentOptions = useMemo(
    () => outRows.filter((r) => !r.returned).map((r) => ({ id: r.id, studentName: r.studentName, admissionNo: r.admissionNo, room: r.room, blockName: r.blockName, dueAt: r.dueAt })),
    [outRows],
  );

  function recordReturn(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await recordGateReturnAction(id);
        showFlash("Return logged.");
      } catch (err) {
        showFlash(err instanceof Error ? err.message : "Could not log the return.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--hw-text-faint)", textTransform: "uppercase", letterSpacing: ".05em" }}>Register</span>
        <div style={{ display: "inline-flex", borderRadius: 9, border: "1px solid var(--hw-divider)", overflow: "hidden" }}>
          {(["check-out", "check-in"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegister(r)}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "7px 16px",
                fontSize: 12.5,
                fontWeight: 700,
                background: register === r ? "var(--hw-accent)" : "#fff",
                color: register === r ? "#fff" : "var(--hw-text-muted)",
              }}
            >
              {r === "check-out" ? "Check-out" : "Check-in"}
            </button>
          ))}
        </div>
        <span style={{ width: 1, height: 22, background: "var(--hw-divider)", margin: "0 6px" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--hw-text-faint)", textTransform: "uppercase", letterSpacing: ".05em" }}>Block</span>
        <select className="input" value={blockName} onChange={(e) => setBlockName(e.target.value)} style={{ height: 32, width: 160 }}>
          <option value="">All blocks</option>
          {blocks.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
        <span style={{ flex: 1 }} />
        {formOpen ? (
          <GhostButton type="button" onClick={() => setFormOpen(false)} style={{ height: 36 }}>
            Close
          </GhostButton>
        ) : (
          <PrimaryButton type="button" onClick={() => setFormOpen(true)} style={{ height: 36 }}>
            + Record a return
          </PrimaryButton>
        )}
      </div>

      {formOpen && <RecordReturnForm students={studentOptions} onDone={() => setFormOpen(false)} />}

      <div className="hw-lift" style={{ border: "1px solid var(--hw-divider)", borderRadius: "var(--hw-radius-md)", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", fontSize: 14, fontWeight: 800 }}>
          {register === "check-in" ? "Returns expected — log the student in at the gate" : "Currently checked out"}
          <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: "var(--hw-text-muted)" }}>{rows.length} records</span>
        </div>
        <TableShell>
          <thead>
            <tr>
              <Th>Student</Th>
              <Th>Admission no.</Th>
              <Th>Room</Th>
              <Th>Reason</Th>
              <Th>Due</Th>
              {register === "check-in" && <Th align="right">Action</Th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hw-row-hover">
                <Td style={{ fontWeight: 600 }}>{r.studentName}</Td>
                <Td style={{ color: "var(--hw-text-muted)" }}>{r.admissionNo}</Td>
                <Td style={{ color: "var(--hw-text-muted)" }}>{r.room} · {r.blockName}</Td>
                <Td style={{ minWidth: 180 }}>{r.reason}{r.destination ? ` · ${r.destination}` : ""}</Td>
                <Td style={{ whiteSpace: "nowrap", color: "var(--hw-text-muted)" }}>{formatDateTime(r.dueAt)}</Td>
                {register === "check-in" && (
                  <Td align="right">
                    <GhostButton type="button" onClick={() => recordReturn(r.id)} disabled={pendingId === r.id} style={{ height: 30, fontSize: 12, padding: "0 12px" }}>
                      {pendingId === r.id ? "Saving…" : "Record return"}
                    </GhostButton>
                  </Td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={register === "check-in" ? 6 : 5} style={{ padding: 32, textAlign: "center", color: "var(--hw-text-muted)", fontSize: 13 }}>
                  {register === "check-in" ? "No students are currently out." : "No returns logged yet."}
                </td>
              </tr>
            )}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}
