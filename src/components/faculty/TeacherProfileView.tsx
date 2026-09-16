import type { ReactNode } from "react";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TimetableGrid, type TimetableSlot } from "@/components/academics/TimetableGrid";
import { PrintButton } from "@/components/idcard/PrintButton";
import { formatDate } from "@/lib/format";

// Shared, PURE presentational shell for the Teacher/Faculty profile DETAIL
// view -- pixel-matches Principal Console.dc.html's own teacherPage(idx)
// (hero card with photo/name/chips/stat tiles, then label-value info cards)
// for Principal, Vice Principal and Admin alike. Every field below is either
// a real column already on GET /staff/:id, or a real aggregate derived from
// data those three roles already fetch (timetable slots, role assignments,
// attendance summary) -- NOTHING here is fabricated.
//
// Two mockup fields have NO real backing anywhere in this schema and are
// honestly dropped rather than invented:
//  - "Syllabus coverage %" -- no syllabus-tracking table/column exists for
//    staff (checked information_schema + grepped every module for
//    "syllabus"). Replaced with a real 4th tile ("Subjects taught", from the
//    teacher's own timetable slots).
//  - The mockup's "Academic details" (qualification/specialization/
//    university/graduation year) and "Professional information" (expertise/
//    certifications/workshops/achievements) cards -- no such columns exist on
//    staff or person anywhere. Both cards are omitted outright rather than
//    shown with fabricated values; see the report this component shipped
//    with for the full list.
//
// Access/actions are UNCHANGED from before this restyle -- this component
// takes zero write behaviour of its own. Every button/form a caller wants
// (Admin's Print ID card, Exit staff, Assign/change roles link, the
// Login & Security section, the editable Subjects section, Certificates,
// the profile edit form) is passed in as a slot, so Principal/VP callers
// that pass none of those simply don't render them, exactly as today.

export interface RoleAssignment {
  id: string;
  roleCode: string;
  scopeType: string;
  scopeStage: string | null;
  scopeName: string | null;
  gradeName: string | null;
  academicYearName: string | null;
  status: string;
}

export const ROLE_LABELS: Record<string, string> = {
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
export function describeScope(r: RoleAssignment): string {
  if (r.scopeType === "SECTION") return `${r.gradeName ?? "—"} ${r.scopeName ?? ""}`.trim();
  if (r.scopeType === "GRADE") return r.gradeName ?? r.scopeName ?? "—";
  if (r.scopeType === "STAGE") return (r.scopeStage && STAGE_LABELS[r.scopeStage]) ?? r.scopeStage ?? "—";
  return "Whole school";
}

export function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "EXITED") return "critical";
  return "pending";
}

export interface TeacherStaffDetail {
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
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  email: string | null;
  mobile: string | null;
  gender: string | null;
}

