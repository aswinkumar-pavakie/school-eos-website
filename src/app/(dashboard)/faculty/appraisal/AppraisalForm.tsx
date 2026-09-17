"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFacultyToast } from "@/components/faculty-ui/toast/ToastProvider";
import { createAppraisalAction } from "./actions";

// Matches the mobile app's own composer exactly -- only the fields the real
// backend accepts (cycle + selfAssessment). The design's weighted
// per-criterion scoring sections have no real capture behind them
// (self-score/description per criterion isn't in the backend's
// CreateAppraisalDto, and mobile's own real screen doesn't have them
// either), so they're left out rather than shown as fake inputs.
export function AppraisalForm({ onDone }: { onDone?: () => void }) {
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const toast = useFacultyToast();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(undefined);
    const result = await createAppraisalAction({}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.show("Self-assessment submitted");
    router.refresh();
    onDone?.();
  }

  return (
    <form action={handleSubmit} style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 24 }}>
      <div style={{ font: "600 13.5px/1 var(--fac-font-sans)", color: "var(--fac-body)", marginBottom: 9 }}>Cycle</div>
      <input name="cycle" required minLength={4} placeholder="e.g. 2026-2027" style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }} />
      <div style={{ font: "600 13.5px/1 var(--fac-font-sans)", color: "var(--fac-body)", margin: "18px 0 9px" }}>Self assessment</div>
      <textarea name="selfAssessment" required minLength={20} rows={6} placeholder="Describe your key contributions this cycle" style={{ width: "100%", minHeight: 140, border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1.6 var(--fac-font-sans)", resize: "vertical" }} />
      {error && <p style={{ font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-red-text)", marginTop: 10 }}>{error}</p>}
      <button type="submit" disabled={pending} style={{ width: "100%", marginTop: 18, border: 0, cursor: "pointer", borderRadius: 11, padding: 16, font: "600 15.5px/1 var(--fac-font-sans)", color: "#fff", background: "var(--fac-primary)", opacity: pending ? 0.7 : 1 }}>
        {pending ? "Submitting…" : "Submit self-assessment"}
      </button>
    </form>
  );
}
