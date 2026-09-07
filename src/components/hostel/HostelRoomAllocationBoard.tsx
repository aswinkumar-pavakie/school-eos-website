"use client";

// Visual room allocation -- drag an unallocated hostel student onto a vacant bed
// to allocate them. Native HTML5 drag-and-drop (no new dependency): a student
// card sets its studentId as drag data; a vacant bed's drop handler reads it and
// calls allocateBedAction. Answers "how do I add a student to the hostel?" --
// previously the only way was typing a raw student ID and bed ID into a form.

import { useState, useTransition } from "react";
import {
  allocateBedAction,
  vacateBedAllocationAction,
} from "@/app/(dashboard)/admin/hostel/actions";
import type { Block } from "./HostelHierarchy";

export interface UnallocatedStudent {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
  gender: string | null;
}

export interface ActiveAllocation {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  bedId: string;
}

export function HostelRoomAllocationBoard({
  hostelId,
  hostelGender,
  blocks,
  unallocatedStudents,
  allocationsByBed,
  academicYearId,
}: {
  hostelId: string;
  hostelGender: string;
  blocks: Block[];
  unallocatedStudents: UnallocatedStudent[];
  allocationsByBed: Map<string, ActiveAllocation>;
  academicYearId?: string;
}) {
  const [draggingStudentId, setDraggingStudentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blockFilter, setBlockFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");

  if (!academicYearId) {
    return <p className="text-sm text-text-muted">Set a current academic year first (Academics → Academic years).</p>;
  }

  // This hostel only ever takes one gender (unless it's MIXED) -- don't even
  // offer the other gender's students as drag candidates here; the backend
  // enforces the same rule so this is a UX filter, not the actual guard.
  const eligibleStudents =
    hostelGender === "MIXED" ? unallocatedStudents : unallocatedStudents.filter((s) => s.gender === hostelGender);
  const otherGenderCount = unallocatedStudents.length - eligibleStudents.length;

  const visibleBlocks = blockFilter ? blocks.filter((b) => b.id === blockFilter) : blocks;
  const floorsInSelectedBlock = blocks.find((b) => b.id === blockFilter)?.floors ?? [];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr]">
      <div>
        <p className="mb-2 text-[13px] font-semibold text-text">
          Unallocated hostel students ({eligibleStudents.length})
        </p>
        <p className="mb-3 text-xs text-text-muted">
          Drag a student onto a vacant bed to allocate them.
          {otherGenderCount > 0 &&
            ` ${otherGenderCount} more student${otherGenderCount === 1 ? "" : "s"} still need a bed elsewhere -- this is a ${hostelGender.toLowerCase()} hostel.`}
        </p>
        <ul className="flex flex-col gap-2">
          {eligibleStudents.length === 0 && (
            <li className="rounded-[11px] border border-dashed border-border p-3 text-center text-xs text-text-muted">
              {unallocatedStudents.length === 0
                ? "Every hostel student has a bed."
                : `No unallocated ${hostelGender.toLowerCase()} students.`}
            </li>
          )}
          {eligibleStudents.map((s) => (
            <li
              key={s.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", s.id);
                setDraggingStudentId(s.id);
              }}
              onDragEnd={() => setDraggingStudentId(null)}
              className={`cursor-grab rounded-[11px] border border-border bg-surface p-2.5 text-sm active:cursor-grabbing ${
                draggingStudentId === s.id ? "opacity-40" : ""
              }`}
            >
              <p className="font-semibold text-text">
                {s.firstName} {s.lastName ?? ""}
              </p>
              <p className="text-xs text-text-muted">
                {s.admissionNo}
                {s.gradeName ? ` · ${s.gradeName}${s.sectionName ? ` ${s.sectionName}` : ""}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        {error && (
          <p className="mb-3 rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{error}</p>
        )}
        {blocks.length === 0 && <p className="text-sm text-text-muted">No blocks/rooms set up yet.</p>}

        {blocks.length > 0 && (
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Block</span>
              <select
                value={blockFilter}
                onChange={(e) => {
                  setBlockFilter(e.target.value);
                  setFloorFilter("");
                }}
                className="min-w-[160px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:bg-surface"
              >
                <option value="">All blocks</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            {blockFilter && (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">Floor</span>
                <select
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                  className="min-w-[140px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:bg-surface"
                >
                  <option value="">All floors</option>
                  {floorsInSelectedBlock.map((f) => (
                    <option key={f.id} value={f.id}>
                      Floor {f.floorNo}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {visibleBlocks.map((block) => (
            <div key={block.id}>
              <p className="text-[13px] font-bold text-text">{block.name}</p>
              <div className="mt-2 flex flex-col gap-3">
                {(floorFilter ? block.floors.filter((f) => f.id === floorFilter) : block.floors).map((floor) => (
                  <div key={floor.id}>
                    <p className="text-xs font-semibold text-text-muted">Floor {floor.floorNo}</p>
                    <div className="mt-1.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                      {floor.rooms.map((room) => (
                        <div key={room.id} className="rounded-[11px] border border-border bg-surface p-2.5">
                          <p className="text-xs font-semibold text-text">
                            Room {room.roomNo}
                            <span className="ml-1.5 font-normal text-text-muted">· {room.beds.length} beds</span>
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {room.beds.map((bed) => {
                              const allocation = allocationsByBed.get(bed.id);
                              const isOccupied = Boolean(allocation) || bed.status !== "VACANT";
                              return (
                                <div
                                  key={bed.id}
                                  onDragOver={(e) => {
                                    if (!isOccupied) e.preventDefault();
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const studentId = e.dataTransfer.getData("text/plain");
                                    if (!studentId || isOccupied) return;
                                    startAllocate(hostelId, studentId, bed.id, academicYearId, setError);
                                  }}
                                  className={`flex min-w-[92px] flex-col items-center gap-1 rounded-[7px] border px-2 py-1.5 text-[11px] transition-colors ${
                                    allocation
                                      ? "border-border bg-field"
                                      : bed.status === "VACANT"
                                        ? "border-dashed border-success-text/40 bg-success-bg/40 text-success-text"
                                        : "border-border bg-critical-bg text-critical-text"
                                  }`}
                                >
                                  <span className="font-bold">{bed.bedNo}</span>
                                  {allocation ? (
                                    <>
                                      <span className="max-w-[80px] truncate text-text">
                                        {allocation.studentFirstName} {allocation.studentLastName ?? ""}
                                      </span>
                                      <VacateButton hostelId={hostelId} allocationId={allocation.id} />
                                    </>
                                  ) : (
                                    <span>{bed.status === "VACANT" ? "Vacant" : bed.status}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {floor.rooms.length === 0 && <p className="text-xs text-text-muted">No rooms on this floor.</p>}
                    </div>
                  </div>
                ))}
                {block.floors.length === 0 && <p className="text-xs text-text-muted">No floors in this block.</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function startAllocate(
  hostelId: string,
  studentId: string,
  bedId: string,
  academicYearId: string,
  setError: (e: string | null) => void,
) {
  setError(null);
  allocateBedAction(hostelId, studentId, bedId, academicYearId).then((result) => {
    if (result.error) setError(result.error);
  });
}

function VacateButton({ hostelId, allocationId }: { hostelId: string; allocationId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => vacateBedAllocationAction(hostelId, allocationId))}
      className="text-[10px] font-semibold text-critical-text underline disabled:opacity-60"
    >
      {isPending ? "…" : "Vacate"}
    </button>
  );
}
