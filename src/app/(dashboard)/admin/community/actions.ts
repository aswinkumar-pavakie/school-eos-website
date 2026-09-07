"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";

export interface FormActionState {
  error?: string;
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? "Something went wrong. Nothing was changed.";
}

export async function createCommunityAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = {
    name: formData.get("name"),
    communityCategory: formData.get("communityCategory"),
    academicYearId: formData.get("academicYearId"),
  };
  const optionalStrings = ["description", "inchargeStaffId", "moderationMode"];
  for (const key of optionalStrings) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") payload[key] = value;
  }
  const maxMembers = formData.get("maxMembers");
  if (typeof maxMembers === "string" && maxMembers.trim() !== "") payload.maxMembers = Number(maxMembers);
  payload.discussionEnabled = formData.get("discussionEnabled") === "on";

  const res = await apiFetch("/communities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { error: await readError(res) };
  }

  const { data } = (await res.json()) as { data: { id: string } };
  revalidatePath("/admin/community");
  redirect(`/admin/community/${data.id}`);
}

export async function updateCommunityAction(
  communityId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = {};
  const optionalStrings = ["name", "communityCategory", "description", "inchargeStaffId", "moderationMode"];
  for (const key of optionalStrings) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") payload[key] = value;
  }
  const maxMembers = formData.get("maxMembers");
  if (typeof maxMembers === "string" && maxMembers.trim() !== "") payload.maxMembers = Number(maxMembers);
  payload.discussionEnabled = formData.get("discussionEnabled") === "on";

  const res = await apiFetch(`/communities/${communityId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { error: await readError(res) };
  }

  revalidatePath(`/admin/community/${communityId}`);
  revalidatePath("/admin/community");
  return {};
}

export async function archiveCommunityAction(communityId: string): Promise<{ error?: string }> {
  const res = await apiFetch(`/communities/${communityId}/archive`, { method: "POST" });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/community/${communityId}`);
  revalidatePath("/admin/community");
  return {};
}

export async function createMembershipAction(
  communityId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = { studentId: formData.get("studentId") };
  const roleInCommunity = formData.get("roleInCommunity");
  if (typeof roleInCommunity === "string" && roleInCommunity.trim() !== "") {
    payload.roleInCommunity = roleInCommunity;
  }

  const res = await apiFetch(`/communities/${communityId}/memberships`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { error: await readError(res) };
  }

  revalidatePath(`/admin/community/${communityId}`);
  return {};
}

export async function recordConsentAction(
  communityId: string,
  membershipId: string,
): Promise<{ error?: string }> {
  const res = await apiFetch(`/community-memberships/${membershipId}/record-consent`, { method: "POST" });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/community/${communityId}`);
  return {};
}

export async function removeMembershipAction(
  communityId: string,
  membershipId: string,
): Promise<{ error?: string }> {
  const res = await apiFetch(`/community-memberships/${membershipId}/remove`, { method: "POST" });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/community/${communityId}`);
  return {};
}

export async function createActivityAction(
  communityId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = {
    title: formData.get("title"),
    scheduledAt: formData.get("scheduledAt"),
  };
  const description = formData.get("description");
  if (typeof description === "string" && description.trim() !== "") payload.description = description;
  const venue = formData.get("venue");
  if (typeof venue === "string" && venue.trim() !== "") payload.venue = venue;

  const res = await apiFetch(`/communities/${communityId}/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { error: await readError(res) };
  }

  revalidatePath(`/admin/community/${communityId}`);
  return {};
}

export async function updateActivityStatusAction(
  communityId: string,
  activityId: string,
  status: string,
): Promise<{ error?: string }> {
  const res = await apiFetch(`/community-activities/${activityId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/community/${communityId}`);
  return {};
}

export async function createAnnouncementAction(
  communityId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = {
    title: formData.get("title"),
    body: formData.get("body"),
  };

  const res = await apiFetch(`/communities/${communityId}/announcements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { error: await readError(res) };
  }

  revalidatePath(`/admin/community/${communityId}`);
  return {};
}

export async function publishAnnouncementAction(
  communityId: string,
  announcementId: string,
): Promise<{ error?: string }> {
  const res = await apiFetch(`/community-announcements/${announcementId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: "PUBLISHED" }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/community/${communityId}`);
  return {};
}

export async function archiveAnnouncementAction(
  communityId: string,
  announcementId: string,
): Promise<{ error?: string }> {
  const res = await apiFetch(`/community-announcements/${announcementId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: "ARCHIVED" }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/community/${communityId}`);
  return {};
}
