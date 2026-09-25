import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { getStudySessionRoster } from "@/lib/hostel-warden-api";
import { RosterMarker } from "./RosterMarker";

export default async function StudySessionRosterPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  try {
    const { session, roster } = await getStudySessionRoster(sessionId);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Link href="/hostel-warden/study-hours" style={{ fontSize: 13, fontWeight: 600, color: "var(--hw-accent-700)" }}>
          ← All sessions
        </Link>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
            {new Date(session.sessionDate).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </h2>
          <div style={{ fontSize: 13.5, color: "var(--hw-text-muted)", marginTop: 2 }}>
            {session.startTime.slice(0, 5)} – {session.endTime.slice(0, 5)}
          </div>
        </div>
        <RosterMarker sessionId={sessionId} roster={roster} locked={session.isLocked} />
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load this session."} />;
  }
}
