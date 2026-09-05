"use client";

import { useEffect } from "react";

/**
 * The whole point of this route: one click on "Print Receipt"/"Print Selected" in the
 * app opens this page in a new tab AND the print dialog appears immediately — no
 * second click on a "Print" button required. The manual PrintButton stays only as a
 * fallback (e.g. the user cancelled the dialog and wants to reprint).
 */
export function AutoPrint() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 200);
    return () => clearTimeout(timer);
  }, []);
  return null;
}
