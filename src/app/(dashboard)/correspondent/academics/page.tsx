// Principal's Academic Configuration -- read-only oversight, reusing Admin's
// exact real data (years, grades, sections, subjects, departments, mediums,
// Class Advisor / Coordinator role assignments) but rendered through
// PrincipalAcademicsTabs, a plain read-only tab view -- never Admin's writable
// AcademicsTabs, which embeds a create/edit form in every one of its panels.

import { PrincipalAcademicsTabs } from "@/components/academics/PrincipalAcademicsTabs";
import { apiFetch } from "@/lib/api";

export default async function PrincipalAcademicsPage() {
  const [yearsRes, gradesRes, sectionsRes, subjectsRes, departmentsRes, mediumsRes, staffRes] = await Promise.all([
    apiFetch("/academic-years"),
    apiFetch("/grades"),
    apiFetch("/sections"),
    apiFetch("/subjects"),
    apiFetch("/departments"),
    apiFetch("/mediums"),
    // Real Head-of-Department name for the Departments tab (design-reframe
    // addition) -- department only stores hodStaffId, resolved here the same
    // way every other list page resolves a person from its own separate list.
    // StaffQueryDto caps limit at 200 (@Max(200)); 500 got a 400 that this
    // fetch's own .ok check silently turned into an empty staff list below --
    // every HOD showed "—" instead of a name until this was caught and fixed.
    apiFetch("/staff?limit=200"),
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
  const { data: staff } = staffRes.ok
    ? ((await staffRes.json()) as { data: { id: string; firstName: string; lastName: string | null }[] })
    : { data: [] };

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
      {/* page.full per Principal Console.dc.html line 121-126: 38px/700/
          -0.028em/1.08 (was 28px) -- same page-title treatment already
          applied to the Dashboard's own greeting. Title matched to the
          mockup's own nav label ("Academics") per this reframe's wording rule. */}
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Academics</h1>
      <p className="mt-2 text-[15px] text-text-muted">
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
          staff={staff}
          classAdvisorAssignments={classAdvisorAssignments}
          coordinatorAssignments={coordinatorAssignments}
        />
      </div>
    </div>
  );
}
