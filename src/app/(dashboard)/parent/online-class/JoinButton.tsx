"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/parent-ui/primitives";
import { joinOnlineClassAction } from "./actions";

export function JoinButton({ classId, label }: { classId: string; label: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleJoin() {
    setPending(true);
    setError(undefined);
    const result = await joinOnlineClassAction(classId);
    setPending(false);
    if (result.meetingUrl) {
      window.open(result.meetingUrl, "_blank", "noopener,noreferrer");
    } else {
      setError(result.error ?? "Could not join this class.");
    }
  }

  return (
    <div>
      <PrimaryButton type="button" onClick={handleJoin} disabled={pending} style={{ padding: "9px 18px", fontSize: 13.5 }}>
        {pending ? "Opening…" : label}
      </PrimaryButton>
      {error && <div style={{ fontSize: 12, color: "var(--par-red)", marginTop: 6 }}>{error}</div>}
    </div>
  );
}
