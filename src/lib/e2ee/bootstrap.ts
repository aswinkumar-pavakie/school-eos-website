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
import { listMyDevicesAction, registerDeviceAction } from "../messaging-actions";
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
  if (existing && existing.personId === personId) {
    // An account has ONE active device. If another browser (or a reset) replaced
    // this browser's device, new messages are encrypted for that other device and
    // this browser can never read them -- so confirm the saved device is still the
    // active one, and set up a fresh one if not. A failed check changes nothing.
    const mine = await listMyDevicesAction().catch(() => null);
    if (!mine || mine.data.some((d) => d.id === existing.deviceId && d.status === "ACTIVE")) return;
    await clearDeviceIdentity();
  }

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
// The messaging server caps device registrations (10/h) and key publishes
// (20/h) per person. Hitting that cap is a temporary, expected condition for
// this background step: it must not surface as an app error, and the retry
// happens on the next mount once the hourly window has reset.
function isRateLimited(err: unknown): boolean {
  return (err instanceof MessagingApiError && err.code === "RATE_LIMITED") || (err instanceof Error && err.message.includes("RATE_LIMITED"));
}

function logBootstrapFailure(label: string, err: unknown): void {
  if (isRateLimited(err)) {
    console.warn("[e2ee bootstrap] " + label + " skipped: messaging rate limit reached, will retry later.");
    return;
  }
  console.error("[e2ee bootstrap] " + label + ":", err);
}

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
      if (isRateLimited(err)) {
        logBootstrapFailure("KeyPackage replenish", err);
      } else if (isStaleLocalIdentity) {
        // The locally-cached device identity is stale -- the server will
        // never accept it again. Wipe it and register a fresh device on
        // this same mount, so a revoked/vanished device self-heals in one
        // page load instead of failing the same way forever.
        await clearDeviceIdentity();
        await ensureDeviceIdentity(personId);
        await replenishKeyPackagesIfNeeded().catch((retryErr) => {
          logBootstrapFailure("KeyPackage replenish after re-registering device", retryErr);
        });
      } else {
        logBootstrapFailure("KeyPackage replenish", err);
      }
    }
  })()
      .catch((err) => {
        logBootstrapFailure("device identity setup", err);
      })
      .finally(() => {
        bootstrapInFlight.delete(personId);
      });

  bootstrapInFlight.set(personId, promise);
  return promise;
}

// A conversation whose Welcome matches none of this browser's saved keys means
// the server holds keys this browser can't use (e.g. an earlier setup was cut
// short). Replace the device with a clean one so NEW chats work; the failed one
// stays unreadable. Once per person per page session, so it can't loop.
const repairedFor = new Set<string>();

export async function repairDeviceAfterFailedJoin(personId: string): Promise<void> {
  if (repairedFor.has(personId)) return;
  repairedFor.add(personId);
  // Let any normal setup already running for this person finish first, and hold
  // the same in-flight slot while repairing so nothing else touches the device.
  await bootstrapInFlight.get(personId)?.catch(() => {});
  const work = (async () => {
    setActivePersonId(personId);
    await clearDeviceIdentity();
    await ensureDeviceIdentity(personId);
    await replenishKeyPackagesIfNeeded();
  })()
    .catch((err) => logBootstrapFailure("device repair", err))
    .finally(() => {
      bootstrapInFlight.delete(personId);
    });
  bootstrapInFlight.set(personId, work);
  await work;
}

export function useE2eeBootstrap(personId: string | null): void {
  const ranFor = useRef<string | null>(null);

  useEffect(() => {
    if (!personId || ranFor.current === personId) return;
    ranFor.current = personId;
    runBootstrap(personId);
  }, [personId]);
}
