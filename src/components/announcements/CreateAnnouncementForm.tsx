"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createAnnouncementAction, type FormActionState } from "@/app/(dashboard)/admin/announcements/actions";

const initialState: FormActionState = {};

const PRIORITIES: [string, string][] = [
  ["LOW", "Low"],
  ["NORMAL", "Normal"],
  ["HIGH", "High"],
  ["URGENT", "Urgent"],
];

// Real role_code values (role_assignment.role_code / announcement_audience.target_role
// both have a hard FK to role.code) -- these are every real role in this deployment.
const ROLES: [string, string][] = [
  ["ADMIN", "Admin"],
  ["PRINCIPAL", "Principal"],
  ["VICE_PRINCIPAL", "Vice Principal"],
  ["FACULTY", "Faculty"],
  ["PARENT", "Parents"],
  ["FINANCE", "Finance / Accounts"],
  ["ACADEMIC_COORDINATOR", "Academic Coordinators"],
  ["CLASS_ADVISOR", "Class Advisors"],
  ["SPORTS_FACULTY", "Sports Faculty"],
  ["COMMUNITY_INCHARGE", "Community In-Charges"],
  ["HEALTH_INCHARGE", "Health In-Charge"],
  ["HOSTEL_WARDEN", "Hostel Wardens"],
  ["BUS_ATTENDANT", "Bus Attendants"],
  ["CANTEEN_VENDOR", "Canteen Vendors"],
];

export function CreateAnnouncementForm() {
  const [open, setOpen] = useState(false);
  const [audienceType, setAudienceType] = useState("SCHOOL");
  const [state, formAction, isPending] = useActionState(createAnnouncementAction, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) setOpen(false);
    wasPending.current = isPending;
  }, [isPending, state.error]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white"
      >
        + New announcement
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-4 flex w-full flex-col gap-3 rounded-[16px] border border-border bg-surface p-[18px]"
    >
      {state.error && (
        <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-semibold text-text">Title *</span>
          <input
            name="title"
            required
            disabled={isPending}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Priority *</span>
          <select
            name="priority"
            required
            disabled={isPending}
            defaultValue="NORMAL"
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          >
            {PRIORITIES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Message *</span>
        <textarea
          name="body"
          required
          disabled={isPending}
          rows={3}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Category</span>
          <input
            name="category"
            disabled={isPending}
            placeholder="e.g. EVENT, ACADEMIC"
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Expires on (optional)</span>
          <input
            type="date"
            name="expiresAt"
            disabled={isPending}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Send to *</span>
          <select
            name="audienceType"
            required
            disabled={isPending}
            value={audienceType}
            onChange={(e) => setAudienceType(e.target.value)}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          >
            <option value="SCHOOL">Everyone (whole school)</option>
            <option value="ROLE">Specific role(s)</option>
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2.5 text-[13px] text-text">
          <input type="checkbox" name="isEmergency" disabled={isPending} className="h-4 w-4 rounded border-border" />
          Mark as emergency
        </label>
      </div>

      {audienceType === "ROLE" && (
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Roles * (select one or more)</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-[11px] border border-border bg-field p-3.5 sm:grid-cols-3">
            {ROLES.map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 text-[13px] text-text">
                <input
                  type="checkbox"
                  name="targetRoles"
                  value={v}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-border"
                />
                {l}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-bg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Sending…" : "Send announcement"}
        </button>
      </div>
    </form>
  );
}
