# ERPm E2E: temporary database and seed

This folder holds the **database and seed half** of the Playwright suite (card B6). The browser scenarios and
selectors are written on top of it by the FE side.

## What a run does

1. `playwright.config.ts` starts the **API** (`ERPm-BE/src/ERPm.API/bin/Debug/net10.0/ERPm.API.dll`) against a
   throwaway database `erpm_e2e_<random>`; EF migrations create it (`Database__AutoMigrate=true`) and the API
   bootstraps the `admin` account from `BootstrapAdmin__*`.
2. `global-setup.ts` seeds fictional data **through the public API** (the same calls the screens use).
3. Specs in `specs/` run (one worker, one shared database).
4. `global-teardown.ts` drops the database.

Passwords are generated per run (`support/env.ts`) and never written to disk. Nothing here is a real credential.

## Seeded data (what a spec can rely on)

| Kind | Content |
| :--- | :--- |
| Organization | `Head Office` (group) › `Company A` (`COMPANY_A`) › `Ha Noi` (`CA_HN`) › `Ha Noi Store 01` (`CA_HN_01`), and `Ho Chi Minh` (`CA_HCM`) under the company |
| Department | `Finance` (`FIN`, level DIVISION) in company A, branch Ha Noi |
| Job position | `Sales accountant` (`SALES_ACC`, scope BRANCH_TREE) with the system role `SALES_ACCOUNTANT` |
| Employees | `E100` Seed Employee (Ha Noi, Finance), `E101` Seed Employee Two (Ho Chi Minh) |
| Accounts | `admin` (super administrator) · `viewer` (legacy Viewer role) · `limited` (no role, no employee: no permissions of its own) · `accountant` (linked to `E100`, permissions come from the position role) |

Specs create everything else themselves with their own codes, so they can run in any order.

## How to use it from a spec

```ts
import { ADMIN_PASSWORD, USER_PASSWORD } from '../support/env';   // passwords of this run
import { Api } from '../support/api';                             // typed-less API client

const admin = await Api.login('admin', ADMIN_PASSWORD);
const tree = await admin.get('/branches/tree');                   // read stored state to assert after a UI action
```

`support/env.ts` also exposes `WEB_URL` (`http://127.0.0.1:4200`) and `API_URL` (`http://127.0.0.1:5143`).
To change the seed edit `global-setup.ts`; `specs/seed.spec.ts` (API only) shows what it must keep true.

## Run it locally

```
cd ERPm-BE && dotnet build src/ERPm.API          # the config starts the built DLL, it does not rebuild
cd ../tests/e2e && npm ci && npx playwright install chromium
npx playwright test
```

A Postgres is needed. Defaults match the local Docker container (`localhost:5433`, user `erpm_user`); override with
`ERPM_E2E_PG_HOST`, `ERPM_E2E_PG_PORT`, `ERPM_E2E_PG_USER`, `ERPM_E2E_PG_PASSWORD`.

## Not done here (left to the FE side and CI owner)

- The Angular dev server (`ng serve --proxy-config tests/e2e/proxy.json --port 4200`) is not started by the config;
  add it to `webServer` when the first browser spec lands (`proxy.json` already forwards `/api` and `/hubs`).
- A job in `.github/workflows/verify.yml`: needs `postgres` service, `dotnet build ERPm-BE/ERPm.sln`,
  `npm ci` and `npx playwright install --with-deps chromium` in `tests/e2e`, then `npx playwright test`
  with `ERPM_E2E_PG_PORT=5432`, `ERPM_E2E_PG_USER=postgres`, `ERPM_E2E_PG_PASSWORD=<the service password>`.
