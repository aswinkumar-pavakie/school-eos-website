"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FieldLabel, PrimaryButton, SecondaryButton, TextInput } from "@/components/hostel-warden-ui/primitives";
import { useFlash } from "@/components/hostel-warden-ui/FlashContext";
import { createStudySessionAction } from "./actions";

function todayLocalIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function NewSessionForm() {
  const [open, setOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState(todayLocalIso());
  const [startTime, setStartTime] = useState("19:30");
  const [endTime, setEndTime] = useState("21:00");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { showFlash } = useFlash();

  if (!open) {
    return (
      <PrimaryButton type="button" style={{ height: 36 }} onClick={() => setOpen(true)}>
        + New study session
      </PrimaryButton>
    );
  }

  return (
    <div className="card" style={{ border: "1px solid var(--hw-accent-300)", borderRadius: "var(--hw-radius-md)", padding: 18 }}>
      <h2 style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em" }}>New study session</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        <FieldLabel>
          Date
          <TextInput type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
        </FieldLabel>
        <FieldLabel>
          Start time
          <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </FieldLabel>
        <FieldLabel>
          End time
          <TextInput type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </FieldLabel>
      </div>
      {error && <p role="alert" style={{ margin: "12px 0 0", fontSize: 12.5, fontWeight: 600, color: "var(--hw-red-text)" }}>{error}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
        <PrimaryButton
          type="button"
          disabled={pending}
          style={{ height: 32, fontSize: 12.5 }}
          onClick={() =>
            startTransition(async () => {
              setError(undefined);
              try {
                const { id } = await createStudySessionAction({ sessionDate, startTime, endTime });
                showFlash("Study session created.");
                router.push(`/hostel-warden/study-hours/${id}`);
              } catch (err) {
                setError(err instanceof Error ? err.message : "That didn't work. Please try again.");
              }
            })
          }
        >
          {pending ? "Creating…" : "Create session"}
        </PrimaryButton>
        <SecondaryButton type="button" style={{ height: 32, fontSize: 12.5 }} onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </SecondaryButton>
      </div>
    </div>
  );
}
