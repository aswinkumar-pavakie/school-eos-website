import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { AuthExpiredError } from "@/lib/api";
import { listMediaTeam } from "@/lib/media-api";
import { CreateMediaTeamMemberModal } from "./CreateMediaTeamMemberModal";
import { EditMediaTeamMemberModal } from "./EditMediaTeamMemberModal";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export default async function MediaTeamPage() {
  try {
    const members = await listMediaTeam();
    const maxJobs = Math.max(1, ...members.map((m) => m.activeJobs));

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Media Team</h1>
            <p className="mt-1 text-sm text-text-muted">{members.length} members · current load and speciality.</p>
          </div>
          <CreateMediaTeamMemberModal />
        </div>

        {members.length === 0 ? (
          <EmptyState title="No team members yet" body="Add the people who shoot, edit and publish for the media room." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <div key={member.id} className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-deep text-sm font-bold text-white">
                      {initialsOf(member.fullName)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text">{member.fullName}</p>
                      <p className="text-xs text-text-muted">{member.designation ?? "—"}</p>
                    </div>
                  </div>
                  <EditMediaTeamMemberModal member={member} />
                </div>

                <div>
                  <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Active jobs</p>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-field">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (member.activeJobs / maxJobs) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <StatusPill state={member.status} />
                  <span className="text-xs text-text-muted">{member.phone ?? "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the media team. Nothing was submitted — try again." />;
  }
}
