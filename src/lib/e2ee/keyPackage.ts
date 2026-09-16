// KeyPackage generation and publish/replenish against the real messaging
// backend. Identical logic to the mobile app's own
// src/services/e2ee/keyPackage.ts -- every KeyPackage this browser ever
// generates reuses the same long-term Ed25519 identity signing key, one
// stable identity per device/browser.

import { defaultCapabilities, defaultLifetime, generateKeyPackageWithKey, type Credential, type KeyPackage, type PrivateKeyPackage } from "ts-mls";
import { publishMlsKeyPackagesAction } from "../messaging-actions";
import { fromBase64 } from "./codec";
import { getMlsCiphersuiteImpl } from "./setup";
import { addKeyPackagesToPool, getPoolSize, loadDeviceIdentity } from "./storage";
import { encodeKeyPackageForWire } from "./wire";

const REPLENISH_THRESHOLD = 10;
const REPLENISH_BATCH_SIZE = 30;

function deviceCredential(deviceId: string): Credential {
  return { credentialType: "basic", identity: new TextEncoder().encode(deviceId) };
}

export async function generateOwnKeyPackage(): Promise<{ publicPackage: KeyPackage; privatePackage: PrivateKeyPackage }> {
  const identity = await loadDeviceIdentity();
  if (!identity) {
    throw new Error("generateOwnKeyPackage called before this browser has a saved identity -- bootstrap must run first.");
  }
  const impl = await getMlsCiphersuiteImpl();
  return generateKeyPackageWithKey(
    deviceCredential(identity.deviceId),
    defaultCapabilities(),
    defaultLifetime,
    [],
    { signKey: fromBase64(identity.identityPrivateKey), publicKey: fromBase64(identity.identityPublicKey) },
    impl,
  );
}

export async function publishKeyPackageBatch(count: number): Promise<void> {
  const identity = await loadDeviceIdentity();
  if (!identity) {
    throw new Error("publishKeyPackageBatch called before this browser has a saved identity -- bootstrap must run first.");
  }

  const generated: { publicPackage: KeyPackage; privatePackage: PrivateKeyPackage }[] = [];
  for (let i = 0; i < count; i++) {
    generated.push(await generateOwnKeyPackage());
  }

  const wireEncoded = generated.map((g) => encodeKeyPackageForWire(g.publicPackage));
  const { data } = await publishMlsKeyPackagesAction(identity.deviceId, wireEncoded);
  if (data.ids.length !== generated.length) {
    throw new Error(`Published ${generated.length} KeyPackages but the server returned ${data.ids.length} ids -- refusing to guess a mapping.`);
  }

  await addKeyPackagesToPool(generated.map((g, i) => ({ serverId: data.ids[i]!, publicPackage: g.publicPackage, privatePackage: g.privatePackage })));
}

export async function replenishKeyPackagesIfNeeded(): Promise<void> {
  const size = await getPoolSize();
  if (size >= REPLENISH_THRESHOLD) return;
  await publishKeyPackageBatch(REPLENISH_BATCH_SIZE);
}
