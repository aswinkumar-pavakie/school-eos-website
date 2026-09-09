// Timetable, Academic Calendar, My Bus -- real-time reads off the same
// tables the Faculty mobile app's own screens already read. Same server-only
// apiFetch convention as faculty-api.ts.

import { apiFetch } from "./api";

interface ApiEnvelope<T> {
  data: T;
}
async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message ?? `Request failed (${res.status})`);
  }
  return body as T;
}
async function get<T>(path: string): Promise<T> {
  return parseOrThrow<T>(await apiFetch(path));
}

export interface TimetablePeriod {
  periodId: string;
  periodNo: number;
  label: string | null;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}
export interface TimetableSlot {
  slotId: string;
  periodId: string;
  periodNo: number;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  room: string | null;
  subjectOfferingId: string;
  subjectName: string;
  gradeName: string;
  sectionName: string;
}
export interface WeeklyTimetable {
  periods: TimetablePeriod[];
  days: { dayOfWeek: number; slots: TimetableSlot[] }[];
}
export async function getWeeklyTimetable(): Promise<WeeklyTimetable> {
  return (await get<ApiEnvelope<WeeklyTimetable>>("/faculty/timetable")).data;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  isHoliday: boolean;
  startDate: string;
  endDate: string;
  scopeType: string;
  scopeStage: string | null;
}
export interface CurrentAcademicYear {
  name: string;
  startDate: string;
  endDate: string;
}
export interface CalendarData {
  events: CalendarEvent[];
  academicYear: CurrentAcademicYear | null;
}
export async function getFacultyCalendar(): Promise<CalendarData> {
  return (await get<ApiEnvelope<CalendarData>>("/faculty/calendar")).data;
}

export interface StaffBusAssignment {
  role: "DRIVER" | "ATTENDANT";
  vehicleId: string;
  registrationNo: string;
  model: string | null;
  capacity: number;
  routeId: string;
  routeName: string;
  routeCode: string | null;
  direction: string;
  stops: { stopName: string; sequenceNo: number; scheduledTime: string | null }[];
}
export async function getFacultyBus(): Promise<StaffBusAssignment | null> {
  return (await get<ApiEnvelope<StaffBusAssignment | null>>("/faculty/bus")).data;
}
