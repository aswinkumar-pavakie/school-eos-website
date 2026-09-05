// Parent cards -- only reachable via an explicit checkbox selection on the
// Parents list (no group/filter print here, since there's no real "which
// parents" grouping the way there's a standard/section for students or a
// teaching/subject scope for faculty). Speculative, per the request that
// added it -- may be useful for a visitor/gate-pass style card later.

import Link from "next/link";
import { IdCardTemplate, type IdCardData } from "@/components/idcard/IdCardTemplate";
import { PrintButton } from "@/components/idcard/PrintButton";
import { apiFetch } from "@/lib/api";

interface ParentDetail {
  id: string;
  firstName: string;
  lastName: string | null;
  mobile: string | null;
  email: string | null;
  photoUrl: string | null;
  children: { studentFirstName: string; studentLastName: string | null }[];
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

export default async function ParentIdCardsBulkPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const params = await searchParams;
  const ids = params.ids ? params.ids.split(",").filter(Boolean) : [];

  const [parentResults, schoolRes, yearsRes] = await Promise.all([
    Promise.all(ids.map((id) => apiFetch(`/parents/${id}`))),
    apiFetch("/school"),
    apiFetch("/academic-years"),
  ]);

  const parents: ParentDetail[] = (
    await Promise.all(
      parentResults.map((res) => (res.ok ? (res.json() as Promise<{ data: ParentDetail }>) : null)),
    )
  )
    .filter((r): r is { data: ParentDetail } => r !== null)
    .map((r) => r.data);

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
          <Link href="/admin/parents" className="text-sm font-semibold text-primary">
            ‹ Back to parents
          </Link>
          <p className="mt-1 text-sm text-text-muted">{parents.length} card{parents.length === 1 ? "" : "s"} selected</p>
        </div>
        <PrintButton label={`Print ${parents.length} card${parents.length === 1 ? "" : "s"}`} />
      </div>

      {parents.length === 0 ? (
        <p className="text-sm text-text-muted">No parents selected.</p>
      ) : (
        <div className="flex flex-wrap gap-4 print:gap-3">
          {parents.map((parent) => {
            const childrenNames = parent.children
              .map((c) => `${c.studentFirstName} ${c.studentLastName ?? ""}`.trim())
              .join(", ");
            const card: IdCardData = {
              photoUrl: parent.photoUrl,
              name: `${parent.firstName} ${parent.lastName ?? ""}`.trim(),
              idLabel: "Contact",
              idValue: parent.mobile ?? parent.email ?? "—",
              lineLabel: childrenNames ? `Parent of ${childrenNames}` : "Parent",
              validity: currentYear?.name ?? "—",
            };
            return (
              <IdCardTemplate key={parent.id} schoolName={school.name} schoolAddress={schoolAddress} card={card} />
            );
          })}
        </div>
      )}
    </div>
  );
}
