// Student profile -- Design Architecture v0.1 module 03: full profile view. Basic
// info, enrolment history + section transfer, guardians, and the (irreversible)
// mark-as-left action. Every section is real data from the backend.

import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { CertificatesSection, type CertificateDocument } from "@/components/dashboard/CertificatesSection";
import { HeaderButtonSlot } from "@/components/dashboard/HeaderButtonPortal";
import { PersonPhotoEditor } from "@/components/dashboard/PersonPhotoEditor";
import { ProfileHeader, type ProfilePill, type ProfileStat } from "@/components/dashboard/ProfileHeader";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { EnrolmentsSection } from "@/components/students/EnrolmentsSection";
import { GuardiansSection } from "@/components/students/GuardiansSection";
import { LeaveStudentDialog } from "@/components/students/LeaveStudentDialog";
import { StudentFeesSection, type StudentFeeSummary } from "@/components/students/StudentFeesSection";
import { StudentProfileForm, STUDENT_SAVE_BUTTON_SLOT } from "@/components/students/StudentProfileForm";
import { StudentTransportSection } from "@/components/students/StudentTransportSection";
import { StudentWalletSection, type StudentWallet } from "@/components/students/StudentWalletSection";
import { apiFetch } from "@/lib/api";
import { formatDate, formatMoneySummary } from "@/lib/format";

interface StudentDetail {
  id: string;
  personId: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  stateStudentId: string | null;
  admissionDate: string;
  mediumId: string | null;
  motherTongue: string | null;
  languageSubjectChoice: string | null;
  communityCategory: string | null;
  isFirstGenLearner: boolean;
  isDifferentlyAbled: boolean;
  supportNeeds: string | null;
  bloodGroup: string | null;
  isHosteller: boolean;
  usesSchoolTransport: boolean;
  commuteMode: string | null;
  bankAccountRef: string | null;
  status: string;
  dateOfLeaving: string | null;
  photoUrl: string | null;
  gradeName: string | null;
  sectionName: string | null;
  rollNo: number | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}

interface EnrolmentRow {
  id: string;
  studentId: string;
  academicYearId: string;
  sectionId: string;
  rollNo: number | null;
  enrolmentType: string;
  outcome: string | null;
  enrolledOn: string;
  status: string;
  remarks: string | null;
}

