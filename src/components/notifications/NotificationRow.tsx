"use client";

// One real notification row -- "Mark read" calls the real backend action;
// deep-link resolution happens here (not trusted from the row's own
// deepLink field, which the backend never actually populates -- see
// notifications-api.ts's own comment) so a notification only ever links to
// a route that genuinely exists for Correspondent, never a guessed one.

import Link from "next/link";
import { useState, useTransition } from "react";
import { markNotificationReadAction } from "@/app/(dashboard)/correspondent/notifications/actions";
import { formatRelativeTime } from "@/lib/format";

interface NotificationRow {
  id: string;
  notificationType: string;
  title: string;
  body: string;
  relatedObjectType: string | null;
  relatedObjectId: string | null;
  isEmergency: boolean;
  createdAt: string;
  readAt: string | null;
}

// Only the real object types Correspondent actually has a working detail
// page for. Every other type (e.g. attendance_record, hostel_call_request --
// real notification types this session confirmed exist in live data, but
// Correspondent has no attendance/hostel-call detail route of its own) shows
// as plain text instead of a broken or fabricated link.
function resolveHref(relatedObjectType: string | null, relatedObjectId: string | null): string | null {
  if (relatedObjectType === "approval_request" && relatedObjectId) {
    return `/correspondent/requests/${relatedObjectId}`;
  }
  return null;
}

export function NotificationRow({ notification }: { notification: NotificationRow }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const href = resolveHref(notification.relatedObjectType, notification.relatedObjectId);
  const isUnread = !notification.readAt;

  function markRead() {
    startTransition(async () => {
      setError(undefined);
      const result = await markNotificationReadAction(notification.id);
      if (result.error) setError(result.error);
    });
  }

  const content = (
    <div
      className={`card-hover flex items-start justify-between gap-3 rounded-[14px] border p-[16px] ${
        isUnread ? "border-primary/30 bg-primary/5" : "border-border bg-surface"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {notification.isEmergency && (
              <span className="rounded-[6px] bg-critical-bg px-2 py-[3px] text-[11px] font-bold text-critical-text">EMERGENCY</span>
            )}
            <p className="text-sm font-bold text-text">{notification.title}</p>
          </div>
          <p className="mt-1 text-[13px] text-text-muted">{notification.body}</p>
          <p className="mt-1.5 text-xs text-text-muted">{formatRelativeTime(notification.createdAt)}</p>
          {error && <p className="mt-1 text-xs font-semibold text-critical-text">{error}</p>}
        </div>
      </div>
      {isUnread && (
        <button
          type="button"
          disabled={isPending}
          onClick={(e) => {
            e.preventDefault();
            markRead();
          }}
          className="shrink-0 whitespace-nowrap text-[12.5px] font-semibold text-primary disabled:opacity-50"
        >
          Mark read
        </button>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={() => isUnread && markRead()} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
