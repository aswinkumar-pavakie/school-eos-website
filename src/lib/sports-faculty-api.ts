// Sports Faculty (Sports In-Charge) module -- real backend calls only
// (school-eos-backend's src/modules/sports, the Faculty-facing controllers:
// sports-faculty-teams/training/tournaments/achievements/profiles,
// sports-equipment-operations, sport-od-requests), mirroring the exact same
// apiFetch/ApiEnvelope pattern src/lib/media-api.ts already established. No
// mock/placeholder data anywhere in this file.
//
// Every route here is server-scoped to whichever sport(s) this signed-in
// Faculty member currently holds an ACTIVE SPORTS_FACULTY role_assignment for
// -- an account with none just sees empty lists everywhere, never a 403 (the
// backend's own "404/empty, not 403" convention).

import { apiFetch, AuthExpiredError } from "./api";

interface ApiEnvelope<T> {
  data: T;
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  if (res.status === 401) throw new AuthExpiredError();
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

// ---------- Teams & roster ----------

export interface SportsTeam {
  id: string;
  sportId: string;
  sportName: string;
  sportCategoryId: string | null;
  academicYearId: string;
  name: string;
  coachId: string | null;
  captainStudentId: string | null;
  houseId: string | null;
  status: string;
}

export interface TeamRosterMember {
  id: string;
  teamId: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  jerseyNo: number | null;
  role: string | null;
  joinedOn: string;
  status: string;
}

export async function listMyTeams(): Promise<SportsTeam[]> {
  const res = await apiFetch("/sports/teams");
  return (await parseOrThrow<ApiEnvelope<SportsTeam[]>>(res)).data;
}

export async function createTeam(input: {
  sportId: string;
  sportCategoryId?: string;
  academicYearId: string;
  name: string;
  coachId?: string;
  captainStudentId?: string;
  houseId?: string;
}): Promise<SportsTeam> {
  const res = await apiFetch("/sports/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<SportsTeam>>(res)).data;
}

export async function listTeamRoster(teamId: string): Promise<TeamRosterMember[]> {
  const res = await apiFetch(`/sports/teams/${teamId}/roster`);
  return (await parseOrThrow<ApiEnvelope<TeamRosterMember[]>>(res)).data;
}

export async function addRosterMember(teamId: string, input: { studentId: string; jerseyNo?: number; role?: string }): Promise<TeamRosterMember> {
  const res = await apiFetch(`/sports/teams/${teamId}/roster`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<TeamRosterMember>>(res)).data;
}

export async function endRosterMember(teamId: string, memberId: string): Promise<void> {
  const res = await apiFetch(`/sports/teams/${teamId}/roster/${memberId}/end`, { method: "POST" });
  await parseOrThrow(res);
}

export async function assignCoach(teamId: string, coachId: string): Promise<SportsTeam> {
  const res = await apiFetch(`/sports/teams/${teamId}/coach`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coachId }) });
  return (await parseOrThrow<ApiEnvelope<SportsTeam>>(res)).data;
}

// ---------- Student sport profiles ----------

export interface SportsProfile {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  sportId: string;
  sportCategoryId: string | null;
  joinedOn: string;
  positionOrRole: string | null;
  status: string;
}

export async function listSportsProfiles(sportId: string): Promise<SportsProfile[]> {
  const res = await apiFetch(`/sports/${sportId}/profiles`);
  return (await parseOrThrow<ApiEnvelope<SportsProfile[]>>(res)).data;
}

export async function createSportsProfile(sportId: string, input: { studentId: string; sportCategoryId?: string; joinedOn?: string; positionOrRole?: string }): Promise<SportsProfile> {
  const res = await apiFetch(`/sports/${sportId}/profiles`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<SportsProfile>>(res)).data;
}

export async function updateSportsProfile(sportId: string, profileId: string, input: { sportCategoryId?: string; positionOrRole?: string; status?: string }): Promise<SportsProfile> {
  const res = await apiFetch(`/sports/${sportId}/profiles/${profileId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<SportsProfile>>(res)).data;
}

// ---------- Training sessions + attendance ----------

export interface TrainingSession {
  id: string;
  teamId: string;
  teamName: string;
  sportId: string;
  scheduledAt: string;
  venue: string | null;
  focus: string | null;
  conductedByCoachId: string | null;
  status: string;
}

export interface TrainingAttendanceEntry {
  id: string;
  trainingSessionId: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  status: string;
  recordedBy: string | null;
}

export async function listTrainingSessions(): Promise<TrainingSession[]> {
  const res = await apiFetch("/sports/training-sessions");
  return (await parseOrThrow<ApiEnvelope<TrainingSession[]>>(res)).data;
}

export async function createTrainingSession(input: { teamId: string; scheduledAt: string; venue?: string; focus?: string; conductedByCoachId?: string }): Promise<TrainingSession> {
  const res = await apiFetch("/sports/training-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<TrainingSession>>(res)).data;
}

export async function updateTrainingSession(id: string, input: Partial<{ scheduledAt: string; venue: string; focus: string; conductedByCoachId: string; status: string }>): Promise<TrainingSession> {
  const res = await apiFetch(`/sports/training-sessions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<TrainingSession>>(res)).data;
}

