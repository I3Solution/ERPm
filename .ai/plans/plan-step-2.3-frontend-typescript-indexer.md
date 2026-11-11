# Step 2.3 — Frontend TypeScript/Angular Indexer

> **Status:** Planned — discovery and first vertical slice next  
> **Created:** 2026-11-11  
> **Target repository:** `I3Solution/ERPm` umbrella; read-only indexing of pinned FE repositories  
> **Integration branch:** `master`  
> **Scope:** frontend code-index tooling, tests and documentation only

## 1. Objective

Build a local-first TypeScript/Angular indexer that can retrieve exact frontend definitions, imports, references, component/service/route metadata and API client HTTP declarations. Every record must retain repository identity, exact pinned commit SHA, repository-relative source path, source span, stable symbol identity, evidence and indexer/schema version.

The index is a retrieval aid. FE source, package manifests, TypeScript configuration and Git gitlinks remain authoritative.

## 2. Verified source snapshot

Use only the snapshot below for the first implementation and smoke tests. Do not resolve nested repositories to their latest remote branches.

- Umbrella root: `I3Solution/ERPm@468e7025fa4dee1e61bb651ed58c106361f05639`.
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
- Choose Node/TypeScript packaging and .NET CLI orchestration only after the discovery spike confirms the least fragile local workflow. Avoid introducing a second full CLI framework prematurely.

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
- Capture HTTP verb and literal path/URL only when directly represented in source.
- Preserve method source span and containing class/service symbol.
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
- [ ] Inspect Node version used by CI/local developer environment and nested-module project boundaries.
- [ ] Document representative API client patterns and recommend the minimal indexer package/CLI integration.

**Exit:** a source-backed frontend tooling report with exact paths and pinned SHA; no application files changed.

### 2.3.2 — TypeScript core indexer

- [ ] Define frontend index records using the shared schema/provenance policy.
- [ ] Load FE root and one selected module using the pinned tsconfig/compiler version.
- [ ] Index definitions, imports and compiler-resolved references.
- [ ] Implement deterministic exclusions and cache isolation.
- [ ] Add fixture tests for symbols, aliases, imports, references and generated files.
- [ ] Add CLI invocation and machine-readable output.

**Exit:** fixture tests pass and a real FE symbol query returns exact source evidence and pinned SHA.

### 2.3.3 — Angular and API metadata

- [ ] Extract component/service/guard metadata.
- [ ] Extract statically declared route metadata.
- [ ] Extract API client methods and HTTP verb/path literals.
- [ ] Add positive/negative fixture tests for dynamic and static cases.
- [ ] Label partial/unknown evidence instead of guessing.

**Exit:** one real FE module query returns component/service/route/API client evidence with exact spans.

### 2.3.4 — Workspace smoke test and acceptance

- [ ] Run tests and build in the supported local environment.
- [ ] Index one pinned FE module, then validate FE-root integration if supported.
- [ ] Verify zero generated/vendor/build paths in normal source results.
- [ ] Inspect representative symbol/import/reference/component/API queries.
- [ ] Verify mixed-SHA rejection and version-specific cache paths.
- [ ] Record counts, diagnostics, indexing time and known limitations.

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
