import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import {
  listMyTeams,
  listTeamRoster,
  listTrainingAttendance,
  listTrainingSessions,
  type TeamRosterMember,
  type TrainingAttendanceEntry,
} from "@/lib/sports-faculty-api";
import { TrainingPanel } from "./TrainingPanel";

export default async function TrainingPage() {
  try {
    const [teams, sessions] = await Promise.all([listMyTeams(), listTrainingSessions()]);

    const rosterResults = await Promise.all(
      teams.map((t) => listTeamRoster(t.id).catch(() => [] as TeamRosterMember[])),
    );
    const rostersByTeam: Record<string, TeamRosterMember[]> = {};
    teams.forEach((t, i) => {
      rostersByTeam[t.id] = rosterResults[i].filter((m) => m.status === "ACTIVE");
    });

    const attendanceResults = await Promise.all(
      sessions.map((s) => listTrainingAttendance(s.id).catch(() => [] as TrainingAttendanceEntry[])),
    );
    const attendanceBySession: Record<string, TrainingAttendanceEntry[]> = {};
    sessions.forEach((s, i) => {
      attendanceBySession[s.id] = attendanceResults[i];
    });

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Training &amp; Attendance</h1>
          <p className="mt-1 text-sm text-text-muted">{sessions.length} session{sessions.length === 1 ? "" : "s"} recorded.</p>
        </div>
        <TrainingPanel teams={teams} sessions={sessions} rostersByTeam={rostersByTeam} attendanceBySession={attendanceBySession} />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load training sessions. Nothing was submitted — try again." />;
  }
}
