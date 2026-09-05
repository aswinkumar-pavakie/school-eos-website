"use client";

import { useActionState, useState } from "react";
import { createActivityAction, type FormActionState } from "@/app/(dashboard)/admin/community/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate } from "@/lib/format";

interface ActivityRow {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  venue: string | null;
  status: string;
}

const initialState: FormActionState = {};

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "critical";
  return "pending";
}

export function ActivitiesSection({ communityId, activities }: { communityId: string; activities: ActivityRow[] }) {
  const [adding, setAdding] = useState(false);
  const action = createActivityAction.bind(null, communityId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <div className="rounded-[16px] border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Activities</h2>
        <span className="text-xs text-text-muted">{activities.length} activities</span>
      </div>

      {activities.length === 0 && (
        <p className="mt-3 rounded-[11px] border border-dashed border-border bg-field px-3.5 py-3 text-sm text-text-muted">
          No activities scheduled yet.
        </p>
      )}

      <ul className="mt-3 flex flex-col divide-y divide-border">
        {activities.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="text-[13.5px] font-semibold text-text">{a.title}</p>
              <p className="text-xs text-text-muted">
                {formatDate(a.scheduledAt)}
                {a.venue && ` · ${a.venue}`}
              </p>
              {a.description && <p className="mt-0.5 text-xs text-text-muted">{a.description}</p>}
            </div>
            <StatusPill tone={statusTone(a.status)} label={a.status} />
          </li>
        ))}
      </ul>

      {!adding ? (
        <button type="button" onClick={() => setAdding(true)} className="mt-3 text-[13px] font-semibold text-primary">
          + New activity
        </button>
      ) : (
        <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
          {state.error && <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Title *</span>
            <input
              name="title"
              required
              disabled={isPending}
              className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Scheduled at *</span>
              <input
                name="scheduledAt"
                type="datetime-local"
                required
                disabled={isPending}
                className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Venue</span>
              <input
                name="venue"
                disabled={isPending}
                className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Description</span>
            <textarea
              name="description"
              rows={2}
              disabled={isPending}
              className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {isPending ? "Creating…" : "Create activity"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
