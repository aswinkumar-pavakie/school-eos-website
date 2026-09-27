"use client";

import { useState } from "react";
import { useFacultyToast } from "@/components/faculty-ui/toast/ToastProvider";
import { createStaffLeaveAction } from "./actions";

const LEAVE_TYPES = [
  { value: "CASUAL", label: "Casual leave" },
  { value: "MEDICAL", label: "Medical leave" },
  { value: "EARNED", label: "Earned leave" },
];

// Pixel-rebuilt apply form -- reuses createStaffLeaveAction unchanged. Only
// wires the fields the real backend actually accepts (leaveType/fromDate/
// toDate/reason) -- the design's "Alternate arrangement"/"Station leave"/
// attachment fields have no real capture behind them, so they're left out
// rather than shown as if they were saved (never fake data).
export function StaffLeaveForm({ defaultType = "CASUAL" }: { defaultType?: string }) {
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const toast = useFacultyToast();
  // staff-od/page.tsx passes defaultType="ON_DUTY", but LEAVE_TYPES has no
  // ON_DUTY option -- the <select>'s defaultValue silently couldn't match
  // any <option>, so the browser fell back to the first one (CASUAL) both
  // on screen AND in the actual submitted form data: every OD request was
  // being saved as a casual leave request. ON_DUTY isn't a leave type the
  // user picks from a list (unlike Casual/Medical/Earned) -- it's the whole
  // nature of this request, so it's a fixed hidden field here instead.
  const isOnDuty = defaultType === "ON_DUTY";

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(undefined);
    const result = await createStaffLeaveAction({}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.show(isOnDuty ? "OD request submitted" : "Leave request submitted");
  }

  return (
    <form action={handleSubmit} style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: 24, marginTop: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {isOnDuty ? (
          <input type="hidden" name="leaveType" value="ON_DUTY" />
        ) : (
          <div>
            <div style={{ font: "600 13.5px/1 var(--eos-font-sans)", color: "var(--eos-body)", marginBottom: 9 }}>Leave type</div>
            <select name="leaveType" defaultValue={defaultType} style={{ width: "100%", border: "1px solid var(--eos-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--eos-font-sans)", background: "var(--eos-white)" }}>
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <div style={{ font: "600 13.5px/1 var(--eos-font-sans)", color: "var(--eos-body)", marginBottom: 9 }}>From date</div>
          <input type="date" name="fromDate" required style={{ width: "100%", border: "1px solid var(--eos-border)", borderRadius: 10, padding: "12px 14px", font: "400 14.5px/1 var(--eos-font-sans)" }} />
        </div>
        <div>
          <div style={{ font: "600 13.5px/1 var(--eos-font-sans)", color: "var(--eos-body)", marginBottom: 9 }}>To date</div>
          <input type="date" name="toDate" required style={{ width: "100%", border: "1px solid var(--eos-border)", borderRadius: 10, padding: "12px 14px", font: "400 14.5px/1 var(--eos-font-sans)" }} />
        </div>
      </div>
      <div style={{ font: "600 13.5px/1 var(--eos-font-sans)", color: "var(--eos-body)", margin: "18px 0 9px" }}>Reason</div>
      <textarea name="reason" required minLength={3} placeholder={isOnDuty ? "Describe the reason for your on-duty request" : "Describe the reason for your leave"} style={{ width: "100%", minHeight: 110, border: "1px solid var(--eos-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1.6 var(--eos-font-sans)", resize: "vertical" }} />
      {error && <p style={{ font: "400 12.5px/1.4 var(--eos-font-sans)", color: "var(--eos-red-text)", marginTop: 10 }}>{error}</p>}
      <button type="submit" disabled={pending} style={{ width: "100%", marginTop: 18, border: 0, cursor: "pointer", borderRadius: 11, padding: 16, font: "600 15.5px/1 var(--eos-font-sans)", color: "#fff", background: "var(--eos-primary)", opacity: pending ? 0.7 : 1 }}>
        {pending ? "Submitting…" : isOnDuty ? "Submit OD request" : "Submit leave request"}
      </button>
    </form>
  );
}
