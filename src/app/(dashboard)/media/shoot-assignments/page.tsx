// Shoot assignments -- pixel-rebuilt from the design's own isShoots screen
// (add panel + inline expandable edit rows). Real shoot_assignment data
// (listShootAssignments/createShootAssignment/updateShootAssignment),
// already fully built.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/media-ui/primitives";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { listMediaInventory, listMediaTeam, listShootAssignments } from "@/lib/media-api";
import { AddShootAssignmentPanel } from "./AddShootAssignmentPanel";
import { ShootAssignmentRow } from "./ShootAssignmentRow";

export default async function ShootAssignmentsPage() {
  try {
    const actor = await getCurrentActor().catch(() => null);
    const [shoots, crew, inventory] = await Promise.all([listShootAssignments(), listMediaTeam(), listMediaInventory()]);
    const activeCrew = crew.filter((c) => c.status === "ACTIVE");
    const availableGear = inventory.data.filter((i) => i.status !== "RETIRED");

    return (
      <div className="media-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1.1 }}>Shoot assignments</div>
            <div style={{ fontSize: 15.5, color: "var(--med-body-muted)", marginTop: 10 }}>Who is shooting what this week · crew, gear and post-production owner.</div>
          </div>
          <AddShootAssignmentPanel crew={activeCrew} gear={availableGear} />
        </div>

        {shoots.length === 0 ? (
          <div style={{ marginTop: 26 }}><EmptyPanel label="Add one to schedule crew and gear for an event." /></div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, marginTop: 26, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 1fr 1fr 0.9fr 0.8fr 0.6fr", gap: 16, padding: "16px 26px", borderBottom: "1px solid var(--med-divider-2)" }}>
              {["WHEN", "EVENT", "CREW", "GEAR ISSUED", "OUTPUT", "STATUS", ""].map((h) => (
                <span key={h} style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary)" }}>{h}</span>
              ))}
            </div>
            {shoots.map((s) => (
              <ShootAssignmentRow key={s.id} shoot={s} crew={activeCrew} gear={availableGear} canModify={!!actor && s.createdBy === actor.personId} />
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load shoot assignments."} />;
  }
}
