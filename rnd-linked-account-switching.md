# R&D — Linked account switching (Faculty ⇄ Class Teacher, and other mapped accounts)

Status: **proposal, awaiting approval. No code has been written for this.**
Scope: backend, mobile app, website. Builds on `rnd-class-teacher-logins-admin.md`.

---

## 1. What you asked for (rules I am designing to)

| # | Rule |
|---|---|
| R1 | The **admin** decides which accounts a faculty member may link — by mapping them to a class (the class-teacher seat). Nobody can link an account the admin did not map to them. |
| R2 | The faculty member must **add** the class-teacher account **once, the first time**. After that, switching works without asking again. |
| R3 | From the class-teacher account they can switch back — and only to the accounts that were mapped, nothing else. |
| R4 | **Leak rule:** if the faculty email + password leak and someone signs in on *another phone*, the connected accounts (class teacher and any other) must **not** be reachable from there. |

## 2. How switching works today (verified in the code)

- Mobile (`school-eos-mobile/src/lib/auth.ts`, `linkAndSwitchIdentity`) and web (`src/lib/account-switch.ts`) both do this: the user types **any** email + password, the app logs in normally, and the **login tokens of both accounts are stored on that device** (SecureStore on mobile, httpOnly cookies on web). Switching just swaps the stored tokens.
- The backend knows **nothing** about it. There is no link record, no device identity, no rule that the accounts belong together.

What that means, honestly:

| Situation | Today |
|---|---|
| Faculty password leaks, attacker signs in on phone B | Phone B has no saved class-teacher tokens, so they cannot switch — **R4 is accidentally true**, but only because tokens are per device, not because the system enforces it. |
| Attacker also knows the class-teacher password | They can add it on phone B. Nothing checks that it belongs to this faculty member. **R1 is not enforced.** |
| Faculty adds *any* faculty/class login they know the password of | Allowed. **R1 is not enforced.** |
| Admin changes the class teacher | Old holder's sessions are cut (done last round), so the old link dies — but only by side effect. |
| Owner wants to see / kill "which phones are linked" | Impossible — the server has no record. |
| A saved class-teacher session on a stolen phone | Lives 30 days on the device, independent of the faculty session. |

## 3. Is your approach good? — my verdict

**Yes, the direction is right, with two adjustments.**

*Right:* the link must be created deliberately, once, on the phone the person actually holds, and it must be bound to that phone. That is exactly what makes R4 work: a password alone (which is what leaks) is not enough to reach the connected accounts.

*Adjustment 1 — make the server the authority, not the phone.* Today the phone holds the keys to both accounts. If the server instead **records the link** (owner ↔ class login ↔ this phone) and **mints the class-teacher session at switch time**, then R1 is enforced (only admin-mapped accounts can link), and every revoke is instant (teacher changed, faculty exited, password reset, "remove this phone").

*Adjustment 2 — the first-time add needs a second secret that a leaked faculty password does not give.* If "add" only needed the faculty session, a leaked faculty password would let the attacker add the class account on phone B — breaking R4. So the first add must also prove knowledge of something else: **the class login's own password** (the admin already hands it to the holder). A leaked *faculty* password alone then reaches only the faculty account.

**What this cannot protect against** (say it plainly): someone who steals the **unlocked phone that already has the link**, or who learns **both** passwords. Those need device-level protection (screen lock) and the "remove this phone / reset" tools in this design, not a smarter switch.

## 4. Proposed design (recommended)

### 4.1 Concepts

