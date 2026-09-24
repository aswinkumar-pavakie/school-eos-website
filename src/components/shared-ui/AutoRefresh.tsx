"use client";

// Re-fetches the current server-rendered page on an interval so live state
// (a class going "Live now", a cancellation, a reschedule) shows up without a
// manual reload. Only refreshes while the tab is visible.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);
  return null;
}
