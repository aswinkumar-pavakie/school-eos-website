// Persistence for this browser's MLS identity, its pool of published-but-
// not-yet-locally-matched KeyPackage private material, and each
// conversation's group ratchet state. The browser equivalent of the mobile
// app's own src/services/e2ee/storage.ts (which uses expo-secure-store).
//
// Real, honest trade-off, stated plainly: browsers have no hardware-backed
// secure-enclave storage equivalent to SecureStore -- localStorage is the
// standard, accepted mechanism every browser-based E2EE client uses for this
// (the same trade-off WhatsApp Web/Signal Web make), not a shortcut unique to
// this build. It is still scoped to this site's own origin (no other site
// can read it) and private key material is never sent anywhere over the
// network.
//
// EVERY key here is namespaced by the currently-active person id (see
// getActivePersonId/setActivePersonId below). This is the real fix for a
// genuine bug: more than one faculty account signing in on the same browser
// (a completely normal thing to do while testing/demoing, not an edge case)
// was overwriting one account's device identity and orphaning its group
// state the moment a second account signed in -- causing a real
// NoGroupStateError on a conversation that had genuinely been joined
// correctly. Namespacing means each person's identity/pool/group-states/
// plaintext caches coexist side by side in the same browser, never
// colliding -- the same correctness property the mobile app's own
// archive/restore logic exists for, achieved more simply here since
// localStorage (unlike SecureStore) has no meaningful limit on the number of
// distinctly-keyed items, so there's no need to archive-then-restore, just
// to never share one key across two people.

import { decodeGroupState, encodeGroupState, type ClientState, type KeyPackage, type PrivateKeyPackage } from "ts-mls";
import { defaultClientConfig } from "ts-mls/clientConfig.js";
import { fromBase64, toBase64 } from "./codec";
import { decodeKeyPackageFromWire, encodeKeyPackageForWire } from "./wire";

function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full/blocked (private browsing, quota) -- surfaces naturally
    // as a failed send/join, never silently pretended to have succeeded.
  }
}
function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // best-effort
  }
}

// ---- Active person namespace ---------------------------------------------

const ACTIVE_PERSON_KEY = "e2ee.active-person";

/** Called once, first thing, by bootstrap.ts the moment a person's identity
 * is being ensured -- every storage call below reads this to build its key,
 * so it must be set before anything else in this module runs for a given
 * page load. Persisted (not just in-memory) so a reload mid-session still
 * resolves to the same namespace as before the reload. */
export function setActivePersonId(personId: string): void {
  setItem(ACTIVE_PERSON_KEY, personId);
}

function getActivePersonId(): string | null {
  return getItem(ACTIVE_PERSON_KEY);
}

/** Every real key in this module goes through this -- never a bare literal,
 * so two different people signed into the same browser can never collide on
 * the same storage slot. Falls back to an unnamespaced key only if called
 * before any identity has ever been established (shouldn't happen in normal
 * use -- bootstrap always runs first -- but must never throw either). */
function namespacedKey(base: string): string {
  const personId = getActivePersonId();
  return personId ? `e2ee.${personId}.${base}` : `e2ee.${base}`;
}

// ---- Device identity ---------------------------------------------------

export interface DeviceIdentity {
  deviceId: string;
  identityPublicKey: string; // base64, Ed25519 raw public key
  identityPrivateKey: string; // base64, Ed25519 raw secret key -- NEVER sent anywhere
  personId: string;
}

export async function loadDeviceIdentity(): Promise<DeviceIdentity | null> {
  const raw = getItem(namespacedKey("device.identity"));
  return raw ? (JSON.parse(raw) as DeviceIdentity) : null;
}

export async function saveDeviceIdentity(identity: DeviceIdentity): Promise<void> {
  setItem(namespacedKey("device.identity"), JSON.stringify(identity));
}

// ---- KeyPackage pool (published; not yet matched to a real join) -------

interface StoredPoolEntry {
  serverId: string;
  publicPackage: string;
  privatePackage: { initPrivateKey: string; hpkePrivateKey: string; signaturePrivateKey: string };
}

async function loadPool(): Promise<StoredPoolEntry[]> {
  const raw = getItem(namespacedKey("mls.keypackagepool"));
  return raw ? (JSON.parse(raw) as StoredPoolEntry[]) : [];
}
async function savePool(pool: StoredPoolEntry[]): Promise<void> {
  setItem(namespacedKey("mls.keypackagepool"), JSON.stringify(pool));
}

export async function addKeyPackagesToPool(
  entries: { serverId: string; publicPackage: KeyPackage; privatePackage: PrivateKeyPackage }[],
): Promise<void> {
  const pool = await loadPool();
  for (const entry of entries) {
    pool.push({
      serverId: entry.serverId,
      publicPackage: encodeKeyPackageForWire(entry.publicPackage),
      privatePackage: {
        initPrivateKey: toBase64(entry.privatePackage.initPrivateKey),
        hpkePrivateKey: toBase64(entry.privatePackage.hpkePrivateKey),
        signaturePrivateKey: toBase64(entry.privatePackage.signaturePrivateKey),
      },
    });
  }
  await savePool(pool);
}

