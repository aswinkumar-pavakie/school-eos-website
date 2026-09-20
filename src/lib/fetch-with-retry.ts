// Shared retry wrapper for calls to the AI bot's Cloudflare Tunnel, which
// drops and reconnects periodically (10-40s gaps). Retries ONLY when
// fetch() itself throws (network/DNS/connection failure) -- never on a
// real HTTP response, even an error one, since that's a legitimate answer
// from the bot (e.g. a 429) that must be surfaced, not retried.
export async function fetchWithRetry(url: string, init: RequestInit, attempts = 3, delayMs = 4000): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}
