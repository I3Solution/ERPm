# Phase 2 — Code Intelligence & Dependency Indexing

> **Status:** Implementation in progress — initial backend vertical slice  
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

Every indexed record must include:

- `schemaVersion` and `indexerVersion`.
- `repositoryId`, repository-relative `path`, and exact `commitSha`.
- `kind`, stable `symbolId`, `name`, optional `qualifiedName`, and `language`.
- Source span: `startLine`, `endLine` (and character offsets where available).
- Typed relations such as `defines`, `references`, `calls`, `imports`, `implements`, `inherits`, `injects`, `routesTo`, `exposesApi`, `mapsToTable`, `mapsToColumn`, `migrates`.
- `confidence` / evidence status: `verified`, `partial`, or `unknown`.
- Generation timestamp and source provenance.

Symbol identity must be language-aware and deterministic. Do not use display names alone as unique IDs. For unresolved/dynamic relationships, preserve the observation with an explicit partial/unknown status instead of inventing a target.

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

- [ ] Define versioned JSONL record schema and stable ID rules.
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

### Step 2.3 — Frontend TypeScript vertical slice

- [ ] Load FE root and all nested module repositories at pinned gitlink SHAs.
- [ ] Use the FE TypeScript 5.8.3 compiler configuration.
- [ ] Index source files, modules, classes, interfaces, imports and references.
- [ ] Add Angular component/service/route metadata extraction.
- [ ] Add API client method and HTTP literal extraction.
- [ ] Add fixture tests and one real FE module smoke test.

**Exit:** a developer can query a real Angular symbol/import/API client and receive exact source evidence.

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
