import Link from "next/link";
import { IdCardBackTemplate } from "@/components/idcard/IdCardBackTemplate";
import { IdCardTemplate, type IdCardData } from "@/components/idcard/IdCardTemplate";
import { PrintButton } from "@/components/idcard/PrintButton";
import { apiFetch } from "@/lib/api";
import { fetchAllPages } from "@/lib/fetch-all-pages";

interface StaffRow {
  id: string;
  firstName: string;
  lastName: string | null;
  employeeNo: string;
  designation: string | null;
  photoUrl: string | null;
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

export default async function FacultyIdCardsBulkPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    isTeaching?: string;
    designation?: string;
    gradeId?: string;
    sectionId?: string;
    subjectId?: string;
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
    if (params.isTeaching) query.set("isTeaching", params.isTeaching);
    if (params.designation) query.set("designation", params.designation);
    if (params.isTeaching === "true") {
      if (params.gradeId) query.set("gradeId", params.gradeId);
      if (params.sectionId) query.set("sectionId", params.sectionId);
      if (params.subjectId) query.set("subjectId", params.subjectId);
    }
  }
  const [{ rows: staff, total, truncated }, schoolRes, yearsRes] = await Promise.all([
    fetchAllPages<StaffRow>("/staff", query),
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
          <Link href="/admin/faculty" className="text-sm font-semibold text-primary">
            ‹ Back to faculty
          </Link>
          <p className="mt-1 text-sm text-text-muted">
            {staff.length} ID card{staff.length === 1 ? "" : "s"} in this group
            {truncated && ` (${total} match this filter — stopped at the safety cap; narrow it to print the rest)`}
          </p>
        </div>
        <PrintButton label={`Print ${staff.length} ID cards`} />
      </div>

      {staff.length === 0 ? (
        <p className="text-sm text-text-muted">No staff match this filter.</p>
      ) : (
        <div className="flex flex-wrap gap-6 print:gap-4">
          {staff.map((member) => {
            const card: IdCardData = {
              photoUrl: member.photoUrl,
              name: `${member.firstName} ${member.lastName ?? ""}`.trim(),
              idLabel: "Employee no.",
              idValue: member.employeeNo,
              lineLabel: member.designation ?? "Staff",
              validity: currentYear?.name ?? "—",
            };
            return (
              <div key={member.id} className="flex gap-2 print:gap-1" style={{ breakInside: "avoid" }}>
                <IdCardTemplate schoolName={school.name} schoolAddress={schoolAddress} card={card} />
                <IdCardBackTemplate schoolName={school.name} schoolAddress={schoolAddress} address={member} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
