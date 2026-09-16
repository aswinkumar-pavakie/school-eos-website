// Student details -- the design's own resident register, backed by the real
// Room & Bed View allocation list (read-only, reused from Admin's own hostel
// repositories -- see hostel-warden-api.ts's own header comment). Search
// (the Shell's shared `q`) matches name, admission number or room, exactly
// as the design's own search placeholder promises.

import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyRow, TableShell, Td, Th } from "@/components/hostel-warden-ui/primitives";
import { listRoomAllocations } from "@/lib/hostel-warden-api";

export default async function HostelWardenStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const needle = (q ?? "").trim().toLowerCase();

  try {
    const allocations = await listRoomAllocations();
    const rows = allocations
      .filter((a) => a.status === "ACTIVE")
      .filter((a) => {
        if (!needle) return true;
        const name = [a.studentFirstName, a.studentLastName].filter(Boolean).join(" ");
        return `${name} ${a.admissionNo} ${a.roomNo} ${a.blockName}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => a.studentFirstName.localeCompare(b.studentFirstName));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="hw-lift" style={{ border: "1px solid var(--hw-divider)", borderRadius: "var(--hw-radius-md)", overflow: "hidden" }}>
          <TableShell>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Admission no.</Th>
                <Th>Class</Th>
                <Th>Room</Th>
                <Th>Hostel</Th>
                <Th align="right">Allotted since</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="hw-row-hover">
                  <Td>
                    <Link href={`/hostel-warden/students/${a.studentId}`} style={{ fontWeight: 700, color: "var(--hw-text)" }}>
                      {[a.studentFirstName, a.studentLastName].filter(Boolean).join(" ")}
                    </Link>
                  </Td>
                  <Td style={{ color: "var(--hw-text-muted)" }}>{a.admissionNo}</Td>
                  <Td style={{ color: "var(--hw-text-muted)" }}>{[a.gradeName, a.sectionName].filter(Boolean).join(" · ") || "—"}</Td>
                  <Td style={{ fontWeight: 600 }}>
                    {a.roomNo} · {a.bedNo}
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--hw-text-faint)", fontWeight: 400 }}>{a.blockName}</span>
                  </Td>
                  <Td style={{ color: "var(--hw-text-muted)" }}>{a.hostelName}</Td>
                  <Td align="right" style={{ whiteSpace: "nowrap", color: "var(--hw-text-muted)" }}>
                    {new Date(a.allocatedFrom).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </Td>
                </tr>
              ))}
              {rows.length === 0 && <EmptyRow colSpan={6} label={needle ? "No students match that search." : "No students currently allotted."} />}
            </tbody>
          </TableShell>
        </div>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load student details."} />;
  }
}
