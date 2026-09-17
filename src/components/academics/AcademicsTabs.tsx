"use client";

import { useState } from "react";
import { AcademicYearsPanel, type AcademicYear } from "./AcademicYearsPanel";
import { GradesPanel, type Grade } from "./GradesPanel";
import { SectionsPanel, type Section } from "./SectionsPanel";
import { SubjectsPanel, type Subject } from "./SubjectsPanel";
import { DepartmentsPanel, type Department } from "./DepartmentsPanel";
import { ClassAdvisorsPanel, type ClassAdvisorAssignment } from "./ClassAdvisorsPanel";
import { CoordinatorsPanel, type CoordinatorAssignment } from "./CoordinatorsPanel";

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

export function AcademicsTabs({
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
  mediums: { id: string; name: string }[];
  classAdvisorAssignments: ClassAdvisorAssignment[];
  coordinatorAssignments: CoordinatorAssignment[];
}) {
  const currentYearId = years.find((y) => y.isCurrent)?.id;
  const [tab, setTab] = useState<Tab>("Academic years");

  return (
    <div>
      {/* Segmented navy-filled active / white-bordered idle tab style, matched to
          Principal's read-only Academic Configuration tab bar for visual parity. */}
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
        {tab === "Academic years" && <AcademicYearsPanel years={years} />}
        {tab === "Grades" && <GradesPanel grades={grades} />}
        {tab === "Sections" && <SectionsPanel sections={sections} years={years} grades={grades} mediums={mediums} />}
        {tab === "Subjects" && <SubjectsPanel subjects={subjects} />}
        {tab === "Departments" && <DepartmentsPanel departments={departments} />}
        {tab === "Class Advisors" && (
          <ClassAdvisorsPanel
            sections={sections}
            grades={grades}
            assignments={classAdvisorAssignments}
            academicYearId={currentYearId}
          />
        )}
        {tab === "Coordinators & Roles" && (
          <CoordinatorsPanel grades={grades} assignments={coordinatorAssignments} academicYearId={currentYearId} />
        )}
      </div>
    </div>
  );
}
