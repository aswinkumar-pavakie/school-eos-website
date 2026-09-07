// Principal's Student profile -- read-only oversight, reusing Admin's real data
// (same GET endpoints) and design language. Deliberately excludes every writable
// piece of Admin's own profile page: the editable basic-info form, enrolment
// section-transfer, wallet freeze/unfreeze, add-guardian form, certificate
// upload, the photo editor, and the "mark as left" action -- Principal views,
// never edits. Certificates are excluded entirely for this phase (a document
// upload/delete surface, not core "view a student" oversight).

import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { PersonAvatar } from "@/components/dashboard/PersonAvatar";
import { ProfileHeader, type ProfilePill, type ProfileStat } from "@/components/dashboard/ProfileHeader";
import { StudentFeesSection, type StudentFeeSummary } from "@/components/students/StudentFeesSection";
import { StudentTransportSection } from "@/components/students/StudentTransportSection";
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
  academicYearId: string;
  sectionId: string;
  rollNo: number | null;
  enrolmentType: string;
  outcome: string | null;
  enrolledOn: string;
  status: string;
}

interface GuardianRow {
  id: string;
  firstName: string;
  lastName: string | null;
  relationship: string;
  isPrimaryContact: boolean;
  isAuthorisedPickup: boolean;
  occupation: string | null;
  status: string;
}

interface AcademicYear {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
  gradeId: string;
}

interface Grade {
  id: string;
  name: string;
}

interface StudentWallet {
  status: string;
  balancePaise: string;
}

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "TC_ISSUED" || status === "ARCHIVED") return "critical";
  return "pending";
}

export default async function PrincipalStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [
    studentRes,
    enrolmentsRes,
    guardiansRes,
    yearsRes,
    sectionsRes,
    gradesRes,
    transportRes,
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

  const gradeById = new Map(grades.map((g) => [g.id, g.name] as const));
  const sectionById = new Map(sections.map((s) => [s.id, s] as const));
  const yearById = new Map(academicYears.map((y) => [y.id, y.name] as const));

  return (
    <div className="mx-auto max-w-[960px]">
      <BackLink href="/principal/students" label="Back to students" />
      <ProfileHeader
        photo={
          <PersonAvatar
            photoUrl={student.photoUrl}
            name={`${student.firstName} ${student.lastName ?? ""}`}
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
      />

      {student.status !== "ACTIVE" && student.dateOfLeaving && (
        <p className="mt-3 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm text-critical-text">
          Left on {formatDate(student.dateOfLeaving)}.
        </p>
      )}

      <section className="mt-8 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Profile &amp; address</h2>
        <p className="mt-1 text-[13px] text-text-muted">Admitted {formatDate(student.admissionDate)}.</p>
        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
          {student.bloodGroup && (
            <div>
              <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Blood group</dt>
              <dd className="text-text">{student.bloodGroup}</dd>
            </div>
          )}
          {student.motherTongue && (
            <div>
              <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Mother tongue</dt>
              <dd className="text-text">{student.motherTongue}</dd>
            </div>
          )}
          {student.communityCategory && (
            <div>
              <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Community category</dt>
              <dd className="text-text">{student.communityCategory}</dd>
            </div>
          )}
          {student.stateStudentId && (
            <div>
              <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">State student ID</dt>
              <dd className="text-text">{student.stateStudentId}</dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Address</dt>
            <dd className="text-text">
              {[student.addressLine1, student.addressLine2, student.city, student.state, student.pincode]
                .filter(Boolean)
                .join(", ") || "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Enrolment history</h2>
        {enrolments.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">No enrolment records.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {enrolments.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-field px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-text">
                    {yearById.get(e.academicYearId) ?? "—"} · {gradeById.get(sectionById.get(e.sectionId)?.gradeId ?? "") ?? "—"} · Section {sectionById.get(e.sectionId)?.name ?? "—"}
                    {e.rollNo != null ? ` · Roll ${e.rollNo}` : ""}
                  </p>
                  <p className="text-xs text-text-muted">
                    {e.enrolmentType.replace(/_/g, " ")} · enrolled {formatDate(e.enrolledOn)}
                    {e.outcome ? ` · ${e.outcome.replace(/_/g, " ")}` : ""}
                  </p>
                </div>
                <span className="text-xs font-semibold text-text-muted">{e.status.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Fees</h2>
        <div className="mt-3">
          <StudentFeesSection summary={feeSummary} />
        </div>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Wallet</h2>
        <p className="mt-1 text-[13px] text-text-muted">Canteen / ID-card balance.</p>
        <div className="mt-3">
          {wallet ? (
            <div className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-field px-4 py-3 text-sm">
              <span className="font-mono font-bold text-text">{formatMoneySummary(wallet.balancePaise)}</span>
              <span className="text-xs font-semibold text-text-muted">{wallet.status.replace(/_/g, " ")}</span>
            </div>
          ) : (
            <p className="text-sm text-text-muted">No wallet on file.</p>
          )}
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
        {guardians.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">No guardians on file.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {guardians.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-field px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-text">
                    {g.firstName} {g.lastName ?? ""}
                    {g.isPrimaryContact && <span className="ml-2 text-xs font-normal text-primary">Primary contact</span>}
                  </p>
                  <p className="text-xs text-text-muted">
                    {g.relationship}
                    {g.occupation ? ` · ${g.occupation}` : ""}
                    {g.isAuthorisedPickup ? " · Authorised for pickup" : ""}
                  </p>
                </div>
                <span className="text-xs font-semibold text-text-muted">{g.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
