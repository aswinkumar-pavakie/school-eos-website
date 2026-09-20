"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Chip, EmptyRow, StatusPill, TableShell, Td, Th, type PillTone } from "@/components/hostel-warden-ui/primitives";
import { formatMoneySummary } from "@/lib/format";
import type { StudentFeeOverallStatus } from "@/lib/hostel-warden-api";

export interface FeeRow {
  studentId: string;
  name: string;
  room: string;
  totalDuePaise: string;
  totalPaidPaise: string;
  totalOverduePaise: string;
  overallStatus: StudentFeeOverallStatus;
}

const STATUS_TONE: Record<StudentFeeOverallStatus, PillTone> = {
  NO_ASSIGNMENT: "gray",
  PAID: "blue",
  PARTIAL: "amber",
  PENDING: "amber",
  OVERDUE: "red",
};
const STATUS_LABEL: Record<StudentFeeOverallStatus, string> = {
  NO_ASSIGNMENT: "No fee plan",
  PAID: "Paid",
  PARTIAL: "Partially paid",
  PENDING: "Pending",
  OVERDUE: "Overdue",
};

type StatusFilter = "All" | StudentFeeOverallStatus;
const FILTERS: StatusFilter[] = ["All", "OVERDUE", "PENDING", "PARTIAL", "PAID"];

export function FeesView({ rows }: { rows: FeeRow[] }) {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const [status, setStatus] = useState<StatusFilter>("All");

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { All: rows.length, NO_ASSIGNMENT: 0, PAID: 0, PARTIAL: 0, PENDING: 0, OVERDUE: 0 };
    for (const r of rows) c[r.overallStatus] += 1;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status !== "All" && r.overallStatus !== status) return false;
      if (q && !`${r.name} ${r.room}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, status, q]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={f === "All" ? `All (${counts.All})` : `${STATUS_LABEL[f]} (${counts[f]})`}
            active={status === f}
            onClick={() => setStatus(f)}
          />
        ))}
      </div>

      <div className="hw-lift" style={{ border: "1px solid var(--hw-divider)", borderRadius: "var(--hw-radius-md)", overflow: "hidden" }}>
        <TableShell>
          <thead>
            <tr>
              <Th>Student</Th>
              <Th>Room</Th>
              <Th align="right">Total due</Th>
              <Th align="right">Paid</Th>
              <Th align="right">Overdue</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.studentId} className="hw-row-hover">
                <Td style={{ fontWeight: 600 }}>{r.name}</Td>
                <Td style={{ color: "var(--hw-text-muted)" }}>{r.room}</Td>
                <Td align="right">{formatMoneySummary(r.totalDuePaise)}</Td>
                <Td align="right">{formatMoneySummary(r.totalPaidPaise)}</Td>
                <Td align="right">{formatMoneySummary(r.totalOverduePaise)}</Td>
                <Td>
                  <StatusPill label={STATUS_LABEL[r.overallStatus]} tone={STATUS_TONE[r.overallStatus]} />
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && <EmptyRow colSpan={6} label={q || status !== "All" ? "No students match this filter." : "No fee records available."} />}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}
