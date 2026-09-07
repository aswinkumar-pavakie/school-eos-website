"use client";

import { useActionState, useState } from "react";
import {
  createBedAction,
  createBlockAction,
  createFloorAction,
  createRoomAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/hostel/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field, PanelCreateForm } from "./shared";

export interface Bed {
  id: string;
  roomId: string;
  bedNo: string;
  status: string;
}
export interface Room {
  id: string;
  floorId: string;
  roomNo: string;
  roomType: string | null;
  bedCapacity: number;
  status: string;
  beds: Bed[];
}
export interface Floor {
  id: string;
  blockId: string;
  floorNo: number;
  rooms: Room[];
}
export interface Block {
  id: string;
  hostelId: string;
  name: string;
  floors: Floor[];
}

const initialState: FormActionState = {};

function bedTone(status: string): "success" | "pending" | "critical" {
  if (status === "VACANT") return "success";
  if (status === "BLOCKED") return "critical";
  return "pending";
}

export function HostelHierarchy({ hostelId, blocks }: { hostelId: string; blocks: Block[] }) {
  const [adding, setAdding] = useState(false);
  const action = createBlockAction.bind(null, hostelId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{blocks.length} blocks</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New block
          </button>
        )}
      </div>
      {adding && (
        <PanelCreateForm title="New block" onCancel={() => setAdding(false)} formAction={formAction} isPending={isPending} error={state.error} submitLabel="Create">
          <Field label="Block name" name="name" required disabled={isPending} placeholder="Block A" />
        </PanelCreateForm>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {blocks.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No blocks yet.</li>}
        {blocks.map((block) => (
          <BlockItem key={block.id} hostelId={hostelId} block={block} />
        ))}
      </ul>
    </div>
  );
}

function BlockItem({ hostelId, block }: { hostelId: string; block: Block }) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const action = createFloorAction.bind(null, hostelId, block.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

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
          {!adding ? (
            <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
              + Add floor
            </button>
          ) : (
            <PanelCreateForm title="New floor" onCancel={() => setAdding(false)} formAction={formAction} isPending={isPending} error={state.error} submitLabel="Create">
              <Field label="Floor no." name="floorNo" type="number" required disabled={isPending} />
            </PanelCreateForm>
          )}
          <ul className="mt-3 flex flex-col gap-2.5">
            {block.floors.map((floor) => (
              <FloorItem key={floor.id} hostelId={hostelId} floor={floor} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function FloorItem({ hostelId, floor }: { hostelId: string; floor: Floor }) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const action = createRoomAction.bind(null, hostelId, floor.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

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
          {!adding ? (
            <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
              + Add room
            </button>
          ) : (
            <PanelCreateForm title="New room" onCancel={() => setAdding(false)} formAction={formAction} isPending={isPending} error={state.error} submitLabel="Create">
              <Field label="Room no." name="roomNo" required disabled={isPending} />
              <Field label="Bed capacity" name="bedCapacity" type="number" required disabled={isPending} />
            </PanelCreateForm>
          )}
          <ul className="mt-2.5 flex flex-col gap-2">
            {floor.rooms.map((room) => (
              <RoomItem key={room.id} hostelId={hostelId} room={room} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function RoomItem({ hostelId, room }: { hostelId: string; room: Room }) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const action = createBedAction.bind(null, hostelId, room.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <li className="rounded-[11px] bg-surface p-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-text">
          Room {room.roomNo} <span className="font-normal text-text-muted">· capacity {room.bedCapacity}</span>
        </p>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-[13px] font-semibold text-primary">
          {expanded ? "Hide beds" : `${room.beds.length} beds`}
        </button>
      </div>
      {expanded && (
        <div className="mt-2 border-t border-border pt-2">
          {!adding ? (
            <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
              + Add bed
            </button>
          ) : (
            <PanelCreateForm title="New bed" onCancel={() => setAdding(false)} formAction={formAction} isPending={isPending} error={state.error} submitLabel="Create">
              <Field label="Bed no." name="bedNo" required disabled={isPending} />
            </PanelCreateForm>
          )}
          <ul className="mt-2 flex flex-wrap gap-2">
            {room.beds.map((bed) => (
              <li key={bed.id} className="flex items-center gap-1.5 rounded-[7px] border border-border px-2.5 py-1.5 text-[13px]">
                {bed.bedNo}
                <StatusPill tone={bedTone(bed.status)} label={bed.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
