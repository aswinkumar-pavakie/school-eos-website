# R&D — Class Teacher logins: admin design (constant login, changeable faculty, year-driven students)

Status: research + design only. **Nothing here is built.** Every "today" statement below was
checked in the current code or the live database on 2026-09-24; file references are given so it
can be re-checked.

---

## 1. The idea in one paragraph

Every class section (grade + section, e.g. **Standard 1 · A**) has **one permanent login** —
a fixed email and a password the admin controls. That login never changes and is never
re-created. Three things around it *do* change:

| Thing | Changes when | Who changes it | Automatic? |
|---|---|---|---|
| **Who is the class teacher** (which real faculty stands behind the login) | Staff change, leave, exit, year rollover | Admin | No — an admin action |
| **Which students the login sees** | Every academic year (promotion, transfers, section changes) | Nobody by hand | **Yes** — derived from that year's enrolments |
| **The password** | Holder change, suspected leak, start of year | Admin | No — an admin action |

So the admin never "maps students to an email". The admin only decides **who holds the seat**
and **what the password is**. Students follow the section, and the section follows the year.

---

## 2. What exists today (as found)

### 2.1 Data model (already built and live)
- `class_teacher_login` — one row per **(grade_id, section_name)**, unique forever. Primary key is the
  login's own `person_id`. (`0032_class_teacher_login.sql`)
- `class_teacher_login_assignment` — history of *which faculty* held the seat, per academic year, with
  `section_id`, `assigned_on`, `unassigned_on`, `status ACTIVE|ENDED`. A partial unique index allows
  **exactly one ACTIVE holder** per login.
