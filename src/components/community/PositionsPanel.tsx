"use client";

// "Positions & office bearers" panel -- new feature (see backend query.md's
// "Community feature rebuilt inside Admin as real Clubs" entry for the new
// community_position table). Pixel-matched to the reference's own right-
// column panel: title + type badge + assignee name, Edit/Delete per row,
// "+ Add position" opens a real form. An assignee is either a real staff
// member (reuses StaffPersonPicker, the same search this app already uses
// for Class Advisor/Coordinator assignment) or a real student (same search
// box MembersPanel uses).

import { useEffect, useRef, useState, useTransition } from "react";
import {
  createPositionAction,
  updatePositionAction,
  deletePositionAction,
} from "@/app/(dashboard)/admin/community/actions";
import { StaffPersonPicker, type StaffHit } from "@/components/academics/StaffPersonPicker";

interface StudentHit {
  id: string;
  firstName: string;
  lastName: string | null;
  gradeName: string | null;
  sectionName: string | null;
}
export interface PositionRow {
  id: string;
  title: string;
  assigneeType: "STAFF" | "STUDENT";
  assigneeStaffId: string | null;
  assigneeStudentId: string | null;
  assigneeFirstName: string;
  assigneeLastName: string | null;
}

function StudentSearchField({ onSelect }: { onSelect: (s: StudentHit | null) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentHit[]>([]);
  const [selected, setSelected] = useState<StudentHit | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/students-search?search=${encodeURIComponent(query)}`);
      if (res.ok) setResults(((await res.json()) as { data: StudentHit[] }).data);
    }, 250);
  }, [query]);

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-[9px] border border-primary bg-primary/5 px-3 py-2 text-sm">
        <span className="font-semibold text-text">
          {selected.firstName} {selected.lastName ?? ""}
        </span>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            onSelect(null);
          }}
          className="text-xs font-bold text-critical-text"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search student by name"
        className="w-full rounded-[9px] border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
      />
      {query.trim().length >= 2 && results.length > 0 && (
        <div className="mt-1.5 grid gap-1">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setSelected(r);
                setQuery("");
                setResults([]);
                onSelect(r);
              }}
              className="rounded-[8px] border border-border px-2.5 py-1.5 text-left text-sm hover:border-primary"
            >
              {r.firstName} {r.lastName ?? ""}
              {r.gradeName && <span className="ml-1.5 text-xs text-text-muted">{r.gradeName}{r.sectionName ? `-${r.sectionName}` : ""}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PositionForm({
  communityId,
  position,
  onDone,
}: {
  communityId: string;
  position?: PositionRow;
  onDone: () => void;
}) {
  const [assigneeType, setAssigneeType] = useState<"STAFF" | "STUDENT">(position?.assigneeType ?? "STAFF");
  const [staff, setStaff] = useState<StaffHit | null>(null);
  const [student, setStudent] = useState<StudentHit | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function submit(formData: FormData) {
    startTransition(async () => {
      setError(undefined);
      const action = position
        ? updatePositionAction.bind(null, communityId, position.id)
        : createPositionAction.bind(null, communityId);
      const result = await action({}, formData);
      if (result.error) setError(result.error);
      else onDone();
    });
  }

  return (
    <form action={submit} className="mt-3 flex flex-col gap-2.5 rounded-[11px] bg-field p-3.5">
      {error && <p className="text-xs font-semibold text-critical-text">{error}</p>}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Title</span>
        <input
          name="title"
          required
          defaultValue={position?.title}
          disabled={isPending}
          placeholder="e.g. President, Secretary, Teacher in-charge"
          className="rounded-[9px] border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
        />
      </label>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="assigneeType"
            value="STAFF"
            checked={assigneeType === "STAFF"}
            onChange={() => setAssigneeType("STAFF")}
            disabled={isPending}
          />
          Staff
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="assigneeType"
            value="STUDENT"
            checked={assigneeType === "STUDENT"}
            onChange={() => setAssigneeType("STUDENT")}
            disabled={isPending}
          />
          Student
        </label>
      </div>
      {assigneeType === "STAFF" ? (
        // StaffPersonPicker's own hidden input submits the selected staff
        // member's personId (its default `name="personId"` field, unused
        // here and left un-submitted since we don't name it "assigneeStaffId")
        // -- community_position.assignee_staff_id is a real FK to staff(id),
        // not person(id), so the real value this form submits comes from
        // onSelect's full StaffHit.id below, via our own hidden input.
        <>
          <StaffPersonPicker label="Staff member" onSelect={setStaff} />
          {staff && <input type="hidden" name="assigneeStaffId" value={staff.id} />}
        </>
      ) : (
        <StudentSearchField onSelect={setStudent} />
      )}
      {assigneeType === "STUDENT" && student && <input type="hidden" name="assigneeStudentId" value={student.id} />}
      <div className="flex gap-2">
        <button type="button" onClick={onDone} className="rounded-[9px] border border-border px-3 py-1.5 text-[12.5px] font-bold text-text hover:bg-surface">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || (assigneeType === "STAFF" ? !staff : !student)}
          className="rounded-[9px] bg-primary px-3 py-1.5 text-[12.5px] font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Saving…" : position ? "Save" : "Add position"}
        </button>
      </div>
    </form>
  );
}

export function PositionsPanel({ communityId, positions }: { communityId: string; positions: PositionRow[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function remove(id: string) {
    startTransition(async () => {
      await deletePositionAction(communityId, id);
    });
  }

  return (
    <div className="card-hover rounded-[14px] border border-border bg-surface p-[22px]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[17px] font-bold text-text">Positions &amp; office bearers</h3>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="whitespace-nowrap rounded-[9px] bg-primary/10 px-4 py-[9px] text-[13.5px] font-bold text-primary"
          >
            + Add position
          </button>
        )}
      </div>

      {adding && <PositionForm communityId={communityId} onDone={() => setAdding(false)} />}

      {positions.length === 0 && !adding ? (
        <p className="pt-2.5 text-[13px] text-text-muted">No positions yet · add one and assign a teacher or student</p>
      ) : (
        <div className="mt-3.5 grid gap-0.5">
          {positions.map((p) =>
            editingId === p.id ? (
              <PositionForm key={p.id} communityId={communityId} position={p} onDone={() => setEditingId(null)} />
            ) : (
              <div key={p.id} className="flex items-center justify-between gap-3 border-t border-border py-3 first:border-t-0">
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-bold text-text">{p.title}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded-[6px] px-2 py-[3px] text-[11px] font-bold ${
                        p.assigneeType === "STAFF" ? "bg-primary/10 text-primary" : "bg-field text-text-muted"
                      }`}
                    >
                      {p.assigneeType === "STAFF" ? "STAFF" : "STUDENT"}
                    </span>
                    <span className="text-[13px] text-text-secondary">
                      {p.assigneeFirstName} {p.assigneeLastName ?? ""}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 gap-3.5">
                  <button type="button" onClick={() => setEditingId(p.id)} className="text-[12.5px] font-semibold text-primary">
                    Edit
                  </button>
                  <button type="button" disabled={isPending} onClick={() => remove(p.id)} className="text-[12.5px] font-semibold text-critical-text disabled:opacity-50">
                    Delete
                  </button>
                </span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
