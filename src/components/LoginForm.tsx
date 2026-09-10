"use client";

// Field styling ported exactly from the approved design (School EOS Login
// Redesign .dc.html) -- literal hex values, not this app's own design tokens,
// scoped to the auth screens (see AuthShell.tsx's own header comment for why).
// Everything functional is unchanged: real loginAction/useActionState, the
// same identifier field accepting either email or mobile (see actions.ts),
// the same server-driven error message shown verbatim. "Remember me" is a
// real checkbox but isn't wired to any new session behavior -- the backend
// has no such concept today, and this redesign is explicitly UI-only.

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "@/app/(auth)/login/actions";
import { EyeIcon, EyeOffIcon } from "@/components/auth/icons";

const initialState: LoginState = {};

const fieldClass =
  "h-[52px] w-full rounded-2xl border-[1.5px] border-[#E2E8F0] bg-white px-4 font-[inherit] text-[15px] text-[#0F172A] outline-none transition-colors duration-150 placeholder:text-[#94A3B8] focus:border-[#2952E3] disabled:opacity-60";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state.error ? (
        <p
          role="alert"
          className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#B91C1C]"
        >
          {state.error}
        </p>
      ) : null}

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
          disabled={isPending}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="password" className="mb-2 text-sm font-semibold text-[#0F172A]">
          Password
        </label>
        <div className="relative flex">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
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
      </div>

      <div className="flex items-center justify-between gap-4">
        <label htmlFor="remember" className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#64748B]">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            defaultChecked
            disabled={isPending}
            className="h-4 w-4 cursor-pointer accent-[#2952E3]"
          />
          Remember me
        </label>
        <Link href="/forgot-password" className="text-sm font-semibold text-[#2952E3] hover:underline">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#2952E3] text-base font-bold text-white transition-[background,box-shadow,transform] duration-150 hover:-translate-y-px hover:bg-[#1E3FC4] hover:shadow-[0_8px_20px_rgba(41,82,227,0.35)] active:translate-y-0 active:bg-[#1B2F8F] active:shadow-none disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {isPending ? (
          <>
            <span
              aria-hidden
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
