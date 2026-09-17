// Subjects & mapping (Admin) -- a dedicated, richer sibling to Academics' own
// flat "Subjects" tab (SubjectsPanel.tsx, untouched by this page): defining
// subjects, appointing per-grade-band academic co-ordinators, and assigning
// teachers to classes, all in one real-data operational view, matching the
// reference design pixel-for-pixel (see SubjectsMappingClient's own header
// comment for the per-section data-source breakdown). Every fetch below
// already exists and is already used by a sibling page (Principal's own
// read-only /principal/academics/subject-mapping, or Admin's Academics tab
// bar) -- nothing new on the backend except this page/its own actions.ts.

import { apiFetch } from "@/lib/api";
import { SubjectsMappingClient } from "@/components/academics/SubjectsMappingClient";

export default async function SubjectsMappingPage() {
  const [yearsRes, gradesRes, sectionsRes, subjectsRes, offeringsRes, coordRes, advisorsRes] = await Promise.all([
    apiFetch("/academic-years"),
    apiFetch("/grades"),
    apiFetch("/sections"),
    apiFetch("/subjects"),
    apiFetch("/subject-offerings/all"),
    apiFetch("/role-assignments?roleCode=ACADEMIC_COORDINATOR&status=ACTIVE"),
    apiFetch("/role-assignments?roleCode=CLASS_ADVISOR&status=ACTIVE"),
  ]);

  if (!yearsRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Subjects &amp; mapping</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: years } = await yearsRes.json();
  const currentYear = (years as { id: string; name: string; isCurrent: boolean }[]).find((y) => y.isCurrent) ?? null;

  const { data: grades } = gradesRes.ok ? await gradesRes.json() : { data: [] };
  const { data: sections } = sectionsRes.ok ? await sectionsRes.json() : { data: [] };
  const { data: subjects } = subjectsRes.ok ? await subjectsRes.json() : { data: [] };
  const { data: offerings } = offeringsRes.ok ? await offeringsRes.json() : { data: [] };
  const { data: coordinators } = coordRes.ok ? await coordRes.json() : { data: [] };
  const { data: classAdvisors } = advisorsRes.ok ? await advisorsRes.json() : { data: [] };

  // Staff (for the Assign-teacher form, the newly-admitted-teacher banner, and
  // the Teacher allocation cards) is fetched separately and never blocks the
  // rest of the page: `staff.repository.ts`'s shared columns() SQL currently
  // selects several `staff` columns (department_id, blood_group, highest_
  // qualification, ...) added by a pending migration that is documented in
  // query.md as NOT YET RUN against the live DB, so GET /staff genuinely 500s
  // right now. Rather than let one broken fetch fail the whole page, the
  // sections that depend on it degrade honestly (see SubjectsMappingClient's
  // own `staffOk` handling) while Define subject / Co-ordinators / Subject
  // register — none of which need staff.repository's own broken query — still
  // render fully real.
  let staff: {
    id: string;
    firstName: string;
    lastName: string | null;
    employeeNo: string;
    designation: string | null;
    isTeaching: boolean;
    dateOfJoining: string;
    status: string;
    photoUrl: string | null;
  }[] = [];
  let staffOk = true;
  try {
    const staffRes = await apiFetch("/staff?status=ACTIVE&limit=200");
    staffOk = staffRes.ok;
    if (staffRes.ok) {
      staff = (await staffRes.json()).data;
    }
  } catch {
    staffOk = false;
  }

  return (
    <SubjectsMappingClient
      currentYear={currentYear}
      grades={grades}
      sections={sections}
      subjects={subjects}
      offerings={offerings}
      coordinators={coordinators}
      classAdvisors={classAdvisors}
      staff={staff}
      staffOk={staffOk}
    />
  );
}
