import { redirect } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listMediaInventory, listMediaTeam, listShootAssignments } from "@/lib/media-api";
import { CreateShootAssignmentModal } from "./CreateShootAssignmentModal";
import { EditShootAssignmentModal } from "./EditShootAssignmentModal";

export default async function ShootAssignmentsPage() {
  try {
    const [shoots, crew, inventory] = await Promise.all([
      listShootAssignments(),
      listMediaTeam(),
      listMediaInventory(),
    ]);
    const activeCrew = crew.filter((c) => c.status === "ACTIVE");
    const availableGear = inventory.data.filter((i) => i.status !== "RETIRED");

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Shoot Assignments</h1>
            <p className="mt-1 text-sm text-text-muted">Who is shooting what — crew, gear and post-production owner.</p>
          </div>
          <CreateShootAssignmentModal crew={activeCrew} gear={availableGear} />
        </div>

        {shoots.length === 0 ? (
          <EmptyState title="No shoot assignments yet" body="Add one to schedule crew and gear for an event." />
        ) : (
          <DataTable
            getKey={(s) => s.id}
            rows={shoots}
            columns={[
              {
                header: "When",
                render: (s) => (
                  <div>
                    <div className="font-bold text-text">{formatDate(s.scheduledAt)}</div>
                    <div className="text-xs text-text-muted">
                      {new Date(s.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ),
              },
              {
                header: "Event",
                render: (s) => (
                  <div>
                    <div className="font-bold text-text">{s.eventTitle}</div>
                    <div className="text-xs text-text-muted">{s.venue ?? "—"}</div>
                  </div>
                ),
              },
              { header: "Crew", render: (s) => s.crew.map((c) => c.fullName).join(", ") || "—" },
              { header: "Gear issued", render: (s) => s.gear.map((g) => g.name).join(", ") || "—" },
              { header: "Output", render: (s) => s.outputType.replace("_", " + ") },
              { header: "Status", render: (s) => <StatusPill state={s.status} /> },
              { header: "", render: (s) => <EditShootAssignmentModal shoot={s} crew={activeCrew} gear={availableGear} /> },
            ]}
          />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load shoot assignments. Nothing was submitted — try again." />;
  }
}