- **Device id** — each app install generates a random id once (mobile: SecureStore; web: httpOnly cookie). Sent on login/switch calls. Not secret by itself; it *names* a phone.
- **Account link** — one row: *owner* (faculty) ↔ *linked account* (class login) ↔ *device id*. Exists only after the first-time add on that device. Revocable.
- **Mapping** — already exists: `class_teacher_login_assignment` (admin's "who holds this class"). A link may only be created if the mapping is ACTIVE for that owner. For non-class accounts (coordinator etc.) see 4.6.
- **Child session** — the session minted for the linked account when switching; tied to the owner's session so it dies with it.

### 4.2 Data model (SQL goes to `query.md` for you to run; I run nothing)

```
account_link
  id uuid pk
  owner_person_id      -> person      (the faculty member)
  linked_person_id     -> person      (the class login)
  device_id text                      (phone/browser that made the link)
  created_at, last_used_at, revoked_at, revoked_reason
  UNIQUE (owner_person_id, linked_person_id, device_id) WHERE revoked_at IS NULL

user_session (add columns)
  device_id text NULL
  linked_from_session_id uuid NULL -> user_session ON DELETE CASCADE
```

`ON DELETE CASCADE` gives the cascade for free: when the owner's session is deleted (logout, force sign-out, password reset, suspend, exit) every child session goes too.

### 4.3 Flows

**A. First-time add (once per phone, started only from the faculty account)**
1. Faculty is signed in. App calls `GET /auth/linked-accounts/available` → the classes the admin mapped to them (e.g. "5-B", email masked).
2. They pick one and type that class login's **password** (proof).
3. `POST /auth/linked-accounts` `{linkedPersonId, password, deviceId}` — server checks: caller's session is live; mapping ACTIVE for caller; password correct (same lockout / rate limit as login); mobile role allowed.
4. Server creates the `account_link`, mints a child session for the class login, returns its tokens. App shows the class-teacher home.

**B. Switch (every time after)** — `POST /auth/switch` `{targetPersonId, deviceId}` with the current bearer token.
Server checks an ACTIVE link exists between *current person* and *target*, **for this device id**, and the current session is live. Then mints the target session. **No password, no stored tokens for the other account.**

**C. Switch back (class teacher → faculty)** — same call, same link (links work in both directions between the two mapped accounts). The class-teacher side **cannot add** anything new; it can only use links the faculty side created (R3).

**D. Leaked faculty password, attacker on phone B**
- Login works (they have the password) → faculty account only.
- `available` lists the mapped class, but adding requires the **class password** they do not have → 401.
- `switch` → no link for device B → 403.
- ⇒ **R4 holds.** The genuine owner's phone A keeps its link untouched.
- Owner's response: change password (or admin resets it) → **all links revoked** and all sessions cut → attacker is out; owner re-adds once on phone A.

**E. Admin changes the class teacher / vacates / faculty exits**
Server revokes every link for that seat in the same transaction (extends the code already there), so the old holder's phone can no longer switch, and the new holder starts with no links (R2 again: they add once).

**F. Owner signs out on the phone** → child sessions cascade-delete; link stays, so signing in again on that phone can switch straight away.

### 4.4 Lifecycle rules

| Event | Effect on links |
|---|---|
| Admin changes / vacates the class teacher | revoke all links of that seat |
| Faculty exited or suspended | revoke all their links |
| Faculty **first-login** password change (the one after the emailed temporary password) | **nothing** — no links exist yet, they are created afterwards |
| Faculty changes their own password later | revoke links on **other** phones only; the phone they changed it on keeps its link (see 4.4b) |
| Admin resets a faculty password (lost / suspected leak) | revoke **all** their links |
| Class login password reset by admin | revoke all links of that seat (proof changed) |
| Link unused for 90 days | auto-expire |
| Owner taps "Remove this phone" | revoke that device's links |
| Admin taps "Revoke all links" on a faculty profile | revoke all |

Limit: **3 devices per owner** (configurable).

### 4.4b Why "revoke all links on every password change" was too strict (revised after your feedback)

Your point: faculty receive an emailed temporary password and change it straight away for safety, and they will change it again from time to time. Revoking every link each time would make them re-add the class account constantly.

What actually protects the leak rule is **not** link revocation on password change:

- A link is **inert on its own**. `switch` needs a *live* session for the current account on that phone, and a session for the faculty account needs the faculty password. Changing the password cuts every session (the reset flow already does this), so an attacker's phone can no longer sign in as faculty, and their linked class session is deleted with it (cascade).
- The first-login change happens **before** any link exists (links are created afterwards, on the trusted phone), so it costs nothing.

There is one real hole to close, and it needs *both* passwords to have leaked: links work in both directions, so an attacker who linked phone B earlier and still knows the **class** password could sign in to the class account and switch *back* to the faculty account, without the new faculty password. To close it without hurting the owner:

- **Self change / reset flow:** revoke links on every phone **except** the one the change was made from. The owner's own phone keeps working; a stolen or attacker phone loses its link. If the owner changed it from a phone or browser with no link, they re-add once on their phone (rare).
- **Admin reset:** revoke **all** links (the owner is locked out or compromised, so a clean start is right).
- **Class login password reset by the admin:** revoke that seat's links (the class password was the proof; it is changing).

Net effect: normal password hygiene does not disturb the owner's linked phone, and the both-passwords-leaked case is still closed.

### 4.5 What changes where

- **Backend (identity module):** `AccountLinkService` + repo; endpoints `GET /auth/linked-accounts/available`, `GET /auth/linked-accounts` (my devices), `POST /auth/linked-accounts`, `POST /auth/switch`, `DELETE /auth/linked-accounts/:id`; hooks in class-login `reassign`/`vacate`/staff `exit`/password reset to revoke links; audit events `ACCOUNT_LINK_CREATED / USED / REVOKED / DENIED`; rate limit on link + switch.
- **Mobile:** stop storing the other account's tokens; keep only a device id and the list of *my links* (labels). "Add class teacher account" screen = pick class + type class password. Switch = one API call. Existing "Switch account" screen reused. Add "Linked phones" list with remove.
- **Website:** same endpoints via server actions; the `otherAcct_*` cookies go away; device id cookie added.
- **Admin website:** faculty profile card (built last round) gets "Linked phones: N — Revoke all"; audit shows link events.

### 4.5b Trade-off you should accept knowingly
Switching now needs a **network call** (today it is instant and works offline). It also means the class-teacher tokens are never sitting on the phone, which is the security gain.

### 4.6 Other connected accounts (coordinator, etc.)
v1 covers **class logins**, where the admin mapping already exists. For other separate accounts (Academic Coordinator, Sports faculty…) add a small table `account_link_grant(owner, target)` that the **admin** fills ("this faculty may link this account") — the same flow then works unchanged. Recommended as phase 2 so v1 stays small.

## 5. Alternatives considered

| Option | Verdict |
|---|---|
| **A. Keep today's device-token swap, only add a mapping check on login** | Cheap, but no instant revoke, no device list, tokens for both accounts still sit on the phone for 30 days. Weakest. |
| **B. Server link with *no* extra proof (faculty session alone can add)** | Simple, but a leaked faculty password lets the attacker link and reach the class account → **breaks R4**. Rejected. |
| **C. Server link + class-password proof + device binding (this proposal)** | Meets R1–R4, instant revoke, auditable. Recommended. |
| **D. Proof by OTP to the faculty's phone/email** | Strongest, but OTP delivery is still a stub in the backend today. Possible later as a replacement for the password proof. |
| **E. Proof by an admin-issued one-time code** | Good if you want the holder to *never* see the class password; costs the admin one extra click per handover. Optional upgrade. |

## 6. Edge cases

| # | Case | Handling |
|---|---|---|
| E1 | Faculty holds two classes | One link per class; `available` lists both. |
| E2 | Faculty has two phones | Each phone links separately (once each), up to the device limit. |
| E3 | New phone / reinstall | Device id is new → add once again. Old device row expires or is removed. |
| E4 | Teacher changed while the old holder is signed in as class teacher | Links revoked + class sessions already cut → app falls back to the faculty login with "no longer available". |
| E5 | Class has no section this year / seat vacant | `available` hides it; switch refused with a clear message. |
| E6 | Two people try to add the same seat | Only the ACTIVE holder passes the mapping check. |
| E7 | Wrong class password repeatedly | Counts toward the login lockout; generic error, no hint whether the mapping exists. |
| E8 | Attacker replays a stolen access token from another phone | Access token is 15 min; a `switch` from it still needs a link for *that device id*. |
| E9 | Device id copied by an attacker | The id alone grants nothing; the link also requires a live owner session, which needs the faculty password + this phone's session. Residual risk: full device compromise (out of scope). |
| E10 | Web browser cleared cookies | Device id lost → add once again. |
| E11 | Existing users (already saved on the phone) | On first launch after the update the app ignores old saved tokens, keeps the active account, and asks to add the class account once. Old tokens are deleted. |
| E12 | Offline | Switching unavailable; current account keeps working. |
| E14 | Faculty changes password from a browser that has no link | Links on their phones are revoked (the change did not come from a linked phone); they re-add once. Rare; noted in the confirmation message. |
| E13 | Class teacher account used alone (someone signed into it directly with its password) | Still allowed (it is a real login); it just has no link to a faculty account, so no switch-back button. |

## 7. Decisions I need from you

| # | Question | My recommendation |
|---|---|---|
| D-1 | Proof for the first add | **Class login password** now; admin one-time code later if you want holders never to see it. |
| D-2 | Max linked phones per faculty | **3** |
| D-3 | Accept "switching needs internet"? | **Yes** (that is the security gain). |
| D-4 (revised) | Links on password change | **Not "revoke all".** First-login change: no effect. Self change: keep the phone it was done on, revoke only other phones. Admin reset: revoke all. Reason in 4.4b. |
| D-5 | v1 scope | **Class logins only**; coordinator/other accounts in phase 2 via admin grants. |
| D-6 | Idle expiry | **90 days** |
| D-7 | Can the class-teacher side add links? | **No** — only switch back over links the faculty created. |

## 8. Phases

1. **P0 — SQL + backend:** tables/columns, link service, endpoints, revoke hooks, audit, rate limits, jest specs. *(I write SQL to `query.md`; you run it.)*
2. **P1 — Mobile:** device id, add-account screen, switch via API, remove old token storage, linked-phones list.
3. **P2 — Website:** same, cookies replaced.
4. **P3 — Admin:** revoke-all + link events on the faculty profile.
5. **P4 — Verification:** jest for every rule R1–R4 and E1–E13 that can be unit-tested; then a live two-phone leak drill (log in as the faculty on a second device and prove the class account is unreachable) once the DB is reachable.

Risk: medium. It touches login/session code, so the new endpoints ship with tests before the old client-side swap is removed, and the old path stays working until the new one is proven.

## 9. Test plan for the leak rule (R4)

1. Phone A: faculty signs in, adds class 5-B (correct class password) → switch works.
2. Phone B: sign in with the **faculty** credentials only.
3. `available` → lists 5-B. `POST linked-accounts` without/with wrong class password → refused. `switch` → refused (no link for device B).
4. Change the faculty password → phone A's link and phone B's session are both dead; phone A re-adds once.
5. Admin changes the class teacher → old holder's phone cannot switch; new holder must add once.
