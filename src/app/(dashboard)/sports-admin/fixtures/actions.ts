"use server";

import { revalidatePath } from "next/cache";
import { createFixture, createTournament, recordFixtureResult, updateFixture, updateTournament } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

export async function createTournamentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sportId = String(formData.get("sportId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const level = String(formData.get("level") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  if (!sportId) return { error: "Pick a sport." };
  if (!name) return { error: "Tournament name is required." };
  if (!level) return { error: "Pick a level." };
  if (!startDate || !endDate) return { error: "Pick start and end dates." };

  try {
    await createTournament({
      sportId,
      name,
      level,
      startDate,
      endDate,
      venue: String(formData.get("venue") ?? "").trim() || undefined,
      format: String(formData.get("format") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create this tournament." };
  }
  revalidatePath("/sports-admin/fixtures");
  return {};
}

export async function createFixtureAction(tournamentId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  if (!date || !time) return { error: "Pick a date and time." };

  try {
    await createFixture(tournamentId, {
      scheduledAt: new Date(`${date}T${time}`).toISOString(),
      round: String(formData.get("round") ?? "").trim() || undefined,
      venue: String(formData.get("venue") ?? "").trim() || undefined,
      homeTeamId: String(formData.get("homeTeamId") ?? "").trim() || undefined,
      awayTeamId: String(formData.get("awayTeamId") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not add this fixture." };
  }
  revalidatePath("/sports-admin/fixtures");
  return {};
}

export async function recordFixtureResultAction(fixtureId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await recordFixtureResult(fixtureId, {
      homeScore: String(formData.get("homeScore") ?? "").trim() || undefined,
      awayScore: String(formData.get("awayScore") ?? "").trim() || undefined,
      winnerTeamId: String(formData.get("winnerTeamId") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record this result." };
  }
  revalidatePath("/sports-admin/fixtures");
  return {};
}

// Edit already real (PATCH accepts name/format/dates/venue/state); "Delete"
// is a Cancel toggle via state='CANCELLED' -- no hard-delete route exists.
export async function updateTournamentAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  if (!name) return { error: "Tournament name is required." };
  if (!startDate || !endDate) return { error: "Pick start and end dates." };
  try {
    await updateTournament(id, {
      name,
      startDate,
      endDate,
      venue: String(formData.get("venue") ?? "").trim() || undefined,
      format: String(formData.get("format") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this tournament." };
  }
  revalidatePath("/sports-admin/fixtures");
  return {};
}

export async function setTournamentStateAction(id: string, state: string): Promise<{ error?: string }> {
  try {
    await updateTournament(id, { state });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this tournament." };
  }
  revalidatePath("/sports-admin/fixtures");
  return {};
}

// Same pattern for the fixture itself -- Edit already real (PATCH accepts
// round/scheduledAt/venue/homeTeamId/awayTeamId/status); "Delete" is a
// Cancel toggle via status='CANCELLED'.
export async function updateFixtureAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  if (!date || !time) return { error: "Pick a date and time." };
  try {
    await updateFixture(id, {
      scheduledAt: new Date(`${date}T${time}`).toISOString(),
      round: String(formData.get("round") ?? "").trim() || undefined,
      venue: String(formData.get("venue") ?? "").trim() || undefined,
      homeTeamId: String(formData.get("homeTeamId") ?? "").trim() || undefined,
      awayTeamId: String(formData.get("awayTeamId") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this fixture." };
  }
  revalidatePath("/sports-admin/fixtures");
  return {};
}

export async function setFixtureStatusAction(id: string, status: string): Promise<{ error?: string }> {
  try {
    await updateFixture(id, { status });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this fixture." };
  }
  revalidatePath("/sports-admin/fixtures");
  return {};
}
