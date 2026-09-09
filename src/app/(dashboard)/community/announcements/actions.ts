"use server";

// Community -> Announcements (self-service). Mirrors the Community mobile
// app's own Announcements screen, which already ships this: send a notice
// scoped to the caller's OWN community only. Same real backend endpoints
// Admin's community/[id] detail page already calls (see
// admin/community/actions.ts's own createAnnouncementAction/
// archiveAnnouncementAction) -- POST/PATCH /communities/:id/announcements and
// /community-announcements/:id, both already granted to COMMUNITY
// (community-announcements.controller.ts, class-level
// @Roles('ADMIN','PRINCIPAL','COMMUNITY','VICE_PRINCIPAL') with a narrower
// @Roles('ADMIN','COMMUNITY') override on create/update). The service layer
// (assertCanWriteCommunity) independently re-checks the caller's own
// role_assignment against the community id on every call, so a COMMUNITY
// actor can never write to a community other than its own regardless of what
// this page passes -- this file only ever passes the id this login's own
// /auth/me already resolved.
//
// No separate "Publish" action here (unlike Admin's fuller moderation UI on
// the same shared AnnouncementsSection component) -- community_announcement.
// state defaults to PUBLISHED at the DB level
// (prisma/schema.prisma:762, `state String @default("PUBLISHED")`), so a
// Community-created announcement is immediately live, exactly matching the
// mobile app's own "direct publish, no approval step" behavior and its own
// UI (no Publish button, only Archive).

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export interface FormActionState {
  error?: string;
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? "Something went wrong. Nothing was changed.";
}

export async function createMyAnnouncementAction(
  communityId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload = {
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

  revalidatePath("/community/announcements");
  return {};
}

export async function archiveMyAnnouncementAction(
  announcementId: string,
): Promise<{ error?: string }> {
  const res = await apiFetch(`/community-announcements/${announcementId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: "ARCHIVED" }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/community/announcements");
  return {};
}
