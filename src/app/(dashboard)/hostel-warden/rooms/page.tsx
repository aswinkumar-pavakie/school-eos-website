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
    // hostel, not block, so every block under the same hostel shares that
    // hostel's warden name(s) (real, just not block-granular: the schema has
    // no per-block warden). Each block gets only ITS hostel's wardens,
    // de-duplicated, and is labelled with the hostel -- previously every
    // block listed every warden of every hostel, repeated, and the two
    // hostels' "Block 1"/"Block 2" were indistinguishable.
    const hostelNameById = new Map(roster.map((w) => [w.hostelId, w.hostelName]));
    const wardensByHostel = new Map<string, Set<string>>();
    for (const w of roster) {
      const set = wardensByHostel.get(w.hostelId) ?? new Set<string>();
      set.add([w.firstName, w.lastName].filter(Boolean).join(" "));
      wardensByHostel.set(w.hostelId, set);
    }

    const blockSummaries: BlockSummary[] = blocks.map((b) => {
      const capacity = b.rooms.reduce((sum, r) => sum + (r.bedCapacity || 0), 0);
      const occupied = b.rooms.reduce((sum, r) => sum + (occupiedByRoom.get(r.id) ?? 0), 0);
      const hostelName = hostelNameById.get(b.hostelId);
      const wardens = wardensByHostel.get(b.hostelId);
      return {
        id: b.id,
        name: hostelName ? `${hostelName} · ${b.name}` : b.name,
        capacity,
        occupied,
        roomCount: b.rooms.length,
        wardenName: wardens && wardens.size > 0 ? Array.from(wardens).join(", ") : null,
      };
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
