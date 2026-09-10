"use server";

// Public self-service reset (school-eos-backend: POST /auth/password-reset/request,
// POST /auth/password-reset/complete) -- OTP-gated, one-time-use per account
// (RESET_ALREADY_USED once it's been used -- the backend's own error, passed
// through unchanged; the admin re-reset flow on each profile page is what a
// second "forgot password" goes through instead). Neither call is
// authenticated -- this page exists specifically for someone who can't sign
// in at all right now.

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

export interface RequestResetState {
  error?: string;
  requested?: boolean;
  identifier?: string;
}

export async function requestResetAction(
  _prev: RequestResetState,
  formData: FormData,
): Promise<RequestResetState> {
  const identifier = formData.get("identifier");
  if (typeof identifier !== "string" || identifier.trim() === "") {
    return { error: "Email or mobile number is required." };
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/password-reset/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
      cache: "no-store",
    });
  } catch {
    return { error: "Unable to reach the server. Please try again." };
  }

  // Deliberately the same success response whether or not that identifier
  // exists -- never let this screen confirm/deny a real account exists.
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { error: body?.message ?? "Something went wrong. Please try again." };
  }

  return { requested: true, identifier };
}

export interface CompleteResetState {
  error?: string;
  done?: boolean;
}

export async function completeResetAction(
  identifier: string,
  _prev: CompleteResetState,
  formData: FormData,
): Promise<CompleteResetState> {
  const otp = formData.get("otp");
  const newPassword = formData.get("newPassword");

  if (typeof otp !== "string" || otp.trim() === "") {
    return { error: "Enter the code you received." };
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/password-reset/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, otp, newPassword }),
      cache: "no-store",
    });
  } catch {
    return { error: "Unable to reach the server. Please try again." };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { error: body?.message ?? "That code didn't work. Please try again." };
  }

  return { done: true };
}
