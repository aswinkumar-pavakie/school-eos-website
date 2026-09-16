"use client";

import { useState } from "react";
import { useFacultyToast } from "@/components/faculty-ui/toast/ToastProvider";
import { createHrRequestAction } from "./actions";

const CATEGORIES = [
  { value: "SALARY_QUERY", label: "Salary query" },
  { value: "PF_ESI", label: "PF / ESI" },
  { value: "INCOME_TAX_DECLARATION", label: "Income tax declaration" },
  { value: "INCREMENT_ARREARS", label: "Increment / arrears" },
  { value: "BANK_ACCOUNT_CHANGE", label: "Bank account change" },
  { value: "SERVICE_CERTIFICATE", label: "Service certificate" },
];

export function HrRequestForm() {
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const toast = useFacultyToast();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(undefined);
    const result = await createHrRequestAction({}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.show("HR request submitted");
  }

  return (
    <form action={handleSubmit} style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 24 }}>
      <div style={{ font: "600 13.5px/1 var(--fac-font-sans)", color: "var(--fac-body)", marginBottom: 9 }}>Request category</div>
      <select name="category" required style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }}>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      <div style={{ font: "600 13.5px/1 var(--fac-font-sans)", color: "var(--fac-body)", margin: "18px 0 9px" }}>Subject</div>
      <input name="subject" required placeholder="e.g. Revised PF contribution query" style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }} />
      <div style={{ font: "600 13.5px/1 var(--fac-font-sans)", color: "var(--fac-body)", margin: "18px 0 9px" }}>Description</div>
      <textarea name="description" placeholder="Describe your request in detail" style={{ width: "100%", minHeight: 120, border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1.6 var(--fac-font-sans)", resize: "vertical" }} />
      {error && <p style={{ font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-red-text)", marginTop: 10 }}>{error}</p>}
      <button type="submit" disabled={pending} style={{ width: "100%", marginTop: 18, border: 0, cursor: "pointer", borderRadius: 11, padding: 16, font: "600 15.5px/1 var(--fac-font-sans)", color: "#fff", background: "var(--fac-primary)", opacity: pending ? 0.7 : 1 }}>
        {pending ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
