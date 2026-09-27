"use client";

import { PlainButton } from "@/components/ui/Button";

export function PrintButton() {
  return (
    <PlainButton variant="secondary" onClick={() => window.print()}>
      Print / save as PDF
    </PlainButton>
  );
}
