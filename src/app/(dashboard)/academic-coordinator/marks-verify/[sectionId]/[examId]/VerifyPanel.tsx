"use client";

import { useActionState, useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/academic-coordinator-ui/primitives";
import { sendBackAction, verifyAction, type FormState } from "../../actions";

const initialState: FormState = {};

export function VerifyPanel({ sectionId, examId, examName }: { sectionId: string; examId: string; examName: string }) {
  const [comment, setComment] = useState("");
  const [verifyState, verifyFormAction, verifyPending] = useActionState(verifyAction, initialState);
  const [sendBackState, sendBackFormAction, sendBackPending] = useActionState(sendBackAction, initialState);
  const pending = verifyPending || sendBackPending;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "20px 22px" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)", marginBottom: 12 }}>Verify</div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comment for the teacher (required to send back)"
        style={{ width: "100%", minHeight: 110, border: "1px solid var(--acc-border)", borderRadius: 11, padding: "13px 14px", fontSize: 14.5, outline: "none", resize: "vertical" }}
      />
      {(verifyState.error || sendBackState.error) && (
        <p role="alert" style={{ margin: "10px 0 0", fontSize: 13, fontWeight: 600, color: "var(--acc-red)" }}>
          {verifyState.error || sendBackState.error}
        </p>
      )}
      <div style={{ display: "flex", gap: 11, marginTop: 14, flexWrap: "wrap" }}>
        <form action={verifyFormAction} style={{ flex: 1, minWidth: 140 }}>
          <input type="hidden" name="sectionId" value={sectionId} />
          <input type="hidden" name="examId" value={examId} />
          <PrimaryButton type="submit" disabled={pending} style={{ width: "100%", padding: 14 }}>
            {verifyPending ? "Approving…" : "Approve"}
          </PrimaryButton>
        </form>
        <form action={sendBackFormAction} style={{ flex: 1, minWidth: 140 }}>
          <input type="hidden" name="sectionId" value={sectionId} />
          <input type="hidden" name="examId" value={examId} />
          <input type="hidden" name="comment" value={comment} />
          <SecondaryButton type="submit" disabled={pending} style={{ width: "100%", padding: 14, borderColor: "var(--acc-red)", color: "var(--acc-red)" }}>
            {sendBackPending ? "Sending…" : "Send back"}
          </SecondaryButton>
        </form>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--acc-tertiary)", marginTop: 12 }}>
        Approving locks the marks for the report card. Sending back opens a correction entry for {examName}.
      </div>
    </div>
  );
}
