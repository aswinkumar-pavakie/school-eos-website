// Hostel details -- the design's own block-record screen lets the warden
// create/amend/retire hostel blocks; a warden's real access is read-only
// (hostel/block/room/bed CRUD is Admin's own module -- see
// room-bed-view.service.ts's own header comment: "Feature 8 -- READ ONLY").
// This screen shows the same real block/room register, without the write
// actions the design pictures.

import { ErrorState } from "@/components/ui/EmptyState";
import { Card } from "@/components/hostel-warden-ui/primitives";
import { listHostelStructure, listRoomAllocations, listWardenRoster } from "@/lib/hostel-warden-api";

export default async function HostelDetailsPage() {
  try {
    const [blocks, allocations, roster] = await Promise.all([
      listHostelStructure(),
      listRoomAllocations(),
      listWardenRoster().catch(() => []),
    ]);
    const wardenNames = roster.map((w) => [w.firstName, w.lastName].filter(Boolean).join(" ")).join(", ") || "Not assigned";
    const occupiedByRoom = new Map<string, number>();
    for (const a of allocations) occupiedByRoom.set(a.roomId, (occupiedByRoom.get(a.roomId) ?? 0) + 1);

    const blockStats = blocks.map((b) => {
      const capacity = b.rooms.reduce((sum, r) => sum + (r.bedCapacity || 0), 0);
      const occupied = b.rooms.reduce((sum, r) => sum + (occupiedByRoom.get(r.id) ?? 0), 0);
      return { ...b, capacity, occupied };
    });

    const totalRooms = blocks.reduce((sum, b) => sum + b.rooms.length, 0);
    const totalCapacity = blockStats.reduce((sum, b) => sum + b.capacity, 0);
    const totalOccupied = blockStats.reduce((sum, b) => sum + b.occupied, 0);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
          <Card style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--hw-text-muted)" }}>Blocks on register</div>
            <div style={{ fontWeight: 800, fontSize: 26, lineHeight: 1.1, marginTop: 6 }}>{blocks.length}</div>
          </Card>
          <Card style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--hw-text-muted)" }}>Rooms</div>
            <div style={{ fontWeight: 800, fontSize: 26, lineHeight: 1.1, marginTop: 6 }}>{totalRooms}</div>
          </Card>
          <Card style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--hw-text-muted)" }}>Beds occupied</div>
            <div style={{ fontWeight: 800, fontSize: 26, lineHeight: 1.1, marginTop: 6 }}>{totalOccupied} / {totalCapacity}</div>
          </Card>
          <Card style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--hw-text-muted)" }}>Beds vacant</div>
            <div style={{ fontWeight: 800, fontSize: 26, lineHeight: 1.1, marginTop: 6 }}>{Math.max(0, totalCapacity - totalOccupied)}</div>
          </Card>
        </div>

        <Card style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--hw-divider)" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--hw-accent)" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21V8l9-5 9 5v13M9 21v-5h6v5" />
            </svg>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em" }}>Block records</h2>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: "var(--hw-text-faint)" }}>Maintained by Admin -- view only</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="hw-table" style={{ fontSize: 13, margin: 0, width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Block</th>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Rooms</th>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Beds occupied</th>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Vacant</th>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Warden in charge</th>
                </tr>
              </thead>
              <tbody>
                {blockStats.map((b) => (
                  <tr key={b.id} style={{ borderTop: "1px solid var(--hw-divider-soft)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{b.name}</td>
                    <td style={{ padding: "10px 14px", color: "var(--hw-text-muted)" }}>{b.rooms.length}</td>
                    <td style={{ padding: "10px 14px", color: "var(--hw-text-muted)" }}>{b.occupied} / {b.capacity}</td>
                    <td style={{ padding: "10px 14px", color: "var(--hw-text-muted)" }}>{Math.max(0, b.capacity - b.occupied)}</td>
                    <td style={{ padding: "10px 14px", color: "var(--hw-text-muted)" }}>{wardenNames}</td>
                  </tr>
                ))}
                {blockStats.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--hw-text-muted)" }}>
                      No blocks are registered for this hostel yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load hostel details."} />;
  }
}
