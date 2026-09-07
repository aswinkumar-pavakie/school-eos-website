"use client";

// Login identifier (what they actually sign in with -- distinct from their
// contact mobile/email, which can drift out of sync) + a gated admin password
// reset. Per explicit instruction: the admin can only reset a parent's
// credentials once they've already used their one self-service reset
// (resetAllowanceUsed) -- i.e. this is for the *second+* "I forgot my
// password," not the first, which the parent handles themselves.

import { useState, useTransition } from "react";
import { resetParentPasswordAction } from "@/app/(dashboard)/admin/parents/actions";

interface LoginIdentifier {
  identifierType: string;
  value: string;
  isVerified: boolean;
}

export function ParentLoginSecuritySection({
  personId,
  loginIdentifiers,
  resetAllowanceUsed,
}: {
  personId: string;
  loginIdentifiers: LoginIdentifier[];
  resetAllowanceUsed: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  function handleReset() {
    setError(null);
    startTransition(async () => {
      const result = await resetParentPasswordAction(personId);
      if (result.error) setError(result.error);
      else setTemporaryPassword(result.temporaryPassword ?? null);
    });
  }

  return (
    <div>
      <p className="text-[13px] font-semibold text-text-muted">Logs in with</p>
      {loginIdentifiers.length === 0 ? (
        <p className="mt-1 text-sm text-text-muted">No login identifier on file.</p>
      ) : (
        <ul className="mt-1 flex flex-col gap-1">
          {loginIdentifiers.map((li) => (
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
            <p className="mt-1.5 text-xs text-text-muted">Share it with the parent now — they should sign in and change it.</p>
          </div>
        ) : resetAllowanceUsed ? (
          <>
            {error && (
              <p className="mb-2 rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{error}</p>
            )}
            <p className="text-xs text-text-muted">
              This parent has already used their one self-service reset — if they&apos;ve forgotten their password
              again, reset it for them here.
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
            This parent hasn&apos;t used their one self-service password reset yet — they can still reset it
            themselves. Admin reset becomes available here after that.
          </p>
        )}
      </div>
    </div>
  );
}
