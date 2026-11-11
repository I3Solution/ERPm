# Phase 2 — Code Intelligence & Dependency Indexing

> **Status:** Step 2.2 backend quality accepted; Step 2.3 frontend implementation and verification complete on feature branch; final review/PR pending  
> **Created:** 2026-11-10  
> **Owner:** ERPm Context Engineering  
> **Target repository:** `I3Solution/ERPm` (umbrella), with read-only indexing of pinned child repositories  
> **Integration branch:** `master`

## 1. Objective

Build a local-first code intelligence layer that lets coding agents find exact symbols, definitions, references, callers, imports, project dependencies, API contracts and database mappings without repeatedly scanning broad source trees.

The index is a retrieval aid, not a replacement for source code. Every result must point to the exact repository, commit SHA and source location. The checked-out Git tree remains authoritative.

## 2. Verified workspace baseline

This plan is based on the root integration snapshot after the roadmap PR #56 merge:

| Repository | Revision | Role |
|---|---|---|
| `I3Solution/ERPm` | `5a43143a12d99ab5709d1d23d07225e98bbf783d` | Umbrella / integration |
| `I3Solution/ERPm-BE` | `56385da65226f72c3b66f9c839e2fc430ce85210` | Backend |
| `I3Solution/ERPm-FE` | `dbeaf66687454452886201bb669df1e25478d893` | Frontend |

The FE revision pins ten nested module repositories. The indexer must read those exact gitlink SHAs, not resolve their latest remote branches:

| FE module | Pinned revision |
|---|---|
| ACC | `2061e4d7424539f1fe7de920ede86a81264e9098` |
| CRM | `ce5632a16bc60ee51a9f74c06cfd4928fd94727c` |
| HRM | `f66e1bb61fe222684a9c63addde93c11d1559df3` |
| MFG | `438693239d984e3c2ae060d4f24033ab41d7855d` |
| PM | `e0d4154fede259e9c9da778e8f77aff947640e29` |
| PUR | `c7e1c0c7f0957a91bba5e8892d1257d4640a2e33` |
| SCM | `0661fdfb7361957b1594890d5efa7a2bc9329624` |
| SD | `106d48ed4a2461c818a046b7269487660987fbc1` |
| WMS | `9d750f6c0f7520735cea7bd4c65025b7fed8f312` |
| dashboard | `4380f4b433de6ec86be5b4934279af177be5dca5` |

If the root gitlink changes, indexing must follow the new pinned revision only after the workspace is updated and validated. An index containing mixed revisions must be rejected.

## 3. Findings from source inspection

### Backend

- .NET target framework: `net10.0`.
- SDK pinned by `ERPm-BE/global.json`: `10.0.403`.
- Solution: `ERPm.sln`.
- Main projects: API, Application, Domain and Infrastructure.
- Existing schema utility: `tools/ERPm.Schema`, which references Infrastructure and generates PostgreSQL DDL from EF Core metadata without connecting to a database.
- EF Core model snapshot and migrations exist under `src/ERPm.Infrastructure/Persistence/Migrations`.
- Existing source boundaries provide useful first-class index nodes: Controllers, DTOs, service interfaces/implementations, entities, DbContext, configurations and migrations.

### Frontend

- Angular: `20.3.x`; Ionic: `8.8.x`.
- TypeScript: `5.8.3`.
- TypeScript configuration uses strict mode and bundler module resolution.
- FE root contains the application shell and SYS/shared code; business modules are nested Git submodules.
- First-class index nodes include standalone components, services, routes, guards, models/interfaces, API clients, imports and Angular dependency-injection relationships.

### Database

- PostgreSQL is the backend database.
- EF Core model metadata, model snapshot, migrations and SQL files are available.
- The existing schema utility demonstrates that the current model can be exported without a live database.
- The initial index should distinguish model-derived facts from migration/raw-SQL observations and must not claim that a text scan is a complete SQL dependency graph.

## 4. Architecture proposal

### 4.1 Local-first, umbrella-owned tooling

Keep the first implementation inside the umbrella repository because the index spans root metadata, BE, FE and nested FE modules. Do not create another Git repository or hosted service for the MVP.

Proposed layout (subject to implementation review):

