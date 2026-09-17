// Vice Principal's Faculty profile -- read-only oversight, identical access
// to Principal's own faculty detail page (same GET /staff/:id,
// /staff/:id/timetable, /role-assignments, all already granted to
// VICE_PRINCIPAL in staff.controller.ts's method-level @Roles overrides) and
// the shared TeacherProfileView shell. Deliberately excludes every writable
// piece of Admin's own profile page: the editable basic-info form, the photo
// editor, the "Assign / change" role-grant link, the exit-staff action, and
// Certificates.

import { notFound } from "next/navigation";
import { PersonAvatar } from "@/components/dashboard/PersonAvatar";
import {
  ROLE_LABELS,
  TeacherProfileView,
  type RoleAssignment,
  type TeacherStaffDetail,
} from "@/components/faculty/TeacherProfileView";
import { TimetableSlot } from "@/components/academics/TimetableGrid";
import { apiFetch } from "@/lib/api";

export default async function VicePrincipalFacultyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await apiFetch(`/staff/${id}`);
  if (res.status === 404) notFound();
  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this staff record</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: staff } = (await res.json()) as { data: TeacherStaffDetail & { photoUrl: string | null } };

  const [timetableRes, rolesRes, attendanceRes] = await Promise.all([
    apiFetch(`/staff/${id}/timetable`),
    apiFetch(`/role-assignments?personId=${staff.personId}`),
    apiFetch(`/staff/${id}/attendance-summary`),
  ]);
  const timetableSlots: TimetableSlot[] = timetableRes.ok
    ? ((await timetableRes.json()) as { data: TimetableSlot[] }).data
    : [];
  const allRoleAssignments: RoleAssignment[] = rolesRes.ok
    ? ((await rolesRes.json()) as { data: RoleAssignment[] }).data
    : [];
  const attendanceSummary = attendanceRes.ok
    ? ((await attendanceRes.json()) as { data: { percentage: number | null } }).data
    : { percentage: null };
  const roleAssignments = allRoleAssignments.filter((r) => r.roleCode in ROLE_LABELS);

  return (
    <TeacherProfileView
      backHref="/vice-principal/faculty"
      staff={staff}
      timetableSlots={timetableSlots}
      roleAssignments={roleAssignments}
      attendanceSummary={attendanceSummary}
      photo={
        <PersonAvatar photoUrl={staff.photoUrl} name={`${staff.firstName} ${staff.lastName ?? ""}`} size={188} shape="square" />
      }
    />
  );
}
