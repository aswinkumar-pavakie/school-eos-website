import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyRow, StatusPill, TableShell, Td, Th } from "@/components/hostel-warden-ui/primitives";
import { listStudySessions } from "@/lib/hostel-warden-api";
import { NewSessionForm } from "./NewSessionForm";

export default async function StudyHoursPage() {
  try {
    const sessions = (await listStudySessions()).slice().sort((a, b) => (a.sessionDate < b.sessionDate ? 1 : -1));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <NewSessionForm />
        </div>

        <div className="hw-lift" style={{ border: "1px solid var(--hw-divider)", borderRadius: "var(--hw-radius-md)", overflow: "hidden" }}>
          <TableShell>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Window</Th>
                <Th>Status</Th>
                <Th align="right">Roster</Th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="hw-row-hover">
                  <Td style={{ fontWeight: 600 }}>{new Date(s.sessionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</Td>
                  <Td style={{ color: "var(--hw-text-muted)" }}>{s.startTime} – {s.endTime}</Td>
                  <Td>
                    <StatusPill label={s.isLocked ? "Locked" : "Open"} tone={s.isLocked ? "gray" : "blue"} />
                  </Td>
                  <Td align="right">
                    <Link href={`/hostel-warden/study-hours/${s.id}`} style={{ fontSize: 12.5, fontWeight: 700, color: "var(--hw-accent-700)" }}>
                      Mark attendance →
                    </Link>
                  </Td>
                </tr>
              ))}
              {sessions.length === 0 && <EmptyRow colSpan={4} label="No study sessions recorded yet." />}
            </tbody>
          </TableShell>
        </div>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load study sessions."} />;
  }
}
