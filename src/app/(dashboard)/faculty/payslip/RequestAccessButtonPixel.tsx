"use client";

import { useState } from "react";
import { useFacultyToast } from "@/components/faculty-ui/toast/ToastProvider";
import { requestPayslipAccessAction } from "./actions";

export function RequestAccessButtonPixel() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const toast = useFacultyToast();

  async function handleClick() {
    setPending(true);
    setError(undefined);
    const result = await requestPayslipAccessAction({}, new FormData());
    setPending(false);
    if (result.error) setError(result.error);
    else toast.show("Access requested");
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        style={{ border: 0, cursor: "pointer", borderRadius: 10, padding: "13px 22px", font: "600 14.5px/1 var(--fac-font-sans)", color: "#fff", background: "var(--fac-primary)", opacity: pending ? 0.7 : 1 }}
      >
        {pending ? "Requesting…" : "Request payslip access"}
      </button>
      {error && <p style={{ font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-red-text)", marginTop: 8 }}>{error}</p>}
    </div>
  );
}
