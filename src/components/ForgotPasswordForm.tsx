"use client";

// Two-step self-service reset: (1) request a code sent to the account's own
// login identifier, (2) enter that code + a new password. Same public
// backend flow every "forgot password" already relies on
// (POST /auth/password-reset/request, .../complete) -- this is just the
// first web page to actually expose it; previously admin had to do this for
// everyone, every time. Field/button styling matches LoginForm.tsx exactly --
// same literal hex values from the approved design, so both auth screens
// read as one continuous flow.

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  requestResetAction,
  completeResetAction,
  type RequestResetState,
  type CompleteResetState,
} from "@/app/(auth)/forgot-password/actions";
import { EyeIcon, EyeOffIcon } from "@/components/auth/icons";

const requestInitial: RequestResetState = {};
const completeInitial: CompleteResetState = {};

const fieldClass =
  "h-[52px] w-full rounded-2xl border-[1.5px] border-[#E2E8F0] bg-white px-4 font-[inherit] text-[15px] text-[#0F172A] outline-none transition-colors duration-150 placeholder:text-[#94A3B8] focus:border-[#2952E3] disabled:opacity-60";

const submitClass =
  "flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#2952E3] text-base font-bold text-white transition-[background,box-shadow,transform] duration-150 hover:-translate-y-px hover:bg-[#1E3FC4] hover:shadow-[0_8px_20px_rgba(41,82,227,0.35)] active:translate-y-0 active:bg-[#1B2F8F] active:shadow-none disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none";

export function ForgotPasswordForm() {
  const [requestState, requestFormAction, isRequesting] = useActionState(requestResetAction, requestInitial);

  if (requestState.requested && requestState.identifier) {
    return <CompleteStep identifier={requestState.identifier} />;
  }

  return (
    <form action={requestFormAction} className="flex flex-col gap-5" noValidate>
      {requestState.error && (
        <p role="alert" className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#B91C1C]">
          {requestState.error}
        </p>
      )}

      <div className="flex flex-col">
        <label htmlFor="identifier" className="mb-2 text-sm font-semibold text-[#0F172A]">
          Email or mobile number
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          inputMode="email"
          placeholder="you@school.edu"
          autoComplete="username"
          required
          disabled={isRequesting}
          className={fieldClass}
        />
      </div>

      <button type="submit" disabled={isRequesting} className={submitClass}>
        {isRequesting ? "Sending…" : "Send reset code"}
      </button>

      <Link href="/login" className="text-center text-sm font-semibold text-[#2952E3] hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}

function CompleteStep({ identifier }: { identifier: string }) {
  const boundAction = completeResetAction.bind(null, identifier);
  const [state, formAction, isPending] = useActionState(boundAction, completeInitial);
  const [showPassword, setShowPassword] = useState(false);

  if (state.done) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-xl bg-[#ECFDF3] px-4 py-3 text-sm font-medium text-[#027A48]">
          Password updated. Sign in with your new password.
        </p>
        <Link href="/login" className={`${submitClass} no-underline`}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <p className="-mt-1 text-sm text-[#64748B]">
        We sent a code to <span className="font-semibold text-[#0F172A]">{identifier}</span>. Enter it below with
        your new password.
      </p>

      {state.error && (
        <p role="alert" className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#B91C1C]">
          {state.error}
        </p>
      )}

      <div className="flex flex-col">
        <label htmlFor="otp" className="mb-2 text-sm font-semibold text-[#0F172A]">
          Reset code
        </label>
        <input
          id="otp"
          name="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          disabled={isPending}
          className={`${fieldClass} tracking-[0.3em]`}
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="newPassword" className="mb-2 text-sm font-semibold text-[#0F172A]">
          New password
        </label>
        <div className="relative flex">
          <input
            id="newPassword"
            name="newPassword"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={isPending}
            className={`${fieldClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={isPending}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-[6px] top-[6px] flex h-10 w-10 items-center justify-center rounded-[10px] text-[#94A3B8] transition-colors duration-100 hover:bg-[#F1F5FD] hover:text-[#2952E3] disabled:opacity-60"
          >
            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-[#64748B]">At least 8 characters.</p>
      </div>

      <button type="submit" disabled={isPending} className={submitClass}>
        {isPending ? "Updating…" : "Update password"}
      </button>

      <Link href="/login" className="text-center text-sm font-semibold text-[#2952E3] hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}
