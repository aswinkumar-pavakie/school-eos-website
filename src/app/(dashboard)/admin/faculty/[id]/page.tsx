// Faculty profile -- Design Architecture v0.1 module 05. Basic info (edit form) and
// the (irreversible) mark-as-exited action. Every field is real data from GET
// /staff/:id (already joined with person's firstName/lastName).

import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { CertificatesSection, type CertificateDocument } from "@/components/dashboard/CertificatesSection";
import { HeaderButtonSlot } from "@/components/dashboard/HeaderButtonPortal";
import { PersonPhotoEditor } from "@/components/dashboard/PersonPhotoEditor";
import { ProfileHeader, type ProfilePill, type ProfileStat } from "@/components/dashboard/ProfileHeader";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { ExitStaffDialog } from "@/components/faculty/ExitStaffDialog";
import { FacultyProfileForm, FACULTY_SAVE_BUTTON_SLOT } from "@/components/faculty/FacultyProfileForm";
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

/** "Standard 7 A" for a section-scoped role, "Standard 7" for a grade-scoped
 * one, "Primary" for a stage-scoped one, "Whole school" otherwise. */
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

export default async function FacultyDetailPage({
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
  const isActive = staff.status !== "EXITED";

  const [timetableRes, rolesRes, documentsRes, attendanceRes] = await Promise.all([
    apiFetch(`/staff/${id}/timetable`),
    apiFetch(`/role-assignments?personId=${staff.personId}`),
    apiFetch(`/documents?ownerObjectType=staff&ownerObjectId=${id}&category=STAFF_HR`),
    apiFetch(`/staff/${id}/attendance-summary`),
  ]);
  const timetableSlots: TimetableSlot[] = timetableRes.ok
    ? ((await timetableRes.json()) as { data: TimetableSlot[] }).data
    : [];
  const allRoleAssignments: RoleAssignment[] = rolesRes.ok
    ? ((await rolesRes.json()) as { data: RoleAssignment[] }).data
    : [];
  const { data: documents } = documentsRes.ok
    ? ((await documentsRes.json()) as { data: CertificateDocument[] })
    : { data: [] };
  const attendanceSummary = attendanceRes.ok
    ? ((await attendanceRes.json()) as { data: { percentage: number | null } }).data
    : { percentage: null };
  // Only the "extra responsibility" roles belong in this section -- the base
  // FACULTY login role (and anything else) isn't shown here.
  const roleAssignments = allRoleAssignments.filter((r) => r.roleCode in ROLE_LABELS);
  const activeAdvisorRole = roleAssignments.find((r) => r.roleCode === "CLASS_ADVISOR" && r.status === "ACTIVE");

  const yearsOfExperience = Math.max(
    0,
    Math.floor((Date.now() - new Date(staff.dateOfJoining).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
  );

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
    { label: "Experience", value: `${yearsOfExperience} yrs`, hint: `joined ${formatDate(staff.dateOfJoining)}` },
  ];

  return (
    <div className="mx-auto max-w-[960px]">
      <BackLink href="/admin/faculty" label="Back to faculty" />
      <ProfileHeader
        photo={
          <PersonPhotoEditor
            personId={staff.personId}
            photoUrl={staff.photoUrl}
            name={`${staff.firstName} ${staff.lastName ?? ""}`}
            revalidatePaths={["/admin/faculty", `/admin/faculty/${staff.id}`]}
            size={112}
            shape="square"
          />
        }
        name={`${staff.firstName} ${staff.lastName ?? ""}`}
        subtitle={staff.designation ?? undefined}
        pills={pills}
        stats={stats}
        actions={
          <>
            <Link
              href={`/print/faculty/${staff.id}/id-card`}
              className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-semibold text-text hover:bg-bg"
            >
              Print ID card
            </Link>
            {isActive && <ExitStaffDialog staffId={staff.id} />}
          </>
        }
        belowActions={<HeaderButtonSlot id={FACULTY_SAVE_BUTTON_SLOT} />}
      />

      {!isActive && staff.dateOfExit && (
        <p className="mt-3 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm text-critical-text">
          Exited on {formatDate(staff.dateOfExit)}
          {staff.exitReason ? ` · ${staff.exitReason.toLowerCase()}` : ""}.
        </p>
      )}

      <section className="mt-8 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Profile &amp; address</h2>
        <p className="mt-1 text-[13px] text-text-muted">
          Joined {formatDate(staff.dateOfJoining)}. Name, mobile and email aren&apos;t editable here.
        </p>
        <FacultyProfileForm
          staff={staff}
          address={{
            addressLine1: staff.addressLine1,
            addressLine2: staff.addressLine2,
            city: staff.city,
            state: staff.state,
            pincode: staff.pincode,
          }}
        />
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Roles</h2>
          <Link href="/admin/academics" className="text-[13px] font-semibold text-primary">
            Assign / change
          </Link>
        </div>
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
                  <StatusPill
                    tone={isCurrent ? "success" : "critical"}
                    label={isCurrent ? "Current" : "Ended"}
                  />
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

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Certificates</h2>
        <p className="mt-1 text-[13px] text-text-muted">Degree certificates, service records, and the like.</p>
        <div className="mt-3">
          <CertificatesSection
            ownerObjectType="staff"
            ownerObjectId={staff.id}
            category="STAFF_HR"
            documents={documents}
            revalidatePaths={[`/admin/faculty/${staff.id}`]}
          />
        </div>
      </section>
    </div>
  );
}
