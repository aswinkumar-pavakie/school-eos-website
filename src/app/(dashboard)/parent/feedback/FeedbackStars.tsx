"use client";

import { useActionState, useEffect, useState } from "react";
import { FieldError } from "@/components/ui/EmptyState";
import { submitFeedbackAction, type FeedbackFormState } from "./actions";

const RATING_VALUES = [1, 2, 3, 4, 5] as const;
const initial: FeedbackFormState = {};

export function FeedbackStars({
  studentId,
  subjectOfferingId,
  myRating,
}: {
  studentId: string;
  subjectOfferingId: string;
  myRating: number | null;
}) {
  const [error, setError] = useState<string | undefined>(undefined);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        {RATING_VALUES.map((value) => (
          <Star
            key={value}
            studentId={studentId}
            subjectOfferingId={subjectOfferingId}
            value={value}
            filled={myRating !== null && value <= myRating}
            onError={setError}
          />
        ))}
      </div>
      <FieldError message={error} />
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
        className={`text-2xl leading-none transition-colors ${filled ? "text-primary" : "text-border"} hover:text-primary`}
      >
        ★
      </button>
    </form>
  );
}