export async function listTrainingAttendance(sessionId: string): Promise<TrainingAttendanceEntry[]> {
  const res = await apiFetch(`/sports/training-sessions/${sessionId}/attendance`);
  return (await parseOrThrow<ApiEnvelope<TrainingAttendanceEntry[]>>(res)).data;
}

export async function recordTrainingAttendance(sessionId: string, entries: { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" }[]): Promise<TrainingAttendanceEntry[]> {
  const res = await apiFetch(`/sports/training-sessions/${sessionId}/attendance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entries }) });
  return (await parseOrThrow<ApiEnvelope<TrainingAttendanceEntry[]>>(res)).data;
}

// ---------- Tournaments, fixtures, results, house performance ----------

export interface Tournament {
  id: string;
  sportId: string;
  sportName: string;
  name: string;
  level: string;
  format: string | null;
  startDate: string;
  endDate: string;
  venue: string | null;
  state: string;
}

export interface Fixture {
  id: string;
  tournamentId: string;
  sportId: string;
  round: string | null;
  scheduledAt: string;
  venue: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  status: string;
}

export interface FixtureResult {
  id: string;
  fixtureId: string;
  homeScore: string | null;
  awayScore: string | null;
  winnerTeamId: string | null;
  resultDetail: Record<string, unknown> | null;
  recordedBy: string | null;
  recordedAt: string;
}

export interface HousePerformance {
  houseId: string;
  houseName: string;
  matches: number;
  wins: number;
}

export async function listTournaments(): Promise<Tournament[]> {
  const res = await apiFetch("/sports/tournaments");
  return (await parseOrThrow<ApiEnvelope<Tournament[]>>(res)).data;
}

export async function createTournament(input: { sportId: string; name: string; level: string; format?: string; startDate: string; endDate: string; venue?: string }): Promise<Tournament> {
  const res = await apiFetch("/sports/tournaments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Tournament>>(res)).data;
}

export async function updateTournament(id: string, input: Partial<{ name: string; format: string; startDate: string; endDate: string; venue: string; state: string }>): Promise<Tournament> {
  const res = await apiFetch(`/sports/tournaments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Tournament>>(res)).data;
}

export async function listFixtures(): Promise<Fixture[]> {
  const res = await apiFetch("/sports/fixtures");
  return (await parseOrThrow<ApiEnvelope<Fixture[]>>(res)).data;
}

export async function createFixture(tournamentId: string, input: { round?: string; scheduledAt: string; venue?: string; homeTeamId?: string; awayTeamId?: string }): Promise<Fixture> {
  const res = await apiFetch(`/sports/tournaments/${tournamentId}/fixtures`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Fixture>>(res)).data;
}

export async function updateFixture(id: string, input: Partial<{ round: string; scheduledAt: string; venue: string; homeTeamId: string; awayTeamId: string; status: string }>): Promise<Fixture> {
  const res = await apiFetch(`/sports/fixtures/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Fixture>>(res)).data;
}

export async function getFixtureResult(id: string): Promise<FixtureResult | null> {
  const res = await apiFetch(`/sports/fixtures/${id}/results`);
  return (await parseOrThrow<ApiEnvelope<FixtureResult | null>>(res)).data;
}

export async function recordFixtureResult(id: string, input: { homeScore?: string; awayScore?: string; winnerTeamId?: string }): Promise<FixtureResult> {
  const res = await apiFetch(`/sports/fixtures/${id}/results`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<FixtureResult>>(res)).data;
}

export async function getHousePerformance(): Promise<HousePerformance[]> {
  const res = await apiFetch("/sports/houses/performance");
  return (await parseOrThrow<ApiEnvelope<HousePerformance[]>>(res)).data;
}

// ---------- Achievements ----------

export interface SportsAchievement {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  teamId: string | null;
  teamName: string | null;
  tournamentId: string | null;
  tournamentName: string | null;
  placement: string;
  awardedOn: string;
  certificateKey: string | null;
}

export async function listAchievements(): Promise<SportsAchievement[]> {
  const res = await apiFetch("/sports/achievements");
  return (await parseOrThrow<ApiEnvelope<SportsAchievement[]>>(res)).data;
}

export async function createAchievement(input: { studentId: string; teamId?: string; tournamentId?: string; placement: string; awardedOn: string; title?: string }): Promise<SportsAchievement> {
  const res = await apiFetch("/sports/achievements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<SportsAchievement>>(res)).data;
}

// ---------- OD (on-duty) requests ----------

export type SportOdRequestState = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface SportOdRequest {
  id: string;
  teamId: string;
  teamName: string;
  sportId: string;
  sportName: string;
  fixtureId: string | null;
  eventDate: string;
  reason: string;
  requestedBy: string;
  approvalRequestId: string | null;
  studentEventId: string | null;
  state: SportOdRequestState;
  createdAt: string;
}

export async function listOdRequests(): Promise<SportOdRequest[]> {
  const res = await apiFetch("/sports/od-requests");
  return (await parseOrThrow<ApiEnvelope<SportOdRequest[]>>(res)).data;
}

export async function createOdRequest(input: { teamId: string; fixtureId?: string; eventDate: string; reason: string }): Promise<SportOdRequest> {
  const res = await apiFetch("/sports/od-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<SportOdRequest>>(res)).data;
}

// ---------- Equipment (read + issue/return, scoped to my sports) ----------

export interface FacultyEquipment {
  id: string;
  name: string;
  sportId: string | null;
  quantityTotal: number;
  quantityAvailable: number;
  condition: string | null;
}

export interface EquipmentIssue {
  id: string;
  equipmentId: string;
  equipmentName: string;
  issuedToStudentId: string | null;
  issuedToTeamId: string | null;
  quantity: number;
  issuedOn: string;
  dueOn: string | null;
  returnedOn: string | null;
  conditionOnReturn: string | null;
  issueReason: string | null;
}

export async function listMyEquipment(): Promise<FacultyEquipment[]> {
  const res = await apiFetch("/sports/faculty/equipment");
  return (await parseOrThrow<ApiEnvelope<FacultyEquipment[]>>(res)).data;
}

export async function listOutstandingIssues(): Promise<EquipmentIssue[]> {
  const res = await apiFetch("/sports/faculty/equipment/outstanding-issues");
  return (await parseOrThrow<ApiEnvelope<EquipmentIssue[]>>(res)).data;
}

export async function listOverdueIssues(): Promise<EquipmentIssue[]> {
  const res = await apiFetch("/sports/faculty/equipment/overdue-issues");
  return (await parseOrThrow<ApiEnvelope<EquipmentIssue[]>>(res)).data;
}

export async function listLowStockEquipment(threshold = 5): Promise<FacultyEquipment[]> {
  const res = await apiFetch(`/sports/faculty/equipment/low-stock?threshold=${threshold}`);
  return (await parseOrThrow<ApiEnvelope<FacultyEquipment[]>>(res)).data;
}

/** signaturePngBase64 must be a real PNG's base64 (magic-bytes checked server-side). */
export async function issueEquipment(
  equipmentId: string,
  input: { issuedToStudentId?: string; issuedToTeamId?: string; quantity: number; reason: string; dueOn?: string; signaturePngBase64: string },
  idempotencyKey: string,
): Promise<EquipmentIssue> {
  const res = await apiFetch(`/sports/faculty/equipment/${equipmentId}/issues`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(input),
  });
  return (await parseOrThrow<ApiEnvelope<EquipmentIssue>>(res)).data;
}

export async function returnEquipment(issueId: string, conditionOnReturn?: string): Promise<EquipmentIssue> {
  const res = await apiFetch(`/sports/faculty/equipment/issues/${issueId}/return`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conditionOnReturn }),
  });
  return (await parseOrThrow<ApiEnvelope<EquipmentIssue>>(res)).data;
}

// ---------- Equipment restock indent (Faculty -> Principal -> Finance) ----------

export type SportsIndentState = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface SportsEquipmentIndent {
  id: string;
  referenceNo: string;
  itemName: string;
  description: string | null;
  quantity: number | null;
  neededBy: string | null;
  state: SportsIndentState;
  createdAt: string;
}

export async function listEquipmentIndents(): Promise<SportsEquipmentIndent[]> {
  const res = await apiFetch("/sports/equipment-indents?pageSize=200");
  return (await parseOrThrow<ApiEnvelope<SportsEquipmentIndent[]>>(res)).data;
}

export async function createEquipmentIndent(input: { equipmentId: string; quantity: number; reason: string; vendorName?: string }): Promise<SportsEquipmentIndent> {
  const res = await apiFetch("/sports/equipment-indents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<SportsEquipmentIndent>>(res)).data;
}
