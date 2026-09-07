// Principal's Academic Configuration -- read-only oversight, reusing Admin's
// exact real data (years, grades, sections, subjects, departments, mediums,
// Class Advisor / Coordinator role assignments) but rendered through
// PrincipalAcademicsTabs, a plain read-only tab view -- never Admin's writable
// AcademicsTabs, which embeds a create/edit form in every one of its panels.

import { PrincipalAcademicsTabs } from "@/components/academics/PrincipalAcademicsTabs";
import { apiFetch } from "@/lib/api";

export default async function PrincipalAcademicsPage() {
  const [yearsRes, gradesRes, sectionsRes, subjectsRes, departmentsRes, mediumsRes] = await Promise.all([
    apiFetch("/academic-years"),
    apiFetch("/grades"),
    apiFetch("/sections"),
    apiFetch("/subjects"),
    apiFetch("/departments"),
    apiFetch("/mediums"),
  ]);

  if (!yearsRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Academics</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: years } = await yearsRes.json();
  const { data: grades } = gradesRes.ok ? await gradesRes.json() : { data: [] };
  const { data: sections } = sectionsRes.ok ? await sectionsRes.json() : { data: [] };
  const { data: subjects } = subjectsRes.ok ? await subjectsRes.json() : { data: [] };
  const { data: departments } = departmentsRes.ok ? await departmentsRes.json() : { data: [] };
  const { data: mediums } = mediumsRes.ok ? await mediumsRes.json() : { data: [] };

  const [advisorsRes, academicCoordRes, sportsFacultyRes] = await Promise.all([
    apiFetch("/role-assignments?roleCode=CLASS_ADVISOR&status=ACTIVE"),
    apiFetch("/role-assignments?roleCode=ACADEMIC_COORDINATOR&status=ACTIVE"),
    apiFetch("/role-assignments?roleCode=SPORTS_FACULTY&status=ACTIVE"),
  ]);
  const classAdvisorAssignments = advisorsRes.ok ? (await advisorsRes.json()).data : [];
  const academicCoordinators = academicCoordRes.ok ? (await academicCoordRes.json()).data : [];
  const sportsFaculty = sportsFacultyRes.ok ? (await sportsFacultyRes.json()).data : [];
  const coordinatorAssignments = [...academicCoordinators, ...sportsFaculty];

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Academic Configuration</h1>
      <p className="mt-1 text-sm text-text-muted">
        The academic structure every other module builds on — years, grades, sections, subjects, departments.
      </p>
      <div className="mt-6">
        <PrincipalAcademicsTabs
          years={years}
          grades={grades}
          sections={sections}
          subjects={subjects}
          departments={departments}
          mediums={mediums}
          classAdvisorAssignments={classAdvisorAssignments}
          coordinatorAssignments={coordinatorAssignments}
        />
      </div>
    </div>
  );
}
