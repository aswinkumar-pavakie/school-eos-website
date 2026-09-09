"use client";

// Login identifier (what they actually sign in with) + a gated admin password
// reset -- same real feature Parent's profile already has (see
// ParentLoginSecuritySection.tsx's own comment for the full reasoning), now
// extended to Faculty: the admin can only reset a faculty member's
// credentials once they've already used their one self-service reset
// (resetAllowanceUsed) -- i.e. this is for the *second+* "I forgot my
// password," not the first, which the faculty member handles themselves via
// the same public /auth/password-reset/* flow every real login uses.

import { useState, useTransition } from "react";
import { resetFacultyPasswordAction } from "@/app/(dashboard)/admin/faculty/actions";

interface LoginIdentifier {
  identifierType: string;
  value: string;
  isVerified: boolean;
}

export function FacultyLoginSecuritySection({
  staffId,
  personId,
  loginIdentifiers,
  resetAllowanceUsed,
}: {
  staffId: string;
  personId: string;
  // Optional at the type level even though GET /staff/:id always includes
  // both real fields now (staff.service.ts's own get()) -- defensive against
  // a stale backend process that hasn't picked up that change yet, or any
  // other transient shape mismatch, rather than a hard crash on this profile.
  loginIdentifiers?: LoginIdentifier[];
  resetAllowanceUsed?: boolean;
}) {
  const identifiers = loginIdentifiers ?? [];
  const allowanceUsed = resetAllowanceUsed ?? false;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  function handleReset() {
    setError(null);
    startTransition(async () => {
      const result = await resetFacultyPasswordAction(staffId, personId);
      if (result.error) setError(result.error);
      else setTemporaryPassword(result.temporaryPassword ?? null);
    });
  }

  return (
    <div>
      <p className="text-[13px] font-semibold text-text-muted">Logs in with</p>
      {identifiers.length === 0 ? (
        <p className="mt-1 text-sm text-text-muted">No login identifier on file.</p>
      ) : (
        <ul className="mt-1 flex flex-col gap-1">
          {identifiers.map((li) => (
            <li key={li.value} className="text-sm text-text">
              {li.value} <span className="text-xs text-text-muted">({li.identifierType.toLowerCase()})</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-border pt-4">
        {temporaryPassword ? (
          <div>
            <p className="text-[13px] font-semibold text-text">New temporary password (shown once):</p>
            <p className="mt-1.5 rounded-[11px] bg-field px-3.5 py-2.5 font-mono text-[15px] font-semibold text-text">
              {temporaryPassword}
            </p>
            <p className="mt-1.5 text-xs text-text-muted">Share it with the faculty member now — they should sign in and change it.</p>
          </div>
        ) : allowanceUsed ? (
          <>
            {error && (
              <p className="mb-2 rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{error}</p>
            )}
            <p className="text-xs text-text-muted">
              This faculty member has already used their one self-service reset — if they&apos;ve forgotten their
              password again, reset it for them here.
            </p>
            <button
              type="button"
              disabled={isPending}
              onClick={handleReset}
              className="mt-2 rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {isPending ? "Resetting…" : "Reset password"}
            </button>
          </>
        ) : (
          <p className="text-xs text-text-muted">
            This faculty member hasn&apos;t used their one self-service password reset yet — they can still reset
            it themselves. Admin reset becomes available here after that.
          </p>
        )}
      </div>
    </div>
  );
}