```text
tools/
  ERPm.CodeIndex/
    src/
      Core/                 # shared index contract and orchestration
      Backend.Roslyn/       # .NET / MSBuildWorkspace indexer
      Database.EFCore/      # EF model + migration metadata extraction
      Cli/                  # command-line entry point and query commands
  frontend-code-indexer/
    src/                    # TypeScript Compiler API / Angular-aware extractor
.ai/
  code-index/
    schema/                 # versioned index contract
    README.md               # usage, freshness and provenance rules
```

The layout is a proposal, not a commitment to these exact project names. Keep components independently testable and avoid coupling indexers to ERPm runtime business code.

### 4.2 Technology choices

| Concern | Proposed technology | Reason / constraint |
|---|---|---|
| C# symbols and references | Roslyn + MSBuildWorkspace | Compiler-backed symbol identity and reference resolution |
| MSBuild loading | Microsoft.Build.Locator | Load the solution with the installed .NET SDK and project references |
| TypeScript symbols/imports | TypeScript Compiler API | Uses the FE project's pinned TypeScript version and compiler configuration |
| Angular metadata | Public Angular compiler metadata where stable; otherwise TypeScript decorators + template/config parsing | Avoid depending on undocumented Angular compiler internals |
| EF model/schema | EF Core design-time model metadata | Reuse the existing DbContext/model without a live DB |
| Cross-language contract | Versioned JSONL records | Simple interchange format, diffable and streamable |
| Query store | Start with generated JSONL; add SQLite read model only when query needs and measurements justify it | Avoid premature storage complexity |
| Execution | Local CLI | Validate the retrieval workflow before MCP |
| Cache | Local, untracked cache keyed by repository + commit SHA + indexer/schema version | Never commit generated indexes or mix revisions |

Package versions must be selected and verified against the actual .NET SDK, FE lockfile and CI environment during implementation. Do not update application dependencies merely to satisfy the indexer.

### 4.3 Index record contract

The record contract is explicitly versioned. Schema versions are not interchangeable and consumers must validate the declared version before deserialization:

- **Schema v1:** historical backend contract; immutable.
- **Schema v2:** current backend Roslyn contract, including the existing C#-oriented `symbolKind` and `sourceSymbolKind`; immutable during Step 2.3.
- **Schema v3:** new language-neutral contract introduced for frontend TypeScript/Angular observations. It must not silently alter or reinterpret v1/v2 records.

All versions retain the common provenance invariants: `schemaVersion`, `indexerVersion`, `repositoryId`, repository-relative `path`, exact `commitSha`, stable identity where applicable, source evidence, and generation timestamp. Version-specific required fields and enums are defined by their own JSON Schemas and typed models.

Schema v3 must support:
- Language-neutral observation and symbol categories without constraining TypeScript/Angular kinds to the existing Roslyn enum.
- Stable symbol IDs derived from repository identity, normalized repository-relative path, semantic scope/kind and compiler symbol identity; display names alone are never unique IDs.
- Source spans with line and character offsets when available.
- Controlled typed relation values and evidence status (`verified`, `partial`, `unknown`); unresolved targets must remain unresolved rather than fabricated.
- Typed Angular observations for component, injectable/service, guard and route metadata.
- Typed API observations for HTTP method, URL classification (`literal`, `interpolated`, `dynamic`), original expression and literal path only when directly present in source.
- Explicit provenance tying every record to one repository and one exact pinned SHA.

Do not use an arbitrary untyped metadata bag or overload `qualifiedName`/`symbolId` with Angular or API payloads. Keep backend v2 serialization unchanged in Step 2.3; any future backend migration requires a separate plan, compatibility tests and before/after verification.

### 4.4 Revision and cache policy

1. Read root HEAD and all recursive gitlinks before indexing.
2. Resolve each source repository to the exact pinned SHA.
3. Generate a separate source manifest per repository.
4. Key cache entries by repository ID, commit SHA, index schema version and indexer version.
5. Rebuild a repository index when any key changes.
6. Reject query results whose source SHA does not match the active workspace manifest.
7. Keep generated files outside tracked source (for example, a configurable local cache directory); add ignore rules only after agreeing the final cache location.

The first MVP may rebuild a whole repository when its SHA changes. File-level incremental indexing is deferred until profiling proves it is necessary.

## 5. MVP scope

### 5.1 Backend Roslyn index

Include:
- Solution, project, assembly and project-reference graph.
- Namespaces, types, interfaces, enums, methods, properties and fields.
- Definitions and compiler-resolved symbol references.
- Method invocation/caller edges where Roslyn can resolve them.
- Inheritance and interface implementation.
- Dependency-injection registrations and constructor injection where statically discoverable.
- ASP.NET controller/action routes and request/response DTO links where statically discoverable.
- EF entity/configuration/DbContext symbol links as a bridge to database indexing.

