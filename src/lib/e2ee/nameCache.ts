// Display-name resolution for conversation participants. The messaging
// microservice deliberately never stores or returns a person's name (an
// anti-enumeration/privacy boundary) -- Discovery is the one place it does
// surface a name (relayed from Core's own scoped-relationship projection),
// so every name this browser ever learns from Discovery is cached locally,
// keyed by personId. Identical approach to the mobile app's own
// src/features/messaging-v2/nameCache.ts, localStorage instead of
// AsyncStorage. A conversation opened without ever having gone through
// Discovery on this browser has no cached name yet -- resolveDisplayName's
// fallback is named and visible, not silently blank.

import type { DiscoveryItem } from "../messaging-actions";

interface CachedPerson {
  name: string;
  // Same Discovery-only provenance as name above -- never fetched separately,
  // never fabricated. Absent for a conversation opened without ever having
  // gone through Discovery on this browser.
  designation: string | null;
}

const STORAGE_KEY = "messaging-v2:person-name-cache";
const memoryCache = new Map<string, CachedPerson>();
let hydrated = false;

function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const entries = JSON.parse(raw) as [string, string | CachedPerson][];
    for (const [id, value] of entries) {
      // Back-compat with the older cache shape (a plain name string).
      memoryCache.set(id, typeof value === "string" ? { name: value, designation: null } : value);
    }
  } catch {
    // A corrupt/missing cache just means names resolve to the fallback until
    // re-learned from Discovery -- never worth failing anything over.
  }
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...memoryCache.entries()]));
  } catch {
    // Best-effort only.
  }
}

export function rememberNamesFromDiscovery(items: DiscoveryItem[]): void {
  hydrate();
  let changed = false;
  for (const item of items) {
    const designation = item.designation ?? item.role ?? null;
    const existing = memoryCache.get(item.userId);
    if (!existing || existing.name !== item.displayName || existing.designation !== designation) {
      memoryCache.set(item.userId, { name: item.displayName, designation });
      changed = true;
    }
  }
  if (changed) persist();
}

export function resolveDisplayName(personId: string): string {
  hydrate();
  return memoryCache.get(personId)?.name ?? "School EOS user";
}

export function resolveDesignation(personId: string): string | null {
  hydrate();
  return memoryCache.get(personId)?.designation ?? null;
}
