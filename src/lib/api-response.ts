// Shared error-parsing step for this app's server-side API client files
// (faculty-api.ts, parent-api.ts, principal-api.ts, etc.) -- previously each
// file duplicated this exact same check independently. Centralized here so
// there's one place to read/change how a non-OK response becomes a thrown
// Error, not 20+ copies. Behavior is unchanged from what every one of those
// files already did: same message extraction, same fallback text, same
// thrown Error type -- a caller doing `catch (err) { err.message }` keeps
// working exactly as before.
export async function parseApiResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message;
    throw new Error(message ?? `Request failed (${res.status})`);
  }
  return body as T;
}
