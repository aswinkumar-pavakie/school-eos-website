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

// Module-scope, keyed by personId -- survives this hook firing more than
// once concurrently for the same person (React Strict Mode's dev-only
// double effect invoke, Fast Refresh remounting the component, or a person
// simply reloading/navigating fast enough that a prior run hasn't finished).
// Confirmed live as a real bug, not a hypothetical: two overlapping runs
// each called registerDeviceAction with their OWN fresh keypair; since only
// one device may be ACTIVE per person, the second run's registration
// revoked the first's, and the first run's OWN in-flight KeyPackage publish
// then landed against its now-revoked device -- while the run that actually
// registered the CURRENTLY active device never got its own publish in
// before a third overlapping run revoked it too. Net result: a real ACTIVE
// device server-side with zero published KeyPackages, permanently
// undiscoverable by anyone trying to message this person until another
// bootstrap happens to run alone. Coalescing concurrent calls into the same
// promise means only one registration ever happens per person per page
// session, so there is nothing left to race.
const bootstrapInFlight = new Map<string, Promise<void>>();

function runBootstrap(personId: string): Promise<void> {
  const existing = bootstrapInFlight.get(personId);
  if (existing) return existing;

  const promise = (async () => {
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
      //
      // ACCESS_DENIED is the OTHER real code this exact call site can get:
      // e2ee.service.ts's publishMlsKeyPackages throws it when
      // devicesRepo.findById(deviceId) finds nothing at all for this
      // browser's cached deviceId -- e.g. after an operator-run data reset
      // truncates messaging_devices server-side while this browser's
      // localStorage still remembers a deviceId that no longer exists
      // anywhere. Confirmed live: a person bootstrapped before such a
      // reset is left with zero real devices/KeyPackages forever, because
      // this call site is always self-scoped (this browser's own token +
      // its own cached deviceId), so ACCESS_DENIED here can never mean a
      // real cross-user permission denial -- only "this cached identity is
      // stale" -- exactly like DEVICE_REVOKED, and self-heals the same way.
      const isStaleLocalIdentity =
        (err instanceof MessagingApiError && (err.code === "DEVICE_REVOKED" || err.code === "ACCESS_DENIED")) ||
        (err instanceof Error && (err.message.includes("DEVICE_REVOKED") || err.message.includes("ACCESS_DENIED")));
      if (isStaleLocalIdentity) {
        // The locally-cached device identity is stale -- the server will
        // never accept it again. Wipe it and register a fresh device on
        // this same mount, so a revoked/vanished device self-heals in one
        // page load instead of failing the same way forever.
        await clearDeviceIdentity();
        await ensureDeviceIdentity(personId);
        await replenishKeyPackagesIfNeeded().catch((retryErr) => {
          console.error("[e2ee bootstrap] KeyPackage replenish failed after re-registering device:", retryErr);
        });
      } else {
        console.error("[e2ee bootstrap] KeyPackage replenish failed:", err);
      }
    }
  })()
      .catch((err) => {
        console.error("[e2ee bootstrap] device identity setup failed:", err);
      })
      .finally(() => {
        bootstrapInFlight.delete(personId);
      });

  bootstrapInFlight.set(personId, promise);
  return promise;
}

export function useE2eeBootstrap(personId: string | null): void {
  const ranFor = useRef<string | null>(null);

  useEffect(() => {
    if (!personId || ranFor.current === personId) return;
    ranFor.current = personId;
    runBootstrap(personId);
  }, [personId]);
}