Do not promise complete runtime call graphs, reflection/dynamic dispatch resolution or full data-flow analysis in the MVP.

### 5.2 Frontend TypeScript / Angular index

Include:
- FE root and nested module repository/project boundaries.
- TypeScript source files, modules, classes, interfaces, functions and members.
- Definitions, imports and compiler-resolved references.
- Angular components, services, guards and route declarations.
- Constructor/inject() dependencies where statically discoverable.
- Template-to-component references where supported by stable compiler metadata.
- API service/client methods and their HTTP path/method literals where statically discoverable.

Do not promise complete runtime dependency injection, dynamic route construction or arbitrary template expression evaluation in the MVP.

### 5.3 Database index

Include:
- EF entity type → table mapping.
- Entity property → column mapping and database type.
- Primary keys, foreign keys, indexes and relationships exposed by EF metadata.
- Migration IDs, operations and affected tables/columns when statically extractable.
- Raw SQL files as source observations with explicit confidence and provenance.

Do not connect to a production database or infer the live schema from a developer's local database. Runtime database introspection is out of scope for the first MVP.

### 5.4 Cross-layer relationships

First useful end-to-end links:
- Angular API client method → backend route/action.
- Backend action → request/response DTO.
- Backend DTO/entity/configuration → EF table/column.
- Entity/table/column → migration evidence.
- Component/route → service and imported module.

A relationship is marked verified only when both endpoints and the connecting evidence are identified. Matching names alone is not sufficient.

## 6. CLI contract (initial proposal)

Proposed commands:

```text
erpm-index workspace status
erpm-index index workspace
erpm-index index repo <repository-id>
erpm-index find symbol <name-or-pattern>
erpm-index references <symbol-id>
erpm-index callers <symbol-id>
erpm-index dependencies <repository-or-project>
erpm-index trace api <method-or-route>
erpm-index trace database <entity-or-table>
```

The CLI must support machine-readable JSON output for agent consumption and concise human-readable output for developers. Exact flags and output envelope will be finalized with the first vertical slice.

## 7. Implementation sequence

### Step 2.1 — Contract and CLI skeleton

- [x] Define versioned JSONL record schemas and stable ID rules (v1/v2 immutable; frontend v3 introduced in Step 2.3).
- [ ] Define workspace manifest format including root and recursive gitlink SHAs.
- [ ] Add local cache policy and ensure generated artifacts are not committed.
- [ ] Create CLI skeleton with `workspace status`, `index` and `find` command contracts.
- [ ] Add small deterministic fixtures and schema validation tests.

**Exit:** a sample index can be generated and queried with explicit source SHA and provenance.

### Step 2.2 — Backend Roslyn vertical slice

- [ ] Load `ERPm.sln` with MSBuildWorkspace using SDK 10.0.403.
- [ ] Index projects, project references, namespaces, types and members.
- [ ] Resolve definitions and references for a selected symbol.
- [ ] Add invocation/caller edges and inheritance/interface relationships.
- [ ] Add tests using small fixture projects plus ERPm smoke indexing.
- [ ] Record unsupported constructs and load diagnostics.

**Exit:** a developer can query a real ERPm backend symbol and receive exact definitions/references with file spans and pinned SHA.

### Step 2.3 — Frontend TypeScript/Angular vertical slice

- [x] Complete pinned FE tooling, compiler configuration, CI/runtime and nested repository-boundary discovery.
- [x] Introduce schema v3 and a typed frontend record model; preserve backend schema v2 unchanged.
- [x] Add an isolated Node worker pinned to TypeScript 5.8.3 with its own package manifest and lockfile.
- [x] Use FE root `tsconfig.app.json` and `src/main.ts` as the initial compiler Program entry; report actual Program coverage rather than claiming every repository TypeScript file is included.
- [x] Attribute every source file to the longest matching repository root from the validated recursive manifest, using that repository's exact SHA.
- [x] Index TypeScript definitions, imports and compiler-resolved references.
- [x] Add isolated Angular component/service/guard/route and API HTTP observations with explicit evidence and URL classification.
- [x] Add fixture tests, repository/SHA provenance checks and real FE Program smoke tests in CI and the local Windows workspace.

