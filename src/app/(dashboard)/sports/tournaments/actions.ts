"use server";

import { revalidatePath } from "next/cache";
import { createFixture, createTournament, recordFixtureResult, updateTournament } from "@/lib/sports-faculty-api";

export interface FormState {
  error?: string;
}

export async function createTournamentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sportId = String(formData.get("sportId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const level = String(formData.get("level") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  if (!sportId) return { error: "Sport is required." };
  if (!name) return { error: "Name is required." };
  if (!level) return { error: "Level is required." };
  if (!startDate || !endDate) return { error: "Start and end dates are required." };

  try {
    await createTournament({
      sportId,
      name,
      level,
      startDate,
      endDate,
      format: String(formData.get("format") ?? "").trim() || undefined,
      venue: String(formData.get("venue") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create tournament." };
  }
  revalidatePath("/sports/tournaments");
  return {};
}

// Fire-and-forget (bound straight to a plain <form action>, no useActionState) --
// a thrown error surfaces via the nearest error.tsx rather than an inline message.
export async function updateTournamentStateAction(tournamentId: string, state: string): Promise<void> {
  await updateTournament(tournamentId, { state });
  revalidatePath("/sports/tournaments");
}

export async function createFixtureAction(tournamentId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();
  if (!scheduledAt) return { error: "Date & time is required." };

  try {
    await createFixture(tournamentId, {
      scheduledAt: new Date(scheduledAt).toISOString(),
      round: String(formData.get("round") ?? "").trim() || undefined,
      venue: String(formData.get("venue") ?? "").trim() || undefined,
      homeTeamId: String(formData.get("homeTeamId") ?? "").trim() || undefined,
      awayTeamId: String(formData.get("awayTeamId") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create fixture." };
  }
  revalidatePath("/sports/tournaments");
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
    return { error: err instanceof Error ? err.message : "Could not record result." };
  }
  revalidatePath("/sports/tournaments");
  return {};
}
