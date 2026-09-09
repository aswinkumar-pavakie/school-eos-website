// Principal's Faculty profile -- read-only oversight, reusing Admin's real
// data (same GET /staff/:id, /staff/:id/timetable, /role-assignments) and
// design language. Deliberately excludes every writable piece of Admin's own
// profile page: the editable basic-info form, the photo editor, the
// "Assign / change" role-grant link, the exit-staff action, and Certificates
// (a document upload/delete surface, excluded for this phase same as Students).
// Timetable (TimetableGrid) is pure display, reused verbatim.

import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { PersonAvatar } from "@/components/dashboard/PersonAvatar";
import { ProfileHeader, type ProfilePill, type ProfileStat } from "@/components/dashboard/ProfileHeader";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TimetableGrid, type TimetableSlot } from "@/components/academics/TimetableGrid";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface RoleAssignment {
  id: string;
  roleCode: string;
  scopeType: string;
  scopeStage: string | null;
  scopeName: string | null;
  gradeName: string | null;
  academicYearName: string | null;
  status: string;
}

const ROLE_LABELS: Record<string, string> = {
  CLASS_ADVISOR: "Class Advisor",
  ACADEMIC_COORDINATOR: "Academic Coordinator",
  SPORTS_FACULTY: "Sports Faculty",
};

const STAGE_LABELS: Record<string, string> = {
  PRE_PRIMARY: "Pre-primary",
  PRIMARY: "Primary",
  MIDDLE: "Middle",
  SECONDARY: "Secondary",
  HIGHER_SECONDARY: "Higher secondary",
};

function describeScope(r: RoleAssignment): string {
  if (r.scopeType === "SECTION") return `${r.gradeName ?? "—"} ${r.scopeName ?? ""}`.trim();
  if (r.scopeType === "GRADE") return r.gradeName ?? r.scopeName ?? "—";
  if (r.scopeType === "STAGE") return (r.scopeStage && STAGE_LABELS[r.scopeStage]) ?? r.scopeStage ?? "—";
  return "Whole school";
}

interface StaffDetail {
  id: string;
  personId: string;
  firstName: string;
  lastName: string | null;
  employeeNo: string;
  designation: string | null;
  teacherCategory: string | null;
  postType: string | null;
  stateTeacherId: string | null;
  isTeaching: boolean;
  dateOfJoining: string;
  dateOfExit: string | null;
  exitReason: string | null;
  experienceYears: number | null;
  status: string;
  photoUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "EXITED") return "critical";
  return "pending";
}

export default async function PrincipalFacultyDetailPage({
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

  const { data: staff } = (await res.json()) as { data: StaffDetail };

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
  const activeAdvisorRole = roleAssignments.find((r) => r.roleCode === "CLASS_ADVISOR" && r.status === "ACTIVE");

  const pills: ProfilePill[] = [
    { label: `ID ${staff.employeeNo}`, tone: "neutral" },
    { label: staff.status.replace(/_/g, " "), tone: statusTone(staff.status) },
    { label: staff.isTeaching ? "Teaching" : "Non-teaching", tone: staff.isTeaching ? "primary" : "neutral" },
    activeAdvisorRole
      ? { label: `Advisor · ${describeScope(activeAdvisorRole)}`, tone: "success" }
      : { label: "No advisory class", tone: "neutral" },
  ];
  const stats: ProfileStat[] = [
    {
      label: "Attendance",
      value: attendanceSummary.percentage !== null ? `${attendanceSummary.percentage}%` : "—",
      hint: "across marked days",
    },
    {
      label: "Experience",
      // Real, admin-entered prior experience -- see Admin's own faculty
      // profile FacultyProfileForm.tsx, not years since date_of_joining
      // (tenure at this school, a different thing).
      value: staff.experienceYears !== null ? `${staff.experienceYears} yrs` : "—",
      hint: staff.experienceYears !== null ? `joined ${formatDate(staff.dateOfJoining)}` : "not yet verified",
    },
  ];

  return (
    <div className="mx-auto max-w-[960px]">
      <BackLink href="/principal/faculty" label="Back to faculty" />
      <ProfileHeader
        photo={
          <PersonAvatar
            photoUrl={staff.photoUrl}
            name={`${staff.firstName} ${staff.lastName ?? ""}`}
            size={112}
            shape="square"
          />
        }
        name={`${staff.firstName} ${staff.lastName ?? ""}`}
        subtitle={staff.designation ?? undefined}
        pills={pills}
        stats={stats}
      />

      {staff.status === "EXITED" && staff.dateOfExit && (
        <p className="mt-3 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm text-critical-text">
          Exited on {formatDate(staff.dateOfExit)}
          {staff.exitReason ? ` · ${staff.exitReason.toLowerCase()}` : ""}.
        </p>
      )}

      <section className="mt-8 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Profile &amp; address</h2>
        <p className="mt-1 text-[13px] text-text-muted">Joined {formatDate(staff.dateOfJoining)}.</p>
        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
          {staff.teacherCategory && (
            <div>
              <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Teacher category</dt>
              <dd className="text-text">{staff.teacherCategory}</dd>
            </div>
          )}
          {staff.postType && (
            <div>
              <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Post type</dt>
              <dd className="text-text">{staff.postType}</dd>
            </div>
          )}
          {staff.stateTeacherId && (
            <div>
              <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">State teacher ID</dt>
              <dd className="text-text">{staff.stateTeacherId}</dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Address</dt>
            <dd className="text-text">
              {[staff.addressLine1, staff.addressLine2, staff.city, staff.state, staff.pincode]
                .filter(Boolean)
                .join(", ") || "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Roles</h2>
        {roleAssignments.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">No Class Advisor / Coordinator roles assigned.</p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-border">
            {roleAssignments.map((r) => {
              const isCurrent = r.status === "ACTIVE";
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <p className="text-[13.5px] font-semibold text-text">{ROLE_LABELS[r.roleCode] ?? r.roleCode}</p>
                    <p className="text-xs text-text-muted">
                      {describeScope(r)}
                      {r.academicYearName ? ` · ${r.academicYearName}` : ""}
                    </p>
                  </div>
                  <StatusPill tone={isCurrent ? "success" : "critical"} label={isCurrent ? "Current" : "Ended"} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Timetable</h2>
        <div className="mt-3">
          <TimetableGrid slots={timetableSlots} showSection />
        </div>
      </section>
    </div>
  );
}
