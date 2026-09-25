// Client-safe constants, types and helpers for the Health In-charge console (no server-only imports).

export const VISIT_ACTIONS = ["REST", "MEDICATION", "SENT_HOME", "REFERRED", "SICKBAY_ADMIT", "NO_ACTION"] as const;
export const SERIOUS_ACTIONS: string[] = ["SENT_HOME", "REFERRED", "SICKBAY_ADMIT"];
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const CHANNELS = ["PHONE", "SMS", "WHATSAPP", "APP", "IN_PERSON"] as const;

export const ACTION_LABEL: Record<string, string> = {
  REST: "Rest",
  MEDICATION: "Medication",
  SENT_HOME: "Sent home",
  REFERRED: "Referred",
  SICKBAY_ADMIT: "Sickbay admit",
  NO_ACTION: "No action",
};
export const ALERT_LABEL: Record<string, string> = {
  INFECTION_CLUSTER: "Infection cluster",
  MEDICATION_MISSED: "Medication missed",
  FOLLOWUP_OVERDUE: "Follow-up overdue",
  VISIT_UNNOTIFIED: "Visit not notified",
  ALLERGY_RISK: "Allergy risk",
};

export interface VisitRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
  visitedAt: string;
  complaint: string;
  vitals: { temp_c?: number; pulse?: number; spo2?: number; bp?: string } | null;
  observation: string | null;
  action: string;
  attendedByFirstName: string | null;
  attendedByLastName: string | null;
  parentNotifiedAt: string | null;
  outcome: string | null;
  isHosteller: boolean;
}

export interface AlertRow {
  id: string;
  alertType: string;
  scopeType: string | null;
  studentId: string | null;
  studentFirstName: string | null;
  studentLastName: string | null;
  detectedAt: string;
  detail: Record<string, unknown> | null;
  acknowledgedByFirstName: string | null;
  acknowledgedByLastName: string | null;
  acknowledgedAt: string | null;
}

export interface EscalationRow {
  id: string;
  sourceType: string;
  sourceId: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  sequenceNo: number;
  contactedName: string | null;
  contactedAt: string;
  channel: string | null;
  response: string | null;
  outcome: string | null;
}

export interface StudentLookup {
  studentId: string;
  admissionNo: string;
  firstName: string;
  lastName: string | null;
  gradeName: string | null;
  sectionName: string | null;
  bloodGroup: string | null;
  hasProfile: boolean;
}

export interface HealthProfile {
  id: string;
  studentId: string;
  bloodGroup: string | null;
  heightCm: string | null;
  weightKg: string | null;
  measuredOn: string | null;
  familyDoctor: string | null;
  doctorPhone: string | null;
  insuranceRef: string | null;
  notes: string | null;
  updatedAt: string;
}

export interface ConsentRow {
  id: string;
  guardianFirstName: string | null;
  guardianLastName: string | null;
  scope: string;
  consentGivenAt: string;
  validUntil: string | null;
}

export interface StudentHealth {
  student: { studentId: string; firstName: string; lastName: string | null; gradeName: string | null; sectionName: string | null; admissionNo: string };
  profile: HealthProfile | null;
  consents: ConsentRow[];
  visits: VisitRow[];
  escalations: EscalationRow[];
}

export interface HealthDashboard {
  counts: {
    visitsToday: number;
    visitsThisWeek: number;
    needsParentNotice: number;
    openAlerts: number;
    escalationsThisWeek: number;
    profilesWithoutBloodGroup: number;
  };
  recentVisits: VisitRow[];
  needsNotice: VisitRow[];
  openAlerts: AlertRow[];
}

export const studentName = (r: { studentFirstName?: string | null; studentLastName?: string | null; firstName?: string; lastName?: string | null }) =>
  [r.studentFirstName ?? r.firstName, r.studentLastName ?? r.lastName].filter(Boolean).join(" ");
export const classLabel = (g: string | null, s: string | null) => (g ? `${g}${s ? `-${s}` : ""}` : "—");
