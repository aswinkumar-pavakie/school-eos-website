// Enroll students -- replaces CreateStudentModal.tsx as Admin's only student
// admission entry point. Pixel-matched to the SIS ADMIN reference design's
// "Enroll students" screen, but every field here is wired to a real backend
// column/table (see EnrollStudentForm.tsx's own header comment and this
// session's report for the full reuse-vs-new-column breakdown) -- the
// reference mockup itself has no real backend behind it at all (draftStudent/
// saveStudentRec/publishStudent are pure UI-state simulations with zero
// persistence), so this page's Save/Publish semantics are a real, honest
// reinterpretation of that mockup, not a literal port of its (non-existent)
// data layer.

import { EnrollStudentForm } from "@/components/students/EnrollStudentForm";
import { apiFetch } from "@/lib/api";

interface Grade {
  id: string;
  name: string;
}

interface Section {
  id: string;
  gradeId: string;
  name: string;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface Route {
  id: string;
  name: string;
  code: string | null;
  status: string;
}

interface RouteStop {
  id: string;
  routeId: string;
  stopName: string;
  sequenceNo: number;
}

export default async function EnrollStudentPage() {
  const [admissionNoRes, gradesRes, sectionsRes, yearsRes, routesRes] = await Promise.all([
    apiFetch("/students/next-admission-no"),
    apiFetch("/grades"),
    apiFetch("/sections?status=ACTIVE"),
    apiFetch("/academic-years"),
    apiFetch("/routes"),
  ]);

  const admissionNo = admissionNoRes.ok
    ? ((await admissionNoRes.json()) as { data: { admissionNo: string } }).data.admissionNo
    : "";
  const grades = gradesRes.ok ? ((await gradesRes.json()) as { data: Grade[] }).data : [];
  const sections = sectionsRes.ok ? ((await sectionsRes.json()) as { data: Section[] }).data : [];
  const years = yearsRes.ok ? ((await yearsRes.json()) as { data: AcademicYear[] }).data : [];
  const currentYear = years.find((y) => y.isCurrent) ?? null;
  const routes = routesRes.ok
    ? ((await routesRes.json()) as { data: Route[] }).data.filter((r) => r.status === "ACTIVE")
    : [];

  // Stops are fetched per-route up front (routes are a small, school-owned list,
  // not a paginated dataset) so the Bus route / Boarding stop selects on the
  // client can cascade with zero extra network round trips.
  const stopsByRoute = await Promise.all(
    routes.map(async (r) => {
      const res = await apiFetch(`/routes/${r.id}/stops`);
      const stops = res.ok ? ((await res.json()) as { data: RouteStop[] }).data : [];
      return [r.id, stops] as const;
    }),
  );

  return (
    <div className="mx-auto max-w-[1280px]">
      <EnrollStudentForm
        suggestedAdmissionNo={admissionNo}
        grades={grades}
        sections={sections}
        currentAcademicYear={currentYear}
        routes={routes.map((r) => ({
          id: r.id,
          label: r.code ? `${r.name} (${r.code})` : r.name,
          stops: (stopsByRoute.find(([id]) => id === r.id)?.[1] ?? [])
            .slice()
            .sort((a, b) => a.sequenceNo - b.sequenceNo)
            .map((s) => ({ id: s.id, label: s.stopName })),
        }))}
      />
    </div>
  );
}
