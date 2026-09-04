"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/(auth)/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state.error ? (
        <p
          role="alert"
          className="rounded-md bg-error-bg px-4 py-3 text-sm font-medium text-error-text"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="identifier" className="text-sm font-bold text-text">
          Email
        </label>
        <input
          id="identifier"
          name="identifier"
          type="email"
          autoComplete="username"
          required
          disabled={isPending}
          className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-bold text-text">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isPending}
          className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
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
