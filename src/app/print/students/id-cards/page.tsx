import Link from "next/link";
import { IdCardBackTemplate } from "@/components/idcard/IdCardBackTemplate";
import { IdCardTemplate, type IdCardData } from "@/components/idcard/IdCardTemplate";
import { PrintButton } from "@/components/idcard/PrintButton";
import { apiFetch } from "@/lib/api";
import { fetchAllPages } from "@/lib/fetch-all-pages";

interface StudentRow {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  bloodGroup: string | null;
  photoUrl: string | null;
  gradeName: string | null;
  sectionName: string | null;
  status: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}

interface School {
  name: string;
  addressLine1: string | null;
  city: string | null;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

export default async function StudentIdCardsBulkPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    gradeId?: string;
    sectionId?: string;
    sectionName?: string;
    ids?: string;
  }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.ids) {
    // An explicit checkbox selection takes precedence over any filter.
    query.set("ids", params.ids);
  } else {
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.sectionId) query.set("sectionId", params.sectionId);
    else if (params.gradeId) query.set("gradeId", params.gradeId);
    else if (params.sectionName) query.set("sectionName", params.sectionName);
  }

  const [{ rows: students, total, truncated }, schoolRes, yearsRes] = await Promise.all([
    fetchAllPages<StudentRow>("/students", query),
    apiFetch("/school"),
    apiFetch("/academic-years"),
  ]);
  const { data: school } = schoolRes.ok
    ? ((await schoolRes.json()) as { data: School })
    : { data: { name: "School", addressLine1: null, city: null } };
  const { data: years } = yearsRes.ok ? ((await yearsRes.json()) as { data: AcademicYear[] }) : { data: [] };
  const currentYear = years.find((y) => y.isCurrent);
  const schoolAddress = [school.addressLine1, school.city].filter(Boolean).join(", ");

  return (
    <div className="p-8">
      <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/students" className="text-sm font-semibold text-primary">
            ‹ Back to students
          </Link>
          <p className="mt-1 text-sm text-text-muted">
            {students.length} ID card{students.length === 1 ? "" : "s"} in this group
            {truncated && ` (${total} match this filter — stopped at the safety cap; narrow it to print the rest)`}
          </p>
        </div>
        <PrintButton label={`Print ${students.length} ID cards`} />
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-text-muted">No students match this filter.</p>
      ) : (
        <div className="flex flex-wrap gap-6 print:gap-4">
          {students.map((student) => {
            const card: IdCardData = {
              photoUrl: student.photoUrl,
              name: `${student.firstName} ${student.lastName ?? ""}`.trim(),
              idLabel: "Admission no.",
              idValue: student.admissionNo,
              lineLabel: student.gradeName ? `${student.gradeName} · Section ${student.sectionName}` : "Not enrolled",
              bloodGroup: student.bloodGroup,
              validity: currentYear?.name ?? "—",
            };
            return (
              <div key={student.id} className="flex gap-2 print:gap-1" style={{ breakInside: "avoid" }}>
                <IdCardTemplate schoolName={school.name} schoolAddress={schoolAddress} card={card} />
                <IdCardBackTemplate schoolName={school.name} schoolAddress={schoolAddress} address={student} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
