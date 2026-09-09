import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listFixtures, listMyTeams, listOdRequests } from "@/lib/sports-faculty-api";
import { OdRequestsPanel } from "./OdRequestsPanel";

export default async function OdRequestsPage() {
  try {
    const [odRequests, teams, fixtures] = await Promise.all([listOdRequests(), listMyTeams(), listFixtures()]);

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">OD Requests</h1>
          <p className="mt-1 text-sm text-text-muted">
            On-duty requests for team events — routed to the Principal for a decision, then to parent consent.
          </p>
        </div>
        <OdRequestsPanel odRequests={odRequests} teams={teams} fixtures={fixtures} />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load OD requests. Nothing was submitted — try again." />;
  }
}
