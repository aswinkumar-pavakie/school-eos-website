// Attendance roster -- real per-student attendance for one section+date
// (see faculty-academic-coordinator.service.ts's own getAttendanceRoster).
// Full parity with the class advisor: a coordinator can open any section's
// day (auto-creating the session, seeded PRESENT, exactly like the
// advisor's own getOrCreateRoster), mark individual students, "mark all
// present", and publish -- for ANY section in their own scope, any day.
// Once published, marking a record transparently becomes a correction
// instead (the same real AttendanceRecordsService.correct path the
// advisor's own post-publish edit already uses) -- this is handled
// server-side (markAttendanceRecord decides based on the session's real
// isLocked state), never trusted from this client.

import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { Card, EmptyPanel, StatusPill } from "@/components/academic-coordinator-ui/primitives";
import { getCoordinatorAttendanceRoster, getCoordinatorStructure } from "@/lib/faculty-coordinator-api";
import { AttendanceRecordRow } from "./AttendanceRecordRow";
import { AttendanceActions } from "./AttendanceActions";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function AttendanceRosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ sectionId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { sectionId } = await params;
  const { date } = await searchParams;
  const effectiveDate = date || todayIso();

  try {
    const [{ sections }, roster] = await Promise.all([
      getCoordinatorStructure(),
      getCoordinatorAttendanceRoster(sectionId, effectiveDate),
    ]);
    const section = sections.find((s) => s.sectionId === sectionId);
    if (!section) return <ErrorState message="Section not found in your scope." />;

    const isLocked = roster.session?.isLocked === true;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Link href="/academic-coordinator/attendance" style={{ textDecoration: "none" }}>
          <span style={{ background: "#fff", border: "1px solid var(--acc-btn-border)", color: "var(--acc-navy)", borderRadius: 10, padding: "11px 16px", fontSize: 14, fontWeight: 700, display: "inline-block" }}>
            ← Back to attendance
          </span>
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 31, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em" }}>
              {section.gradeName} {section.sectionName}
            </div>
            <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 7 }}>
              {new Date(effectiveDate).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <StatusPill label={isLocked ? "Published" : "Draft"} tone={isLocked ? "gray" : "green"} />
            <AttendanceActions sectionId={sectionId} date={effectiveDate} isLocked={isLocked} />
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: 12, padding: "15px 18px", fontSize: 14, color: "var(--acc-navy)", fontWeight: 600 }}>
          {isLocked
            ? "This day is published. Changing a mark here records a correction against the original entry."
            : "This day is still a draft. Mark students directly, then publish when ready."}
        </div>

        <Card hover={false} style={{ padding: "20px 22px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 200px", gap: 12, fontSize: 10.5, letterSpacing: "0.08em", color: "var(--acc-tertiary)", fontWeight: 700, paddingBottom: 10, borderBottom: "1px solid var(--acc-divider)" }}>
            <div>STUDENT</div>
            <div>STATUS</div>
            <div>{isLocked ? "CORRECT" : "MARK"}</div>
          </div>
          {roster.records.map((r) => (
            <AttendanceRecordRow key={r.id} sectionId={sectionId} record={r} isLocked={isLocked} />
          ))}
          {roster.records.length === 0 && <EmptyPanel label="No students currently enrolled in this section." />}
        </Card>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load this attendance roster."} />;
  }
}
