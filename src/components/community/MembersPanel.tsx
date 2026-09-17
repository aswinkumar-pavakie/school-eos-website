"use client";

// "Members" panel -- pixel-matched to the reference's own left-column panel
// (search box, live results with "+ Add", current-members list with
// "Remove"). Real search against /api/students-search (the same proxy
// StudentPersonPicker already uses elsewhere), real add/remove via this
// module's own createMembershipAction/removeMembershipAction.

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createMembershipAction, removeMembershipAction } from "@/app/(dashboard)/admin/community/actions";

interface StudentHit {
  id: string;
  firstName: string;
  lastName: string | null;
  gradeName: string | null;
  sectionName: string | null;
}
interface MembershipRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  studentGradeName: string | null;
  studentSectionName: string | null;
  status: string;
}

export function MembersPanel({
  communityId,
  memberCap,
  memberships,
}: {
  communityId: string;
  memberCap: number | null;
  memberships: MembershipRow[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentHit[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [gradeFilter, setGradeFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeMembers = memberships.filter((m) => m.status !== "REMOVED");

  // Real class/section options -- only the ones actually present among this
  // club's own members, not every grade/section in the school.
  const grades = useMemo(
    () => Array.from(new Set(activeMembers.map((m) => m.studentGradeName).filter((g): g is string => Boolean(g)))).sort(),
    [activeMembers],
  );
  const sections = useMemo(() => {
    const pool = gradeFilter ? activeMembers.filter((m) => m.studentGradeName === gradeFilter) : activeMembers;
    return Array.from(new Set(pool.map((m) => m.studentSectionName).filter((s): s is string => Boolean(s)))).sort();
  }, [activeMembers, gradeFilter]);

  const visible = activeMembers.filter((m) => {
    if (gradeFilter && m.studentGradeName !== gradeFilter) return false;
    if (sectionFilter && m.studentSectionName !== sectionFilter) return false;
    return true;
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/students-search?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const body = (await res.json()) as { data: StudentHit[] };
        setResults(body.data);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function addStudent(student: StudentHit) {
    startTransition(async () => {
      setError(undefined);
      const formData = new FormData();
      formData.set("studentId", student.id);
      const result = await createMembershipAction(communityId, {}, formData);
      if (result.error) setError(result.error);
      else setAddedIds((prev) => new Set(prev).add(student.id));
    });
  }

  function removeMember(membershipId: string) {
    startTransition(async () => {
      setError(undefined);
      const result = await removeMembershipAction(communityId, membershipId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="card-hover rounded-[14px] border border-border bg-surface p-[22px]">
      <h3 className="whitespace-nowrap text-[17px] font-bold text-text">
        Members · {activeMembers.length}
        {memberCap ? `/${memberCap}` : ""}
      </h3>

      <label className="mt-3.5 block">
        <span className="mb-1.5 block text-[11px] font-bold tracking-[0.09em] text-text-muted">ADD A STUDENT</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by student name or class, e.g. 6-B"
          className="w-full rounded-[9px] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:shadow-[0_0_0_3px_#e7eeff]"
        />
      </label>

      {error && <p className="mt-2 text-xs font-semibold text-critical-text">{error}</p>}

      {query.trim().length >= 2 && results.length > 0 && (
        <div className="mt-2.5 grid max-h-[190px] gap-1.5 overflow-y-auto">
          {results.map((r) => {
            const alreadyMember = activeMembers.some((m) => m.studentId === r.id) || addedIds.has(r.id);
            return (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2.5 rounded-[9px] border border-border px-2.5 py-[9px]"
              >
                <span>
                  <span className="block text-sm font-semibold text-text">
                    {r.firstName} {r.lastName ?? ""}
                  </span>
                  <span className="block text-xs text-text-muted">
                    {r.gradeName ? `${r.gradeName}${r.sectionName ? `-${r.sectionName}` : ""}` : "—"}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={isPending || alreadyMember}
                  onClick={() => addStudent(r)}
                  className="whitespace-nowrap rounded-[8px] bg-primary/10 px-3 py-[7px] text-[13px] font-bold text-primary disabled:opacity-50"
                >
                  {alreadyMember ? "Added" : "+ Add"}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {query.trim().length >= 2 && results.length === 0 && (
        <p className="mt-2.5 text-[13px] text-text-muted">No student found · try a different name</p>
      )}

      <div className="mt-[18px] flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-[0.09em] text-text-muted">CURRENT MEMBERS</span>
        {activeMembers.length > 0 && (
          <div className="flex gap-1.5">
            <select
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value);
                setSectionFilter("");
              }}
              className="rounded-[7px] border border-border bg-surface px-2 py-1 text-[12px] text-text outline-none focus:border-primary"
            >
              <option value="">All classes</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="rounded-[7px] border border-border bg-surface px-2 py-1 text-[12px] text-text outline-none focus:border-primary"
            >
              <option value="">All sections</option>
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {activeMembers.length === 0 ? (
        <p className="pt-2.5 text-[13px] text-text-muted">No members yet · search above to add students</p>
      ) : visible.length === 0 ? (
        <p className="pt-2.5 text-[13px] text-text-muted">No members match this class/section filter.</p>
      ) : (
        <div className="mt-1.5 grid max-h-[320px] gap-0.5 overflow-y-auto">
          {visible.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2.5 border-t border-border py-[9px] first:border-t-0">
              <span>
                <span className="block text-sm font-semibold text-text">
                  {m.studentFirstName} {m.studentLastName ?? ""}
                </span>
                <span className="block text-xs text-text-muted">
                  {m.studentGradeName ? `${m.studentGradeName}${m.studentSectionName ? `-${m.studentSectionName}` : ""}` : "—"}
                </span>
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => removeMember(m.id)}
                className="whitespace-nowrap text-[12.5px] font-semibold text-critical-text disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
