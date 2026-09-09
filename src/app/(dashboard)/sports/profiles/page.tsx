import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listMyTeams, listSportsProfiles, listTournaments } from "@/lib/sports-faculty-api";
import { ProfilesPanel } from "./ProfilesPanel";

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ sportId?: string }>;
}) {
  try {
    const [teams, tournaments] = await Promise.all([listMyTeams(), listTournaments()]);
    const knownSports = Array.from(
      new Map([...teams.map((t) => [t.sportId, t.sportName] as const), ...tournaments.map((t) => [t.sportId, t.sportName] as const)]).entries(),
    ).map(([id, name]) => ({ id, name }));

    const { sportId: sportIdParam } = await searchParams;
    const activeSportId = sportIdParam || knownSports[0]?.id;

    const profiles = activeSportId ? await listSportsProfiles(activeSportId) : [];

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Player Profiles</h1>
          <p className="mt-1 text-sm text-text-muted">Per-sport student sport profiles.</p>
        </div>

        {knownSports.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-field px-6 py-5 text-sm text-text-muted">
            No sport known yet — create a team or tournament first, then come back here.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {knownSports.map((s) => (
                <Link key={s.id} href={`/sports/profiles?sportId=${s.id}`}>
                  <span
                    className={`inline-flex items-center rounded-[var(--radius-pill)] px-3 py-1.5 text-sm font-semibold ${
                      s.id === activeSportId ? "bg-primary text-white" : "bg-field text-text-muted hover:bg-border"
                    }`}
                  >
                    {s.name}
                  </span>
                </Link>
              ))}
            </div>
            {activeSportId && <ProfilesPanel sportId={activeSportId} profiles={profiles} />}
          </>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load player profiles. Nothing was submitted — try again." />;
  }
}
