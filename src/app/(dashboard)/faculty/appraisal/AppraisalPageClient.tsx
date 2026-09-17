"use client";

import { useState } from "react";
import { AppraisalForm } from "./AppraisalForm";

export function AppraisalPageClient() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 18 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", border: 0, cursor: "pointer", background: "var(--fac-primary)", color: "#fff", font: "600 14.5px/1 var(--fac-font-sans)", borderRadius: 11, padding: "14px 0" }}
      >
        {open ? "Cancel" : "+ Submit self-assessment"}
      </button>
      {open && (
        <div style={{ marginTop: 14 }}>
          <AppraisalForm onDone={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
