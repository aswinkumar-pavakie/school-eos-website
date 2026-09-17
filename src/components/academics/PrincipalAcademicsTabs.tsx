"use client";

// Principal's read-only Academic Configuration -- same 7 tabs and same real
// data as Admin's AcademicsTabs, but every tab renders plain read-only markup
// instead of the writable panels (AcademicYearsPanel, GradesPanel, etc.), none
// of which are reused here since every one of them embeds its own create/edit
// forms. Principal is leadership/oversight -- it does not get Admin/Academic
// Coordinator configuration permissions just because it can view this data.

import { useState } from "react";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate } from "@/lib/format";

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
}

interface Grade {
  id: string;
  name: string;
  levelNo: number;
  stage: string;
  status: string;
}

interface Section {
  id: string;
  gradeId: string;
  mediumId: string;
  name: string;
  capacity: number | null;
  status: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  subjectType: string;
  appliesToStage: string | null;
  status: string;
}

interface Department {
  id: string;
  name: string;
  code: string | null;
  hodStaffId: string | null;
  status: string;
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string | null;
}

interface Medium {
  id: string;
  name: string;
}

interface ClassAdvisorAssignment {
  id: string;
  personId: string;
  personFirstName: string;
  personLastName: string | null;
  scopeId: string | null;
}

interface CoordinatorAssignment {
  id: string;
  personId: string;
  personFirstName: string;
  personLastName: string | null;
  roleCode: string;
  scopeId: string | null;
  scopeStage: string | null;
  scopeName: string | null;
}

const TABS = [
  "Academic years",
  "Grades",
  "Sections",
  "Subjects",
  "Departments",
  "Class Advisors",
  "Coordinators & Roles",
] as const;
type Tab = (typeof TABS)[number];

const STAGE_LABELS: Record<string, string> = {
  PRE_PRIMARY: "Pre-primary",
  PRIMARY: "Primary",
  MIDDLE: "Middle",
  SECONDARY: "Secondary",
  HIGHER_SECONDARY: "Higher secondary",
};

const SUBJECT_TYPE_LABELS: Record<string, string> = {
  CORE: "Core",
  LANGUAGE: "Language",
  OPTIONAL: "Optional",
  VOCATIONAL: "Vocational",
  CO_SCHOLASTIC: "Co-scholastic",
};

const ROLE_LABELS: Record<string, string> = {
  ACADEMIC_COORDINATOR: "Academic Coordinator",
  SPORTS_FACULTY: "Sports Faculty",
};

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE" || status === "CURRENT") return "success";
  if (status === "CLOSED" || status === "ARCHIVED" || status === "INACTIVE") return "critical";
  return "pending";
}

