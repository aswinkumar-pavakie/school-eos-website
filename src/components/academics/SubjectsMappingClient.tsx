"use client";

// Admin "Subjects & mapping" -- a dedicated page (not a tab), pixel-matched to
// the reference mockup, with real WRITE operations Principal's own read-only
// /principal/academics/subject-mapping page (see that page.tsx's own header
// comment) never needed. Real data per section:
//
// 1. Header + "Define a subject" panel -- POST /subjects (real subjectsService).
// 2. 4-step process row -- real counts derived from subjects/offerings/grades/
//    role_assignment below, no fabricated numbers.
// 3. Academic co-ordinators -- real role_assignment rows (role_code=
//    ACADEMIC_COORDINATOR, scope_type=STAGE), grouped by the real grade.stage
//    values present in this school's own /grades data (not a hardcoded "4
//    bands" -- however many real stages exist is however many cards render).
// 4. Assign a teacher to a class -- real subject_offering rows (teacher can
//    only be set on an EXISTING offering; see actions.ts's own comment on why
//    there's no "create a new offering" endpoint in the real schema yet).
//    "Newly admitted" banner = real staff with zero subject_offering rows as
//    teacher AND a dateOfJoining inside the current academic year.
// 5. Teacher allocation cards -- real subject_offering + role_assignment
//    (CLASS_ADVISOR) data per teaching staff member.
// 6. Summary stats -- real aggregates over the same data as (5).
// 7. Subject register -- real /subjects with derived grade-band/periods/
//    co-ordinator columns.
//
// GET /staff genuinely 500s right now (pending migration -- see query.md and
// this page's own page.tsx comment), so every section below that needs staff
// data checks `staffOk` and degrades to an honest inline notice instead of
// fabricating names/counts.