**Exit:** a developer can query a real Angular symbol/import/API client and receive exact source evidence, repository identity, pinned SHA and schema-v3 provenance.

### Step 2.4 — Database metadata index

- [ ] Extract the EF model without a live database.
- [ ] Index entity/table/column/key/FK/index metadata.
- [ ] Extract migration IDs and supported migration operations.
- [ ] Record raw SQL observations separately with confidence labels.
- [ ] Link EF model symbols and migration evidence to database records.

**Exit:** entity/table/column lookups return model and migration provenance at the exact BE SHA.

### Step 2.5 — Unified query and cross-layer tracing

- [ ] Merge records from backend, frontend and database indexers.
- [ ] Implement references, callers, dependencies and API/database trace queries.
- [ ] Match FE API clients to BE routes only with explicit evidence.
- [ ] Reject mixed-SHA indexes and expose partial/unknown relations.
- [ ] Evaluate whether SQLite is justified for graph traversal and query latency.

**Exit:** one CLI can trace a representative FE → BE → DTO/entity → DB path with provenance.

### Step 2.6 — Evaluation and handoff

- [ ] Select representative real ERPm tasks with known expected symbols/dependencies.
- [ ] Measure indexing time, query latency, retrieval precision, missing edges and context tokens.
- [ ] Compare agent exploration with and without the index.
- [ ] Document known gaps, refresh procedure and recovery.
- [ ] Decide whether Phase 3 Context MCP is justified.

**Exit:** Phase 2 acceptance criteria are measured; no unverified accuracy claims.

## 8. Non-functional requirements

- No application runtime behavior or production data changes.
- No index generation in ordinary build/test paths by default.
- No network requirement after dependencies are restored; source repositories must already be checked out.
- Deterministic output for the same source SHA and tool/schema versions, excluding generation timestamps.
- Clear diagnostics for missing SDKs, incomplete submodules, failed project loads and unresolved symbols.
- Safe handling of generated code, linked files, ignored directories and duplicate paths.
- Indexers must not execute application code.
- Source paths must remain repository-relative; do not expose absolute machine paths in committed artifacts.
- Generated index/cache content must not be committed.

## 9. Testing and evaluation

### Unit tests
- Symbol ID stability.
- Record schema validation and version compatibility.
- Relationship serialization.
- Gitlink manifest validation.
- Duplicate/ambiguous symbol handling.
- Partial/unknown evidence handling.

### Integration tests
- Backend fixture solution and ERPm solution smoke test.
- Frontend fixture project and one pinned feature module smoke test.
- EF model extraction without PostgreSQL connectivity.
- Cross-layer API matching fixture with positive and negative cases.
- Mixed revision rejection.

### Performance metrics
- Full indexing time per repository.
- Incremental rebuild time (when implemented).
- Query latency by query type.
- Retrieval precision: relevant results / returned results.
- Dependency recall against manually verified expected edges.
- Tokens and source files opened by agents with and without index.

Do not claim token savings until measured on comparable real tasks.

## 10. Out of scope

- Hosted indexing service or shared remote database.
- RAG/vector embeddings as a substitute for compiler-backed symbol search.
- Automatic code modification or agent task execution.
- Runtime tracing/profiling and production DB access.
- Complete semantic understanding of business rules.
- Full program analysis, arbitrary reflection/dynamic dispatch and exhaustive SQL parsing.
- MCP server implementation (planned Phase 3, after CLI validation).

## 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| MSBuildWorkspace cannot load one or more projects | Surface diagnostics; support partial index with explicit status; test SDK/solution loading |
| Nested submodules are missing or at wrong revisions | Validate recursive gitlink manifest before indexing; fail closed on mismatch |
| Angular compiler APIs are unstable | Prefer TypeScript Compiler API and stable Angular metadata; isolate Angular adapter |
| False cross-layer links from similar names | Require route/method/path/DTO evidence; label uncertain matches |
| Stale cache | Include source SHA, schema and indexer versions in cache key |
| Large generated/vendor trees | Honor Git ignore/config exclusions; classify generated files |
| Premature storage complexity | Start JSONL; add SQLite only after query/evaluation evidence |
| Tooling slows normal development | Keep opt-in local CLI outside normal build and CI paths |

## 12. Phase 2 Definition of Done

Phase 2 is complete when:

