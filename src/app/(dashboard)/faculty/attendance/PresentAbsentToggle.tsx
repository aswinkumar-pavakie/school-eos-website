"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFacultyToast } from "@/components/faculty-ui/toast/ToastProvider";
import { markRecordAction, type FormState } from "./actions";

const initial: FormState = {};

// Matches the design's P/A toggle-button pair exactly -- reuses the EXISTING
// markRecordAction server action unchanged (src/app/(dashboard)/faculty/
// attendance/actions.ts), only the buttons are new.
export function PresentAbsentToggle({ recordId, sectionId, status }: { recordId: string; sectionId: string; status: string }) {
  const [state, formAction] = useActionState(markRecordAction.bind(null, recordId, sectionId), initial);
  const formRef = useRef<HTMLFormElement>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);
  const pendingStatus = useRef<string | null>(null);
  const toast = useFacultyToast();
  const prevState = useRef(state);

  useEffect(() => {
    if (state !== prevState.current && !state.error && pendingStatus.current) {
      toast.show(`Marked ${pendingStatus.current === "PRESENT" ? "present" : "absent"}`);
      pendingStatus.current = null;
    }
    prevState.current = state;
  }, [state, toast]);

  function submit(next: "PRESENT" | "ABSENT") {
    pendingStatus.current = next;
    // Set the hidden input's DOM value directly -- a ref update alone
    // wouldn't re-render before requestSubmit() reads the form's current
    // field values synchronously.
    if (statusInputRef.current) statusInputRef.current.value = next;
    formRef.current?.requestSubmit();
  }

  const isPresent = status === "PRESENT" || status === "LATE" || status === "HALF_DAY";
  const isAbsent = status === "ABSENT";

  return (
    <form ref={formRef} action={formAction}>
      <input ref={statusInputRef} type="hidden" name="status" defaultValue="" />
      <span className="flex gap-2.5">
        <button
          type="button"
          onClick={() => submit("PRESENT")}
          style={{
            width: 62,
            border: `1px solid ${isPresent ? "var(--fac-primary)" : "var(--fac-border-focus)"}`,
            cursor: "pointer",
            borderRadius: 9,
            padding: "10px 0",
            font: "600 14px/1 var(--fac-font-sans)",
            background: isPresent ? "var(--fac-primary)" : "var(--fac-white)",
            color: isPresent ? "#fff" : "var(--fac-primary)",
          }}
        >
          P
        </button>
        <button
          type="button"
          onClick={() => submit("ABSENT")}
          style={{
            width: 62,
            border: `1px solid ${isAbsent ? "var(--fac-ink)" : "var(--fac-border)"}`,
            cursor: "pointer",
            borderRadius: 9,
            padding: "10px 0",
            font: "600 14px/1 var(--fac-font-sans)",
            background: isAbsent ? "var(--fac-ink)" : "var(--fac-white)",
            color: isAbsent ? "#fff" : "var(--fac-body-muted)",
          }}
        >
          A
        </button>
      </span>
      {state.error && <span style={{ display: "block", font: "400 11px/1.3 var(--fac-font-sans)", color: "var(--fac-red-text)", marginTop: 4 }}>{state.error}</span>}
    </form>
  );
}
