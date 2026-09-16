// Vice Principal's Student profile -- read-only oversight, but deliberately
// NOT a copy of Principal's own /principal/students/[id] page: a real backend
// @Roles audit (students.controller.ts) found GET :id/fees, :id/wallet and
// :id/transport all inherit the class-level @Roles('ADMIN', 'PRINCIPAL') with
// no VICE_PRINCIPAL override anywhere, unlike :id, :id/enrolments,
// :id/guardians and :id/attendance-summary, which all explicitly include
// VICE_PRINCIPAL. So this page fetches and renders only the sections VP is
// actually authorized for -- Profile & address, Enrolment history, Guardians,
// attendance in the header stat -- and omits Fees/Wallet/Transport entirely
// rather than let them 403 silently.
//
// GET /students/:id itself (students.service.ts#get) does no role-based field
// stripping -- it returns the exact same StudentDetail shape to VICE_PRINCIPAL
// as to PRINCIPAL, so dateOfBirth/gender/languageSubjectChoice are genuine
// parity (a visual gap, not an access boundary) and are fetched/shown here
// the same as Principal's own Profile card.

import { notFound } from "next/navigation";
import { PersonAvatar } from "@/components/dashboard/PersonAvatar";
import {
  StudentProfileView,
  type StudentProfileInfoCard,
  type StudentProfilePill,
  type StudentProfileSection,
  type StudentProfileStat,
} from "@/components/students/StudentProfileView";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface StudentDetail {
  id: string;
  personId: string;
  firstName: string;
  lastName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  admissionNo: string;
  stateStudentId: string | null;
  admissionDate: string;
  motherTongue: string | null;
  languageSubjectChoice: string | null;
  communityCategory: string | null;
  bloodGroup: string | null;
  isHosteller: boolean;
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

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "TC_ISSUED" || status === "ARCHIVED") return "critical";
  return "pending";
}

export default async function VicePrincipalStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [studentRes, enrolmentsRes, guardiansRes, yearsRes, sectionsRes, gradesRes, attendanceRes] =
    await Promise.all([
      apiFetch(`/students/${id}`),
      apiFetch(`/students/${id}/enrolments`),
      apiFetch(`/students/${id}/guardians`),
      apiFetch(`/academic-years`),
      apiFetch(`/sections`),
      apiFetch(`/grades`),
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
  const attendanceSummary = attendanceRes.ok
    ? ((await attendanceRes.json()) as { data: { percentage: number | null } }).data
    : { percentage: null };

  const pills: StudentProfilePill[] = [
    { label: student.admissionNo, tone: "neutral" },
    { label: student.status.replace(/_/g, " "), tone: statusTone(student.status) },
    ...(student.isHosteller ? [{ label: "Hosteller", tone: "primary" as const }] : []),
  ];
  const stats: StudentProfileStat[] = [
    {
      label: "Attendance",
      value: attendanceSummary.percentage !== null ? `${attendanceSummary.percentage}%` : "—",
      hint: "across marked days",
    },
  ];

  const gradeById = new Map(grades.map((g) => [g.id, g.name] as const));
  const sectionById = new Map(sections.map((s) => [s.id, s] as const));
  const yearById = new Map(academicYears.map((y) => [y.id, y.name] as const));

  const infoCards: StudentProfileInfoCard[] = [
    {
      title: "Profile",
      rows: [
        student.dateOfBirth && ["Date of birth", formatDate(student.dateOfBirth)],
        student.gender && ["Gender", student.gender],
        student.bloodGroup && ["Blood group", student.bloodGroup],
        student.languageSubjectChoice && ["Second language", student.languageSubjectChoice],
        student.motherTongue && ["Mother tongue", student.motherTongue],
        student.communityCategory && ["Community category", student.communityCategory],
        student.stateStudentId && ["State student ID", student.stateStudentId],
      ],
    },
    {
      title: "Contact",
      rows: [
        [
          "Address",
          [student.addressLine1, student.addressLine2, student.city, student.state, student.pincode]
            .filter(Boolean)
            .join(", ") || "—",
        ],
      ],
    },
    {
      title: "Academic details",
      note: `Admitted ${formatDate(student.admissionDate)}`,
      rows: [
        ["Admission no", student.admissionNo],
        student.gradeName && ["Class", student.gradeName],
        student.sectionName && ["Section", student.sectionName],
        student.rollNo != null && ["Roll no", String(student.rollNo)],
      ],
    },
  ];

  // VP is not authorized for Fees/Wallet/Transport (see this file's own top
  // comment) -- only Enrolment history and Guardians follow the InfoCard
  // grid, same sections Principal's own page shows for those two.
  const profileSections: StudentProfileSection[] = [
    {
      key: "enrolment",
      title: "Enrolment history",
      content:
        enrolments.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">No enrolment records.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {enrolments.map((e) => (
              <div key={e.id} className="card-hover flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-field px-4 py-3 text-sm">
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
        ),
    },
    {
      key: "guardians",
      title: "Guardians",
      content:
        guardians.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">No guardians on file.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {guardians.map((g) => (
              <div key={g.id} className="card-hover flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-field px-4 py-3 text-sm">
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
        ),
    },
  ];

  return (
    <StudentProfileView
      backHref="/vice-principal/students"
      photo={
        // 188x188 square, matching Teacher/Faculty's own photo footprint
        // exactly (explicit user request for size parity across profiles).
        <PersonAvatar
          photoUrl={student.photoUrl}
          name={`${student.firstName} ${student.lastName ?? ""}`}
          size={188}
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
      leavingNote={
        student.status !== "ACTIVE" &&
        student.dateOfLeaving && (
          <p className="mt-3 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm text-critical-text">
            Left on {formatDate(student.dateOfLeaving)}.
          </p>
        )
      }
      infoCards={infoCards}
      sections={profileSections}
    />
  );
}
