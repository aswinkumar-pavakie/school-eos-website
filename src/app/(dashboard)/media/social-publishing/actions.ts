"use server";

import { revalidatePath } from "next/cache";
import {
  cancelMediaPost,
  createMediaPost,
  deleteMediaPost,
  deleteMediaPostComment,
  listMediaPostComments,
  replyToMediaPostComment,
  updateMediaPost,
  type MediaPostComment,
} from "@/lib/media-api";

export interface FormState {
  error?: string;
}

/** formData arrives straight from the <form> submit (real File objects included in
 * its "files" entries). Combines the separate date+time inputs into the one
 * publishAt ISO string the backend's CreateMediaPostDto expects, and normalizes
 * the two toggle checkboxes to the explicit "true"/"false" strings the DTO
 * validates (a real HTML checkbox is only present in FormData at all when
 * checked, and even then defaults to the value "on", not "true"). */
export async function createMediaPostAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const caption = String(formData.get("caption") ?? "").trim();
  if (!caption) return { error: "Caption is required." };

  const publishDate = String(formData.get("publishDate") ?? "").trim();
  const publishTime = String(formData.get("publishTime") ?? "").trim();
  formData.delete("publishDate");
  formData.delete("publishTime");
  if (publishDate) {
    formData.set("publishAt", new Date(`${publishDate}T${publishTime || "00:00"}:00`).toISOString());
  }

  const pinToTop = formData.get("pinToTop") !== null;
  const allowComments = formData.get("allowComments") !== null;
  formData.set("pinToTop", pinToTop ? "true" : "false");
  formData.set("allowComments", allowComments ? "true" : "false");

  // A blank <input> still submits as "" in FormData -- never omitted -- so an
  // untouched "Link in post"/"First comment" field must be stripped here, not
  // just trimmed, or the backend's @IsOptional() (which only treats a genuinely
  // missing field as "not provided") sees an empty string and @IsUrl() rejects
  // the entire post for a field the user never touched.
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  if (linkUrl) formData.set("linkUrl", linkUrl);
  else formData.delete("linkUrl");

  const firstComment = String(formData.get("firstComment") ?? "").trim();
  if (firstComment) formData.set("firstComment", firstComment);
  else formData.delete("firstComment");

  // An untouched file <input> still submits one empty File entry (name "",
  // size 0) -- never omitted -- which the backend's real upload filter then
  // rejects as an unsupported format ("blob" isn't a supported photo/video
  // format"). Strip it here so a caption-only/text post (e.g. a Notice card)
  // can actually be saved, same "blank input still submits" fix already
  // applied above for linkUrl/firstComment.
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  formData.delete("files");
  for (const f of files) formData.append("files", f);

  // This action forwards the raw FormData straight through as the multipart
  // body (createMediaPost needs the real File objects, unlike every other
  // action here that just reads named fields into a JSON payload) -- so
  // React's own server-action bookkeeping keys ($ACTION_REF_1, $ACTION_1:0,
  // $ACTION_1:1, $ACTION_KEY, always present on a <form action={fn}> submit)
  // ride along too. The backend DTO's forbidNonWhitelisted validation then
  // rejects the whole request ("property $ACTION_REF_1 should not exist").
  // Real File entries are never named "$ACTION_*", so this is safe to strip.
  for (const key of Array.from(formData.keys())) {
    if (key.startsWith("$ACTION_")) formData.delete(key);
  }

  try {
    await createMediaPost(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create the post." };
  }
  revalidatePath("/media/social-publishing");
  revalidatePath("/media");
  return {};
}

export async function updateMediaPostAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await updateMediaPost(id, {
      caption: String(formData.get("caption") ?? "").trim() || undefined,
      firstComment: String(formData.get("firstComment") ?? "").trim() || undefined,
      linkUrl: String(formData.get("linkUrl") ?? "").trim() || undefined,
      pinToTop: formData.get("pinToTop") === "on",
      allowComments: formData.get("allowComments") === "on",
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update the post." };
  }
  revalidatePath("/media/social-publishing");
  return {};
}

export async function getMediaPostCommentsAction(postId: string): Promise<MediaPostComment[]> {
  return listMediaPostComments(postId);
}

export async function cancelMediaPostAction(id: string): Promise<void> {
  await cancelMediaPost(id);
  revalidatePath("/media/social-publishing");
  revalidatePath("/media");
}

export async function deleteMediaPostAction(id: string): Promise<void> {
  await deleteMediaPost(id);
  revalidatePath("/media/social-publishing");
  revalidatePath("/media");
}

export async function replyToCommentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const commentId = String(formData.get("commentId") ?? "");
  const reply = String(formData.get("reply") ?? "").trim();
  if (!reply) return { error: "Reply cannot be empty." };
  try {
    await replyToMediaPostComment(commentId, reply);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not send the reply." };
  }
  revalidatePath("/media/social-publishing");
  return {};
}

export async function deleteCommentAction(commentId: string): Promise<void> {
  await deleteMediaPostComment(commentId);
  revalidatePath("/media/social-publishing");
}