interface GuardianRow {
  id: string;
  studentId: string;
  personId: string;
  firstName: string;
  lastName: string | null;
  relationship: string;
  isPrimaryContact: boolean;
  accessLevel: string;
  isAuthorisedPickup: boolean;
  occupation: string | null;
  status: string;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface Section {
  id: string;
  name: string;
  academicYearId: string;
  gradeId: string;
}

interface Grade {
  id: string;
  name: string;
}

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "TC_ISSUED" || status === "ARCHIVED") return "critical";
  return "pending";
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [
    studentRes,
    enrolmentsRes,
    guardiansRes,
    yearsRes,
    sectionsRes,
    gradesRes,
    transportRes,
    documentsRes,
    feesRes,
    walletRes,
    attendanceRes,
  ] = await Promise.all([
    apiFetch(`/students/${id}`),
    apiFetch(`/students/${id}/enrolments`),
    apiFetch(`/students/${id}/guardians`),
    apiFetch(`/academic-years`),
    apiFetch(`/sections`),
    apiFetch(`/grades`),
    apiFetch(`/students/${id}/transport`),
    apiFetch(`/documents?ownerObjectType=student&ownerObjectId=${id}&category=STUDENT_ACADEMIC`),
    apiFetch(`/students/${id}/fees`),
    apiFetch(`/students/${id}/wallet`),
    apiFetch(`/students/${id}/attendance-summary`),
  ]);

  if (studentRes.status === 404) notFound();
  if (!studentRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this student</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: student } = (await studentRes.json()) as { data: StudentDetail };
  const { data: enrolments } = enrolmentsRes.ok
    ? ((await enrolmentsRes.json()) as { data: EnrolmentRow[] })
    : { data: [] };
  const { data: guardians } = guardiansRes.ok
    ? ((await guardiansRes.json()) as { data: GuardianRow[] })
    : { data: [] };
  const { data: academicYears } = yearsRes.ok
    ? ((await yearsRes.json()) as { data: AcademicYear[] })
    : { data: [] };
  const { data: sections } = sectionsRes.ok ? ((await sectionsRes.json()) as { data: Section[] }) : { data: [] };
  const { data: grades } = gradesRes.ok ? ((await gradesRes.json()) as { data: Grade[] }) : { data: [] };
  const { data: transportAllocations } = transportRes.ok
    ? ((await transportRes.json()) as {
        data: {
          id: string;
          direction: string;
          feeSlab: string | null;
          validFrom: string;
          status: string;
          stopName: string;
          routeName: string;
          vehicleRegistrationNo: string | null;
          driverName: string | null;
        }[];
      })
    : { data: [] };
  const { data: documents } = documentsRes.ok
    ? ((await documentsRes.json()) as { data: CertificateDocument[] })
    : { data: [] };
  const feeSummary: StudentFeeSummary = feesRes.ok
    ? ((await feesRes.json()) as { data: StudentFeeSummary }).data
    : {
        assignment: null,
        demands: [],
        payments: [],
        totalDuePaise: "0",
        totalPaidPaise: "0",
        totalPendingPaise: "0",
        totalOverduePaise: "0",
        overallStatus: "NO_ASSIGNMENT",
      };
  const wallet: StudentWallet | null = walletRes.ok
    ? ((await walletRes.json()) as { data: StudentWallet | null }).data
    : null;
  const attendanceSummary = attendanceRes.ok
    ? ((await attendanceRes.json()) as { data: { percentage: number | null } }).data
    : { percentage: null };

  const isActive = student.status === "ACTIVE";

  const feesStatusLabel: Record<StudentFeeSummary["overallStatus"], string> = {
    PAID: "Paid",
    PARTIAL: "Partially paid",
    PENDING: "Payment pending",
    OVERDUE: "Overdue",
    NO_ASSIGNMENT: "Not assigned",
  };

  const pills: ProfilePill[] = [
    { label: student.admissionNo, tone: "neutral" },
    { label: student.status.replace(/_/g, " "), tone: statusTone(student.status) },
    ...(student.isHosteller ? [{ label: "Hosteller", tone: "primary" as const }] : []),
    ...(wallet?.status === "FROZEN" ? [{ label: "Wallet frozen", tone: "critical" as const }] : []),
  ];
  const stats: ProfileStat[] = [
    {
      label: "Attendance",
      value: attendanceSummary.percentage !== null ? `${attendanceSummary.percentage}%` : "—",
      hint: "across marked days",
    },
    {
      label: "Fees",
      value: feesStatusLabel[feeSummary.overallStatus],
      hint: Number(feeSummary.totalDuePaise) > 0 ? formatMoneySummary(feeSummary.totalDuePaise) + " due" : undefined,
    },
  ];

  return (
    <div className="mx-auto max-w-[960px]">
      <BackLink href="/admin/students" label="Back to students" />
      <ProfileHeader
        photo={
          <PersonPhotoEditor
            personId={student.personId}
            photoUrl={student.photoUrl}
            name={`${student.firstName} ${student.lastName ?? ""}`}
            revalidatePaths={["/admin/students", `/admin/students/${student.id}`]}
            size={112}
            shape="square"
          />
        }
        name={`${student.firstName} ${student.lastName ?? ""}`}
        subtitle={
          student.gradeName
            ? `${student.gradeName} · Section ${student.sectionName}${student.rollNo != null ? ` · Roll ${student.rollNo}` : ""}`
            : "Not enrolled in a class yet"
        }
        pills={pills}
        stats={stats}
        actions={
          <>
            <Link
              href={`/print/students/${student.id}/id-card`}
              className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-semibold text-text hover:bg-bg"
            >
              Print ID card
            </Link>
            {isActive && <LeaveStudentDialog studentId={student.id} />}
          </>
        }
        belowActions={<HeaderButtonSlot id={STUDENT_SAVE_BUTTON_SLOT} />}
      />

      {!isActive && student.dateOfLeaving && (
        <p className="mt-3 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm text-critical-text">
          Left on {formatDate(student.dateOfLeaving)}.
        </p>
      )}

      <section className="mt-8 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Profile &amp; address</h2>
        <p className="mt-1 text-[13px] text-text-muted">
          Admitted {formatDate(student.admissionDate)}. Name, mobile and email aren&apos;t editable here.
        </p>
        <StudentProfileForm
          student={student}
          address={{
            addressLine1: student.addressLine1,
            addressLine2: student.addressLine2,
            city: student.city,
            state: student.state,
            pincode: student.pincode,
          }}
        />
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Enrolment history</h2>
        <EnrolmentsSection
          studentId={student.id}
          enrolments={enrolments}
          academicYears={academicYears}
          sections={sections}
          grades={grades}
        />
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Fees</h2>
        <div className="mt-3">
          <StudentFeesSection summary={feeSummary} />
        </div>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Wallet</h2>
        <p className="mt-1 text-[13px] text-text-muted">
          Canteen / ID-card balance. Freeze it if the card is lost so the balance can&apos;t be spent.
        </p>
        <div className="mt-3">
          <StudentWalletSection studentId={student.id} wallet={wallet} />
        </div>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Transport</h2>
        <StudentTransportSection
          usesSchoolTransport={student.usesSchoolTransport}
          commuteMode={student.commuteMode}
          allocations={transportAllocations}
        />
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Guardians</h2>
        <GuardiansSection studentId={student.id} guardians={guardians} />
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Certificates</h2>
        <p className="mt-1 text-[13px] text-text-muted">
          Certificates received at admission or any time after — Transfer Certificate, Birth Certificate, and the
          like.
        </p>
        <div className="mt-3">
          <CertificatesSection
            ownerObjectType="student"
            ownerObjectId={student.id}
            category="STUDENT_ACADEMIC"
            documents={documents}
            revalidatePaths={[`/admin/students/${student.id}`]}
          />
        </div>
      </section>
    </div>
  );
}
