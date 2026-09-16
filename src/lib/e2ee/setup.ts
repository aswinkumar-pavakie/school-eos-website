// Shared crypto bootstrap for this whole e2ee module -- the browser
// equivalent of the mobile app's own src/services/e2ee/setup.ts. Real
// difference from mobile, verified against ts-mls's actual source (same
// requirement mobile's own header comment documents): its nobleCryptoProvider
// unconditionally needs globalThis.crypto.getRandomValues and opportunistically
// uses globalThis.crypto.subtle for Ed25519 -- every evergreen browser already
// provides both natively (the standard Web Crypto API), so unlike React
// Native this needs no polyfill install() step at all.
//
// This whole directory (and every file that imports from it) is
// browser-only -- it must never run on the Next.js server, since private key
// material and plaintext must never leave the browser. Every file here is
// imported only from "use client" components.

import {
  getCiphersuiteFromName,
  getCiphersuiteImpl,
  nobleCryptoProvider,
  type CiphersuiteImpl,
} from "ts-mls";

// Same classical (non-post-quantum) suite the mobile app uses, confirmed via
// a real on-device round trip in that build -- kept identical here so a
// website-originated conversation and a mobile-originated conversation speak
// the exact same protocol against the same real backend.
export const MLS_CIPHERSUITE_NAME = "MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519";
export const MLS_ENCRYPTION_VERSION = `mls-1.6.4-${MLS_CIPHERSUITE_NAME}`;

let implPromise: Promise<CiphersuiteImpl> | null = null;

export function getMlsCiphersuiteImpl(): Promise<CiphersuiteImpl> {
  if (!implPromise) {
    implPromise = getCiphersuiteImpl(getCiphersuiteFromName(MLS_CIPHERSUITE_NAME), nobleCryptoProvider);
  }
  return implPromise;
}
