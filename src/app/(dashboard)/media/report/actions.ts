"use server";

import { revalidatePath } from "next/cache";
import { createMediaReportMetric, deleteMediaReportMetric, updateMediaReportMetric } from "@/lib/media-api";

export async function createMetricAction(input: { academicYearId: string; name: string; nowValue: string; targetValue: string; attainmentPct: string }): Promise<void> {
  if (!input.name.trim()) throw new Error("Metric name is required.");
  if (!input.nowValue.trim()) throw new Error("This year's value is required.");

  await createMediaReportMetric({
    academicYearId: input.academicYearId,
    name: input.name.trim(),
    nowValue: input.nowValue.trim(),
    targetValue: input.targetValue.trim() || undefined,
    attainmentPct: input.attainmentPct.trim() || undefined,
  });
  revalidatePath("/media/report");
}

export async function updateMetricAction(id: string, input: { name: string; nowValue: string; targetValue: string; attainmentPct: string }): Promise<{ error?: string }> {
  if (!input.name.trim()) return { error: "Metric name is required." };
  if (!input.nowValue.trim()) return { error: "This year's value is required." };
  try {
    await updateMediaReportMetric(id, {
      name: input.name.trim(),
      nowValue: input.nowValue.trim(),
      targetValue: input.targetValue.trim() || undefined,
      attainmentPct: input.attainmentPct.trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this metric." };
  }
  revalidatePath("/media/report");
  return {};
}

export async function deleteMetricAction(id: string): Promise<{ error?: string }> {
  try {
    await deleteMediaReportMetric(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not delete this metric." };
  }
  revalidatePath("/media/report");
  return {};
}
