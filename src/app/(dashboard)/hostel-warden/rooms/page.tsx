// Rooms & occupancy -- the design's own bed-level heat map, backed by real
// capacity (hostel_room.bed_capacity, exposed to this warden role by this
// build's own additive backend fix -- see hostel-warden-api.ts's comment on
// HostelStructureRoom) and real allocations (currently-occupied beds).

import { ErrorState } from "@/components/ui/EmptyState";
import { Card } from "@/components/hostel-warden-ui/primitives";
import { listHostelStructure, listRoomAllocations } from "@/lib/hostel-warden-api";

export default async function RoomsOccupancyPage() {
  try {
    const [blocks, allocations] = await Promise.all([listHostelStructure(), listRoomAllocations()]);
    const occupiedByRoom = new Map<string, number>();
    for (const a of allocations) occupiedByRoom.set(a.roomId, (occupiedByRoom.get(a.roomId) ?? 0) + 1);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {blocks.map((block) => {
          const capacity = block.rooms.reduce((sum, r) => sum + (r.bedCapacity || 0), 0);
          const occupied = block.rooms.reduce((sum, r) => sum + (occupiedByRoom.get(r.id) ?? 0), 0);
          return (
            <Card key={block.id} style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <h2 style={{ margin: 0, flex: 1, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em" }}>{block.name}</h2>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--hw-accent-700)", background: "var(--hw-accent-100)", borderRadius: 99, padding: "6px 12px" }}>
                  {occupied} / {capacity} beds full
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                {block.rooms.map((room) => {
                  const filled = occupiedByRoom.get(room.id) ?? 0;
                  const cap = room.bedCapacity || 0;
                  const full = cap > 0 && filled >= cap;
                  const empty = filled === 0;
                  const bg = empty ? "#ffffff" : full ? "var(--hw-accent)" : "var(--hw-accent-300)";
                  const fg = empty ? "var(--hw-accent-900)" : full ? "#ffffff" : "var(--hw-accent-900)";
                  const bd = empty ? "#dde2e8" : full ? "var(--hw-accent)" : "var(--hw-accent-300)";
                  return (
                    <div key={room.id} className="hw-lift" style={{ border: `1px solid ${bd}`, background: bg, color: fg, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{room.roomNo}</div>
                      <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 2 }}>{filled}/{cap} beds filled</div>
                      <div style={{ fontSize: 11, opacity: 0.75 }}>Floor {room.floorNo}</div>
                    </div>
                  );
                })}
                {block.rooms.length === 0 && <div style={{ fontSize: 13, color: "var(--hw-text-muted)" }}>No rooms registered in this block.</div>}
              </div>
            </Card>
          );
        })}
        {blocks.length === 0 && <ErrorState message="No hostel blocks are registered for this warden yet." />}
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load room occupancy."} />;
  }
}