1. Workspace manifest validates root and all recursive submodule SHAs.
2. Backend definitions/references/callers can be queried with exact source provenance.
3. Frontend TypeScript/Angular symbols/imports/API clients can be queried with exact source provenance.
4. EF model and migration metadata can be queried without connecting to a live database.
5. Cross-layer FE → BE → DB traces show evidence and confidence for each edge.
6. Mixed-revision indexes are rejected and stale cache entries are rebuilt or invalidated.
7. Unit and integration tests pass for fixtures and representative ERPm source.
8. Evaluation records indexing time, query latency, precision/recall and context/token impact.
9. CLI usage and limitations are documented for Claude Code and Antigravity.
10. A Phase 3 recommendation is made based on actual CLI usage, not assumption.

## 13. Initial implementation decision

Start with **Step 2.1 + Step 2.2 as the first vertical slice**: define the common contract/workspace manifest, then implement a Roslyn backend index that can answer one real symbol/reference query. This validates the core provenance and retrieval design before adding TypeScript, Angular and database adapters.

No application source changes are authorized by this plan. Tooling implementation will be delivered in separate reviewable PRs with tests and measured outcomes.


## 14. Implementation snapshot — initial backend vertical slice

**Branch:** `loipham/phase2-code-indexer-backend`  
**Base:** root `master` at merge commit `fa9c58f51d2b0de2c32de2a8e3c6368d39dd891b`.

### Implemented in the current branch

- `.ai/code-index/schema/index-record-v1.schema.json`: versioned JSON Schema for provenance-rich definition/reference records and source-to-target relationship edges.
- `tools/ERPm.CodeIndex/Workspace/`: discovers the umbrella root, reads root HEAD and recursive submodule SHAs, and rejects submodules not checked out at their pinned revisions.
- `tools/ERPm.CodeIndex/Indexing/BackendRoslynIndexer.cs`: loads `ERPm-BE/ERPm.sln` with MSBuildWorkspace; indexes source definitions and compiler-resolved syntax references with caller/target symbol IDs and source spans.
- `tools/ERPm.CodeIndex/Program.cs`: initial `workspace status`, `index repo erpm-be`, and `find symbol` commands.
- Generated index output is keyed by repository ID, pinned commit SHA and indexer version under `.ai/code-index/cache/`; the cache is ignored by Git.
- CLI usage and current limitations are documented in `tools/ERPm.CodeIndex/README.md`.

### Explicitly not complete yet

- No build or test result is claimed: this branch has not yet been built or executed in the user's Windows workspace.
- No fixture test project or JSON Schema runtime validation has been added yet.
- Project-reference graph, inheritance/implementation edges, ASP.NET route/DTO extraction and robust caller query are not yet implemented.
- Roslyn workspace diagnostics are surfaced, but partial indexing and failed project-load behavior still need explicit acceptance tests.

### Verification required before marking Step 2.1 / 2.2 complete

1. `dotnet build tools/ERPm.CodeIndex/ERPm.CodeIndex.csproj`.
2. `dotnet run --project tools/ERPm.CodeIndex -- workspace status` and compare every recursive SHA with `git submodule status --recursive`.
3. `dotnet run --project tools/ERPm.CodeIndex -- index repo erpm-be`.
4. Query a known backend type, method and caller with `find symbol`; inspect the JSONL source paths, line spans and commit SHA.
5. Add fixture tests and close the remaining Step 2.2 scope gaps before declaring the vertical slice complete.


## 15. Backend indexer quality follow-up

**Status:** Planned; implementation not started.  
**Detailed plan:** [plan-step-2.2-backend-indexer-quality.md](plan-step-2.2-backend-indexer-quality.md).

After PR #58 was merged, the user ran the local CLI against the pinned backend revision `56385da65226f72c3b66f9c839e2fc430ce85210` and generated 148,944 records. The user-reported baseline contains 142,818 references and 6,126 definitions; references comprise 127,338 calls and 15,480 non-call references. A total of 1,661 records came from generated paths (1,604 references and 57 definitions).

Sample inspection showed:
- Calls are overwhelmingly associated with method source symbols (127,260 of 127,338); the remaining 78 require explicit classification rather than being assumed invalid.
- Non-N/T/M source symbol IDs include Roslyn field IDs, including auto-property backing fields. This is valid symbol information and must not be discarded.
- Namespace source context appears on namespace/using references and is valid; it must not be coerced into a method/type context.
- Existing generic type definitions/references and cross-controller usages are queryable.

