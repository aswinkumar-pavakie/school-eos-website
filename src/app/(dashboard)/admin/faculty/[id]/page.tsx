// Faculty profile -- Design Architecture v0.1 module 05. Basic info (edit form) and
// the (irreversible) mark-as-exited action. Every field is real data from GET
// /staff/:id (already joined with person's firstName/lastName). Visual shell
// is the shared TeacherProfileView (pixel-matches Principal Console's own
// teacherPage() mockup); every write action Admin already had (edit form,
// photo editor, exit dialog, Assign/change roles link, Login & Security,
// editable Subjects, Certificates) is unchanged, just passed in as a slot.

import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificatesSection, type CertificateDocument } from "@/components/dashboard/CertificatesSection";
import { HeaderButtonSlot } from "@/components/dashboard/HeaderButtonPortal";
import { PersonPhotoEditor } from "@/components/dashboard/PersonPhotoEditor";
import { ExitStaffDialog } from "@/components/faculty/ExitStaffDialog";
import { LinkedPhonesSection, type LinkedPhoneRow } from "@/components/faculty/LinkedPhonesSection";
import { FacultyLoginSecuritySection } from "@/components/faculty/FacultyLoginSecuritySection";
import { FacultyProfileForm, FACULTY_SAVE_BUTTON_SLOT } from "@/components/faculty/FacultyProfileForm";
import { FacultySubjectsSection, type TaughtOffering } from "@/components/faculty/FacultySubjectsSection";
import {
  ROLE_LABELS,
  TeacherProfileView,
  type RoleAssignment,
  type TeacherStaffDetail,
} from "@/components/faculty/TeacherProfileView";
import { TimetableSlot } from "@/components/academics/TimetableGrid";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { ClassLoginList, ClassLoginSeat } from "@/lib/class-login-types";

interface LoginIdentifier {
  identifierType: string;
  value: string;
  isVerified: boolean;
}

interface StaffDetail extends TeacherStaffDetail {
  photoUrl: string | null;
  loginIdentifiers: LoginIdentifier[];
  resetAllowanceUsed: boolean;
  adminVisiblePassword: string | null;
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

  const [timetableRes, rolesRes, documentsRes, attendanceRes, subjectOfferingsRes, gradesRes, sectionsRes, classLoginsRes, linkedPhonesRes] =
    await Promise.all([
      apiFetch(`/staff/${id}/timetable`),
      apiFetch(`/role-assignments?personId=${staff.personId}`),
      apiFetch(`/documents?ownerObjectType=staff&ownerObjectId=${id}&category=STAFF_HR`),
      apiFetch(`/staff/${id}/attendance-summary`),
      apiFetch(`/subject-offerings/by-teacher/${id}`),
      apiFetch("/grades"),
      apiFetch("/sections?status=ACTIVE"),
      apiFetch("/class-teacher-logins"),
      apiFetch(`/persons/${staff.personId}/linked-accounts`),
    ]);
  const linkedPhones: LinkedPhoneRow[] = linkedPhonesRes.ok
    ? ((await linkedPhonesRes.json()) as { data: LinkedPhoneRow[] }).data
    : [];
  // The class logins this teacher currently holds (read-only here; changed from
  // Academics -> Class teacher logins).
  const heldSeats: ClassLoginSeat[] = classLoginsRes.ok
    ? ((await classLoginsRes.json()) as { data: ClassLoginList }).data.seats.filter(
        (s) => s.holderPersonId === staff.personId,
      )
    : [];
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
  const taughtOfferings: TaughtOffering[] = subjectOfferingsRes.ok
    ? ((await subjectOfferingsRes.json()) as { data: TaughtOffering[] }).data
    : [];
  const grades: { id: string; name: string }[] = gradesRes.ok ? ((await gradesRes.json()) as { data: { id: string; name: string }[] }).data : [];
  const sections: { id: string; gradeId: string; name: string }[] = sectionsRes.ok
    ? ((await sectionsRes.json()) as { data: { id: string; gradeId: string; name: string }[] }).data
    : [];
  // Only the "extra responsibility" roles belong in the Roles section -- the
  // base FACULTY login role (and anything else) isn't shown here.
  const roleAssignments = allRoleAssignments.filter((r) => r.roleCode in ROLE_LABELS);

  return (
    <TeacherProfileView
      backHref="/admin/faculty"
      staff={staff}
      timetableSlots={timetableSlots}
      roleAssignments={roleAssignments}
      attendanceSummary={attendanceSummary}
      photo={
        <PersonPhotoEditor
          personId={staff.personId}
          photoUrl={staff.photoUrl}
          name={`${staff.firstName} ${staff.lastName ?? ""}`}
          revalidatePaths={["/admin/faculty", `/admin/faculty/${staff.id}`]}
          size={188}
          shape="square"
        />
      }
      headerActions={
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
      belowHeaderActions={<HeaderButtonSlot id={FACULTY_SAVE_BUTTON_SLOT} />}
      rolesAction={
        <Link href="/admin/academics" className="text-[13px] font-semibold text-primary">
          Assign / change
        </Link>
      }
      extraSections={
        <>
          {heldSeats.length > 0 && (
            <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Class teacher login</h2>
                <Link href="/admin/academics" className="text-[13px] font-semibold text-primary">
                  Change in Academics
                </Link>
              </div>
              <ul className="mt-3 divide-y divide-border text-sm">
                {heldSeats.map((s) => (
                  <li key={s.loginPersonId} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span className="font-semibold text-text">
                      {s.gradeName}-{s.sectionName}
                    </span>
                    <span className="font-mono text-[13px] text-text-muted">{s.email}</span>
                    <span className="text-text-muted">{s.studentCount} students</span>
                  </li>
                ))}
              </ul>
              {isActive && (
                <p className="mt-2 text-[13px] text-text-muted">
                  Marking this teacher as exited releases the class and renews its shared password.
                </p>
              )}
            </section>
          )}
          {heldSeats.length > 0 && <LinkedPhonesSection personId={staff.personId} phones={linkedPhones} />}
          <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Edit profile &amp; address</h2>
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
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Login &amp; security</h2>
            <p className="mt-1 text-[13px] text-text-muted">
              The faculty member&apos;s own login, distinct from the contact details above.
            </p>
            <div className="mt-3">
              <FacultyLoginSecuritySection
                staffId={staff.id}
                personId={staff.personId}
                personName={`${staff.firstName} ${staff.lastName ?? ""}`.trim()}
                loginIdentifiers={staff.loginIdentifiers}
                resetAllowanceUsed={staff.resetAllowanceUsed}
                adminVisiblePassword={staff.adminVisiblePassword}
              />
            </div>
          </section>

          {staff.isTeaching && (
            <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Subjects</h2>
              <FacultySubjectsSection
                staffId={staff.id}
                facultyDetailPath={`/admin/faculty/${staff.id}`}
                taught={taughtOfferings}
                grades={grades}
                sections={sections}
              />
            </section>
          )}

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
        </>
      }
    />
  );
}
