"use client";

// Parent's own decision step for a PENDING event-permission request --
// Reject or Sign as Guardian, mirroring the mobile app's own two-screen flow
// (app/(protected)/permissions/[id]/index.tsx + sign.tsx) collapsed onto one
// page since the website has no per-screen navigation stack.

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/EmptyState";
import { PermissionSignaturePad } from "./PermissionSignaturePad";
import { rejectPermissionRequestAction, signPermissionRequestAction, type FormState } from "./actions";

const initial: FormState = {};

export function PermissionDecisionForm({ requestId, studentId }: { requestId: string; studentId: string }) {
  const [rejectState, rejectAction] = useActionState(rejectPermissionRequestAction, initial);
  const [signState, signAction] = useActionState(signPermissionRequestAction, initial);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="mb-1 text-sm font-bold text-text">Sign as guardian</h2>
        <p className="mb-4 text-xs text-text-muted">
          By signing below, you confirm that you are the parent/guardian of this student and consent to their participation in this event.
        </p>
        <form action={signAction} className="flex flex-col gap-4">
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="studentId" value={studentId} />
          <PermissionSignaturePad name="signaturePngBase64" />
          <FieldError message={signState.error} />
          <div className="flex justify-end">
            <Button variant="primary" pendingLabel="Submitting…">Approve</Button>
          </div>
        </form>
      </div>

      <form
        action={rejectAction}
        onSubmit={(e) => {
          if (!confirm("Reject this request? This cannot be undone from here — the teacher will need to add the student again to re-request.")) {
            e.preventDefault();
          }
        }}
        className="flex flex-col items-end gap-2"
      >
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="studentId" value={studentId} />
        <FieldError message={rejectState.error} />
        <Button variant="danger" pendingLabel="Rejecting…">Reject request</Button>
      </form>
    </div>
  );
}