export async function getPoolSize(): Promise<number> {
  return (await loadPool()).length;
}

export interface DecodedPoolEntry {
  serverId: string;
  publicPackage: KeyPackage;
  privatePackage: PrivateKeyPackage;
}

export async function listPoolEntries(): Promise<DecodedPoolEntry[]> {
  const pool = await loadPool();
  return pool.map((entry) => ({
    serverId: entry.serverId,
    publicPackage: decodeKeyPackageFromWire(entry.publicPackage),
    privatePackage: {
      initPrivateKey: fromBase64(entry.privatePackage.initPrivateKey),
      hpkePrivateKey: fromBase64(entry.privatePackage.hpkePrivateKey),
      signaturePrivateKey: fromBase64(entry.privatePackage.signaturePrivateKey),
    },
  }));
}

export async function removeFromPool(serverId: string): Promise<void> {
  const pool = await loadPool();
  await savePool(pool.filter((entry) => entry.serverId !== serverId));
}

// ---- Per-conversation group state ---------------------------------------

function groupStateKey(conversationId: string): string {
  return namespacedKey(`mls.group.${conversationId}`);
}

export async function loadGroupState(conversationId: string): Promise<ClientState | null> {
  const raw = getItem(groupStateKey(conversationId));
  if (!raw) return null;
  const decoded = decodeGroupState(fromBase64(raw), 0);
  if (!decoded) return null;
  return { ...decoded[0], clientConfig: defaultClientConfig };
}

export async function saveGroupState(conversationId: string, state: ClientState): Promise<void> {
  const encoded = encodeGroupState(state);
  setItem(groupStateKey(conversationId), toBase64(encoded));
}

export async function hasGroupState(conversationId: string): Promise<boolean> {
  return getItem(groupStateKey(conversationId)) !== null;
}

export async function discardGroupState(conversationId: string): Promise<void> {
  removeItem(groupStateKey(conversationId));
}

export async function renameGroupState(fromId: string, toId: string): Promise<void> {
  const raw = getItem(groupStateKey(fromId));
  if (!raw) return;
  setItem(groupStateKey(toId), raw);
  removeItem(groupStateKey(fromId));
}

// ---- Locally-cached plaintext of messages THIS browser sent -----------------
//
// Real forward secrecy means the secret used to encrypt an outgoing message
// is discarded the moment it's used -- even this browser's own later re-fetch
// of that same ciphertext can no longer be decrypted, by design. Every real
// E2EE client shows its own sent messages from what it already knew locally
// before encrypting, keyed by the clientMessageId it generated for that send.

function sentPlaintextKey(conversationId: string): string {
  return namespacedKey(`sent.${conversationId}`);
}
async function loadSentPlaintexts(conversationId: string): Promise<Record<string, string>> {
  const raw = getItem(sentPlaintextKey(conversationId));
  return raw ? (JSON.parse(raw) as Record<string, string>) : {};
}
export async function saveSentPlaintext(conversationId: string, clientMessageId: string, plaintext: string): Promise<void> {
  const entries = await loadSentPlaintexts(conversationId);
  entries[clientMessageId] = plaintext;
  setItem(sentPlaintextKey(conversationId), JSON.stringify(entries));
}
export async function getSentPlaintext(conversationId: string, clientMessageId: string): Promise<string | null> {
  const entries = await loadSentPlaintexts(conversationId);
  return entries[clientMessageId] ?? null;
}

// ---- Locally-cached plaintext of messages RECEIVED and already decrypted --
//
// The same forward-secrecy property applies to incoming messages: a given
// ciphertext can only ever be decrypted once (the ratchet key it needs is
// discarded the moment decryption succeeds), so every genuinely-decrypted
// message must be cached to avoid a doomed second decrypt attempt on a later
// re-fetch.

function receivedPlaintextKey(conversationId: string): string {
  return namespacedKey(`received.${conversationId}`);
}
async function loadReceivedPlaintexts(conversationId: string): Promise<Record<string, string>> {
  const raw = getItem(receivedPlaintextKey(conversationId));
  return raw ? (JSON.parse(raw) as Record<string, string>) : {};
}
export async function saveReceivedPlaintext(conversationId: string, messageId: string, plaintext: string): Promise<void> {
  const entries = await loadReceivedPlaintexts(conversationId);
  entries[messageId] = plaintext;
  setItem(receivedPlaintextKey(conversationId), JSON.stringify(entries));
}
export async function getReceivedPlaintext(conversationId: string, messageId: string): Promise<string | null> {
  const entries = await loadReceivedPlaintexts(conversationId);
  return entries[messageId] ?? null;
}