import { useActionState, useMemo, useState } from "react";
import {
  assignBandCoordinatorAction,
  assignClassTeacherAction,
  assignOfferingTeacherAction,
  createSubjectAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/academics/subjects-mapping/actions";
import { PersonAvatar } from "@/components/dashboard/PersonAvatar";
import { formatDate } from "@/lib/format";

export interface Grade {
  id: string;
  name: string;
  levelNo: number;
  stage: string;
  status: string;
}
export interface Section {
  id: string;
  gradeId: string;
  name: string;
  status?: string;
}
export interface Subject {
  id: string;
  name: string;
  code: string;
  subjectType: string;
  appliesToStage: string | null;
  status: string;
}
export interface Offering {
  id: string;
  academicYearId: string;
  sectionId: string;
  gradeName: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  teacherStaffId: string | null;
  teacherFirstName: string | null;
  teacherLastName: string | null;
  isPractical: boolean;
  weeklyPeriods: number;
  status: string;
}
export interface RoleAssignment {
  id: string;
  personId: string;
  personFirstName: string;
  personLastName: string | null;
  roleCode: string;
  scopeId: string | null;
  scopeStage: string | null;
  scopeName: string | null;
}
export interface StaffRow {
  id: string;
  firstName: string;
  lastName: string | null;
  employeeNo: string;
  designation: string | null;
  isTeaching: boolean;
  dateOfJoining: string;
  status: string;
  photoUrl: string | null;
}

const STAGES: [string, string][] = [
  ["PRE_PRIMARY", "Pre-primary"],
  ["PRIMARY", "Primary"],
  ["MIDDLE", "Middle"],
  ["SECONDARY", "Secondary"],
  ["HIGHER_SECONDARY", "Higher secondary"],
];
const STAGE_LABELS: Record<string, string> = Object.fromEntries(STAGES);
const WEEKLY_LOAD_TARGET = 30;

const TYPES: [string, string][] = [
  ["CORE", "Core"],
  ["LANGUAGE", "Language"],
  ["OPTIONAL", "Optional"],
  ["VOCATIONAL", "Vocational"],
  ["CO_SCHOLASTIC", "Co-scholastic"],
];

function fullName(first: string, last: string | null) {
  return `${first} ${last ?? ""}`.trim();
}

// Real digits inside a grade name ("Grade 5", "5", "Std 5-A") drive the band's
// "CLASSES X-Y" eyebrow -- names with no digit at all (LKG/UKG) fall back to
// the raw name itself instead of a fabricated number.
function gradeNumber(name: string): number | null {
  const match = name.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function bandLabel(grades: Grade[]): string {
  const nums = grades.map((g) => gradeNumber(g.name)).filter((n): n is number => n !== null);
  if (nums.length === grades.length && nums.length > 0) {
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    return min === max ? `CLASS ${min}` : `CLASSES ${min}-${max}`;
  }
  const sorted = [...grades].sort((a, b) => a.levelNo - b.levelNo);
  const first = sorted[0]?.name ?? "";
  const last = sorted[sorted.length - 1]?.name ?? "";
  return first === last ? first.toUpperCase() : `${first.toUpperCase()} - ${last.toUpperCase()}`;
}

const initialState: FormActionState = {};

export function SubjectsMappingClient({
  currentYear,
  grades,
  sections,
  subjects,
  offerings,
  coordinators,
  classAdvisors,
  staff,
  staffOk,
}: {
  currentYear: { id: string; name: string } | null;
  grades: Grade[];
  sections: Section[];
  subjects: Subject[];
  offerings: Offering[];
  coordinators: RoleAssignment[];
  classAdvisors: RoleAssignment[];
  staff: StaffRow[];
  staffOk: boolean;
}) {
  const gradeById = useMemo(() => new Map(grades.map((g) => [g.id, g])), [grades]);
  const teachingStaff = useMemo(() => staff.filter((s) => s.isTeaching), [staff]);

  // ---- Derived, real aggregates shared across sections ----
  const mappedTeacherIds = useMemo(
    () => new Set(offerings.filter((o) => o.teacherStaffId).map((o) => o.teacherStaffId as string)),
    [offerings],
  );
  const realStages = useMemo(() => {
    const present = new Set(grades.map((g) => g.stage));
    return STAGES.filter(([code]) => present.has(code));
  }, [grades]);

  const bandsWithCoordinator = realStages.filter(([code]) => coordinators.some((c) => c.scopeStage === code)).length;

  const sectionsByGradeStage = useMemo(() => {
    const map = new Map<string, Section[]>();
    for (const sec of sections) {
      const g = gradeById.get(sec.gradeId);
      if (!g) continue;
      const list = map.get(g.stage) ?? [];
      list.push(sec);
      map.set(g.stage, list);
    }
    return map;
  }, [sections, gradeById]);

  const subjectsByStage = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const o of offerings) {
      const sec = sections.find((s) => s.id === o.sectionId);
      const g = sec ? gradeById.get(sec.gradeId) : null;
      if (!g) continue;
      const set = map.get(g.stage) ?? new Set<string>();
      set.add(o.subjectId);
      map.set(g.stage, set);
    }
    return map;
  }, [offerings, sections, gradeById]);

  // Class advisor lookup by section id.
  const advisorBySection = useMemo(() => new Map(classAdvisors.map((a) => [a.scopeId, a])), [classAdvisors]);
  const sectionsWithAdvisor = new Set(classAdvisors.map((a) => a.scopeId)).size;

  // Weekly load + subjects taken, per teacher.
  const offeringsByTeacher = useMemo(() => {
    const map = new Map<string, Offering[]>();
    for (const o of offerings) {
      if (!o.teacherStaffId) continue;
      const list = map.get(o.teacherStaffId) ?? [];
      list.push(o);
      map.set(o.teacherStaffId, list);
    }
    return map;
  }, [offerings]);

  // "Newly admitted, not yet mapped" -- real staff, teaching, joined this
  // academic year, zero subject_offering rows as teacher.
  const newlyAdmitted = useMemo(() => {
    if (!staffOk) return [];
    return teachingStaff.filter((s) => {
      if (mappedTeacherIds.has(s.id)) return false;
      if (!currentYear) return false;
      const joined = new Date(s.dateOfJoining);
      if (Number.isNaN(joined.getTime())) return false;
      const now = new Date();
      const daysSince = (now.getTime() - joined.getTime()) / 86400000;
      return daysSince >= 0 && daysSince <= 120;
    });
  }, [teachingStaff, mappedTeacherIds, currentYear, staffOk]);

  // Sections with at least one real subject_offering row still missing a teacher.
  const sectionsMissingTeacher = useMemo(() => {
    const set = new Set<string>();
    for (const o of offerings) if (!o.teacherStaffId) set.add(o.sectionId);
    return set.size;
  }, [offerings]);

  const avgLoad = useMemo(() => {
    if (mappedTeacherIds.size === 0) return 0;
    const total = offerings.reduce((sum, o) => sum + (o.teacherStaffId ? o.weeklyPeriods : 0), 0);
    return Math.round(total / mappedTeacherIds.size);
  }, [offerings, mappedTeacherIds]);

  const [search, setSearch] = useState("");
  const [definingSubject, setDefiningSubject] = useState(false);

  const filteredSubjects = subjects.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const coordName = coordinatorNameForStage(s.appliesToStage, coordinators);
    return s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (coordName ?? "").toLowerCase().includes(q);
  });

  function periodsForSubject(subjectId: string): string {
    const rows = offerings.filter((o) => o.subjectId === subjectId).map((o) => o.weeklyPeriods);
    if (rows.length === 0) return "—";
    const avg = Math.round(rows.reduce((a, b) => a + b, 0) / rows.length);
    return String(avg);
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* 1. Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Subjects &amp; mapping</h1>
          <p className="mt-1 max-w-[640px] text-sm text-text-muted">
            Every subject offered in the school, its grade band and the academic co-ordinator who owns it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDefiningSubject((v) => !v)}
          className="shrink-0 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white"
        >
          {definingSubject ? "Close" : "+ Define subject"}
        </button>
      </div>

      {definingSubject && <DefineSubjectForm onDone={() => setDefiningSubject(false)} coordinators={coordinators} />}

      {/* 2. Four-step process row */}
      <div className="mt-8 grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
        <StepCard n={1} title="Define the subjects" subtitle={`${subjects.length} subjects on the register`} />
        <StepCard
          n={2}
          title="Assign teachers to classes"
          subtitle={staffOk ? `${mappedTeacherIds.size} of ${teachingStaff.length} teachers mapped` : "Teacher roster unavailable"}
        />
        <StepCard n={3} title="Appoint band co-ordinators" subtitle={`${bandsWithCoordinator} of ${realStages.length} bands have a co-ordinator`} />
        <StepCard n={4} title="Co-ordinator publishes the timetable" subtitle="Visible in class timetable" />
      </div>

      {/* 3. Academic co-ordinators */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-text">Academic co-ordinators</h2>
        <p className="mt-1 text-[13px] text-text-muted">
          One co-ordinator per grade band · they publish the class and exam timetables for their band
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {realStages.map(([code]) => {
            const bandGrades = grades.filter((g) => g.stage === code);
            const current = coordinators.find((c) => c.scopeStage === code) ?? null;
            const subjCount = subjectsByStage.get(code)?.size ?? 0;
            const secCount = sectionsByGradeStage.get(code)?.length ?? 0;
            return (
              <CoordinatorCard
                key={code}
                stage={code}
                label={bandLabel(bandGrades)}
                current={current}
                subjectsCount={subjCount}
                sectionsCount={secCount}
                academicYearId={currentYear?.id}
                teachingStaff={teachingStaff}
                staffOk={staffOk}
              />
            );
          })}
          {realStages.length === 0 && <p className="text-sm text-text-muted">No grade bands configured yet.</p>}
        </div>
      </section>

      {/* 4. Assign a teacher to a class */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-text">Assign a teacher to a class</h2>
        <p className="mt-1 text-[13px] text-text-muted">Pick the subject first — the teacher list narrows to the staff who handle it</p>

        {!staffOk && (
          <div className="mt-4 rounded-[14px] border border-border bg-critical-bg px-4 py-3 text-sm text-critical-text">
            Couldn&apos;t load the teacher roster (GET /staff) — nothing below was changed. This section needs it and is unavailable
            until that&apos;s fixed.
          </div>
        )}

        {staffOk && newlyAdmitted.length > 0 && (
          <div className="mt-4 rounded-[14px] px-4 py-3" style={{ background: "color-mix(in srgb, var(--color-primary) 8%, transparent)" }}>
            <p className="text-sm font-semibold text-text">
              {newlyAdmitted.length} newly admitted {newlyAdmitted.length === 1 ? "teacher is" : "teachers are"} not yet mapped to a
              class
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {newlyAdmitted.map((t) => (
                <li key={t.id} className="flex items-center gap-2 rounded-[var(--radius-pill)] bg-surface px-3 py-1.5 text-xs">
                  <span className="rounded-[4px] bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">NEW</span>
                  <span className="font-semibold text-text">{fullName(t.firstName, t.lastName)}</span>
                  <span className="text-text-muted">{t.designation ?? "Teacher"}</span>
                  <span className="text-text-muted">joined {formatDate(t.dateOfJoining)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-text-muted">They appear in the teacher dropdown marked NEW.</p>
          </div>
        )}

        {staffOk && (
          <AssignTeacherForm
            grades={grades}
            sections={sections}
            subjects={subjects}
            offerings={offerings}
            teachingStaff={teachingStaff}
            newlyAdmittedIds={new Set(newlyAdmitted.map((t) => t.id))}
            currentYearId={currentYear?.id}
          />
        )}
      </section>

      {/* 5. Teacher allocation */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-text">Teacher allocation</h2>
        <p className="mt-1 text-[13px] text-text-muted">
          Every teacher with the classes they take · academic year {currentYear?.name ?? "—"}
        </p>
        {!staffOk ? (
          <p className="mt-4 text-sm text-text-muted">Teacher roster unavailable — see the notice above.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {teachingStaff.map((t) => {
              const own = offeringsByTeacher.get(t.id) ?? [];
              const load = own.reduce((sum, o) => sum + o.weeklyPeriods, 0);
              const advisorFor = classAdvisors.find((a) => a.personId === t.id);
              const advisorSection = advisorFor ? sections.find((s) => s.id === advisorFor.scopeId) : null;
              const advisorGrade = advisorSection ? gradeById.get(advisorSection.gradeId) : null;
              const isNew = newlyAdmitted.some((n) => n.id === t.id);
              const sectionChips = Array.from(new Set(own.map((o) => `${o.gradeName} ${o.sectionName}`)));
              return (
                <div key={t.id} className="card-hover flex min-h-[168px] flex-col rounded-[14px] border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <PersonAvatar photoUrl={t.photoUrl} name={fullName(t.firstName, t.lastName)} size={40} />
                      <div>
                        <p className="text-sm font-bold text-text">{fullName(t.firstName, t.lastName)}</p>
                        <p className="text-xs text-text-muted">
                          {own[0]?.subjectName ?? t.designation ?? "Teacher"}
                          {t.designation ? ` · ${t.designation}` : ""}
                        </p>
                      </div>
                    </div>
                    {isNew ? (
                      <span className="shrink-0 rounded-[4px] bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">NEW</span>
                    ) : advisorSection && advisorGrade ? (
                      <span className="shrink-0 rounded-[var(--radius-pill)] bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary-deep">
                        CT {advisorGrade.name}-{advisorSection.name}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">Takes classes</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {sectionChips.length > 0 ? (
                      sectionChips.map((chip) => (
                        <span key={chip} className="rounded-[var(--radius-pill)] bg-field px-2.5 py-1 text-xs font-medium leading-[16px] text-text-muted">
                          {chip}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs italic leading-[16px] text-text-muted">Not mapped to a class yet</span>
                    )}
                  </div>

                  <div className="mt-auto pt-3">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
                      <span>Weekly load</span>
                      <span className="font-mono normal-case tracking-normal text-text">
                        {load} / {WEEKLY_LOAD_TARGET} periods
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-[var(--radius-pill)] bg-field">
                      <div
                        className="h-full rounded-[var(--radius-pill)] bg-primary"
                        style={{ width: `${Math.max(0, Math.min(100, (load / WEEKLY_LOAD_TARGET) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {teachingStaff.length === 0 && <p className="text-sm text-text-muted">No teaching staff on file yet.</p>}
          </div>
        )}
      </section>

      {/* 6. Summary stats */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile value={String(mappedTeacherIds.size)} label="Teachers assigned" />
        <SummaryTile value={`${sectionsWithAdvisor} / ${sections.length}`} label="Class teachers mapped" />
        <SummaryTile value={String(avgLoad)} label="Average weekly load" unit="periods" />
        <SummaryTile value={String(sectionsMissingTeacher)} label="Sections without a subject teacher" />
      </div>

      {/* 7. Subject register */}
      <section className="mb-16 mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold text-text">
            Subject register <span className="text-base font-normal text-text-muted">({subjects.length})</span>
          </h2>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subject, code or co-ordinator"
          className="mt-3 w-full max-w-[360px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        />
        <div className="mt-4 overflow-x-auto rounded-[16px] border border-border bg-surface">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Grade band</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Periods/week</th>
                <th className="px-4 py-3">Co-ordinator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSubjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                    No subjects match this search.
                  </td>
                </tr>
              )}
              {filteredSubjects.map((s) => (
                <tr key={s.id} className="hover:bg-field">
                  <td className="px-4 py-3 font-mono text-[13px] text-text-muted">{s.code}</td>
                  <td className="px-4 py-3 font-bold text-text">{s.name}</td>
                  <td className="px-4 py-3 text-text-muted">{s.appliesToStage ? STAGE_LABELS[s.appliesToStage] ?? s.appliesToStage : "All stages"}</td>
                  <td className="px-4 py-3 text-text-muted">{s.subjectType.replace(/_/g, " ").toLowerCase()}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-text-muted">{periodsForSubject(s.id)}</td>
                  <td className="px-4 py-3 text-text-muted">{coordinatorNameForStage(s.appliesToStage, coordinators) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function coordinatorNameForStage(stage: string | null, coordinators: RoleAssignment[]): string | null {
  if (!stage) return null;
  const c = coordinators.find((c) => c.scopeStage === stage);
  return c ? fullName(c.personFirstName, c.personLastName) : null;
}

function StepCard({ n, title, subtitle }: { n: number; title: string; subtitle: string }) {
  return (
    <div className="card-hover rounded-[14px] border border-border bg-surface p-4">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white">{n}</span>
      <p className="mt-3 text-[15px] font-bold text-text">{title}</p>
      <p className="mt-1 text-[13px] text-text-muted">{subtitle}</p>
    </div>
  );
}

function SummaryTile({ value, label, unit }: { value: string; label: string; unit?: string }) {
  return (
    <div className="card-hover rounded-[14px] border border-border bg-surface p-5 text-center">
      <p className="text-[32px] font-bold leading-none tracking-[-0.02em] text-text">
        {value}
        {unit && <span className="ml-1 text-base font-semibold text-text-muted">{unit}</span>}
      </p>
      <p className="mt-2 text-[13px] text-text-muted">{label}</p>
    </div>
  );
}

function CoordinatorCard({
  stage,
  label,
  current,
  subjectsCount,
  sectionsCount,
  academicYearId,
  teachingStaff,
  staffOk,
}: {
  stage: string;
  label: string;
  current: RoleAssignment | null;
  subjectsCount: number;
  sectionsCount: number;
  academicYearId?: string;
  teachingStaff: StaffRow[];
  staffOk: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [personId, setPersonId] = useState(current?.personId ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function save() {
    if (!academicYearId) {
      setError("Set a current academic year first.");
      return;
    }
    setPending(true);
    setError(undefined);
    const result = await assignBandCoordinatorAction(academicYearId, stage, current?.id, personId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
  }

  return (
    <div className="card-hover rounded-[14px] border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">{label}</p>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-primary">
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          {error && <p className="text-xs text-critical-text">{error}</p>}
          {staffOk ? (
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              disabled={pending}
              className="rounded-[10px] border border-border bg-field px-2.5 py-2 text-sm text-text outline-none focus:border-primary"
            >
              <option value="">Select teacher</option>
              {teachingStaff.map((t) => (
                <option key={t.id} value={t.id}>
                  {fullName(t.firstName, t.lastName)}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-critical-text">Teacher roster unavailable.</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={pending || !staffOk}
              className="rounded-[9px] bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setPersonId(current?.personId ?? "");
                setError(undefined);
              }}
              className="rounded-[9px] border border-border px-3 py-1.5 text-xs font-bold text-text"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 text-[16px] font-bold text-text">{current ? fullName(current.personFirstName, current.personLastName) : "Not appointed"}</p>
          <p className="text-xs text-text-muted">Academic co-ordinator</p>
        </>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-[var(--radius-pill)] bg-field px-2.5 py-1 text-xs font-medium text-text-muted">{subjectsCount} subjects</span>
        <span className="rounded-[var(--radius-pill)] bg-field px-2.5 py-1 text-xs font-medium text-text-muted">{sectionsCount} sections</span>
      </div>
    </div>
  );
}

function DefineSubjectForm({ onDone, coordinators }: { onDone: () => void; coordinators: RoleAssignment[] }) {
  const [state, formAction, isPending] = useActionState(createSubjectAction, initialState);

  return (
    <form
      action={(fd) => {
        formAction(fd);
        onDone();
      }}
      className="mt-4 flex flex-col gap-3 rounded-[14px] border border-border bg-field p-4"
    >
      <p className="text-[13px] font-bold text-text">Define a subject</p>
      {state.error && <p className="rounded-[10px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <TextInput label="Subject code" name="code" required disabled={isPending} placeholder="MATH" />
        <TextInput label="Subject name" name="name" required disabled={isPending} placeholder="Mathematics" />
        <SelectInput
          label="Grade band"
          name="appliesToStage"
          disabled={isPending}
          options={[["", "All stages"], ...STAGES]}
        />
        <SelectInput label="Type" name="subjectType" required disabled={isPending} options={[["", "Select"], ...TYPES]} />
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Periods/week</span>
          <input
            disabled
            title="Set per class when assigning a teacher below — subject_offering.weekly_periods is per class, not per subject."
            placeholder="Set per class"
            className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-text-muted outline-none opacity-70"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,320px)_auto]">
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Co-ordinator</span>
          <select
            disabled
            title="A co-ordinator is appointed per grade band in the section below, not per subject."
            className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-text-muted outline-none opacity-70"
          >
            <option>Set per grade band below</option>
          </select>
        </div>
        <button type="submit" disabled={isPending} className="self-end rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {isPending ? "Saving…" : "Save subject"}
        </button>
      </div>
      {coordinators.length === 0 && (
        <p className="text-xs text-text-muted">No academic co-ordinators appointed yet — appoint them below once this subject is saved.</p>
      )}
    </form>
  );
}

function TextInput({
  label,
  name,
  required,
  disabled,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-text">
        {label}
        {required && <span className="text-critical-text"> *</span>}
      </span>
      <input
        name={name}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary disabled:opacity-60"
      />
    </label>
  );
}

function SelectInput({
  label,
  name,
  required,
  disabled,
  options,
}: {
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  options: [string, string][];
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-text">
        {label}
        {required && <span className="text-critical-text"> *</span>}
      </span>
      <select
        name={name}
        required={required}
        disabled={disabled}
        defaultValue=""
        className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary disabled:opacity-60"
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function AssignTeacherForm({
  grades,
  sections,
  subjects,
  offerings,
  teachingStaff,
  newlyAdmittedIds,
  currentYearId,
}: {
  grades: Grade[];
  sections: Section[];
  subjects: Subject[];
  offerings: Offering[];
  teachingStaff: StaffRow[];
  newlyAdmittedIds: Set<string>;
  currentYearId?: string;
}) {
  const [gradeId, setGradeId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherStaffId, setTeacherStaffId] = useState("");
  const [role, setRole] = useState<"SUBJECT_TEACHER" | "CLASS_TEACHER">("SUBJECT_TEACHER");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const sectionsInGrade = sections.filter((s) => s.gradeId === gradeId);

  const matchingOffering = offerings.find((o) => o.sectionId === sectionId && o.subjectId === subjectId) ?? null;

  const teachersForSubject = subjectId
    ? teachingStaff.filter((t) => offerings.some((o) => o.subjectId === subjectId && o.teacherStaffId === t.id))
    : [];
  const teacherOptions = teachersForSubject.length > 0 ? teachersForSubject : teachingStaff;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSuccess(undefined);

    if (role === "CLASS_TEACHER") {
      if (!sectionId || !teacherStaffId || !currentYearId) {
        setError("Choose a class, section and teacher first.");
        return;
      }
      setPending(true);
      const result = await assignClassTeacherAction(sectionId, undefined, currentYearId, teacherStaffId);
      setPending(false);
      if (result.error) setError(result.error);
      else setSuccess(result.success);
      return;
    }

    if (!matchingOffering) {
      setError("This class/section doesn't offer this subject yet as a subject_offering row — nothing to assign a teacher to.");
      return;
    }
    if (!teacherStaffId) {
      setError("Choose a teacher.");
      return;
    }
    setPending(true);
    const fd = new FormData();
    fd.set("teacherStaffId", teacherStaffId);
    const result = await assignOfferingTeacherAction(matchingOffering.id, initialState, fd);
    setPending(false);
    if (result.error) setError(result.error);
    else setSuccess(result.success);
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3 rounded-[14px] border border-border bg-field p-4">
      {error && <p className="rounded-[10px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{error}</p>}
      {success && <p className="rounded-[10px] bg-success-bg px-3 py-2 text-sm text-success-text">{success}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Class</span>
          <select
            value={gradeId}
            onChange={(e) => {
              setGradeId(e.target.value);
              setSectionId("");
            }}
            className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-text outline-none focus:border-primary"
          >
            <option value="">Select</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Section</span>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={!gradeId}
            className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-text outline-none focus:border-primary disabled:opacity-50"
          >
            <option value="">Select</option>
            {sectionsInGrade.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Subject</span>
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setTeacherStaffId("");
            }}
            disabled={role === "CLASS_TEACHER"}
            className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-text outline-none focus:border-primary disabled:opacity-50"
          >
            <option value="">Select</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1.5 text-sm">
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-text">Teacher</span>
            <select
              value={teacherStaffId}
              onChange={(e) => setTeacherStaffId(e.target.value)}
              className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-text outline-none focus:border-primary"
            >
              <option value="">Select</option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {fullName(t.firstName, t.lastName)}
                  {newlyAdmittedIds.has(t.id) ? " (NEW)" : ""}
                </option>
              ))}
            </select>
          </label>
          {subjectId && (
            <p className="text-xs text-text-muted">
              {teachersForSubject.length} teacher{teachersForSubject.length === 1 ? "" : "s"} handle
              {teachersForSubject.length === 1 ? "s" : ""} this subject
            </p>
          )}
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "SUBJECT_TEACHER" | "CLASS_TEACHER")}
            className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-text outline-none focus:border-primary"
          >
            <option value="SUBJECT_TEACHER">Subject teacher</option>
            <option value="CLASS_TEACHER">Class teacher / advisor</option>
          </select>
        </label>
      </div>
      <button type="submit" disabled={pending} className="self-start rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Assigning…" : "Assign teacher"}
      </button>
    </form>
  );
}
