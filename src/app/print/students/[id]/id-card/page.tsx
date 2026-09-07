import Link from "next/link";
import { notFound } from "next/navigation";
import { IdCardBackTemplate } from "@/components/idcard/IdCardBackTemplate";
import { IdCardTemplate, type IdCardData } from "@/components/idcard/IdCardTemplate";
import { PrintButton } from "@/components/idcard/PrintButton";
import { apiFetch } from "@/lib/api";

interface StudentDetail {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  bloodGroup: string | null;
  photoUrl: string | null;
  gradeName: string | null;
  sectionName: string | null;
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

export default async function StudentIdCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [studentRes, schoolRes, yearsRes] = await Promise.all([
    apiFetch(`/students/${id}`),
    apiFetch("/school"),
    apiFetch("/academic-years"),
  ]);

  if (studentRes.status === 404) notFound();
  if (!studentRes.ok) {
    return <p className="p-8 text-center text-text-muted">Couldn&apos;t load this student.</p>;
  }

  const { data: student } = (await studentRes.json()) as { data: StudentDetail };
  const { data: school } = schoolRes.ok
    ? ((await schoolRes.json()) as { data: School })
    : { data: { name: "School", addressLine1: null, city: null } };
  const { data: years } = yearsRes.ok ? ((await yearsRes.json()) as { data: AcademicYear[] }) : { data: [] };
  const currentYear = years.find((y) => y.isCurrent);
  const schoolAddress = [school.addressLine1, school.city].filter(Boolean).join(", ");

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
    <div className="mx-auto max-w-[900px] p-8">
      <div className="print:hidden mb-6 flex items-center justify-between">
        <Link href={`/admin/students/${id}`} className="text-sm font-semibold text-primary">
          ‹ Back to profile
        </Link>
        <PrintButton label="Print ID card" />
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <IdCardTemplate schoolName={school.name} schoolAddress={schoolAddress} card={card} />
        <IdCardBackTemplate schoolName={school.name} schoolAddress={schoolAddress} address={student} />
      </div>
    </div>
  );
}
