# School EOS — Web Frontend

Next.js (App Router) + TypeScript + React frontend for School EOS.

This repository currently contains **structure/scaffold only**. No screens, business
logic, API clients, authentication, or state management have been implemented.

## Scope

This web app serves the **web-facing roles** of School EOS: Admin, Vice Principal,
Finance/Accounts, and the web half of Principal. Faculty, Parent, Hostel Warden, and
device-scoped logins (Bus Attendant, Canteen Vendor) are served by separate
mobile/device apps and are out of scope for this repository.

## Directory structure

```
public/                    Static assets served as-is by Next.js.

src/
  app/                     Routing and route composition ONLY (App Router).
    (auth)/                Unauthenticated routes (e.g. login).
    (dashboard)/           Authenticated route group, one folder per business module.
                           Each route's page.tsx composes UI from the matching
                           module in src/modules/ — it must not contain module logic.

  modules/                 One folder per School EOS business/application module.
                           Each module owns its components/, hooks/, services/, and
                           types/, and should not be imported into by other modules.

  components/              Shared, module-agnostic UI.
    ui/                    Base/primitive components (buttons, inputs, etc.).
    layout/                Shared chrome used to build the app/ layouts (nav, shell).
    shared/                Composite components reused across multiple modules.

  lib/                      Shared frontend infrastructure.
    api/                   HTTP client and shared request/response conventions.
    auth/                  Authentication and authorization boundary.
    hooks/                 Shared hooks with no module-specific knowledge.
    providers/             App-wide context/providers (composed in app/ layouts).
    utils/                 Generic, framework-agnostic utility functions.

  config/                  App configuration (env, navigation/route config).
```

## Business modules

Each folder under `src/modules/` corresponds to a product domain from the
School EOS HLD/API documentation, and shares its name with the matching route
under `src/app/(dashboard)/`:

`organization`, `people`, `academics`, `assessment`, `student-development`,
`community`, `sports`, `finance`, `wallet-canteen`, `hostel`, `transport`,
`health`, `camps`, `communication`, `approvals`, `emergency`, `reports`,
`audit`, `access-control`.

## Conventions

- A route's `page.tsx` composes and renders; module logic lives in `src/modules/*`.
- Code specific to one module stays inside that module's folder.
- Only code genuinely needed by multiple modules belongs under `src/components/`
  or `src/lib/`.
- A new business module gets a new folder under both `src/app/(dashboard)/` and
  `src/modules/`, named identically.

## Getting started

```
npm install
npm run dev
```

Copy `.env.example` to `.env` and set `NEXT_PUBLIC_API_BASE_URL` before running.