export function PrincipalAcademicsTabs({
  years,
  grades,
  sections,
  subjects,
  departments,
  mediums,
  staff = [],
  classAdvisorAssignments,
  coordinatorAssignments,
}: {
  years: AcademicYear[];
  grades: Grade[];
  sections: Section[];
  subjects: Subject[];
  departments: Department[];
  mediums: Medium[];
  staff?: StaffMember[];
  classAdvisorAssignments: ClassAdvisorAssignment[];
  coordinatorAssignments: CoordinatorAssignment[];
}) {
  const [tab, setTab] = useState<Tab>("Academic years");
  const gradeById = new Map(grades.map((g) => [g.id, g] as const));
  const sectionById = new Map(sections.map((s) => [s.id, s] as const));
  const mediumById = new Map(mediums.map((m) => [m.id, m.name] as const));
  const staffNameById = new Map(staff.map((s) => [s.id, `${s.firstName} ${s.lastName ?? ""}`.trim()] as const));

  // Real client-side sub-filters, one per tab that genuinely has enough rows
  // to warrant one (Academic years/Grades/Departments stay small lists, no
  // filter added). Every option list comes from the same real data already
  // fetched for that tab -- never a fabricated option.
  const [sectionGradeFilter, setSectionGradeFilter] = useState("");
  const [subjectStageFilter, setSubjectStageFilter] = useState("");
  const [advisorGradeFilter, setAdvisorGradeFilter] = useState("");
  const [coordinatorRoleFilter, setCoordinatorRoleFilter] = useState("");

  const filteredSections = sectionGradeFilter ? sections.filter((s) => s.gradeId === sectionGradeFilter) : sections;
  const filteredSubjects = subjectStageFilter
    ? subjects.filter((s) => (subjectStageFilter === "ALL" ? s.appliesToStage === null : s.appliesToStage === subjectStageFilter))
    : subjects;
  const filteredClassAdvisors = advisorGradeFilter
    ? classAdvisorAssignments.filter((a) => {
        const section = a.scopeId ? sectionById.get(a.scopeId) : undefined;
        return section?.gradeId === advisorGradeFilter;
      })
    : classAdvisorAssignments;
  const filteredCoordinators = coordinatorRoleFilter
    ? coordinatorAssignments.filter((a) => a.roleCode === coordinatorRoleFilter)
    : coordinatorAssignments;

  const filterSelectClass =
    "min-w-[180px] rounded-[10px] border border-border bg-field px-3.5 py-2 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface";

  return (
    <div>
      {/* page.hasTabs per Principal Console.dc.html line 147-158: navy-filled
          active / white-bordered idle segmented buttons, 10px radius, 12/20px
          padding -- was a small pill-tab strip (radius 7, bg-primary active). */}
      <div className="flex flex-wrap gap-2.5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`min-h-11 whitespace-nowrap rounded-[10px] border px-5 py-3 text-sm font-semibold transition-colors ${
              tab === t
                ? "border-[#0f2342] bg-[#0f2342] text-white"
                : "border-border bg-surface font-medium text-text hover:bg-bg"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-[16px] border border-border bg-surface p-[22px]">
        {tab === "Academic years" && (
          <ReadOnlyTable
            emptyLabel="No academic years."
            rows={years}
            columns={[
              { label: "Name", render: (y) => y.name },
              { label: "Period", render: (y) => `${formatDate(y.startDate)} – ${formatDate(y.endDate)}` },
              { label: "Current", render: (y) => (y.isCurrent ? "Yes" : "—") },
              { label: "Status", render: (y) => <StatusPill tone={statusTone(y.status)} label={y.status} /> },
            ]}
          />
        )}

        {tab === "Grades" && (
          <ReadOnlyTable
            emptyLabel="No grades."
            rows={grades}
            columns={[
              { label: "Name", render: (g) => g.name },
              { label: "Level", render: (g) => String(g.levelNo) },
              { label: "Stage", render: (g) => STAGE_LABELS[g.stage] ?? g.stage },
              { label: "Status", render: (g) => <StatusPill tone={statusTone(g.status)} label={g.status} /> },
            ]}
          />
        )}

        {tab === "Sections" && (
          <>
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">Grade</span>
                <select value={sectionGradeFilter} onChange={(e) => setSectionGradeFilter(e.target.value)} className={filterSelectClass}>
                  <option value="">All grades</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <ReadOnlyTable
              emptyLabel="No sections."
              rows={filteredSections}
              columns={[
                { label: "Grade", render: (s) => gradeById.get(s.gradeId)?.name ?? "—" },
                { label: "Section", render: (s) => s.name },
                { label: "Medium", render: (s) => mediumById.get(s.mediumId) ?? "—" },
                { label: "Capacity", render: (s) => (s.capacity != null ? String(s.capacity) : "—") },
                { label: "Status", render: (s) => <StatusPill tone={statusTone(s.status)} label={s.status} /> },
              ]}
            />
          </>
        )}

        {tab === "Subjects" && (
          <>
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">Stage</span>
                <select value={subjectStageFilter} onChange={(e) => setSubjectStageFilter(e.target.value)} className={filterSelectClass}>
                  <option value="">All stages</option>
                  {Object.entries(STAGE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                  <option value="ALL">All (no single stage)</option>
                </select>
              </label>
            </div>
            <ReadOnlyTable
              emptyLabel="No subjects."
              rows={filteredSubjects}
              columns={[
                { label: "Name", render: (s) => s.name },
                { label: "Code", render: (s) => s.code },
                { label: "Type", render: (s) => SUBJECT_TYPE_LABELS[s.subjectType] ?? s.subjectType },
                { label: "Stage", render: (s) => (s.appliesToStage ? STAGE_LABELS[s.appliesToStage] ?? s.appliesToStage : "All") },
                { label: "Status", render: (s) => <StatusPill tone={statusTone(s.status)} label={s.status} /> },
              ]}
            />
          </>
        )}

        {tab === "Departments" && (
          <ReadOnlyTable
            emptyLabel="No departments."
            rows={departments}
            columns={[
              { label: "Name", render: (d) => d.name },
              { label: "Code", render: (d) => d.code ?? "—" },
              { label: "Head of Department", render: (d) => (d.hodStaffId ? staffNameById.get(d.hodStaffId) ?? "—" : "—") },
              { label: "Status", render: (d) => <StatusPill tone={statusTone(d.status)} label={d.status} /> },
            ]}
          />
        )}

        {tab === "Class Advisors" && (
          <>
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">Grade</span>
                <select value={advisorGradeFilter} onChange={(e) => setAdvisorGradeFilter(e.target.value)} className={filterSelectClass}>
                  <option value="">All grades</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <ReadOnlyTable
              emptyLabel="No Class Advisors assigned."
              rows={filteredClassAdvisors}
              columns={[
                { label: "Faculty", render: (a) => `${a.personFirstName} ${a.personLastName ?? ""}` },
                {
                  label: "Section",
                  render: (a) => {
                    const section = a.scopeId ? sectionById.get(a.scopeId) : undefined;
                    if (!section) return "—";
                    return `${gradeById.get(section.gradeId)?.name ?? "—"} ${section.name}`;
                  },
                },
              ]}
            />
          </>
        )}

        {tab === "Coordinators & Roles" && (
          <>
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">Role</span>
                <select value={coordinatorRoleFilter} onChange={(e) => setCoordinatorRoleFilter(e.target.value)} className={filterSelectClass}>
                  <option value="">All roles</option>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <ReadOnlyTable
              emptyLabel="No Coordinators or Sports Faculty assigned."
              rows={filteredCoordinators}
              columns={[
                { label: "Faculty", render: (a) => `${a.personFirstName} ${a.personLastName ?? ""}` },
                { label: "Role", render: (a) => ROLE_LABELS[a.roleCode] ?? a.roleCode },
                {
                  label: "Scope",
                  render: (a) =>
                    a.scopeName ?? (a.scopeStage ? STAGE_LABELS[a.scopeStage] ?? a.scopeStage : "Whole school"),
                },
              ]}
            />
          </>
        )}
      </div>
    </div>
  );
}

function ReadOnlyTable<T extends { id: string }>({
  rows,
  columns,
  emptyLabel,
}: {
  rows: T[];
  columns: { label: string; render: (row: T) => React.ReactNode }[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-text-muted">{emptyLabel}</p>;
  }
  // isTable per Principal Console.dc.html line 353-409: header row filled
  // #f8fafc (not just a border), 11px/600/0.11em th, 15px/14px td padding,
  // hairline row-top divider, hover tint + inset ring -- was a bare
  // border-bottom header with tighter 3px/2.5px padding and no row hover.
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="bg-field">
            {columns.map((c) => (
              <th
                key={c.label}
                className="whitespace-nowrap px-3.5 py-[13px] text-[11px] font-semibold uppercase tracking-[0.11em]"
                style={{ color: "var(--color-text-label, var(--color-text-muted))" }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[#eef1f6] transition-[box-shadow,background] duration-100 hover:bg-[#f6faff] hover:shadow-[inset_0_0_0_1.5px_#1f6feb]">
              {columns.map((c) => (
                <td key={c.label} className="px-3.5 py-[15px] align-middle text-text">
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
