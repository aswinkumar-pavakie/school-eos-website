"use server";

// Health In-charge writes. Every action goes to the HEALTH_INCHARGE-only backend routes
// (POST/PUT/PATCH /health-incharge/...); the backend validates, audits and (for serious
// visits) notifies the guardians in the same transaction.

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export interface HealthFormState {
  error?: string;
  /** Set on success so the modal can close / show a confirmation. */
  ok?: string;
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? "Something went wrong. Nothing was changed.";
}

async function send(path: string, method: "POST" | "PUT" | "PATCH", body?: unknown) {
  const res = await apiFetch(`/health-incharge${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => null);
  if (!res) return { error: "Unable to reach the server. Please try again." as string };
  if (!res.ok) return { error: await readError(res) };
  return { data: (await res.json().catch(() => null))?.data };
}

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}
function num(formData: FormData, key: string): number | undefined {
  const v = str(formData, key);
  return v === undefined ? undefined : Number(v);
}

function refresh() {
  revalidatePath("/health-incharge", "layout");
}

export async function recordVisitAction(_prev: HealthFormState, formData: FormData): Promise<HealthFormState> {
  const studentId = str(formData, "studentId");
  if (!studentId) return { error: "Choose a student first." };
  const vitals = {
    temp_c: num(formData, "temp_c"),
    pulse: num(formData, "pulse"),
    spo2: num(formData, "spo2"),
    bp: str(formData, "bp"),
  };
  const hasVitals = Object.values(vitals).some((v) => v !== undefined);
  const notify = formData.get("notifyParent");
  const r = await send("/visits", "POST", {
    studentId,
    complaint: str(formData, "complaint"),
    action: str(formData, "action"),
    observation: str(formData, "observation"),
    outcome: str(formData, "outcome"),
    ...(hasVitals ? { vitals } : {}),
    // Unchecked box => not sent => backend default (notify for serious actions).
    ...(notify === "no" ? { notifyParent: false } : {}),
  });
  if (r.error) return { error: r.error };
  refresh();
  const d = r.data as { guardiansNotified?: number; noGuardianOnFile?: boolean } | undefined;
  return {
    ok: d?.noGuardianOnFile
      ? "Visit recorded. No guardian is on file, so nobody could be notified."
      : d?.guardiansNotified
        ? `Visit recorded. ${d.guardiansNotified} guardian${d.guardiansNotified === 1 ? "" : "s"} notified.`
        : "Visit recorded.",
  };
}

export async function updateVisitAction(visitId: string, _prev: HealthFormState, formData: FormData): Promise<HealthFormState> {
  const r = await send(`/visits/${visitId}`, "PATCH", {
    observation: str(formData, "observation"),
    outcome: str(formData, "outcome"),
    action: str(formData, "action"),
  });
  if (r.error) return { error: r.error };
  refresh();
  return { ok: "Visit updated." };
}

export async function notifyParentAction(visitId: string): Promise<HealthFormState> {
  const r = await send(`/visits/${visitId}/notify-parent`, "POST");
  if (r.error) return { error: r.error };
  refresh();
  return { ok: "Guardians notified." };
}

export async function logEscalationAction(visitId: string, _prev: HealthFormState, formData: FormData): Promise<HealthFormState> {
  const r = await send("/escalations", "POST", {
    visitId,
    contactedName: str(formData, "contactedName"),
    channel: str(formData, "channel"),
    response: str(formData, "response"),
    outcome: str(formData, "outcome"),
  });
  if (r.error) return { error: r.error };
  refresh();
  return { ok: "Contact logged." };
}

export async function saveProfileAction(studentId: string, _prev: HealthFormState, formData: FormData): Promise<HealthFormState> {
  const r = await send(`/students/${studentId}/profile`, "PUT", {
    bloodGroup: str(formData, "bloodGroup") ?? null,
    heightCm: num(formData, "heightCm") ?? null,
    weightKg: num(formData, "weightKg") ?? null,
    measuredOn: str(formData, "measuredOn") ?? null,
    familyDoctor: str(formData, "familyDoctor") ?? null,
    doctorPhone: str(formData, "doctorPhone") ?? null,
    insuranceRef: str(formData, "insuranceRef") ?? null,
    notes: str(formData, "notes") ?? null,
  });
  if (r.error) return { error: r.error };
  refresh();
  return { ok: "Health profile saved." };
}

export async function acknowledgeAlertAction(alertId: string): Promise<HealthFormState> {
  const r = await send(`/alerts/${alertId}/acknowledge`, "POST");
  if (r.error) return { error: r.error };
  refresh();
  return { ok: "Alert acknowledged." };
}
