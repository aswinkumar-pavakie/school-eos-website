// Media Team -- pixel-rebuilt from the design's own isTeam screen. Real
// media_team_member data (listMediaTeam, already fully built) -- click a
// member for their real profile (equipment held, recent activity).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/media-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { listMediaTeam } from "@/lib/media-api";
import { AddMemberPanel } from "./AddMemberPanel";
import { TeamMemberCard } from "./TeamMemberCard";

export default async function MediaTeamPage() {
  try {
    const members = await listMediaTeam();
    const maxJobs = Math.max(1, ...members.map((m) => m.activeJobs));

    return (
      <div className="media-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1.1 }}>Media Team</div>
            <div style={{ fontSize: 15.5, color: "var(--med-body-muted)", marginTop: 10 }}>{members.length} members · current load and speciality · click a member for their profile</div>
          </div>
          <AddMemberPanel />
        </div>

        {members.length === 0 ? (
          <div style={{ marginTop: 26 }}><EmptyPanel label="Add the people who shoot, edit and publish for the media room." /></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 20, marginTop: 28 }}>
            {members.map((m) => (
              <TeamMemberCard key={m.id} member={m} maxJobs={maxJobs} />
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the media team."} />;
  }
}
