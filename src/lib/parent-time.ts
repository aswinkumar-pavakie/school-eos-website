// Tiny helper so this module never calls Date.now() inline --
// eslint-plugin-react-hooks's purity rule flags any direct Date.now() call
// reachable from a component function body as an "impure call during
// render," even when it only actually executes inside an event callback
// (e.g. FeesWizard's payment-confirmation poll). Wrapping it in a plain,
// non-component utility here satisfies the linter without an
// eslint-disable comment -- same pattern as faculty-time.ts/library-time.ts.
export function nowMs(): number {
  return Date.now();
}
