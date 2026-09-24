// Shapes returned by GET/POST /class-teacher-logins/* (admin only).

export type SeatStatus = "ACTIVE" | "VACANT" | "NEEDS_ROLLOVER" | "NO_SECTION_THIS_YEAR" | "HOLDER_INACTIVE";

export interface ClassLoginSeat {
  loginPersonId: string;
  gradeId: string;
  gradeName: string;
  sectionName: string;
  email: string;
  holderPersonId: string | null;
  holderName: string | null;
  holderEmployeeNo: string | null;
  holderStaffStatus: string | null;
  holderSince: string | null;
  roleSectionId: string | null;
  targetSectionId: string | null;
  studentCount: number;
  hasStoredPassword: boolean;
  linkedPhones: number;
  status: SeatStatus;
}

export interface SectionWithoutLogin {
  sectionId: string;
  gradeId: string;
  gradeName: string;
  sectionName: string;
}

export interface ClassLoginList {
  academicYear: { id: string; name: string };
  summary: {
    total: number;
    active: number;
    vacant: number;
    needsRollover: number;
    noSectionThisYear: number;
    holderInactive: number;
  };
  seats: ClassLoginSeat[];
  sectionsWithoutLogin: SectionWithoutLogin[];
}

export interface ClassLoginStudent {
  studentId: string;
  name: string;
  rollNo: number | null;
  enrolmentType: string | null;
}

export interface ClassLoginHistoryItem {
  id: string;
  academicYearId: string;
  sectionId: string;
  facultyPersonId: string;
  assignedOn: string;
  unassignedOn: string | null;
  status: string;
}

export interface RolloverPreview {
  academicYear: { id: string; name: string };
  summary: {
    toMove: number;
    alreadyAligned: number;
    noSectionThisYear: number;
    staysVacant: number;
    sectionsWithoutLogin: number;
  };
  items: {
    loginPersonId: string;
    gradeName: string;
    sectionName: string;
    email: string;
    currentHolderName: string | null;
    studentCount: number;
    action: "MOVE" | "ALREADY_ALIGNED" | "SKIP_NO_SECTION";
    staysVacant: boolean;
  }[];
  sectionsWithoutLogin: SectionWithoutLogin[];
}

export interface RolloverResult {
  academicYear: { id: string; name: string };
  moved: number;
  alreadyAligned: number;
  noSectionThisYear: number;
  staysVacant: number;
  sectionsWithoutLogin: number;
}

export const SEAT_STATUS_META: Record<SeatStatus, { label: string; tone: "ok" | "warn" | "bad" | "muted"; hint: string }> = {
  ACTIVE: { label: "Active", tone: "ok", hint: "A teacher holds this class for the current year." },
  VACANT: { label: "Vacant", tone: "warn", hint: "No teacher assigned. Nobody can use this login until you assign one." },
  NEEDS_ROLLOVER: {
    label: "Needs rollover",
    tone: "bad",
    hint: "The login still points at last year's class, so it shows no students. Run the year rollover.",
  },
  NO_SECTION_THIS_YEAR: {
    label: "No section this year",
    tone: "muted",
    hint: "This class has no section in the current year. Create the section, then run the rollover.",
  },
  HOLDER_INACTIVE: {
    label: "Teacher inactive",
    tone: "bad",
    hint: "The assigned teacher is no longer active. Change the class teacher.",
  },
};
