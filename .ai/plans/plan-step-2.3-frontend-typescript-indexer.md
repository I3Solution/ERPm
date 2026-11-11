# Step 2.3 — Frontend TypeScript/Angular Indexer

> **Status:** Implementation, CI and local Windows smoke verification passed; final code review and PR/merge pending  
> **Created:** 2026-11-11  
> **Target repository:** `I3Solution/ERPm` umbrella; read-only indexing of pinned FE repositories  
> **Integration branch:** `master`  
> **Scope:** frontend code-index tooling, tests and documentation only

## 1. Objective

Build a local-first TypeScript/Angular indexer that can retrieve exact frontend definitions, imports, references, component/service/route metadata and API client HTTP declarations. Every record must retain repository identity, exact pinned commit SHA, repository-relative source path, source span, stable symbol identity, evidence and indexer/schema version.

The index is a retrieval aid. FE source, package manifests, TypeScript configuration and Git gitlinks remain authoritative.

## 2. Verified source snapshot

Use only the snapshot below for the first implementation and smoke tests. Do not resolve nested repositories to their latest remote branches.

- Umbrella root at discovery verification: `I3Solution/ERPm@af74ff2ba768efb49ef37f07a60b81a1b0bb56ca` (after PR #65 merge).
- FE gitlink: `ERPm-FE@62270988b42eece930c702d1272fe857d31bcbb9`.

Recursive FE module gitlinks observed in the user's workspace:

| Module | Exact SHA |
|---|---|
| ACC | `2061e4d7424539f1fe7de920ede86a81264e9098` |
| CRM | `9b66e321d6cff83ed703d080c3e5e19996816477` |
| HRM | `f66e1bb61fe222684a9c63addde93c11d1559df3` |
| MFG | `438693239d984e3c2ae060d4f24033ab41d7855d` |
| PM | `e0d4154fede259e9c9da778e8f77aff947640e29` |
| PUR | `c7e1c0c7f0957a91bba5e8892d1257d4640a2e33` |
| SCM | `0661fdfb7361957b1594890d5efa7a2bc9329624` |
| SD | `750960006dd1190682556334fdf3a64b6273aad4` |
| WMS | `fd320c77642a0860ca8cfad25de10ea9bd1e796c` |
| dashboard | `4380f4b433de6ec86be5b4934279af177be5dca5` |

The indexer must read the current recursive gitlink manifest at runtime and reject a repository whose checkout differs from the pinned SHA. The table is the starting snapshot, not a hardcoded replacement for runtime validation.

## 3. Discovery tasks

Before choosing the final folder/package layout, inspect the exact FE snapshot and report:

- package manager and lockfile(s);
- Node runtime/toolchain constraints and CI environment;
- FE root `package.json`, TypeScript config(s), Angular workspace config and module-level configs;
- actual TypeScript version (expected 5.8.3 from the current architecture plan);
- Angular version and stable metadata patterns used by components, services, guards and routes;
- nested module repository boundaries and whether each module has an independent TypeScript config or inherits FE root configuration;
- generated/vendor/build output exclusions;
- representative API client/service patterns, including HTTP verb and URL literals.

Do not change FE application package manifests, lockfiles, TypeScript config or Angular config as part of discovery.

## 4. Architecture

### 4.1 Compiler-backed TypeScript core

- Use TypeScript Compiler API with the FE project's pinned TypeScript version (expected 5.8.3; verify before implementation).
- Load the relevant tsconfig and preserve its path aliases, module resolution, strictness and project boundaries.
- Prefer compiler-resolved symbols and source spans over text-only name matching.
- Keep the extractor deterministic for a fixed repository SHA, config and indexer/schema version.
- Reuse the common JSONL provenance contract and cache key policy from `tools/ERPm.CodeIndex` where practical.
- Isolate frontend-specific extraction from backend Roslyn code; do not couple the indexer to FE runtime application code.
- Use the existing .NET CLI as orchestrator and manifest/SHA/cache/provenance owner; invoke an isolated Node worker under `tools/frontend-code-indexer`.
- Give the worker its own `package.json` and lockfile, pinning TypeScript `5.8.3`; do not modify FE application manifests or lockfiles.
- Pass the already validated workspace manifest from .NET to the worker; do not implement a second Git/submodule manifest parser in Node.
- Use FE root `tsconfig.app.json` and `src/main.ts` as the initial application Program entry. Report actual Program coverage and do not claim unreferenced TypeScript files are indexed.
- Attribute each file to the longest matching manifest `RelativePath`; emit that entry's `RepositoryId` and exact `CommitSha`. Never stamp nested-module files as FE-root records.

### 4.2 Initial record categories

At minimum support:

- source file / module observations;
- namespace/module declarations where applicable;
- class, interface, enum, function and member definitions;
- imports and compiler-resolved symbol references;
- component, injectable service, guard and route metadata;
- API client method declarations and statically declared HTTP method/path literals.

Use typed relation values such as `defines`, `imports`, `references`, `injects`, `declaresRoute` and `callsApi` only where source evidence supports them. Preserve unresolved/dynamic cases as partial/unknown or omit them; never fabricate targets.

### 4.3 Angular metadata extraction

- Start with public/stable TypeScript decorator and Angular metadata patterns.
- Extract component selector/template/style references only when statically available.
- Extract injectable service declarations and constructor/`inject()` dependencies where statically resolvable.
- Extract route declarations from static route arrays and supported router configuration patterns.
- Keep template expression resolution and advanced Angular compiler integration as separate optional capabilities; do not depend on undocumented Angular compiler internals for the first slice.

### 4.4 API client extraction

- Identify FE service/client methods that invoke Angular `HttpClient` or the project's established HTTP abstraction.
- Capture HTTP verb and preserve the original URL expression.
- Classify URL evidence as `literal`, `interpolated` or `dynamic`; populate `literalPath` only when a literal path is directly present in source.
- Preserve method source span and containing class/service symbol. Do not evaluate environment variables or fabricate a fully resolved URL.
- Do not match a FE API call to a BE endpoint by similar names alone; cross-layer matching belongs to Step 2.5 and requires route/path evidence.

## 5. Generated and excluded source policy

- Exclude build output, coverage, package caches, generated declaration/output trees and dependency directories (for example `node_modules`, `dist`, `coverage`, `.angular`, `out-tsc`) according to repository-relative path segments.
- Exclude generated files only by explicit conventions or generated headers; do not exclude handwritten files based on broad name fragments.
- Respect tsconfig `include`, `exclude`, `files`, project references and path aliases.
- Emit repository-relative normalized paths; never emit absolute machine paths.
- Record excluded file/tree counts in index diagnostics.

## 6. Implementation sequence

### 2.3.1 — Workspace and tooling discovery

- [x] Verify root and recursive FE gitlink SHAs.
- [x] Inspect FE root package manager and lockfile.
- [x] Confirm TypeScript and Angular versions from the pinned FE source.
- [x] Inspect root Angular/TypeScript compiler configuration and static route metadata.
- [x] Inspect Node version used by CI/local developer environment and nested-module project boundaries.
- [x] Document representative API client patterns and recommend the minimal indexer package/CLI integration.
- [x] Run the existing .NET `workspace status` command and verify all 12 repository IDs, relative paths and pinned SHAs.

**Exit: MET (2026-11-11).** Source-backed tooling report, runtime manifest, nested repository boundaries and representative API patterns verified; no FE application files changed.

### 2.3.2 — TypeScript core indexer

- [x] Define schema v3 JSON Schema and typed .NET frontend record model; add positive/negative JSON Schema validation tests.
- [x] Load the FE application Program from the pinned root `tsconfig.app.json` / `src/main.ts`; attribute included source files to the longest matching manifest repository path.
- [x] Index source files, supported definitions, imports and compiler-resolved references with schema v3 records.
- [x] Implement deterministic source exclusions and per-repository / pinned-SHA / indexer-version cache isolation.
- [x] Add fixture tests for symbols, imports, references, nested repository attribution and generated files.
- [x] Add CLI invocation and machine-readable JSONL output.

**Exit:** fixture tests pass and a real FE symbol query returns exact source evidence and pinned SHA.

### 2.3.3 — Angular and API metadata

- [x] Extract component/service/guard metadata from Angular decorators and statically typed guard declarations.
- [x] Extract statically declared route path, lazy import target and guard invocation metadata.
- [x] Extract Angular HttpClient calls, HTTP verbs, original URL expressions and literal/interpolated/dynamic classifications.
- [x] Add fixture tests for Angular decorators, static routes, guards, HttpClient calls and all URL evidence classes.
- [x] Preserve unresolved import targets as partial; dynamic/interpolated API paths never receive fabricated literal paths.

**Exit:** one real FE module query returns component/service/route/API client evidence with exact spans.

### 2.3.4 — Workspace smoke test and acceptance

- [x] Run tests and build in the supported local Windows environment: `npm ci`; Node worker tests 3/3; .NET build succeeded; .NET tests 18/18.
- [x] Index the pinned FE application Program and nested repositories: local run wrote 13,140 records across six repositories; CI run indexed 102 source files from a 161-file Program and wrote 12,880 records.
- [x] Verify generated/vendor/build exclusions through worker filtering and CI validation; local provenance audit covered all 8 cache files with zero mismatches.
- [x] Inspect representative symbol/API queries locally (`PartnerService`, `getPartnerById`) and in CI (definition-first `PartnerService`, interpolated API query); local index output spans six repositories.
- [x] Verify active-SHA cache isolation with a synthetic record under a fake SHA; `find symbol` did not return it. Cache paths include repository, SHA and indexer version. Old cache folders are retained but not selected.
- [x] Record local record count (13,140), CI coverage/counts (102/161 source files; 12,880 records), provenance results (8 files, 0 errors), test counts and known Program-reachability limitation. Indexing duration and detailed diagnostics were not captured.

**Exit:** a reproducible frontend index for at least one real pinned module; broader all-module indexing only after measured reliability.

## 7. Acceptance criteria

| ID | Acceptance criterion |
|---|---|
| FEI-01 | Runtime validates exact FE root and recursive module gitlink SHAs. |
| FEI-02 | TypeScript version/configuration are read from the pinned FE workspace, not silently upgraded. |
| FEI-03 | Definitions, imports and compiler-resolved references include exact source spans and provenance. |
| FEI-04 | Stable symbol IDs distinguish same-named symbols in different modules/scopes. |
| FEI-05 | Angular component/service/guard/route metadata is extracted only from supported static evidence. |
| FEI-06 | API client HTTP verb/path literals are captured without name-only BE matching. |
| FEI-07 | Generated, vendor and build outputs are excluded and covered by tests. |
| FEI-08 | Fixture tests pass; one real FE module smoke test passes. |
| FEI-09 | Cache keys include repository, exact SHA, schema and indexer version; generated cache is untracked. |
| FEI-10 | No FE application source, application dependency, lockfile or build-config changes. |

## 8. Out of scope

- FE application changes, dependency upgrades or refactors.
- Full Angular template type-checking or runtime DI graph.
- Dynamic route construction and computed API URL resolution.
- Name-only FE-to-BE endpoint matching.
- Database indexing and cross-layer traces (Step 2.4/2.5).
- Hosted indexing service, vector/RAG search, SQLite or MCP unless later justified by measured needs.
- Committing generated index/cache data.

## 9. Delivery and safety

- Work on a new `loipham/*` branch from current root `master`; never work directly on master.
- Inspect current working-tree and submodule state before commands that may change checkout state.
- Do not run destructive reset/clean/forced submodule checkout.
- Preserve local user modifications and both root/backend `global.json` files.
- Keep implementation PR focused on tooling, tests and documentation.
- Require CI plus local fixture and real-module smoke evidence before marking Step 2.3 complete.

## 10. Provenance

- Root and recursive FE SHAs above were supplied by the user's `git rev-parse`, `git ls-tree` and `git submodule status --recursive` output on 2026-11-11.
- Confidence: high for the reported Git snapshot; package/toolchain facts remain to be verified directly from the pinned FE manifests.
- Retrieval reason: establish a reproducible, revision-safe starting point for the frontend indexer.


## 11. Discovery findings — pinned FE snapshot (2026-11-11)

Source inspected at `I3Solution/ERPm-FE@62270988b42eece930c702d1272fe857d31bcbb9`:

| File | Verified finding |
|---|---|
| `package.json` | npm scripts; Angular dependencies declared at `^20.3.34`; TypeScript declared as `~5.8.3` |
| `package-lock.json` | npm lockfileVersion 3; exact TypeScript `5.8.3`; exact Angular core/router `20.3.34`; Angular DevKit/build tooling `20.3.42` |
| `angular.json` | Angular application project `client`; sourceRoot `src`; build uses `tsconfig.app.json`; output `dist/client`; Karma tests use `tsconfig.spec.json` |
| `tsconfig.json` | strict TypeScript; ES2022 target/module; `moduleResolution: bundler`; decorators enabled; strict Angular injection/template checks |
| `tsconfig.app.json` | extends root tsconfig; app entry file `src/main.ts`; declaration include `src/**/*.d.ts` |
| `tsconfig.spec.json` | extends root tsconfig; includes `src/**/*.spec.ts` and declarations |
| `src/app/app.routes.ts` | static `Routes` array; many `loadComponent: () => import(...).then(...)` lazy route declarations; guards include direct references and factory-style calls |
| `src/app/app.config.ts` | `provideRouter(routes)`, `provideHttpClient(withInterceptors(...))`, Ionic provider setup |

### Toolchain constraints

- Package manager is npm; lockfile is committed.
- The lockfile's Angular 20.3.34 packages declare Node engine support `^20.19.0 || ^22.12.0 || >=24.0.0`. Verify the actual CI/local Node version before executing npm commands.
- No `.nvmrc` or `.node-version` file was found at the FE root.
- The TypeScript compiler version is pinned by the lockfile at 5.8.3. The indexer must use this version rather than an independently upgraded global compiler.

### Architectural implications

1. The app compiler configuration is rooted at `tsconfig.app.json` and the program starts from `src/main.ts`; compiler import traversal should be used rather than scanning every `.ts` file indiscriminately.
2. Lazy route components are represented by dynamic `import()` expressions in a static route array. This is a tractable first Angular route-extraction fixture and can retain the import path and resolved component symbol.
3. The root FE repository contains nested Git submodules under `src/app/modules`. A TypeScript Program may resolve files across those nested roots; each emitted record must be assigned to its owning repository root and exact gitlink SHA, not stamped with the FE root SHA indiscriminately.
4. Route guards can be direct references or factory-style calls (for example permission guards). Preserve the syntactic form and only emit a resolved dependency when the checker supports it.
5. API client patterns and nested module-specific configuration have not yet been inspected; keep these discovery items open.

**Evidence paths and revisions:** all findings above derive from the exact FE files listed in the table at commit `62270988b42eece930c702d1272fe857d31bcbb9`. Confidence: high for manifest/config/route facts; Node runtime actually used in CI and module-specific project boundaries remain unverified.


## 12. Discovery closure and implementation decisions — 2026-11-11

### 12.1 Runtime workspace manifest

The user ran `dotnet run --project tools/ERPm.CodeIndex -- workspace status` on root commit `af74ff2ba768efb49ef37f07a60b81a1b0bb56ca`. The command returned 12 repositories and confirmed the pinned FE root plus ten nested module revisions:

| Repository | Repository ID | Relative path |
|---|---|---|
| Backend | `erpm-be` | `ERPm-BE` |
| FE root | `erpm-fe` | `ERPm-FE` |
| ACC | `erpm-fe-src-app-modules-acc` | `ERPm-FE/src/app/modules/ACC` |
| CRM | `erpm-fe-src-app-modules-crm` | `ERPm-FE/src/app/modules/CRM` |
| HRM | `erpm-fe-src-app-modules-hrm` | `ERPm-FE/src/app/modules/HRM` |
| MFG | `erpm-fe-src-app-modules-mfg` | `ERPm-FE/src/app/modules/MFG` |
| PM | `erpm-fe-src-app-modules-pm` | `ERPm-FE/src/app/modules/PM` |
| PUR | `erpm-fe-src-app-modules-pur` | `ERPm-FE/src/app/modules/PUR` |
| SCM | `erpm-fe-src-app-modules-scm` | `ERPm-FE/src/app/modules/SCM` |
| SD | `erpm-fe-src-app-modules-sd` | `ERPm-FE/src/app/modules/SD` |
| WMS | `erpm-fe-src-app-modules-wms` | `ERPm-FE/src/app/modules/WMS` |
| Dashboard | `erpm-fe-src-app-modules-dashboard` | `ERPm-FE/src/app/modules/dashboard` |

The runtime manifest is authoritative. The worker must not hardcode IDs or SHAs. Repository attribution uses longest-prefix matching against normalized `RelativePath`; nested files are assigned only to the most specific matching repository entry.

### 12.2 Verified toolchain and project boundaries

- Local Node.js: `22.12.0`; npm: `10.9.0`.
- CI uses Node 22.
- Package manager: npm; committed lockfileVersion 3.
- TypeScript: `5.8.3`; Angular core/router: `20.3.34`; Angular DevKit/build tooling: `20.3.42`.
- Angular workspace project: `client`; source root: `src`; application compiler config: `tsconfig.app.json`; entry: `src/main.ts`.
- Nested modules have no independent `package.json`, `angular.json`, `tsconfig.json`, `tsconfig.app.json` or `project.json`; they inherit the FE root TypeScript project.
- The application routes include static `Routes` arrays, lazy `import()` component loading and direct/factory-style guard declarations.

### 12.3 Compiler Program coverage boundary

The initial Program uses FE root `tsconfig.app.json` and its `src/main.ts` entry. Compiler import traversal includes reachable modules and resolved dependencies. It does not prove that every `.ts` file in the FE root and nested repositories is included. The indexer must report actual Program source coverage and avoid describing this as a full recursive filesystem scan. A separate discovery mode for unreferenced files may be considered later, without weakening compiler semantics.

### 12.4 API evidence observed

Representative inspected patterns:
- `src/app/core/services/auth.service.ts`: literal POST `/api/v1/auth/login` and GET `/api/v1/auth/me`.
- `localization.service.ts`: environment-derived base URL and language suffix.
- `notification-state.service.ts`: environment-derived base URL with literal suffixes and dynamic recipient identifiers.
- CRM `partner.service.ts`: GET/POST/PUT/DELETE operations over a base URL and identifier templates.
- Dashboard and SD services: environment-derived API bases, literal suffixes and dynamic URL expressions.

API records must preserve the original expression and distinguish `literal`, `interpolated` and `dynamic`. Only a source literal may populate `literalPath`; do not resolve environment variables or dynamic identifiers by guesswork.

### 12.5 Final architecture decision

1. .NET CLI remains the orchestrator and owner of manifest validation, SHA validation, cache layout and provenance.
2. Node worker is isolated at `tools/frontend-code-indexer`, with its own package manifest and lockfile pinning TypeScript `5.8.3`.
3. The validated workspace manifest is passed from .NET to Node; no second Git/submodule parser is introduced.
4. TypeScript core, Angular metadata and API extraction remain separate modules.
5. Schema v1 and v2 remain unchanged. Frontend records use a new schema v3 and a separate typed model. Backend migration is out of Step 2.3 scope.
6. No FE application package manifest, lockfile, tsconfig, Angular config or source file is modified.

**Discovery confidence:** high for runtime manifest, exact checked-out SHAs, FE toolchain, compiler configuration and nested repository boundaries. API patterns are representative observations and require fixture coverage during implementation.


## 13. Schema v3 contract baseline — 2026-11-11

Added `.ai/code-index/schema/index-record-v3.schema.json` and typed `FrontendIndexRecord`, `AngularIndexMetadata` and `ApiIndexMetadata` models.

- Schema v3 is strict (`additionalProperties: false`) and independent of immutable v1/v2.
- Common provenance includes repository ID, 40-character lowercase commit SHA, repository-relative path, indexer version and generation timestamp.
- Source spans carry line and character offsets; unavailable positions are explicit `null`.
- Language-neutral symbol categories replace the C#-specific v2 category enum.
- Angular metadata and API observations use separate typed objects.
- API URL evidence is classified as `literal`, `interpolated` or `dynamic`. Only literal URLs may populate `literalPath`; dynamic/interpolated values must leave it null.
- Record kind controls the permitted typed payload; unknown properties and unsupported enum values are rejected.
- Validation tests cover valid Angular/API observations and invalid URL/payload/provenance cases using JsonSchema.Net. Local package restore and test execution remain pending.


## 14. TypeScript core worker implementation — 2026-11-11

Added an isolated Node worker under `tools/frontend-code-indexer`:
- Separate `package.json` and npm lockfile pin TypeScript exactly to 5.8.3; FE application manifests and lockfiles remain untouched.
- Worker consumes the validated .NET workspace manifest through stdin and does not invoke Git or parse submodule status.
- Compiler Program is created from the pinned FE root `tsconfig.app.json`, whose application entry is `src/main.ts`.
- Source ownership is resolved using the longest matching manifest repository path. Records carry the exact SHA for that owner and repository-relative paths.
- Initial extractors emit source-file records, supported TypeScript declarations, import edges and compiler-resolved identifier references/calls.
- Excludes declaration files, generated suffixes/headers and common vendor/build output directories.
- .NET CLI command `index repo erpm-fe` invokes the worker, validates emitted repository/SHA/path/version fields and writes separate schema v3 JSONL caches for each repository represented in the Program.
- Node built-in test runner fixtures cover definition/import/reference extraction, nested module attribution, pinned SHA propagation and generated-source exclusion.
- CI now installs the isolated worker dependencies and runs its Node tests before the existing .NET code-index build/tests.

**Verification state:** implementation is committed to the feature branch. CI and local real-workspace smoke test are pending; do not mark Step 2.3.2 accepted until both pass and record counts/source samples are inspected.


## 15. Angular and API metadata implementation — 2026-11-11

The Node worker now includes isolated extractors for:
- Angular `@Component` metadata: selector, template/template URL and statically declared styles.
- Angular `@Injectable` metadata: `providedIn`.
- Functional guards with explicit Angular guard function types.
- Static `Routes` arrays: literal route path, lazy import path, compiler-resolved lazy target symbol and original guard invocation expression.
- Angular `HttpClient` calls resolved by the TypeScript checker: HTTP method, exact source URL expression, containing method symbol and URL evidence class.

URL evidence rules:
- String literal or no-substitution template literal: `literal`, with the exact literal path.
- Template expression with substitutions: `interpolated`, with the original expression and `literalPath: null`.
- Identifier, property access, concatenation or other computed expression: `dynamic`, with `literalPath: null`.
- HTTP calls are accepted only when the receiver type resolves to Angular's `HttpClient`; arbitrary objects with methods named `get`/ `post` are not treated as API clients.

Fixture coverage now includes component/service decorators, functional guards, lazy route imports, guard invocation text, literal/interpolated/dynamic URLs, nested repository attribution, exact pinned SHA propagation and generated-file exclusion.

### Pinned FE CI smoke evidence

The code-index job completed the actual pinned FE Program smoke test and symbol queries. Latest full workflow run #542 passed backend, frontend and code-index at branch HEAD `1bb5bf789f62100e4d4d413a91217e5cd35a64ed`:
- TypeScript compiler: 5.8.3.
- Program source files: 161.
- Indexed source files: 102.
- Excluded/external/declaration source files: 59.
- Records written: 12,880 across the FE root and five nested repositories represented in the Program.
- FE root: 5,889 records at `62270988b42eece930c702d1272fe857d31bcbb9`.
- CRM: 745 records at `9b66e321d6cff83ed703d080c3e5e19996816477`.
- dashboard: 64 records at `4380f4b433de6ec86be5b4934279af177be5dca5`.
- HRM: 1,737 records at `f66e1bb61fe222684a9c63addde93c11d1559df3`.
- SD: 3,690 records at `750960006dd1190682556334fdf3a64b6273aad4`.
- WMS: 755 records at `fd320c77642a0860ca8cfad25de10ea9bd1e796c`.

No records were emitted for ACC, MFG, PM, PUR or SCM because their source files were not reachable from the configured FE application Program entry in this pinned snapshot. This is expected compiler coverage, not evidence that those repositories are empty or unsupported.

The CI query `find symbol PartnerService` returned a definition from CRM at `services/partner.service.ts`, lines 72–177, with the exact CRM SHA. Definition records are prioritized ahead of references. The same run extracted 130 Angular metadata records (63 components, 18 services, 3 guards, 46 routes) and 34 HttpClient API observations (17 GET, 9 POST, 5 PUT, 3 DELETE). API URL evidence comprised 4 literal, 16 interpolated and 14 dynamic expressions; interpolated/dynamic records retain the original expression and have no fabricated literal path. The workflow now also queries `getPartnerById` and requires an interpolated API record.

**Verification state (2026-11-11):** CI run #545 passed all three jobs (backend, frontend and code-index) at branch HEAD `184a0a4d4f32f7ed687800bf626a4be034e25bb5`. CI indexed 102 source files from 161 Program files and wrote 12,880 records. Local Windows verification passed: `npm ci`, Node tests 3/3, .NET build and tests 18/18, 12-repository manifest validation, FE indexing (13,140 records across six repositories), `PartnerService` / `getPartnerById` queries, and cache provenance audit (8 files, 0 mismatches). A synthetic fake-SHA record was not returned by the active-SHA query. The cache test demonstrates SHA-keyed isolation; old cache folders are intentionally retained. `git status --short` was clean and `.ai/code-index/cache/` was confirmed ignored. Indexing duration and detailed diagnostics were not captured. Final code review and PR/merge remain pending.