function InfoCard({ title, note, rows }: { title: string; note?: string; rows: [string, string][] }) {
  if (rows.length === 0) return null;
  return (
    <section className="rounded-[16px] border border-border bg-surface p-[18px]">
      <h2 className="text-[15px] font-extrabold leading-[20px] text-text">{title}</h2>
      {note && <p className="mt-1 text-[13px] text-text-muted">{note}</p>}
      <div className={note ? "mt-3 flex flex-col" : "mt-2 flex flex-col"}>
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-[18px] border-b border-border py-[11px] last:border-b-0"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">{label}</span>
            <span className="text-right text-sm font-semibold text-text">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TeacherProfileView({
  backHref,
  staff,
  timetableSlots,
  roleAssignments,
  attendanceSummary,
  photo,
  headerActions,
  belowHeaderActions,
  rolesAction,
  extraSections,
}: {
  backHref: string;
  staff: TeacherStaffDetail;
  timetableSlots: TimetableSlot[];
  /** Already filtered to the extra-responsibility roles (CLASS_ADVISOR /
   * ACADEMIC_COORDINATOR / SPORTS_FACULTY) -- same filter every caller
   * already applied before this shell existed. */
  roleAssignments: RoleAssignment[];
  attendanceSummary: { percentage: number | null };
  /** PersonAvatar (Principal/VP, read-only) or PersonPhotoEditor (Admin,
   * writable) -- whichever the caller already used. */
  photo: ReactNode;
  /** Admin's real write actions (Print ID card, Exit staff dialog) -- absent
   * for Principal/VP, exactly as before. */
  headerActions?: ReactNode;
  /** The HeaderButtonSlot portal target for FacultyProfileForm's own Save
   * button (Admin only). */
  belowHeaderActions?: ReactNode;
  /** Admin's "Assign / change" roles link, next to the Roles heading. */
  rolesAction?: ReactNode;
  /** Admin-only extra sections (Login & Security, editable Subjects,
   * Certificates) rendered below the shared Roles/Timetable sections. */
  extraSections?: ReactNode;
}) {
  const fullName = `${staff.firstName} ${staff.lastName ?? ""}`.trim();
  const activeAdvisorRole = roleAssignments.find((r) => r.roleCode === "CLASS_ADVISOR" && r.status === "ACTIVE");

  const subjectNames = [...new Set(timetableSlots.map((s) => s.subjectName))];
  const sectionKeys = [...new Set(timetableSlots.map((s) => `${s.gradeName} ${s.sectionName}`))];
  const primarySubject = subjectNames[0] ?? null;
  const academicYear = activeAdvisorRole?.academicYearName ?? roleAssignments[0]?.academicYearName ?? null;

  type Pill = { label: string; tone: "primary" | "neutral" | "success" };
  const pills: Pill[] = (
    [
      activeAdvisorRole ? { label: `Class teacher · ${describeScope(activeAdvisorRole)}`, tone: "primary" } : null,
      primarySubject ? { label: primarySubject, tone: "neutral" } : null,
      sectionKeys.length > 0
        ? { label: sectionKeys.length === 1 ? sectionKeys[0] : `${sectionKeys.length} sections`, tone: "neutral" }
        : null,
    ] as (Pill | null)[]
  ).filter((p): p is Pill => p !== null);

  const PILL_TONE_CLASSES = {
    primary: "bg-primary/10 text-primary",
    neutral: "bg-field text-text-muted",
    success: "bg-success-bg text-success-text",
  } as const;

  const tiles = [
    {
      label: "Periods per week",
      value: String(timetableSlots.length),
      note: sectionKeys.length > 0 ? `Across ${sectionKeys.length} section${sectionKeys.length === 1 ? "" : "s"}` : undefined,
    },
    {
      label: "Subjects taught",
      value: String(subjectNames.length),
      note: subjectNames.length > 0 ? subjectNames.slice(0, 2).join(", ") + (subjectNames.length > 2 ? "…" : "") : undefined,
    },
    {
      label: "Experience",
      value: staff.experienceYears !== null ? `${staff.experienceYears} yrs` : "—",
      note: `Joined ${formatDate(staff.dateOfJoining)}`,
    },
    {
      label: "Staff attendance",
      value: attendanceSummary.percentage !== null ? `${attendanceSummary.percentage}%` : "—",
      note: "Across marked days",
    },
  ];

  const profileRows: [string, string][] = [
    ["Full name", fullName],
    ["Employee ID", staff.employeeNo],
    ...(staff.designation ? ([["Designation", staff.designation]] as [string, string][]) : []),
    ...(staff.gender ? ([["Gender", staff.gender]] as [string, string][]) : []),
    ...(staff.teacherCategory ? ([["Teacher category", staff.teacherCategory]] as [string, string][]) : []),
    ...(staff.postType ? ([["Post type", staff.postType]] as [string, string][]) : []),
    ...(staff.stateTeacherId ? ([["State teacher ID", staff.stateTeacherId]] as [string, string][]) : []),
    [
      "Experience",
      staff.experienceYears !== null ? `${staff.experienceYears} years` : "not yet verified",
    ],
    ["Joining date", formatDate(staff.dateOfJoining)],
  ];

  const address = [staff.addressLine1, staff.addressLine2, staff.city, staff.state, staff.pincode]
    .filter(Boolean)
    .join(", ");
  const contactRows: [string, string][] = [
    ...(staff.email ? ([["Official email", staff.email]] as [string, string][]) : []),
    ...(staff.mobile ? ([["Phone number", staff.mobile]] as [string, string][]) : []),
    ...(address ? ([["Address", address]] as [string, string][]) : []),
  ];

  const teachingRows: [string, string][] = [
    ["Subjects handled", subjectNames.length > 0 ? subjectNames.join(", ") : "—"],
    ["Classes handled", sectionKeys.length > 0 ? sectionKeys.join(", ") : "—"],
    ["Class teacher of", activeAdvisorRole ? describeScope(activeAdvisorRole) : "—"],
    ["Periods per week", String(timetableSlots.length)],
    ...(academicYear ? ([["Academic year", academicYear]] as [string, string][]) : []),
  ];

  return (
    <div className="mx-auto max-w-[960px]">
      <div className="mb-4 mt-2 flex flex-wrap items-center justify-between gap-3">
        <BackLink href={backHref} label="Back to faculty" />
        <div className="flex items-center gap-2">
          {headerActions}
          {belowHeaderActions}
          <PrintButton label="Print profile" />
        </div>
      </div>

      {/* Identity card -- isHero per Principal Console.dc.html's teacherPage():
          photo, name, "ID · designation · subject" line, pill chips, then the
          4-tile stats row, all on one bordered card. */}
      <section className="rounded-[16px] border border-border bg-surface p-[22px]">
        <div className="flex flex-wrap items-start gap-5">
          {photo}
          <div className="min-w-0 flex-1">
            <h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-text">{fullName}</h1>
            <p className="mt-1.5 text-[15px] text-text-muted">
              {[staff.employeeNo, staff.designation, primarySubject].filter(Boolean).join(" · ")}
            </p>
            {pills.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-2">
                {pills.map((pill, i) => (
                  <span
                    key={i}
                    className={`rounded-[var(--radius-pill)] px-3.5 py-1.5 text-[13px] font-semibold ${PILL_TONE_CLASSES[pill.tone]}`}
                  >
                    {pill.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.label} className="rounded-[12px] bg-field p-4">
              <p className="text-[13px] text-text-muted">{tile.label}</p>
              <p className="mt-1.5 text-[22px] font-bold leading-none tracking-[-0.02em] text-text">{tile.value}</p>
              {tile.note && <p className="mt-1.5 text-xs text-text-muted">{tile.note}</p>}
            </div>
          ))}
        </div>
      </section>

      {staff.status === "EXITED" && staff.dateOfExit && (
        <p className="mt-3 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm text-critical-text">
          Exited on {formatDate(staff.dateOfExit)}
          {staff.exitReason ? ` · ${staff.exitReason.toLowerCase()}` : ""}.
        </p>
      )}

      {/* Profile / Contact / Teaching details -- the mockup's other two cards
          (Academic details: qualification/university/graduation year;
          Professional information: expertise/certifications/workshops/
          achievements) have no real column anywhere in this schema and are
          honestly omitted rather than shown with invented values. */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard title="Profile" rows={profileRows} />
        <InfoCard title="Contact" rows={contactRows} />
        <InfoCard title="Teaching details" rows={teachingRows} />
      </div>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Roles</h2>
          {rolesAction}
        </div>
        {roleAssignments.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">No Class Advisor / Coordinator roles assigned.</p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-border">
            {roleAssignments.map((r) => {
              const isCurrent = r.status === "ACTIVE";
              return (
                <li key={r.id} className="card-hover flex flex-wrap items-center justify-between gap-2 rounded-[10px] px-2 py-2.5">
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

      {extraSections}
    </div>
  );
}
