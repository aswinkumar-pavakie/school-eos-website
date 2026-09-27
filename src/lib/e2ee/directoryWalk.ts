"use client";

// One shared, rate-limit-aware loader for the "New message" people list.
//
// The messaging service can only list the school directory a page at a time
// (100 per page) and caps directory requests at 30 per minute per person. With
// the directory now in the thousands, listing everyone needs more than 30
// requests, so a plain "fetch every page in a loop" always tripped that cap and
// surfaced as a RATE_LIMITED error. This loader:
//   - hands the screen each page as soon as it arrives (the first page, which
//     lists the person's own scoped contacts first, shows immediately),
//   - stays under the cap (at most REQUESTS_PER_WINDOW pages per minute) and,
//     if the server still says RATE_LIMITED, waits for the window to reset and
//     carries on from the same place instead of failing,
//   - shares one walk between every screen and remembers what it already loaded
//     for this browser tab, so re-opening "New message" does not fetch again.
// Nothing here changes what the server enforces or returns.

import { rememberNamesFromDiscovery } from "./nameCache";
import { discoverUsersAction, type DiscoveryItem } from "../messaging-actions";

const PAGE_LIMIT = 100;
const MAX_PAGES = 200;
const REQUESTS_PER_WINDOW = 24;
const WINDOW_MS = 61_000;

type Listener = (items: DiscoveryItem[], done: boolean) => void;

interface WalkState {
  personId: string | null;
  items: DiscoveryItem[];
  seen: Set<string>;
  cursor: string | undefined;
  pages: number;
  done: boolean;
  running: boolean;
  requestTimes: number[];
  listeners: Set<Listener>;
}

const state: WalkState = {
  personId: null,
  items: [],
  seen: new Set(),
  cursor: undefined,
  pages: 0,
  done: false,
  running: false,
  requestTimes: [],
  listeners: new Set(),
};

function emit(): void {
  const snapshot = state.items.slice();
  for (const l of state.listeners) l(snapshot, state.done);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function isRateLimited(err: unknown): boolean {
  return err instanceof Error && err.message.includes("RATE_LIMITED");
}

async function waitForBudget(): Promise<void> {
  for (;;) {
    const now = Date.now();
    state.requestTimes = state.requestTimes.filter((t) => now - t < WINDOW_MS);
    if (state.requestTimes.length < REQUESTS_PER_WINDOW) return;
    await sleep(state.requestTimes[0]! + WINDOW_MS - now + 250);
  }
}

async function run(): Promise<void> {
  if (state.running) return;
  state.running = true;
  let failures = 0;
  try {
    while (!state.done && state.pages < MAX_PAGES) {
      await waitForBudget();
      state.requestTimes.push(Date.now());
      try {
        const { data } = await discoverUsersAction({ cursor: state.cursor, limit: PAGE_LIMIT });
        failures = 0;
        const fresh: DiscoveryItem[] = [];
        for (const item of data.items) {
          if (state.seen.has(item.userId)) continue;
          state.seen.add(item.userId);
          fresh.push(item);
        }
        state.items = state.items.concat(fresh);
        rememberNamesFromDiscovery(fresh);
        state.pages += 1;
        if (!data.nextCursor || data.nextCursor === state.cursor) state.done = true;
        else state.cursor = data.nextCursor;
        emit();
      } catch (err) {
        failures += 1;
        if (isRateLimited(err)) {
          // Server-side window is still full (e.g. another tab or an earlier
          // reload used it): pause a full window, then resume where we were.
          state.requestTimes = new Array(REQUESTS_PER_WINDOW).fill(Date.now());
          continue;
        }
        if (failures >= 3) break;
        await sleep(1500);
      }
    }
  } finally {
    state.running = false;
    emit();
  }
}

/**
 * Subscribe to the directory list. `onUpdate` is called with everything loaded
 * so far (immediately if something is already cached) and again after each
 * page; `done` is true once the whole directory has loaded. Returns an
 * unsubscribe function.
 */
export function subscribeDirectory(personId: string, onUpdate: Listener): () => void {
  if (state.personId !== personId) {
    // A different person is signed in on this tab -- never show the previous
    // person's directory (scope flags differ per person).
    state.personId = personId;
    state.items = [];
    state.seen = new Set();
    state.cursor = undefined;
    state.pages = 0;
    state.done = false;
  }
  state.listeners.add(onUpdate);
  if (state.items.length > 0 || state.done) onUpdate(state.items.slice(), state.done);
  void run();
  return () => {
    state.listeners.delete(onUpdate);
  };
}
