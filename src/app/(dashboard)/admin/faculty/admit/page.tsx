// Admit faculty -- replaces CreateFacultyModal.tsx as Admin's faculty-admission
// entry point. Pixel-matched to the SIS ADMIN reference design's "Admit
// faculty" screen (Admin Portal.dc.html: facReq/draftFaculty/saveFacultyRec/
// publishFaculty), same reuse-vs-new-column discipline as the sibling Enroll
// Students build (see AdmitFacultyForm.tsx's own header comment for the full
// breakdown) -- Publish drives the exact same real POST /persons + POST
// /staff two-step createFacultyAction already used, just restructured around
// this page's own field set and required-column list.

import { AdmitFacultyForm } from "@/components/faculty/AdmitFacultyForm";
import { apiFetch } from "@/lib/api";
import { getNextEmployeeIdAction } from "../actions";

interface Department {
  id: string;
  name: string;
  status: string;
}

interface Campus {
  id: string;
  name: string;
  status: string;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface StaffRow {
  id: string;
  firstName: string;
  lastName: string | null;
  employeeNo: string;
  designation: string | null;
}

export default async function AdmitFacultyPage() {
  const [employeeNo, departmentsRes, campusesRes, yearsRes, rosterRes] = await Promise.all([
    getNextEmployeeIdAction(),
    apiFetch("/departments"),
    apiFetch("/campuses"),
    apiFetch("/academic-years"),
    apiFetch("/staff?status=ACTIVE&limit=6"),
  ]);

  const departments = departmentsRes.ok
    ? ((await departmentsRes.json()) as { data: Department[] }).data.filter((d) => d.status === "ACTIVE")
    : [];
  const campuses = campusesRes.ok
    ? ((await campusesRes.json()) as { data: Campus[] }).data.filter((c) => c.status === "ACTIVE")
    : [];
  const years = yearsRes.ok ? ((await yearsRes.json()) as { data: AcademicYear[] }).data : [];
  const currentYear = years.find((y) => y.isCurrent) ?? null;
  const roster = rosterRes.ok ? ((await rosterRes.json()) as { data: StaffRow[] }).data : [];
  // Distinguish "GET /staff genuinely returned zero active rows" from "the
  // request itself failed" -- the two look identical if you just check
  // roster.length, and silently collapsing a real 500 (e.g. the schema
  // missing a column this endpoint selects) into "No active faculty on file
  // yet" hides a real backend bug behind a false empty-state.
  const rosterError = !rosterRes.ok;

  return (
    <div className="mx-auto max-w-[1280px]">
      <AdmitFacultyForm
        suggestedEmployeeNo={employeeNo}
        departments={departments}
        campuses={campuses}
        currentAcademicYear={currentYear}
        rosterError={rosterError}
        roster={roster.map((s) => ({
          id: s.id,
          name: [s.firstName, s.lastName].filter(Boolean).join(" "),
          employeeNo: s.employeeNo,
          designation: s.designation,
        }))}
      />
    </div>
  );
}
