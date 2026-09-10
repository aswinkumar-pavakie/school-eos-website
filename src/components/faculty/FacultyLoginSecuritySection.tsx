"use client";

// Login identifier (what they actually sign in with) + a gated admin password
// reset -- same real feature Parent's profile already has (see
// ParentLoginSecuritySection.tsx's own comment for the full reasoning), now
// extended to Faculty: the admin can only reset a faculty member's
// credentials once they've already used their one self-service reset
// (resetAllowanceUsed) -- i.e. this is for the *second+* "I forgot my
// password," not the first, which the faculty member handles themselves via
// the same public /auth/password-reset/* flow every real login uses.
//
// adminVisiblePassword: same real feature/reasoning as
// ParentLoginSecuritySection.tsx's own header comment -- shown here in the
// clear only while it's still the password Admin created/last reset;
// self-service clears it server-side and this switches to a status line.

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
  personName,
  loginIdentifiers,
  resetAllowanceUsed,
  adminVisiblePassword,
}: {
  staffId: string;
  personId: string;
  personName: string;
  // Optional at the type level even though GET /staff/:id always includes
  // both real fields now (staff.service.ts's own get()) -- defensive against
  // a stale backend process that hasn't picked up that change yet, or any
  // other transient shape mismatch, rather than a hard crash on this profile.
  loginIdentifiers?: LoginIdentifier[];
  resetAllowanceUsed?: boolean;
  adminVisiblePassword?: string | null;
}) {
  const identifiers = loginIdentifiers ?? [];
  const allowanceUsed = resetAllowanceUsed ?? false;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  function handleReset() {
    setError(null);
    startTransition(async () => {
      const result = await resetFacultyPasswordAction(staffId, personId, newPassword || undefined);
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

      {!temporaryPassword && (adminVisiblePassword || allowanceUsed) && (
        <div className="mt-3">
          {adminVisiblePassword ? (
            <div>
              <p className="text-[13px] font-semibold text-text-muted">Current password</p>
              <p className="mt-1.5 rounded-[11px] bg-field px-3.5 py-2.5 font-mono text-[15px] font-semibold text-text">
                {adminVisiblePassword}
              </p>
              <p className="mt-1.5 text-xs text-text-muted">
                Set by admin — visible here until {personName} changes it themselves.
              </p>
            </div>
          ) : (
            // allowanceUsed is true here (the || above guarantees it) -- a
            // reliable signal they've actually gone through the self-service
            // flow, not just an older row that predates this column.
            <p className="text-xs text-text-muted">
              {personName} has changed this password since — it&apos;s no longer visible to admin.
            </p>
          )}
        </div>
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
            <label className="mt-2 flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Set password (optional)</span>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isPending}
                placeholder="Leave blank to auto-generate one"
                minLength={8}
                className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
              />
            </label>
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
