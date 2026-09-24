"use client";

// One request form for the Campus screens (Food Court, Medical, Feedback):
// the fields are data, the submit is a server action from ./actions.ts.

import { useActionState, useEffect, useRef } from "react";
import { useFacultyToast } from "@/components/faculty-ui/toast/ToastProvider";
import type { CampusFormState } from "./actions";

export interface CampusField {
  name: string;
  label: string;
  kind: "text" | "textarea" | "date" | "select";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

const CONTROL: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--fac-border)",
  borderRadius: 10,
  padding: "12px 14px",
  font: "400 14.5px/1.3 var(--fac-font-sans)",
  color: "var(--fac-ink)",
  background: "var(--fac-white)",
};

export function CampusRequestForm({
  action,
  fields,
  submitLabel,
  successText,
}: {
  action: (prev: CampusFormState, formData: FormData) => Promise<CampusFormState>;
  fields: CampusField[];
  submitLabel: string;
  successText: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useFacultyToast();

  useEffect(() => {
    if (state.done) {
      formRef.current?.reset();
      toast.show(successText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={`cf-${f.name}`} style={{ display: "block", font: "600 13px/1 var(--fac-font-sans)", color: "var(--fac-body)", marginBottom: 8 }}>
            {f.label}
          </label>
          {f.kind === "textarea" ? (
            <textarea id={`cf-${f.name}`} name={f.name} required={f.required} placeholder={f.placeholder} rows={4} style={{ ...CONTROL, resize: "vertical" }} />
          ) : f.kind === "select" ? (
            <select id={`cf-${f.name}`} name={f.name} required={f.required} defaultValue={f.options?.[0]?.value} style={CONTROL}>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <input id={`cf-${f.name}`} name={f.name} type={f.kind === "date" ? "date" : "text"} required={f.required} placeholder={f.placeholder} style={CONTROL} />
          )}
        </div>
      ))}
      {state.error && (
        <div role="alert" style={{ font: "500 13px/1.4 var(--fac-font-sans)", color: "var(--fac-red-text)" }}>{state.error}</div>
      )}
      <button
        type="submit"
        disabled={pending}
        style={{ border: 0, cursor: pending ? "default" : "pointer", background: "var(--fac-primary)", color: "#fff", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 10, padding: "14px 18px", opacity: pending ? 0.7 : 1 }}
      >
        {pending ? "Submitting…" : submitLabel}
      </button>
    </form>
  );
}
