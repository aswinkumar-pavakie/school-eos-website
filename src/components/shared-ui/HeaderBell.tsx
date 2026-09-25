"use client";

// Same notification bell Shell.tsx renders in its header (pending-approvals
// count, "seen" state remembered per browser, link to the role's own
// requests page) -- extracted so roles on the shared AppShell keep that real
// capability. Behavior is copied 1:1 from Shell.tsx; nothing about how the
// count is computed or where it links changes.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BellIcon } from "../dashboard/icons";

const NOTIF_SEEN_STORAGE_KEY = "school-eos:notif-seen-count";

export function HeaderBell({ pendingRequestsCount, requestsHref }: { pendingRequestsCount: number; requestsHref: string }) {
  const [open, setOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(NOTIF_SEEN_STORAGE_KEY));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only read of a per-browser value (can't be a lazy initializer: it would mismatch SSR)
      if (Number.isFinite(stored)) setSeenCount(stored);
    } catch {
      /* localStorage unavailable -- dot just won't persist across reloads */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const hasUnseen = pendingRequestsCount > seenCount;

  function markRead() {
    setSeenCount(pendingRequestsCount);
    try {
      localStorage.setItem(NOTIF_SEEN_STORAGE_KEY, String(pendingRequestsCount));
    } catch {
      /* best-effort */
    }
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg"
      >
        <BellIcon className="h-[21px] w-[21px]" />
        {hasUnseen && <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-primary" />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-20 w-72 rounded-[14px] border border-border bg-surface p-1.5 shadow-lg">
          <div className="flex items-center justify-between gap-2 px-2.5 py-2">
            <p className="text-xs font-bold uppercase tracking-[0.09em] text-text-muted">Notifications</p>
            {hasUnseen && (
              <button type="button" onClick={markRead} className="text-[11.5px] font-semibold text-primary hover:underline">
                Mark as read
              </button>
            )}
          </div>
          <Link
            href={requestsHref}
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-3 rounded-[11px] px-2.5 py-2.5 text-sm text-text hover:bg-bg"
          >
            <span>
              {pendingRequestsCount > 0
                ? `${pendingRequestsCount} request${pendingRequestsCount === 1 ? "" : "s"} need${pendingRequestsCount === 1 ? "s" : ""} your review`
                : "No pending requests"}
            </span>
            {pendingRequestsCount > 0 && (
              <span className="shrink-0 rounded-[7px] bg-primary/10 px-2 py-0.5 font-mono text-[12px] font-semibold text-primary">
                {pendingRequestsCount}
              </span>
            )}
          </Link>
        </div>
      )}
    </div>
  );
}
