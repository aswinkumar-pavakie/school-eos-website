// MLS group lifecycle for a School EOS conversation: exactly 2 members,
// created once, never resized. Identical logic to the mobile app's own
// src/services/e2ee/group.ts -- no Update/Commit rekeying in V1
// (deliberately -- per-message forward secrecy already comes from MLS's own
// secret-tree ratchet on every application message, independent of whether
// any Update commit ever fires).

import { createCommit, createGroup, joinGroup, emptyPskIndex } from "ts-mls";
import { withConversationLock } from "./conversationLock";
import { getMlsCiphersuiteImpl } from "./setup";
import { generateOwnKeyPackage } from "./keyPackage";
import { listPoolEntries, loadGroupState, removeFromPool, saveGroupState } from "./storage";
import { decodeKeyPackageFromWire, encodeWelcomeForWire, decodeWelcomeFromWire } from "./wire";

/** Creator flow -- called once, when starting a brand-new conversation. The
 * real conversation id isn't known until the server responds to
 * POST /conversations or /requests, so this generates its own temporary
 * local id, saves post-commit state under that, and returns it for the
 * caller to rename once the real conversation id is known. */
export async function createGroupForConversation(targetKeyPackageWire: string): Promise<{ welcomeWire: string; tempGroupId: string }> {
  const impl = await getMlsCiphersuiteImpl();
  const self = await generateOwnKeyPackage();
  const tempGroupId = crypto.randomUUID();

  let state = await createGroup(new TextEncoder().encode(tempGroupId), self.publicPackage, self.privatePackage, [], impl);

  const targetKeyPackage = decodeKeyPackageFromWire(targetKeyPackageWire);
  const commitResult = await createCommit(
    { state, cipherSuite: impl },
    { extraProposals: [{ proposalType: "add", add: { keyPackage: targetKeyPackage } }], ratchetTreeExtension: true },
  );
  state = commitResult.newState;
  if (!commitResult.welcome) {
    throw new Error("MLS group creation did not produce a Welcome.");
  }

  // Persist the POST-commit state BEFORE returning anything -- an initial
  // chat message must only ever be encrypted against this already-durable
  // state, never the pre-commit one.
  await saveGroupState(tempGroupId, state);

  return { welcomeWire: encodeWelcomeForWire(commitResult.welcome), tempGroupId };
}

/** Joiner flow -- called the first time this browser sees a conversation
 * with a pending mlsWelcome. The server never tells the joining client which
 * of its own previously-published KeyPackages a given Welcome targets, so
 * this tries each locally-cached, not-yet-matched pool entry until one
 * actually decrypts the Welcome. */
export async function joinConversationFromWelcome(conversationId: string, welcomeWire: string): Promise<void> {
  return withConversationLock(conversationId, async () => {
    const alreadyJoined = await loadGroupState(conversationId);
    if (alreadyJoined) return; // idempotent: a retried ack-less fetch is a safe no-op

    const impl = await getMlsCiphersuiteImpl();
    const welcome = decodeWelcomeFromWire(welcomeWire);
    const pool = await listPoolEntries();

    let joined: { state: Awaited<ReturnType<typeof joinGroup>>; serverId: string } | null = null;
    for (const entry of pool) {
      try {
        const state = await joinGroup(welcome, entry.publicPackage, entry.privatePackage, emptyPskIndex, impl);
        joined = { state, serverId: entry.serverId };
        break;
      } catch {
        // Wrong KeyPackage for this Welcome -- expected for every pool entry
        // except the one the server actually consumed; try the next.
        continue;
      }
    }

    if (!joined) {
      throw new Error(
        "Could not join this conversation: no locally-cached KeyPackage matches the received Welcome. " +
          "This browser may have republished/replenished since the Welcome was created, or local storage was cleared.",
      );
    }

    await saveGroupState(conversationId, joined.state);
    await removeFromPool(joined.serverId);
  });
}
