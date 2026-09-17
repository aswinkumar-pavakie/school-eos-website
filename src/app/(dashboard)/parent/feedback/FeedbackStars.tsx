"use client";

import { useActionState, useEffect, useState } from "react";
import { submitFeedbackAction, type FeedbackFormState } from "./actions";

const RATING_VALUES = [1, 2, 3, 4, 5] as const;
const initial: FeedbackFormState = {};

export function FeedbackStars({ studentId, subjectOfferingId, myRating }: { studentId: string; subjectOfferingId: string; myRating: number | null }) {
  const [error, setError] = useState<string | undefined>(undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {RATING_VALUES.map((value) => (
          <Star key={value} studentId={studentId} subjectOfferingId={subjectOfferingId} value={value} filled={myRating !== null && value <= myRating} onError={setError} />
        ))}
      </div>
      {error && <span style={{ fontSize: 12, color: "var(--par-red)" }}>{error}</span>}
    </div>
  );
}

function Star({
  studentId,
  subjectOfferingId,
  value,
  filled,
  onError,
}: {
  studentId: string;
  subjectOfferingId: string;
  value: number;
  filled: boolean;
  onError: (message: string | undefined) => void;
}) {
  const action = submitFeedbackAction.bind(null, studentId, subjectOfferingId, value);
  const [state, formAction] = useActionState(action, initial);

  useEffect(() => {
    onError(state.error);
  }, [state.error, onError]);

  return (
    <form action={formAction}>
      <button
        type="submit"
        aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
        aria-pressed={filled}
        style={{ all: "unset", cursor: "pointer", fontSize: 22, lineHeight: 1, color: filled ? "var(--par-primary)" : "var(--par-border)" }}
      >
        ★
      </button>
    </form>
  );
}
