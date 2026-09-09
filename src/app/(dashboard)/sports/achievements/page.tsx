import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listAchievements, listMyTeams, listTournaments } from "@/lib/sports-faculty-api";
import { AchievementsPanel } from "./AchievementsPanel";

export default async function AchievementsPage() {
  try {
    const [achievements, teams, tournaments] = await Promise.all([
      listAchievements(),
      listMyTeams(),
      listTournaments(),
    ]);

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Achievements</h1>
          <p className="mt-1 text-sm text-text-muted">{achievements.length} recorded.</p>
        </div>
        <AchievementsPanel achievements={achievements} teams={teams} tournaments={tournaments} />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load achievements. Nothing was submitted — try again." />;
  }
}
