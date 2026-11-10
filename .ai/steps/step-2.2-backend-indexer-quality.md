# Step 2.2 Follow-up — Backend Roslyn Indexer Quality

> **Status:** Implementation merged via PR #60; CI passed; real-workspace verification pending  
> **Created:** 2026-11-10  
> **Target repository:** `I3Solution/ERPm` (umbrella)  
> **Integration branch:** `master`  
> **Implementation branch:** `loipham/phase2-backend-indexer-quality-impl` (merged via PR #60)  
> **Scope:** `tools/ERPm.CodeIndex` and its tests/documentation only

## 1. Objective

Improve the precision and usefulness of the initial Roslyn backend indexer before starting the TypeScript/Angular indexer. Preserve the existing compiler-resolved information, remove build-generated noise from the normal source index, and make symbol/relation semantics explicit and regression-tested.

This is a quality follow-up to the initial Step 2.1/2.2 vertical slice. It does not replace or redesign Roslyn/MSBuildWorkspace.

## 2. Evidence baseline

The user ran the CLI against the exact pinned backend revision:

- Root repository: `I3Solution/ERPm@d72119b308d6d11f4ba886e4368ab2f53616cb53`.
- Backend gitlink / indexed source: `ERPm-BE@56385da65226f72c3b66f9c839e2fc430ce85210`.
- Workspace manifest reported all 12 repositories at their expected recursive gitlink SHAs.
- CLI output: `Indexed 148944 records from erpm-be@56385da65226f72c3b66f9c839e2fc430ce85210`.
- Baseline records: 148,944 total; 142,818 references; 6,126 definitions.
- Reference relations: 127,338 `calls`; 15,480 `references`.
- Generated-path records: 1,661 total (1,604 references and 57 definitions), approximately 1.12% of the index.
- Calls had 127,260 method-source records and 78 other-source records. No namespace/type source IDs appeared in the call sample.
- Among reference records, source symbol IDs included method, namespace, type and field/other kinds. The sample of 15 non-N/T/M IDs showed Roslyn field IDs, including auto-property backing fields such as `<Code>k__BackingField`.
- The sample of namespace-source records came from namespace/using references in `BaseCrudController.cs`; namespace-level source context is valid for these observations and must not be rewritten into a method/type.
- A symbol lookup for `BaseCrudController` returned generic type definitions and references from multiple controllers, confirming the current compiler-backed lookup is useful.

These counts are the user's observed baseline, not an independently reproduced measurement. Preserve the old `0.1.0` cache as a comparison artifact; do not delete or overwrite it.

## 3. Current implementation observations

At the baseline commit:

- `BackendRoslynIndexer` traverses compilation syntax trees and resolves `SimpleNameSyntax` / object-creation symbols through Roslyn.
- It classifies calls versus references syntactically.
- It derives source context using `SemanticModel.GetEnclosingSymbol`.
- It currently walks compilation syntax trees without filtering `obj/`, `bin/` or generated source files.
- The index record schema stores relation and source/target symbol IDs, but does not store a separate explicit Roslyn symbol-kind field.
- Symbol IDs are built from Roslyn documentation IDs where available.

Implementation must inspect the exact current code and existing schema before deciding whether a schema change is necessary. Do not add fields or change identity formats without a compatibility/versioning decision.

## 4. Implementation scope

### 4.1 Generated-source filtering

Define and test a deterministic source inclusion policy for the normal source index:

- Always exclude files under repository-relative `obj/` and `bin/` path segments, case-insensitively.
- Exclude compiler-generated source files identified by reliable generated-file conventions/markers (for example `.g.cs`, `.g.i.cs`, `.generated.cs`, and an auto-generated header).
- Do not exclude a file solely because its name contains `Designer`; require the agreed generated marker/policy so handwritten designer-adjacent code is not silently lost.
- Normalize paths before applying filters; keep emitted paths repository-relative with forward slashes.
- Report excluded/generated file counts in a concise index summary if practical.
- Keep filtering isolated and unit-tested. Do not change the backend application's build configuration.

### 4.2 Symbol-kind classification and source context

- Add a central, tested mapping from Roslyn `SymbolKind` (and relevant method/member sub-kinds) to stable index categories.
- At minimum distinguish namespace, named type, method/constructor, field, property, event, parameter/local and other/unknown.
- Preserve Roslyn's actual symbol identity. Do not relabel a backing field as a property merely because it is associated with an auto-property.
- Where Roslyn exposes an associated property for an implicit backing field, retain that relationship only if the existing record contract can represent it without ambiguity; otherwise document the limitation and defer a schema extension.
- Namespace-level references (including `using` directives) must retain namespace source context.
- Method invocation records must continue to use the enclosing method/constructor/local-function context when Roslyn can resolve one.
- Do not force every source symbol into only `N`, `T`, or `M`; field/property/etc. are valid symbol kinds.

### 4.3 Relationship semantics

- Keep `calls` and `references` distinct.
- `calls` must represent invocation/object-creation relationships only where the current syntax and Roslyn symbol resolution support that claim.
- Namespace imports and type/member usages remain `references`, not calls.
- Preserve source and target symbol IDs and source spans.
- Unresolved/dynamic cases must be skipped or represented as partial/unknown according to the existing contract; never invent a target.
- Add focused tests for nested invocations, constructor/object creation, generic type references, using directives, property initializers/backing fields and ordinary field/property access.

### 4.4 Regression test suite

Add a small deterministic fixture-based test project or equivalent tests consistent with repository conventions. Tests must not require a live database, production services, or external network access.

Required fixtures/assertions:

1. Method invocation produces a `calls` edge with the enclosing method as source.
2. Object creation/constructor resolution follows the documented `calls` policy.
3. Generic base/type references resolve to the correct target symbol.
4. `using` / namespace references retain namespace source context.
5. Field and property symbols receive distinct categories/IDs.
6. Auto-property backing-field behavior is explicit and regression-tested.
7. Generated files under `obj/`, `bin/`, `.g.cs`, `.g.i.cs`, `.generated.cs` and auto-generated headers are excluded according to policy.
8. A normal handwritten source file remains included.
9. Repository-relative path and line spans remain correct.
10. The same fixture source at the same commit/schema/indexer versions yields stable records apart from generation timestamps.

The implementation uses schema v2 with explicit `symbolKind` and `sourceSymbolKind`; schema v1 remains unchanged for baseline compatibility.

### 4.5 Versioning and cache

- Increment the indexer version from `0.1.0` to `0.2.0`; the new output uses a separate cache directory.
- Schema v2 is required because records now expose `symbolKind` and `sourceSymbolKind`; preserve the v1 schema and all existing v1 cache files.
- Never overwrite or delete the user's existing `0.1.0` baseline cache.
- Continue to key generated output by repository ID, exact commit SHA, schema version and indexer version.
- Do not commit generated JSONL/cache files.

### 4.6 Documentation

Update `tools/ERPm.CodeIndex/README.md` with:
- generated-source inclusion/exclusion rules;
- symbol-kind and relation semantics;
- test/build/run commands;
- known limitations and the fact that the index is not a complete runtime call graph.

## 5. Out of scope

- Frontend TypeScript/Angular indexer.
- EF Core/database metadata indexer.
- API route/DTO extraction, DI graph, inheritance/implementation graph and cross-layer tracing, except where required to prevent regression in the existing index.
- SQLite or other storage changes.
- MCP server.
- Application source changes, application dependency upgrades, runtime behavior changes or database access.
- Changes to either root or backend `global.json`.
- Any reset/clean/checkout operation that could discard local user changes.

## 6. Acceptance criteria

| ID | Acceptance criterion |
|---|---|
| BEQ-01 | No `obj/` or `bin/` records appear in the normal source index. |
| BEQ-02 | Generated source filtering follows documented, deterministic rules and has positive/negative tests. |
| BEQ-03 | Symbol kinds distinguish namespace, type, method, field, property, event, parameter/local and unknown/other as supported. |
| BEQ-04 | Backing fields retain their actual Roslyn identity; associated-property handling is explicit rather than silently relabelled. |
| BEQ-05 | Namespace/using references retain namespace context. |
| BEQ-06 | Method calls and ordinary references remain separate and pass fixture tests. |
| BEQ-07 | Generic type references, source paths, line spans and symbol IDs pass regression tests. |
| BEQ-08 | Indexer/schema versioning creates a new cache path; the existing `0.1.0` cache is untouched. |
| BEQ-09 | Unit tests and CLI build pass in CI; a real ERPm re-index/query smoke test is documented with actual results before declaring the task complete. |
| BEQ-10 | No application source, submodule gitlink, production DB, or global.json changes. |

## 7. Verification sequence

Run from the umbrella root on the user's Windows workspace after implementation is merged or checked out:

```powershell
dotnet build tools/ERPm.CodeIndex/ERPm.CodeIndex.csproj
dotnet test tools/ERPm.CodeIndex.Tests
dotnet run --project tools/ERPm.CodeIndex -- workspace status
dotnet run --project tools/ERPm.CodeIndex -- index repo erpm-be
dotnet run --project tools/ERPm.CodeIndex -- find symbol BaseCrudController
```

Adjust the test command only if implementation chooses a different test-project name; document the exact command in the README and CI.

Compare the new index with the saved `0.1.0` baseline:
- total records and definitions/references;
- calls versus references;
- generated-path records (expected zero for excluded paths);
- symbol-kind distribution;
- representative generic, method, namespace, field and property queries;
- source spans and exact backend SHA.

A lower record count is not automatically success. Confirm that excluded records are generated noise and that handwritten source coverage has not regressed.

## 8. Delivery workflow

1. Implement on a new `loipham/*` branch created from current `master`.
2. Keep the PR focused on `tools/ERPm.CodeIndex`, tests and relevant docs.
3. Require CI build/tests and review the diff for accidental application/submodule/global.json changes.
4. Run the real ERPm smoke test against the exact pinned backend SHA.
5. Merge only after the acceptance criteria are evidenced.
6. Update the Phase 2 plan and root status with actual verification outcomes; do not mark Step 2.1/2.2 complete solely because CI passes.

## 9. Implementation snapshot (2026-11-10)

Implementation has started on `loipham/phase2-backend-indexer-quality-impl`, based on root merge commit `a459edbc87d92ee959cdc42572235a40aee44aab` (PR #59). Current changes include:

- `BackendRoslynIndexer` version `0.2.0`, schema version `2`.
- Filtering for repository-relative `obj/` and `bin/`, `.g.cs`, `.g.i.cs`, `.generated.cs`, auto-generated headers, and source paths outside the backend root.
- Explicit target and source symbol categories in schema v2; schema v1 is retained.
- Calls are restricted to invocation target names and explicit/implicit object creation; other simple-name references remain `references`.
- CLI symbol search reads only the current indexer-version cache, avoiding accidental mixing of v1/v2 records.
- A new xUnit test project covers generated-file policy, handwritten Designer inclusion, Roslyn symbol categories and call/reference syntax classification.
- CI now runs the code-index test project.

This is an implementation snapshot, not a verification result. CI compilation/tests and the real ERPm re-index/query comparison remain pending. The tests currently cover deterministic classification/filter helpers; additional end-to-end indexer assertions may be added if CI or the real smoke test reveals gaps.

## 10. Context packet / provenance

- Root baseline: `I3Solution/ERPm@d72119b308d6d11f4ba886e4368ab2f53616cb53`.
- Backend source: `I3Solution/ERPm-BE@56385da65226f72c3b66f9c839e2fc430ce85210`.
- Evidence: user-run CLI output and JSONL statistics supplied in the task conversation on 2026-11-10.
- Source files inspected at root `master`: `BackendRoslynIndexer.cs`, `IndexRecord.cs`, `index-record-v1.schema.json`, `Program.cs`, and `README.md`.
- Retrieval reason: verify actual indexing behavior and record contract before defining implementation changes.
- Confidence: high for observed code paths and user-reported counts; generated-file classification and full symbol-kind distribution remain to be validated by tests.