- The login itself is an ordinary `person` with a `login_identifier` (the constant email), a
  `user_credential` (hash **and** `admin_visible_password`), one `role_assignment`
  (`CLASS_ADVISOR`, scope `SECTION`, pointing at that year's `section.id`) and a **`staff` row**.
- Live check: 56 sections → 56 logins → 56 ACTIVE holders, one faculty each. Emails look like
  `classadvisor1a@sis.in`; every password is `SIS@test123` (test data).

### 2.2 Backend API for class logins today (all ADMIN-only)
| Endpoint | Does | Missing |
|---|---|---|
| `GET /class-teacher-logins/lookup?gradeId&sectionName` | find one login | no **list all** |
| `POST /class-teacher-logins` | create login + first holder | — |
| `POST /class-teacher-logins/:id/reassign` | move to a new year's section + new holder | does **not** rotate the password, does **not** sign the old holder out, does **not** clean push devices, handles **one** login at a time |
| `GET /class-teacher-logins/:id/history` | holder history | — |
| *(none)* | | reveal password, rotate password, vacate seat, bulk rollover, student count |

Generic tool that already exists: `POST /persons/:id/password-reset` (ADMIN) — works for **any**
account, sets a new password (auto or chosen), stores it as `admin_visible_password`, and **signs the
person out of every session**. Reusable for class logins.

### 2.3 Admin web today (the base to build on)
- **Admin › Academics** has tabs: Academic years · Grades · Sections · **Class advisors** · Coordinators ·
  Subjects · Departments (`components/academics/AcademicsTabs.tsx`).
- The **Class advisors** tab (`ClassAdvisorsPanel.tsx`) is a good pattern — one row per section,
  grade filter, "Assign / Change" with a staff search picker (`StaffPersonPicker.tsx`) — **but it
  still uses the old model**: `assignClassAdvisorAction` creates a *direct* `CLASS_ADVISOR` role on the
  faculty's own login. That now **conflicts** with class logins (see §7, E-01).
- **Faculty profile › Login security** (`FacultyLoginSecuritySection.tsx`) shows the password in the clear
  *only while it is still the one admin set*, plus a gated "Reset password". This shows the
  existing look (mono password box, muted helper text, `rounded-[11px]`, `bg-field`, primary button).
  Its rule ("admin can only reset after the person used their one self-service reset") does **not** fit a
  shared login — see §6.

### 2.4 Who reads the class login today
- **Mobile**: account switcher lists the faculty's class logins (email only, never the password).
- **Web**: same switcher in the sidebar footer; Class Teacher view of `/faculty`.
- **Backend rules that depend on it**: every advisor lookup requires the login to have an **ACTIVE staff
  row** *and* a section in the **current academic year** (`faculty-scope.repository.ts`,
  messaging + permissions `class-advisor.repository.ts`). Approvals assigned to `CLASS_ADVISOR` resolve to the
  login person.

### 2.5 Two facts that shape everything
1. **Sections are re-created every academic year** (`section.academic_year_id`), and advisor lookups only
   count the **current** year. The login is constant, but its role points at *last year's* section row until
   an admin moves it. **Setting a new current year silently blanks every class login.**
2. **The seed skipped the staff row** for all 56 logins, so every class login resolved zero sections
   (fixed by SQL in `query.md`, which you ran). The seed script must do this itself.

---

## 3. Domain model (what the UI must make visible)

```
                CONSTANT                              CHANGES
   ┌──────────────────────────────┐      ┌────────────────────────────────────┐
   │ Seat  (grade, section_name)  │      │ Holder   real faculty, per year     │
   │  Standard 1 · A              │◄─────│  Asha K   2025-26  ENDED            │
   │  email  classadvisor1a@…     │      │  Ravi S   2026-27  ACTIVE           │
   │  password  (admin-controlled)│      └────────────────────────────────────┘
   └───────────────┬──────────────┘
                   │ this year's section row (re-created yearly)
                   ▼
   ┌──────────────────────────────┐      ┌────────────────────────────────────┐
   │ Section 2026-27  "1-A"       │◄─────│ Students = that year's enrolments    │
   └──────────────────────────────┘      │  (promotion / transfer / detained)   │
                                         └────────────────────────────────────┘
```

**Seat states** the admin sees (one pill per row):

| State | Meaning | Detected by |
|---|---|---|
| **Active** | holder assigned, role points at the current year's section | assignment ACTIVE + role's section in current year |
| **Vacant** | no holder (nobody can act as this class) | no ACTIVE assignment |
| **Needs rollover** | current year has a matching section, but the login still points at an older year | role's section ≠ current-year section of same (grade, name) |
| **No section this year** | the current year has *no* section with this grade + name (class merged/removed) | no matching section |
| **Holder inactive** | holder's staff record is EXITED / ON_LEAVE | assignment ACTIVE but staff.status ≠ ACTIVE |

---

## 4. Admin UI design

Built inside the existing admin console, reusing its components and tokens
(`PanelHeader`, `StaffPersonPicker`, mono credential box, `rounded-[11px]`, `bg-field`, primary/critical
buttons). **No new design language.**

### 4.1 Where it lives
**Admin › Academics › "Class teacher logins"** — replaces the current "Class advisors" tab (same position, same
route family). One screen for the whole school; the Faculty profile gets a small read-only card that links here.

### 4.2 Main screen — the seat table

```
Academics  ▸  Class teacher logins                               [ Year rollover… ]  [ Export sheet ]
─────────────────────────────────────────────────────────────────────────────────────────────────────
Academic year: [ 2026–27 (current) ▾ ]   Grade: [ All ▾ ]   Status: [ All ▾ ]   🔍 email / faculty
 56 seats · 52 Active · 3 Vacant · 1 Needs rollover

 Class     Login email (constant)      Password            Class teacher           Students  Status
 ───────   ─────────────────────────   ─────────────────   ─────────────────────   ────────  ───────────────
 1 · A     classadvisor1a@sis.in  ⧉    ••••••••  👁 ⧉      Vikram Kandasamy        24        ● Active     ⋯
                                                            since 2026-06-01
 1 · B     classadvisor1b@sis.in  ⧉    ••••••••  👁 ⧉      Balamurugan Krishnan    26        ● Active     ⋯
 1 · C     classadvisor1c@sis.in  ⧉    ••••••••  👁 ⧉      — Vacant —   [Assign]   25        ○ Vacant     ⋯
 2 · A     classadvisor2a@sis.in  ⧉    ••••••••  👁 ⧉      Priya S.                0 !       ▲ Needs rollover ⋯
 ⧉ = copy    👁 = reveal (logged)    ⋯ = Change teacher · Reset password · Vacate seat · History
```

- **Email** is shown as text with a copy button. **Never editable** (see E-02).
- **Password** is masked by default. **Reveal** shows it for 30 s and writes an audit event
  (`CLASS_LOGIN_PASSWORD_REVEALED`). **Copy** copies without revealing on screen.
- **Class teacher** column shows name, employee no., "since" date; a **Vacant** row shows an *Assign* button.
- **Students** = enrolments in the selected year (link opens Students filtered to that section). A `!`
  appears when the count is 0 — usually "promotion not done yet".
- Sorting follows the grade order already used by the current panel (`level_no`), not alphabetically.
- Empty / loading / error states reuse the existing `EmptyState` / `ErrorState` and the "Nothing was changed"
  wording used across the admin.

### 4.3 Row actions and dialogs

**Change class teacher** (also "Assign" on a vacant seat)
```
 Change class teacher — Standard 1 · A
 Current: Vikram Kandasamy (since 2026-06-01)
 New class teacher:  [ search faculty by name / employee no…        ]   ← StaffPersonPicker, ACTIVE faculty only
 ─ What happens when you confirm ─────────────────────────────────────────────
  ☑ The password is changed and shown to you once (recommended, default ON)
  ✔ Vikram is signed out of this login on every device            (always)
  ✔ Vikram's devices stop receiving this class's notifications    (always)
  ✔ Change is recorded in the history with your name and time     (always)
 Warning shown if: new teacher already holds 3+ classes · is not FACULTY · is on leave/exited
                                            [ Cancel ]  [ Confirm change ]
```

**Reset password**
```
 Reset password — classadvisor1a@sis.in
 ( • ) Generate a strong password     (   ) Set my own  [ ________ ] (min 8)
 All devices signed in to this login are signed out.
                                     [ Cancel ]  [ Reset ]
 → result box (mono, same as Faculty security section):  "Xk7-…  ⧉   This is now the current password."
```

**Vacate seat** — ends the holder's assignment, signs everyone out, rotates the password so no one can use
the login until a new teacher is assigned. Confirm text names the class and the teacher affected.

### 4.4 Detail drawer (click a row)
```
 Standard 1 · A                                                         [ ✕ ]
 ── Login ─────────────────────────────  ── Class teacher ──────────────────
 classadvisor1a@sis.in  ⧉  (locked)       Vikram Kandasamy · EMP1037
 Password ••••••••  👁 ⧉  [Reset]         Active since 2026-06-01   [Change]
 ── Students ──────────────────────────  ── History ─────────────────────────
 2026-27: 24   2025-26: 23   2024-25: 22   2026-27  Vikram Kandasamy   ACTIVE
 [Open roster for 2026-27]                2025-26  Asha K              ENDED 2026-05-30
 ── Recent activity (from the audit log) ──────────────────────────────────
 2026-09-24 12:10  Password revealed by Dharani S.  ·  2026-06-01  Teacher changed by Dharani S.
```

### 4.5 Year rollover wizard (Academic years tab → "Roll class logins forward")
The single most important screen — without it the whole system goes blank each June.
```
 Step 1  Target year  [ 2027–28 ▾ ]   (must already have its sections created)
 Step 2  Preview (nothing is changed yet)
   Class   Old section → New section    Teacher (default: keep)     Flag
   1 · A   2026-27 1-A → 2027-28 1-A     Vikram K.  [keep ▾]         ✓
   1 · B   2026-27 1-B → 2027-28 1-B     Balamurugan K. [change…]    ✓
   4 · D   2026-27 4-D → —                                              ⚠ No section next year
   New section 6 · E has no login                                       ⚠ Create login
 Step 3  Confirm — moves all logins in ONE transaction (all-or-nothing) → result summary + downloadable report
```
- Defaults to **keep the same teacher**; admin changes only the exceptions.
- Password rotation at rollover is an **opt-in** checkbox for the whole batch.
- Runs only after the new year's sections exist; can be re-run safely (already-moved logins are skipped).

### 4.6 Faculty profile card (existing page `admin/faculty/[id]`)
Read-only: "Class teacher logins held: **1 · A** (`classadvisor1a@sis.in`) — Manage →". No password shown here.

### 4.7 Permissions
| Role | See list | See email | Reveal / reset password | Change teacher | Rollover |
|---|---|---|---|---|---|
| ADMIN | ✔ | ✔ | ✔ (audited) | ✔ | ✔ |
| PRINCIPAL / CORRESPONDENT | ✔ read-only | ✔ | ✘ | ✘ | ✘ |
| ACADEMIC_COORDINATOR | ✔ their grades | ✔ | ✘ | ✔ propose → admin confirms *(decision D-04)* | ✘ |
| FACULTY / CLASS TEACHER | own seat only (switcher) | ✔ own | ✘ | ✘ | ✘ |

---

## 5. Backend changes this design needs (proposal)

New / changed endpoints (all under `class-teacher-logins`, ADMIN unless stated):

| Endpoint | Purpose |
|---|---|
| `GET /class-teacher-logins?academicYearId&gradeId&status&q` | list for the table: seat, email, holder, since, student count, status, needs-rollover flag. **No password.** |
| `POST /class-teacher-logins/:id/reveal-password` | returns the current password **and writes an audit event**. (A GET must never return secrets.) |
| `POST /class-teacher-logins/:id/password` | admin sets/generates; signs out all sessions; keeps it admin-visible |
| `POST /class-teacher-logins/:id/reassign` (change) | **also**: rotate password (optional, default on), delete all sessions, delete push tokens of the login, in the same transaction |
| `POST /class-teacher-logins/:id/vacate` | end assignment, rotate, sign out, remove push tokens |
| `GET /class-teacher-logins/:id/students?academicYearId` | roster preview (read-only) |
| `POST /class-teacher-logins/rollover/preview` / `.../apply` | bulk, transactional, idempotent |
| Coordinator `POST/DELETE faculty/academic-coordinator/sections/:id/advisor` | **re-point** to the class-login reassign (today it still writes a direct role) |

Data (small):
- A marker so system logins are not mistaken for employees: e.g. `staff.is_system_login boolean` (or exclude
  by `EXISTS class_teacher_login`) — needed by the Faculty list, payroll, staff attendance (E-13).
- Audit actions: `CLASS_LOGIN_PASSWORD_REVEALED`, `…_PASSWORD_RESET`, `…_VACATED`, `…_ROLLED_OVER`
  (`CLASS_TEACHER_LOGIN_REASSIGNED` already exists).
- Policy flag on the login (or derived from `class_teacher_login`): **self-service password change/reset is
  blocked** — only admin changes it (E-07).

---

## 6. Security and privacy (the honest version)

- The password is stored **readable** (`admin_visible_password`) — that is the existing Faculty/Parent
  design, and you asked for passwords to be viewable. Keep the exposure small: masked by default, reveal is
  logged and time-limited, ADMIN only, never returned by list endpoints, never in CSV/exports unless an
  explicit, logged "credentials sheet" action is used.
- A shared login means **actions are attributed to "Class Teacher (1-A)", not a person**. The history table
  (who held the seat when) recovers accountability — but only if changes are always recorded (they are).
- The existing Faculty rule "admin may reset only after the person used their one self-service reset" is
  wrong for a shared login and must **not** be reused (E-08).

---

## 7. Edge cases (what should happen)

Legend: **B** = built today · **G** = gap (needs work) · **D** = decision needed.

### Identity
| # | Case | Expected | |
|---|---|---|---|
| E-01 | Old "Class advisors" tab / coordinator flow still assigns a **direct** advisor role to a faculty | Must be removed/re-pointed; otherwise a section has two advisors (login + faculty) and the single-active-advisor rule breaks | **G** |
| E-02 | Admin tries to change the constant email | Not possible in the UI; the email is the seat's identity. If ever required: new seat + migration, not an edit | **G** (UI) |
| E-03 | Email domain / pattern differs between environments (`@sis.in` vs `@sms.in`) | One configured pattern `classadvisor{grade}{section}@{domain}`; validated unique at creation | **D-01** |
| E-04 | Grade names like "LKG", "UKG", "Standard 10", "12" | Email slug rules must be fixed and documented (lowercase, no spaces) | **D-01** |
| E-05 | Login display name is "Class Teacher (A)" — ambiguous across grades | Name should include grade: "Class Teacher (1-A)" | **G** |

### Passwords and sessions
| # | Case | Expected | |
|---|---|---|---|
| E-06 | Teacher changes; old teacher still knows the password | Rotate at change (default on) + sign the old holder out + drop their push devices | **G** (today none of the three happens) |
| E-07 | Holder uses "Forgot password" (OTP goes to a shared mailbox nobody reads) or changes it in-app | Blocked for class logins ("Ask the administrator"); otherwise admin's shown password goes stale | **G** |
| E-08 | Admin wants to reset before any "self-service reset used" | Allowed always for class logins | **G** |
| E-09 | Password revealed on a shared/projected screen | Auto-hide after 30 s; reveal logged | **G** |
| E-10 | Old teacher's phone still has the saved class account | Their next switch fails → "session expired" prompt (web already handles it; **mobile must verify**) | **G** (mobile) |
| E-11 | Two devices signed in as the class login at once | Allowed today (same-person sessions); after reassign all are killed | B + G |

### Changing the teacher
| # | Case | Expected | |
|---|---|---|---|
| E-12 | Faculty leaves / exits school | Seat flagged **Holder inactive**; admin must reassign or vacate. Auto-vacate on exit is an option | **D-05** |
| E-13 | The 56 login "staff" rows appear as employees in Faculty list, payroll, staff attendance | Exclude system logins everywhere staff is counted | **G** |
| E-14 | One faculty holds several classes | Supported (mobile + web switcher list each class) | B |
| E-15 | Two people should share a class (co-teacher / substitute during leave) | Not supported (one ACTIVE holder). Options: temporary "acting holder" with an end date, or two seats | **D-06** |
| E-16 | Seat left vacant | Nobody can act as the class; parents see "Class teacher: not assigned"; approvals routed to it stall | **G** (no vacate today) |
| E-17 | Two admins change the same seat at once | DB partial-unique index prevents two ACTIVE holders; UI shows "Someone else just changed this — refresh" | B (DB) + G (UI) |
| E-18 | Assign a non-faculty / exited / on-leave person | Picker lists only ACTIVE FACULTY; server re-validates | **G** (server) |
| E-19 | Assign the same faculty who already holds it | No-op with a clear message | **G** |
| E-20 | History / accountability | Every change stored with actor + time (`class_teacher_login_assignment`, audit) | B |

### Academic year and students
| # | Case | Expected | |
|---|---|---|---|
| E-21 | New year set as current before class logins are rolled forward | All 56 logins resolve **zero sections** the moment the year flips. Rollover must run *before or with* set-current; UI warns on set-current | **G** — biggest risk |
| E-22 | Class has no section next year (merged/removed) | Flag **No section this year**; login kept, suspended, can be re-linked later | **G** |
| E-23 | A new section is added mid-year | "Sections without a login" list with a one-click **Create login** (standard email, first holder) | **G** |
| E-24 | Students not promoted yet (0 enrolments in the new year) | Count shows 0 with a `!` and hint "promotion pending" — login opens with an empty roster, not an error | **G** |
| E-25 | Student transfers section mid-year | Follows automatically (enrolment is the source) | B |
| E-26 | Detained / readmitted / promoted students | Handled by `student_enrolment.enrolment_type`; the login just shows whatever the section holds | B |
| E-27 | Looking back at last year's class | Students column and roster preview accept a year selector (read-only) | **G** |
| E-28 | Two years marked current, or none | Backend already enforces one current year; rollover preview refuses to run when none | B + G |

### Other parts of the app that use the login
| # | Case | Expected | |
|---|---|---|---|
| E-29 | Parents' chats with "Class Teacher" are end-to-end encrypted and tied to the *device that joined* | A new teacher **cannot read** the previous teacher's chat history. Privacy-correct but surprising; needs a written policy | **D-07** |
| E-30 | Push notifications registered under the login person | Removed on reassign/vacate (E-06) so the old teacher stops receiving them | **G** |
| E-31 | Approvals assigned to "class advisor of section" | Resolve to the login person; the real teacher must be signed in as the class login to approve — document for staff | B (document) |
| E-32 | What parents/students see as the class teacher's name | Currently the login's name. Show the holder's real name instead? | **D-08** |
| E-33 | Seed / reseed | Seed must create login + role + **staff row** + assignment, and preserve constant emails and (optionally) passwords | **G** (staff row missing today) |
| E-34 | Login used on both mobile and web | Both allowed (web login now accepts the class role) | B |

---

## 8. Decisions needed (with my recommendation)

| ID | Question | Recommendation |
|---|---|---|
| D-01 | Email pattern and domain | `classadvisor{grade}{section}@<school domain>`, fixed, generated by the system, never typed by hand |
| D-02 | Keep the password constant, or rotate on holder change? | Rotate on every holder change and at vacate; keep constant otherwise |
| D-03 | Should passwords stay readable to admin? | Yes (your requirement), masked + logged reveal, ADMIN only |
| D-04 | Can the Academic Coordinator change teachers? | Coordinator proposes, admin approves (or coordinator can change but never sees passwords) |
| D-05 | Auto-vacate when a faculty member exits? | Yes, with a notification to admin |
| D-06 | Co-teachers / substitutes | Phase 2: "acting holder" with an end date; not in the first release |
| D-07 | Chat history when the teacher changes | Accept "new teacher starts fresh"; tell parents "conversation continues with the class teacher" |
| D-08 | Name shown to parents | Show the current holder's real name + "Class Teacher" |
| D-09 | How the new teacher receives the password | Admin copies a small "credentials slip" (email + password) — no in-app password delivery in phase 1 |

---

## 9. Suggested build order

**Phase 0 — must exist before anyone relies on it**
1. Seed creates the staff row (E-33) — *already patched in the DB by SQL, seed script still needs it.*
2. Reassign: rotate password + sign out + drop push tokens (E-06, E-30).
3. Block self-service password change/reset for class logins (E-07).
4. Stop the old direct-advisor assignment paths (E-01): admin Academics tab and the coordinator endpoint.
5. Hide system logins from staff lists / payroll / staff attendance (E-13).

**Phase 1 — the admin screen**
6. `GET list` + the seat table + Change teacher + Reset password + Reveal (audited) + History drawer.
7. Vacate seat.
8. **Year rollover wizard** + warning on "set current year" (E-21…E-24).

**Phase 2**
9. Sections-without-login + Create login (E-23), credentials slip / export, Principal read-only view,
   acting holder (D-06), auto-vacate on exit (D-05).

---

## 10. How it will be tested (no guessing)
- **API tests** (jest) for: list statuses, reassign rotates + revokes, vacate, rollover preview/apply idempotency,
  reveal writes audit, self-service reset blocked, role matrix (ADMIN vs everyone else).
- **Edge scripts** against the running backend: two admins racing on one seat (E-17); assigning an exited
  faculty (E-18); year flip with and without rollover (E-21).
- **Real-render web check** (same method used for the Faculty/Class Teacher pages) for the table states:
  Active / Vacant / Needs rollover / No section / Holder inactive.
- **Consumer checks**: after reassign, the previous holder's saved session fails cleanly on mobile and web.

---

## 11. Evidence (where each claim was checked)
- Schema: `school-eos-backend/database/migrations/0032_class_teacher_login.sql`
- Create/reassign/history logic: `src/modules/admin/class-teacher-login.service.ts` (+ controller, repository)
- Admin password reset: `src/modules/admin/persons.service.ts` → `resetPassword` (deletes all sessions)
- Advisor lookup rules (staff row + current year): `src/modules/faculty/repositories/faculty-scope.repository.ts`
- Old direct model: `school-eos-website/src/app/(dashboard)/admin/academics/actions.ts` (`assignClassAdvisorAction`),
  `.../faculty-academic-coordinator.controller.ts` (`POST/DELETE sections/:sectionId/advisor`)
- Existing admin UI patterns: `src/components/academics/*Panel.tsx`, `src/components/faculty/FacultyLoginSecuritySection.tsx`
- Live data checks (read-only): 56 logins / 56 ACTIVE holders / 0 with 2+ classes; 56 of 56 lacked a staff row before the fix.