The follow-up will:
1. Exclude `obj/`, `bin/` and reliably identified generated source files from the normal source index.
2. Add explicit, tested Roslyn symbol-kind classification for namespace/type/method/field/property/event/parameter/local and unknown kinds as supported.
3. Preserve the distinction between `calls` and `references`, including valid namespace-level references and backing-field identity.
4. Add deterministic fixture regression tests for calls, constructors, generic types, namespace imports, fields/properties, generated files, paths and line spans.
5. Increment the indexer version so new output uses a separate cache path; preserve the existing `0.1.0` baseline.
6. Re-index the real ERPm backend and compare results before declaring the backend slice complete.

**Verification state:** PR #58 CI passed and the user confirmed the workspace manifest and real backend indexing smoke test succeeded. The quality follow-up tests and re-index have not yet been run. Do not claim the complete Step 2.1/2.2 exit criteria are satisfied.


## 16. Backend indexer quality implementation — 2026-11-10

**Status:** Implementation merged via PR #60; CI passed; real-workspace verification pending.  
**Implementation branch:** `loipham/phase2-backend-indexer-quality-impl`  
**PR:** [#60](https://github.com/I3Solution/ERPm/pull/60), merged into `master`.  
**Merge commit:** `1f742cb08b9c2bca507b7d1bf285696cf48ff2a5`.  
**Base:** PR #59 merge commit `a459edbc87d92ee959cdc42572235a40aee44aab`.  
**Detailed plan:** [plan-step-2.2-backend-indexer-quality.md](plan-step-2.2-backend-indexer-quality.md).

Implementation changes currently on the branch:

- Backend indexer version `0.2.0`, schema version 2.
- Added schema v2 with explicit `symbolKind` and `sourceSymbolKind`; schema v1 remains unchanged.
- Added generated-source filtering for `obj/`, `bin/`, `.g.cs`, `.g.i.cs`, `.generated.cs`, auto-generated headers and source paths outside the backend repository.
- Added explicit symbol-kind mapping and narrowed `calls` to invocation targets and explicit/implicit object creation. Other simple-name references remain `references`.
- Updated `find symbol` to read only the active indexer-version cache so schema v1/v2 records are not mixed.
- Added xUnit tests for generated-file inclusion/exclusion, handwritten Designer files, symbol categories and call/reference syntax.
- Added the code-index test project to the CI workflow and updated CLI documentation.

**CI verification — PASS:** GitHub Actions run #432 on PR #60 head `52457bf16997f0918b2b1af6614040840670eb08` completed successfully. Backend, frontend and code-index jobs all passed. The code-index job passed CLI build, xUnit tests and pinned workspace-manifest validation.

**Merge:** PR #60 merged into `master` at `1f742cb08b9c2bca507b7d1bf285696cf48ff2a5` on 2026-11-10.

**Real-workspace acceptance remains pending:** The user has not yet run the 0.2.0 index against the exact pinned ERPm-BE SHA or compared it with the preserved 0.1.0 baseline. CI does not replace this smoke test. Keep Step 2.2 open until indexing, query samples, generated-file exclusion, source spans and baseline comparison are verified.


## 17. PR #60 merged — verification checkpoint (2026-11-10)

- Root `master` now points to merge commit `1f742cb08b9c2bca507b7d1bf285696cf48ff2a5`.
- PR #60 implementation is integrated; no further implementation merge is required before the smoke test.
- GitHub Actions run #432 passed all three jobs: backend, frontend and code-index. Code-index build, unit tests and workspace-manifest validation passed.
- User plans to perform local verification on the next work session. Until then, the `0.1.0` cache remains the comparison baseline and must not be overwritten or deleted.
- Next action: run the `0.2.0` backend index on `ERPm-BE@56385da65226f72c3b66f9c839e2fc430ce85210`, inspect output and compare with `0.1.0`. Record real counts and query evidence before marking BEQ acceptance complete.


## 18. Backend quality acceptance and Step 2.3 handoff — 2026-11-11

### Step 2.2 acceptance evidence

The user completed the real-workspace verification after PR #60:

- Root snapshot at the time of backend acceptance: `468e7025fa4dee1e61bb651ed58c106361f05639`; current Step 2.3 integration branch workspace root after PR #65: `af74ff2ba768efb49ef37f07a60b81a1b0bb56ca`.
- Backend gitlink and checkout: `235173fd193ae2fb60081fa4573434f5edd506f3`, exact match.
- Unit tests: 12 passed, 0 failed.
- Backend 0.2.0 index: 50,471 records; 195 syntax trees included and 45 excluded.
- Definitions: 6,066; references: 44,405; calls: 8,807; non-call references: 35,598.
- No `obj/` or `bin/` path records.
- `BaseCrudController` lookup returned both generic definitions and references from multiple controllers; sampled calls/references were inspected.

The old 0.1.0 baseline was generated from BE SHA `56385da65226f72c3b66f9c839e2fc430ce85210`, whereas 0.2.0 was generated from `235173fd193ae2fb60081fa4573434f5edd506f3`. The record-count delta is therefore not a controlled A/B comparison. Preserve the 0.1.0 cache; do not attribute all count changes to indexer filtering.

**Accepted scope:** generated-source exclusion, symbol-kind classification, calls/references distinction, versioned cache, fixture tests, CI and real-workspace indexing/query smoke test. Dedicated `inherits` / `implements` edges and declaring-type source context remain deferred to Step 2.5 (unified relationship model).

### Step 2.3 — Frontend TypeScript/Angular vertical slice

Detailed plan: [plan-step-2.3-frontend-typescript-indexer.md](plan-step-2.3-frontend-typescript-indexer.md).

Use the exact FE snapshot from the verified root workspace, not moving branch heads:

- Root at Step 2.3 discovery verification: `I3Solution/ERPm@af74ff2ba768efb49ef37f07a60b81a1b0bb56ca` (after PR #65 merge).
- FE: `ERPm-FE@62270988b42eece930c702d1272fe857d31bcbb9`.
- Nested modules: ACC `2061e4d7424539f1fe7de920ede86a81264e9098`; CRM `9b66e321d6cff83ed703d080c3e5e19996816477`; HRM `f66e1bb61fe222684a9c63addde93c11d1559df3`; MFG `438693239d984e3c2ae060d4f24033ab41d7855d`; PM `e0d4154fede259e9c9da778e8f77aff947640e29`; PUR `c7e1c0c7f0957a91bba5e8892d1257d4640a2e33`; SCM `0661fdfb7361957b1594890d5efa7a2bc9329624`; SD `750960006dd1190682556334fdf3a64b6273aad4`; WMS `fd320c77642a0860ca8cfad25de10ea9bd1e796c`; dashboard `4380f4b433de6ec86be5b4934279af177be5dca5`.

Initial implementation sequence:
1. Inspect FE package manager, lockfiles, TypeScript 5.8.3 configuration, Angular 20.3 metadata conventions and nested module boundaries at the exact pinned snapshot.
2. Define a repository-scoped frontend indexer that consumes the existing common provenance/schema/cache policy; do not index a moving branch or combine revisions.
3. Start with TypeScript Compiler API definitions, imports and compiler-resolved references using the project's pinned TypeScript version.
4. Add Angular component/service/guard/route metadata and API client HTTP method/path literals as isolated extractors with explicit evidence levels.
5. Add deterministic fixtures and one real FE module smoke test before broadening to all modules.

**Constraints:** no FE application source changes, no package upgrades in application projects, no generated index/cache commits, no claim of complete Angular runtime DI/template analysis, and no cross-layer route match based on names alone. Tooling dependencies belong to the indexer tool, isolated from application dependency manifests where practical.


### Step 2.3 discovery closure — 2026-11-11

The user verified the current workspace manifest with `erpm-index workspace status` on root `af74ff2ba768efb49ef37f07a60b81a1b0bb56ca`. It reports 12 repositories: `erpm-be`, `erpm-fe`, and ten nested FE modules. The FE root and nested module SHAs match the discovery baseline recorded in the Step 2.3 plan. Runtime manifest data remains authoritative; these SHAs are evidence, not hardcoded worker configuration.

Verified frontend toolchain and project boundaries:
- Local Node.js `22.12.0`, npm `10.9.0`; CI uses Node 22.
- FE package manager is npm; `package-lock.json` uses lockfileVersion 3.
- TypeScript is pinned to `5.8.3`; Angular core/router are `20.3.34`; Angular DevKit/build tooling is `20.3.42`.
- Angular application project is `client`, source root `src`, build configuration `tsconfig.app.json`, entry `src/main.ts`.
- Ten nested modules have no independent `package.json`, `angular.json`, `tsconfig.json`, `tsconfig.app.json` or `project.json`; they inherit the FE root TypeScript project.
- The FE application routes include static `Routes` arrays, lazy `import()` component loading, and direct/factory-style guards.

Implementation decisions:
1. Keep the .NET CLI as manifest validator, SHA gate, cache/provenance owner and process orchestrator.
2. Implement an isolated Node worker under `tools/frontend-code-indexer`, with a separate lockfile pinning TypeScript 5.8.3; do not modify FE application manifests or lockfiles.
3. Use the FE root compiler configuration and `src/main.ts` as the initial application Program entry. Report the actual Program source coverage; do not claim that unreferenced TypeScript files are indexed.
4. Attribute each source file to the longest matching `RelativePath` in the validated manifest. Use that entry's `RepositoryId` and `CommitSha`; a nested-module file must not be stamped as `erpm-fe`.
5. Keep schema v1/v2 immutable. Introduce schema v3 and a separate typed frontend model; do not migrate backend records in Step 2.3.
6. Keep Angular and API extractors isolated from TypeScript core. API URL observations distinguish `literal`, `interpolated` and `dynamic`; only source literals are emitted as literal paths. Never resolve environment variables or dynamic identifiers by guesswork.

Representative API evidence inspected in the pinned FE source includes:
- Core auth service: literal POST `/api/v1/auth/login` and GET `/api/v1/auth/me`.
- Localization and notification services: environment-derived base URLs with literal suffixes and dynamic recipient/language segments.
- CRM partner service: GET/POST/PUT/DELETE operations over a base URL and identifier templates.
- Dashboard and SD services: environment-derived API bases, literal suffixes and dynamic URL expressions.

Discovery confidence is high for the reported workspace manifest, toolchain, config and module boundaries. API extractor coverage is limited to inspected source patterns and must be expanded through fixtures and implementation. No FE application files were changed during discovery.


### Frontend schema v3 baseline — 2026-11-11

The Step 2.3 branch now contains the strict Draft 2020-12 schema at `.ai/code-index/schema/index-record-v3.schema.json`, a separate typed .NET frontend model and schema validation fixtures. v3 uses language-neutral symbol categories, explicit source offsets, typed Angular/API payloads, strict enums and per-record repository/SHA provenance. API URL classifications prevent an interpolated or dynamic expression from being mislabeled as a fully literal path. Backend v1/v2 contracts and serialization remain unchanged.


### TypeScript frontend worker implementation — 2026-11-11

The feature branch now includes the isolated TypeScript 5.8.3 worker, Node fixture tests, and .NET CLI orchestration for `index repo erpm-fe`. The worker consumes the already validated recursive workspace manifest, builds the FE application Program from `tsconfig.app.json` / `src/main.ts`, attributes source files by longest matching repository path, and writes schema v3 caches per repository/SHA. The extractor emits file, definition, import and compiler-resolved reference/call observations, plus Angular component/service/guard/route metadata and typed HttpClient API observations. CI has indexed the pinned FE application Program and queried a real CRM symbol. The real Program produced 130 Angular metadata records (63 components, 18 services, 3 guards and 46 routes) plus 34 HttpClient API observations (17 GET, 9 POST, 5 PUT, 3 DELETE), classified as 4 literal, 16 interpolated and 14 dynamic URL expressions.

The code-index CI job installs the worker's independent npm lockfile and executes Node tests, .NET build/tests, pinned workspace validation, actual FE indexing and symbol/API query smoke tests. The latest branch-head workflow run #542 passed all three jobs at `1bb5bf789f62100e4d4d413a91217e5cd35a64ed`. CI indexed 102 source files from a 161-file Program and wrote 12,880 schema v3 records. Local Windows smoke verification and mixed-SHA rejection remain pending; no local result is claimed.


### Frontend indexing and Angular/API smoke acceptance — 2026-11-11

The pinned FE CI smoke run used TypeScript 5.8.3 and indexed 102 source files from a 161-file Program. It wrote 12,880 schema v3 records, attributed to the FE root plus CRM, dashboard, HRM, SD and WMS nested repositories using each exact gitlink SHA. ACC, MFG, PM, PUR and SCM did not appear in the current Program's reachable source set and were not stamped with guessed records.

The code-index CI job passed worker fixtures, .NET build/tests, manifest validation, actual FE indexing and a definition-first `PartnerService` query from CRM at `services/partner.service.ts` (lines 72–177). Local Windows smoke verification and mixed-SHA rejection remain part of Step 2.3.4 before closing the phase.
