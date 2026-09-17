"use server";

import { revalidatePath } from "next/cache";
import { createTeam, listAcademicYears } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

export async function createTeamAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sportId = String(formData.get("sportId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!sportId) return { error: "Pick a sport." };
  if (!name) return { error: "Team name is required." };

  try {
    const years = await listAcademicYears();
    const currentYear = years.find((y) => y.isCurrent) ?? years[0];
    if (!currentYear) return { error: "No academic year is set up yet — ask Admin to create one first." };

    const sportCategoryId = String(formData.get("sportCategoryId") ?? "").trim();
    const coachId = String(formData.get("coachId") ?? "").trim();

    await createTeam({
      sportId,
      academicYearId: currentYear.id,
      name,
      sportCategoryId: sportCategoryId || undefined,
      coachId: coachId || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create this squad." };
  }
  revalidatePath("/sports-admin/teams");
  return {};
}
