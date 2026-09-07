import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { EditHostelForm } from "@/components/hostel/EditHostelForm";
import { HostelHierarchy } from "@/components/hostel/HostelHierarchy";
import type { Block, Floor, Room } from "@/components/hostel/HostelHierarchy";
import { HostelRoomAllocationBoard } from "@/components/hostel/HostelRoomAllocationBoard";
import type { ActiveAllocation, UnallocatedStudent } from "@/components/hostel/HostelRoomAllocationBoard";
import type { Hostel } from "@/components/hostel/HostelsPanel";
import { apiFetch } from "@/lib/api";

async function loadBlocks(hostelId: string): Promise<Block[]> {
  const blocksRes = await apiFetch(`/hostels/${hostelId}/blocks`);
  if (!blocksRes.ok) return [];
  const { data: blocksRaw } = (await blocksRes.json()) as { data: Omit<Block, "floors">[] };

  return Promise.all(
    blocksRaw.map(async (block): Promise<Block> => {
      const floorsRes = await apiFetch(`/hostel-blocks/${block.id}/floors`);
      const floorsRaw = floorsRes.ok ? ((await floorsRes.json()).data as Omit<Floor, "rooms">[]) : [];

      const floors: Floor[] = await Promise.all(
        floorsRaw.map(async (floor): Promise<Floor> => {
          const roomsRes = await apiFetch(`/hostel-floors/${floor.id}/rooms`);
          const roomsRaw = roomsRes.ok ? ((await roomsRes.json()).data as Omit<Room, "beds">[]) : [];

          const rooms: Room[] = await Promise.all(
            roomsRaw.map(async (room): Promise<Room> => {
              const bedsRes = await apiFetch(`/hostel-rooms/${room.id}/beds`);
              const beds = bedsRes.ok ? (await bedsRes.json()).data : [];
              return { ...room, beds };
            }),
          );
          return { ...floor, rooms };
        }),
      );
      return { ...block, floors };
    }),
  );
}

export default async function HostelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [hostelRes, blocks, yearsRes] = await Promise.all([
    apiFetch(`/hostels/${id}`),
    loadBlocks(id),
    apiFetch("/academic-years"),
  ]);

  if (hostelRes.status === 404) notFound();
  if (!hostelRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this hostel</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: hostel } = (await hostelRes.json()) as { data: Hostel };

  const years = yearsRes.ok ? ((await yearsRes.json()) as { data: { id: string; isCurrent: boolean }[] }).data : [];
  const currentYearId = years.find((y) => y.isCurrent)?.id;

  const bedIdsInHostel = new Set(
    blocks.flatMap((b) => b.floors.flatMap((f) => f.rooms.flatMap((r) => r.beds.map((bed) => bed.id)))),
  );

  let unallocatedStudents: UnallocatedStudent[] = [];
  const allocationsByBed = new Map<string, ActiveAllocation>();

  if (currentYearId) {
    const [unallocatedRes, allocationsRes] = await Promise.all([
      apiFetch(`/hostel-allocations/unallocated-students?academicYearId=${currentYearId}`),
      apiFetch(`/hostel-allocations?academicYearId=${currentYearId}&status=ACTIVE`),
    ]);
    unallocatedStudents = unallocatedRes.ok
      ? ((await unallocatedRes.json()) as { data: UnallocatedStudent[] }).data
      : [];
    if (allocationsRes.ok) {
      const { data: allocations } = (await allocationsRes.json()) as { data: ActiveAllocation[] };
      for (const a of allocations) {
        if (bedIdsInHostel.has(a.bedId)) allocationsByBed.set(a.bedId, a);
      }
    }
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <BackLink href="/admin/hostel" label="Back to hostels" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">{hostel.name}</h1>
          <div className="mt-1.5 flex items-center gap-2.5 text-sm text-text-muted">
            <span>{hostel.gender.toLowerCase()}</span>
            {hostel.capacity && <span>capacity {hostel.capacity}</span>}
            <StatusPill tone={hostel.status === "ACTIVE" ? "success" : "pending"} label={hostel.status} />
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Room allocation</h2>
        <p className="mt-1 text-[13px] text-text-muted">
          Drag a student onto a vacant bed to allocate them — no more copying IDs by hand.
        </p>
        <div className="mt-3">
          <HostelRoomAllocationBoard
            hostelId={hostel.id}
            hostelGender={hostel.gender}
            blocks={blocks}
            unallocatedStudents={unallocatedStudents}
            allocationsByBed={allocationsByBed}
            academicYearId={currentYearId}
          />
        </div>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Basic information</h2>
        <EditHostelForm hostel={hostel} />
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Blocks, floors, rooms &amp; beds</h2>
        <p className="mt-1 text-[13px] text-text-muted">Set up the physical structure here; allocate students above.</p>
        <HostelHierarchy hostelId={hostel.id} blocks={blocks} />
      </section>
    </div>
  );
}
