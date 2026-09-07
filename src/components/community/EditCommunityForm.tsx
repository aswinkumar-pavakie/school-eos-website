"use client";

import { useActionState, useState, useTransition } from "react";
import { archiveCommunityAction, updateCommunityAction, type FormActionState } from "@/app/(dashboard)/admin/community/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";

const initialState: FormActionState = {};

interface Community {
  id: string;
  name: string;
  communityCategory: string;
  description: string | null;
  inchargeStaffId: string | null;
  maxMembers: number | null;
  discussionEnabled: boolean;
  moderationMode: string;
  state: string;
}

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "ACTIVE") return "success";
  if (state === "SUSPENDED" || state === "ARCHIVED") return "critical";
  return "pending";
}

export function EditCommunityForm({ community }: { community: Community }) {
  const action = updateCommunityAction.bind(null, community.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [archiveError, setArchiveError] = useState<string | undefined>();
  const [archiving, startArchive] = useTransition();

  const isArchived = community.state === "ARCHIVED";

  return (
    <div className="rounded-[16px] border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Basic info</h2>
        <div className="flex items-center gap-3">
          <StatusPill tone={stateTone(community.state)} label={community.state} />
          {!isArchived && (
            <button
              type="button"
              disabled={archiving}
              onClick={() =>
                startArchive(async () => {
                  const result = await archiveCommunityAction(community.id);
                  setArchiveError(result.error);
                })
              }
              className="text-[13px] font-semibold text-critical-text disabled:opacity-60"
            >
              {archiving ? "Archiving…" : "Archive"}
            </button>
          )}
        </div>
      </div>

      {archiveError && (
        <p role="alert" className="mt-3 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm text-critical-text">
          {archiveError}
        </p>
      )}
      {state.error && (
        <p role="alert" className="mt-3 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm text-critical-text">
          {state.error}
        </p>
      )}

      <form action={formAction} className="mt-4 flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Name</span>
            <input
              name="name"
              defaultValue={community.name}
              disabled={isPending || isArchived}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Category</span>
            <input
              name="communityCategory"
              defaultValue={community.communityCategory}
              disabled={isPending || isArchived}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Description</span>
          <textarea
            name="description"
            defaultValue={community.description ?? ""}
            disabled={isPending || isArchived}
            rows={2}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Max members</span>
            <input
              name="maxMembers"
              type="number"
              min={1}
              defaultValue={community.maxMembers ?? ""}
              disabled={isPending || isArchived}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Moderation mode</span>
            <select
              name="moderationMode"
              defaultValue={community.moderationMode}
              disabled={isPending || isArchived}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
            >
              <option value="OPEN">Open</option>
              <option value="PRE_MODERATED">Pre-moderated</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Incharge staff ID</span>
          <input
            name="inchargeStaffId"
            defaultValue={community.inchargeStaffId ?? ""}
            placeholder="Existing staff UUID"
            disabled={isPending || isArchived}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 font-mono text-[13px] text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
          />
        </label>

        <label className="flex items-center gap-2 text-[13px] text-text">
          <input
            type="checkbox"
            name="discussionEnabled"
            defaultChecked={community.discussionEnabled}
            disabled={isPending || isArchived}
            className="h-4 w-4 rounded border-border"
          />
          Enable discussion
        </label>

        {!isArchived && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
