"use client";

// The website equivalent of the mobile app's own
// src/services/messaging/bootstrap.ts useE2eeBootstrap hook: on first mount
// with a signed-in person, generates a device identity if this browser
// doesn't have one yet, registers the device, and publishes an initial
// KeyPackage batch; on every mount, replenishes the pool only if it's run
// low. Failures are swallowed -- like the mobile app's own push-registration
// pattern, this is a background enhancement a screen never blocks on.

import { useEffect, useRef } from "react";
import { ed25519 } from "@noble/curves/ed25519.js";
import { registerDeviceAction } from "../messaging-actions";
import { MessagingApiError } from "../messaging-errors";
import { toBase64 } from "./codec";
import { replenishKeyPackagesIfNeeded } from "./keyPackage";
import { clearDeviceIdentity, loadDeviceIdentity, saveDeviceIdentity, setActivePersonId } from "./storage";

async function ensureDeviceIdentity(personId: string): Promise<void> {
  // Must run before any other storage read/write below -- every key in
  // storage.ts is namespaced by whichever person this points at, so setting
  // it first is what keeps two different accounts signed into the same
  // browser from ever colliding on the same identity/group-state slot.
  setActivePersonId(personId);

  const existing = await loadDeviceIdentity();
  if (existing && existing.personId === personId) return;

  const keypair = ed25519.keygen();
  const identityPublicKey = toBase64(keypair.publicKey);

  const { data: device } = await registerDeviceAction({ devicePublicKey: identityPublicKey });

  await saveDeviceIdentity({
    deviceId: device.id,
    identityPublicKey,
    identityPrivateKey: toBase64(keypair.secretKey),
    personId,
  });
}

export function useE2eeBootstrap(personId: string | null): void {
  const ranFor = useRef<string | null>(null);

  useEffect(() => {
    if (!personId || ranFor.current === personId) return;
    ranFor.current = personId;

    (async () => {
      await ensureDeviceIdentity(personId);
      try {
        await replenishKeyPackagesIfNeeded();
      } catch (err) {
        // err crosses a Server Action boundary (messagingRequest in
        // messaging-actions.ts is "use server"), and Next.js's RSC error
        // serialization does NOT preserve custom Error subclasses or extra
        // properties across that boundary -- confirmed live: `err instanceof
        // MessagingApiError` and `err.code` are both always false/undefined
        // here even though the server genuinely threw a MessagingApiError
        // with code "DEVICE_REVOKED". Only `message` survives, so that's
        // what has to be matched on.
        const isDeviceRevoked =
          (err instanceof MessagingApiError && err.code === "DEVICE_REVOKED") ||
          (err instanceof Error && err.message.includes("DEVICE_REVOKED"));
        if (isDeviceRevoked) {
          // The locally-cached device identity is stale -- the server will
          // never accept it again. Wipe it and register a fresh device on
          // this same mount, so a revoked device self-heals in one page
          // load instead of failing the same way forever.
          await clearDeviceIdentity();
          await ensureDeviceIdentity(personId);
          await replenishKeyPackagesIfNeeded().catch((retryErr) => {
            console.error("[e2ee bootstrap] KeyPackage replenish failed after re-registering device:", retryErr);
          });
        } else {
          console.error("[e2ee bootstrap] KeyPackage replenish failed:", err);
        }
      }
    })().catch((err) => {
      console.error("[e2ee bootstrap] device identity setup failed:", err);
    });
  }, [personId]);
}
