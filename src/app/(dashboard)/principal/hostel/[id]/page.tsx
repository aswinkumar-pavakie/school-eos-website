// Principal -> Hostel -> detail: read-only mirror of Admin's own hostel
// detail page (basic info, structure, and per-bed occupancy). No
// EditHostelForm, no drag-and-drop allocation board, no structure-setup
// forms -- those stay Admin operational actions.

import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { PrincipalHostelHierarchy, type OccupantInfo } from "@/components/hostel/PrincipalHostelHierarchy";
import type { Block, Floor, Room } from "@/components/hostel/HostelHierarchy";
import type { Hostel } from "@/components/hostel/HostelsPanel";
import { apiFetch } from "@/lib/api";

interface ActiveAllocation {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  bedId: string;
}

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

export default async function PrincipalHostelDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const occupantByBed = new Map<string, OccupantInfo>();
  if (currentYearId) {
    const allocationsRes = await apiFetch(`/hostel-allocations?academicYearId=${currentYearId}&status=ACTIVE`);
    if (allocationsRes.ok) {
      const { data: allocations } = (await allocationsRes.json()) as { data: ActiveAllocation[] };
      for (const a of allocations) {
        if (bedIdsInHostel.has(a.bedId)) {
          occupantByBed.set(a.bedId, { studentFirstName: a.studentFirstName, studentLastName: a.studentLastName });
        }
      }
    }
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <BackLink href="/principal/hostel" label="Back to hostels" />
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
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Blocks, floors, rooms &amp; beds</h2>
        <p className="mt-1 text-[13px] text-text-muted">Who is in which bed, by block/floor/room.</p>
        <div className="mt-3">
          <PrincipalHostelHierarchy blocks={blocks} occupantByBed={occupantByBed} />
        </div>
      </section>
    </div>
  );
}
