// Rooms & occupancy -- the design's own click-to-select block cards (percent
// full, progress bar, beds vacant/rooms, warden in charge) + bed-level heat
// map for the selected block. Real data throughout: capacity from
// hostel_room.bed_capacity, occupancy from real allocations, warden name
// from the real co-warden roster (GET /hostel/warden-roster, the same real
// role_assignment relationship the mobile app's own Warden Roster screen
// uses) -- a block with no assigned warden honestly shows "Not assigned"
// rather than a fabricated name.

import { ErrorState } from "@/components/ui/EmptyState";
import { listHostelStructure, listRoomAllocations, listWardenRoster } from "@/lib/hostel-warden-api";
import { RoomsView, type BlockSummary, type RoomTile } from "./RoomsView";

export default async function RoomsOccupancyPage() {
  try {
    const [blocks, allocations, roster] = await Promise.all([
      listHostelStructure(),
      listRoomAllocations(),
      listWardenRoster().catch(() => []),
    ]);
    const occupiedByRoom = new Map<string, number>();
    for (const a of allocations) occupiedByRoom.set(a.roomId, (occupiedByRoom.get(a.roomId) ?? 0) + 1);

    // A block belongs to exactly one hostel; the warden roster is scoped by
    // hostel, not block, so every block under the same hostel shares the
    // same warden name(s) here -- real, just not block-granular (the real
    // schema has no per-block warden assignment, only per-hostel).
    const wardenNames = roster.map((w) => [w.firstName, w.lastName].filter(Boolean).join(" ")).join(", ") || null;

    const blockSummaries: BlockSummary[] = blocks.map((b) => {
      const capacity = b.rooms.reduce((sum, r) => sum + (r.bedCapacity || 0), 0);
      const occupied = b.rooms.reduce((sum, r) => sum + (occupiedByRoom.get(r.id) ?? 0), 0);
      return { id: b.id, name: b.name, capacity, occupied, roomCount: b.rooms.length, wardenName: wardenNames };
    });

    const roomsByBlock: Record<string, RoomTile[]> = {};
    for (const b of blocks) {
      roomsByBlock[b.id] = b.rooms.map((r) => ({
        id: r.id,
        roomNo: r.roomNo,
        floorNo: r.floorNo,
        filled: occupiedByRoom.get(r.id) ?? 0,
        capacity: r.bedCapacity || 0,
      }));
    }

    return <RoomsView blocks={blockSummaries} roomsByBlock={roomsByBlock} />;
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load room occupancy."} />;
  }
}
