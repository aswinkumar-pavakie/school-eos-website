"use client";

// Principal's read-only mirror of HostelHierarchy -- same blocks -> floors ->
// rooms -> beds structure, no create-block/floor/room/bed forms. Bed occupancy
// (which student, if any) is passed in from the same allocationsByBed map the
// Admin detail page already builds from the existing /hostel-allocations
// endpoint -- not a second occupancy calculation, just the same join reused.

import { useState } from "react";
import { StatusPill } from "@/components/dashboard/StatusPill";
import type { Block } from "./HostelHierarchy";

export interface OccupantInfo {
  studentFirstName: string;
  studentLastName: string | null;
}

function bedTone(status: string): "success" | "pending" | "critical" {
  if (status === "VACANT") return "success";
  if (status === "BLOCKED") return "critical";
  return "pending";
}

export function PrincipalHostelHierarchy({
  blocks,
  occupantByBed,
}: {
  blocks: Block[];
  occupantByBed: Map<string, OccupantInfo>;
}) {
  return (
    <div>
      <p className="text-[13px] text-text-muted">{blocks.length} blocks</p>
      <ul className="mt-4 flex flex-col gap-3">
        {blocks.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No blocks yet.</li>}
        {blocks.map((block) => (
          <BlockItem key={block.id} block={block} occupantByBed={occupantByBed} />
        ))}
      </ul>
    </div>
  );
}

function BlockItem({ block, occupantByBed }: { block: Block; occupantByBed: Map<string, OccupantInfo> }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="rounded-[11px] border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="text-[13.5px] font-semibold text-text">{block.name}</p>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-[13px] font-semibold text-primary">
          {expanded ? "Hide floors" : `${block.floors.length} floors`}
        </button>
      </div>
      {expanded && (
        <div className="mt-2.5 border-t border-border pt-2.5">
          <ul className="flex flex-col gap-2.5">
            {block.floors.map((floor) => (
              <FloorItem key={floor.id} floor={floor} occupantByBed={occupantByBed} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function FloorItem({ floor, occupantByBed }: { floor: Block["floors"][number]; occupantByBed: Map<string, OccupantInfo> }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="rounded-[11px] bg-field p-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-text">Floor {floor.floorNo}</p>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-[13px] font-semibold text-primary">
          {expanded ? "Hide rooms" : `${floor.rooms.length} rooms`}
        </button>
      </div>
      {expanded && (
        <div className="mt-2 border-t border-border pt-2">
          <ul className="mt-2.5 flex flex-col gap-2">
            {floor.rooms.map((room) => (
              <RoomItem key={room.id} room={room} occupantByBed={occupantByBed} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function RoomItem({
  room,
  occupantByBed,
}: {
  room: Block["floors"][number]["rooms"][number];
  occupantByBed: Map<string, OccupantInfo>;
}) {
  const [expanded, setExpanded] = useState(false);
  const occupiedCount = room.beds.filter((b) => occupantByBed.has(b.id)).length;
  return (
    <li className="rounded-[11px] bg-surface p-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-text">
          Room {room.roomNo}{" "}
          <span className="font-normal text-text-muted">
            · {occupiedCount}/{room.bedCapacity} occupied
          </span>
        </p>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-[13px] font-semibold text-primary">
          {expanded ? "Hide beds" : `${room.beds.length} beds`}
        </button>
      </div>
      {expanded && (
        <div className="mt-2 border-t border-border pt-2">
          <ul className="mt-2 flex flex-col gap-1.5">
            {room.beds.map((bed) => {
              const occupant = occupantByBed.get(bed.id);
              return (
                <li key={bed.id} className="flex items-center justify-between gap-2 rounded-[7px] border border-border px-2.5 py-1.5 text-[13px]">
                  <span className="text-text">
                    {bed.bedNo}
                    {occupant && (
                      <span className="ml-2 text-text-muted">
                        {occupant.studentFirstName} {occupant.studentLastName ?? ""}
                      </span>
                    )}
                  </span>
                  <StatusPill tone={bedTone(bed.status)} label={bed.status} />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
}
