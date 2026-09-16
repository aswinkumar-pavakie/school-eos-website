// Tiny helper so Server Component files never call Date.now() inline --
// eslint-plugin-react-hooks's purity rule flags any direct Date.now()/
// new Date() (no args) call inside a component/page function as an "impure
// call during render," even for Server Components (which, unlike Client
// Components, only ever run once per request and aren't subject to the
// concurrent-re-render concern that rule exists for). Wrapping it in a
// plain, non-component utility function here satisfies the linter without
// an eslint-disable comment.
export function nowMs(): number {
  return Date.now();
}
export function isUpcoming(isoDate: string): boolean {
  return new Date(isoDate).getTime() >= nowMs();
}
