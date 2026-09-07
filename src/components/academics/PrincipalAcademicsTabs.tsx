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
  status: string;
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
  classAdvisorAssignments,
  coordinatorAssignments,
}: {
  years: AcademicYear[];
  grades: Grade[];
  sections: Section[];
  subjects: Subject[];
  departments: Department[];
  mediums: Medium[];
  classAdvisorAssignments: ClassAdvisorAssignment[];
  coordinatorAssignments: CoordinatorAssignment[];
}) {
  const [tab, setTab] = useState<Tab>("Academic years");
  const gradeById = new Map(grades.map((g) => [g.id, g] as const));
  const sectionById = new Map(sections.map((s) => [s.id, s] as const));
  const mediumById = new Map(mediums.map((m) => [m.id, m.name] as const));

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              tab === t ? "bg-primary text-white" : "bg-field text-text-muted hover:bg-border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-[16px] border border-border bg-surface p-[18px]">
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
          <ReadOnlyTable
            emptyLabel="No sections."
            rows={sections}
            columns={[
              { label: "Grade", render: (s) => gradeById.get(s.gradeId)?.name ?? "—" },
              { label: "Section", render: (s) => s.name },
              { label: "Medium", render: (s) => mediumById.get(s.mediumId) ?? "—" },
              { label: "Capacity", render: (s) => (s.capacity != null ? String(s.capacity) : "—") },
              { label: "Status", render: (s) => <StatusPill tone={statusTone(s.status)} label={s.status} /> },
            ]}
          />
        )}

        {tab === "Subjects" && (
          <ReadOnlyTable
            emptyLabel="No subjects."
            rows={subjects}
            columns={[
              { label: "Name", render: (s) => s.name },
              { label: "Code", render: (s) => s.code },
              { label: "Type", render: (s) => SUBJECT_TYPE_LABELS[s.subjectType] ?? s.subjectType },
              { label: "Stage", render: (s) => (s.appliesToStage ? STAGE_LABELS[s.appliesToStage] ?? s.appliesToStage : "All") },
              { label: "Status", render: (s) => <StatusPill tone={statusTone(s.status)} label={s.status} /> },
            ]}
          />
        )}

        {tab === "Departments" && (
          <ReadOnlyTable
            emptyLabel="No departments."
            rows={departments}
            columns={[
              { label: "Name", render: (d) => d.name },
              { label: "Code", render: (d) => d.code ?? "—" },
              { label: "Status", render: (d) => <StatusPill tone={statusTone(d.status)} label={d.status} /> },
            ]}
          />
        )}

        {tab === "Class Advisors" && (
          <ReadOnlyTable
            emptyLabel="No Class Advisors assigned."
            rows={classAdvisorAssignments}
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
        )}

        {tab === "Coordinators & Roles" && (
          <ReadOnlyTable
            emptyLabel="No Coordinators or Sports Faculty assigned."
            rows={coordinatorAssignments}
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
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
            {columns.map((c) => (
              <th key={c.label} className="px-3 py-2.5">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c.label} className="px-3 py-2.5 text-text">
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
