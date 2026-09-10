// Shared parser for this app's admin "Create X" server actions. The backend's
// global ValidationPipe (validation.pipe.ts) returns 400s as a `message`
// array where each entry is class-validator's default message, always
// prefixed with the exact DTO property name (e.g. "identifierValue must be
// longer than or equal to 1 characters") -- confirmed against the real API,
// not assumed. That prefix IS the form field's own `name` attribute, so it
// maps directly onto which input to show the error under. A 409/other
// business error (e.g. "An account with this email or mobile number already
// exists.") has no such prefix -- those fall back to the general banner.

export interface ParsedApiError {
  /** Shown in the top banner -- messages that couldn't be attributed to a
   * specific field. */
  error?: string;
  /** field name -> message, for inline display under that input. */
  fieldErrors: Record<string, string>;
}

export async function parseApiError(res: Response): Promise<ParsedApiError> {
  const body = await res.json().catch(() => null);
  const message = body?.message;

  if (!Array.isArray(message)) {
    return { error: message ?? "Something went wrong. Nothing was changed.", fieldErrors: {} };
  }

  const fieldErrors: Record<string, string> = {};
  const general: string[] = [];
  for (const m of message) {
    const match = typeof m === "string" ? m.match(/^([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*)\s/) : null;
    if (match) {
      const field = match[1].split(".")[0];
      // Keep the first message per field -- later ones for the same field
      // are usually redundant (e.g. "must be a string" alongside "must not
      // be empty").
      if (!fieldErrors[field]) fieldErrors[field] = m;
    } else if (typeof m === "string") {
      general.push(m);
    }
  }

  return {
    error: general.length > 0 ? general.join(" ") : undefined,
    fieldErrors,
  };
}
