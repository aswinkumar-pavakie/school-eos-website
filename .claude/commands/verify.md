---
name: verify
description: Typecheck the frontend and report any errors before considering a change done.
---

Run `npx tsc --noEmit` from the repo root and report the results.

- If clean, say so in one line.
- If there are errors, list each file/line and a one-line description, then fix
  them (don't just report broken code as done).

For anything touching a Server Component's data fetching or a Server Action,
also worth a live check: the dev server (port 3001) against a real logged-in
session, not just a clean typecheck.
