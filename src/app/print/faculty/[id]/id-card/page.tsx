import Link from "next/link";
import { notFound } from "next/navigation";
import { IdCardBackTemplate } from "@/components/idcard/IdCardBackTemplate";
import { IdCardTemplate, type IdCardData } from "@/components/idcard/IdCardTemplate";
import { PrintButton } from "@/components/idcard/PrintButton";
import { apiFetch } from "@/lib/api";

interface StaffDetail {
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

export default async function FacultyIdCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [staffRes, schoolRes, yearsRes] = await Promise.all([
    apiFetch(`/staff/${id}`),
    apiFetch("/school"),
    apiFetch("/academic-years"),
  ]);

  if (staffRes.status === 404) notFound();
  if (!staffRes.ok) {
    return <p className="p-8 text-center text-text-muted">Couldn&apos;t load this staff record.</p>;
  }

  const { data: staff } = (await staffRes.json()) as { data: StaffDetail };
  const { data: school } = schoolRes.ok
    ? ((await schoolRes.json()) as { data: School })
    : { data: { name: "School", addressLine1: null, city: null } };
  const { data: years } = yearsRes.ok ? ((await yearsRes.json()) as { data: AcademicYear[] }) : { data: [] };
  const currentYear = years.find((y) => y.isCurrent);
  const schoolAddress = [school.addressLine1, school.city].filter(Boolean).join(", ");

  const card: IdCardData = {
    photoUrl: staff.photoUrl,
    name: `${staff.firstName} ${staff.lastName ?? ""}`.trim(),
    idLabel: "Employee no.",
    idValue: staff.employeeNo,
    lineLabel: staff.designation ?? "Staff",
    validity: currentYear?.name ?? "—",
  };

  return (
    <div className="mx-auto max-w-[900px] p-8">
      <div className="print:hidden mb-6 flex items-center justify-between">
        <Link href={`/admin/faculty/${id}`} className="text-sm font-semibold text-primary">
          ‹ Back to profile
        </Link>
        <PrintButton label="Print ID card" />
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <IdCardTemplate schoolName={school.name} schoolAddress={schoolAddress} card={card} />
        <IdCardBackTemplate schoolName={school.name} schoolAddress={schoolAddress} address={staff} />
      </div>
    </div>
  );
}
