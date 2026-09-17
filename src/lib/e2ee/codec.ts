// Browser-native base64<->Uint8Array helpers -- the browser equivalent of
// the mobile app's own src/services/e2ee/codec.ts (which relies on a
// react-native-quick-crypto-provided Buffer polyfill). Browsers have no
// global Buffer, but btoa/atob are natively available everywhere this runs
// (client-side only -- see this directory's own header note).

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
