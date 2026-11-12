# ERPm Code Index

Local-first code intelligence CLI for the ERPm umbrella workspace.

## Prerequisites

- The .NET SDK version pinned by the umbrella repository `global.json`.
- Git and Node.js 22 or later.
- ERPm umbrella repository with recursive submodules checked out at their pinned revisions.

## Commands

Run from any directory inside the ERPm workspace:

```powershell
dotnet run --project tools/ERPm.CodeIndex -- workspace status
dotnet run --project tools/ERPm.CodeIndex -- index repo erpm-be
npm.cmd ci --prefix tools/frontend-code-indexer
dotnet run --project tools/ERPm.CodeIndex -- index repo erpm-fe
dotnet run --project tools/ERPm.CodeIndex -- find symbol PartnerService
```

The legacy CLI validates the recursive submodule manifest before dispatching its workspace/index/find commands. `extractor-host` is a separate machine-to-machine mode dispatched before that manifest is loaded; it reads one bounded JSON request from stdin and operates only on the supplied execution workspace and output directory. The backend indexer loads the single root solution through MSBuildWorkspace and indexes C# definitions and compiler-resolved references.

The frontend worker uses TypeScript Compiler API 5.8.3 with the pinned ERPm-FE `tsconfig.app.json` and `src/main.ts` entry. The .NET CLI verifies that the installed TypeScript package is exactly 5.8.3, loads schema v3, and validates every JSONL record against that schema before any cache is written. The CLI passes the already validated workspace manifest to the Node worker over stdin. The worker does not run Git or parse submodule status.

The frontend worker indexes TypeScript/JavaScript files reachable in the application Program, attributes each file to the longest matching repository path in the manifest, and writes separate caches for each owning repository. Nested module files therefore retain their own repository ID and commit SHA. Unreferenced files outside the compiler Program are not claimed as indexed.

## Index format and provenance

- Backend indexer 0.2.0 writes schema v2 records. Schema v1 remains immutable as a historical baseline.
- Frontend indexer 0.1.0 writes schema v3 records using the language-neutral frontend contract.
- Every record carries its schema/indexer version, repository ID, exact source commit SHA, repository-relative path, source span, symbol identity, evidence and generation timestamp.
- Generated JSONL files are written under `.ai/code-index/cache/` and must not be committed. Cache paths are isolated by repository ID, exact SHA and indexer version.

Schema v3 has typed Angular and API payloads. The worker emits file, definition, import and compiler-resolved reference/call observations, plus Angular component/service/guard/route metadata and typed HttpClient API observations.

## Managed backend extractor host

`extractor-host` is the first protocol-v1 host entry point for the platform Core. It accepts one JSON request on stdin with protocol version, invocation ID, Source/SourceRevision IDs, repository ID, full commit SHA, root tree ID, capture-manifest ID/SHA-256, execution workspace, output directory, extractor identity/version and source schema version. It rejects unsupported protocol versions, malformed Git identities/digests, missing root solutions and output directories located inside the execution workspace.

The host reuses `BackendRoslynIndexer` without changing its source record schema or analysis semantics. It writes `records.jsonl` and `result-manifest.json`; the manifest echoes the exact revision/capture lineage and records artifact byte length, SHA-256 and record count. Stdout is bounded progress; stderr carries diagnostics. The Core remains responsible for independently validating artifact containment, digest, schema, record lineage and authorization before normalization/publication.

Example request shape (paths are supplied by the trusted orchestrator):

```json
{
  "protocolVersion": 1,
  "invocationId": "invocation-001",
  "sourceId": "source-erpm-be",
  "sourceRevisionId": "revision-001",
  "repositoryId": "erpm-be",
  "commitSha": "<40-character-commit-sha>",
  "treeId": "<40-character-tree-id>",
  "captureManifestId": "capture-001",
  "captureManifestSha256": "<64-character-sha256>",
  "executionWorkspaceRoot": "/sandbox/workspace",
  "outputDirectory": "/sandbox/output",
  "extractorId": "roslyn-backend",
  "extractorVersion": "0.1.0",
  "sourceSchemaVersion": 1
}
```

This host is a trusted first-slice adapter, not a public extension SDK or a sandbox by itself. The Go orchestrator must still enforce process timeout/cancellation, process-tree termination, resource limits, read-only immutable snapshot mounts, writable per-invocation build workspace, network policy and independent result verification.

## Frontend worker

The isolated worker lives in `tools/frontend-code-indexer` and has its own npm package manifest and lockfile. TypeScript is pinned exactly to 5.8.3; no FE application package manifest or lockfile is changed. Run `npm ci --prefix tools/frontend-code-indexer` before invoking `index repo erpm-fe`.

The initial Program uses the FE root `tsconfig.app.json` and `src/main.ts`. It reports actual Program coverage and does not claim that unreferenced TypeScript files are indexed. Source ownership is resolved by the longest matching repository path in the runtime manifest.

The worker extracts Angular decorators, static route arrays and HttpClient calls only where static/compiler evidence is available. It excludes declaration files, generated suffixes/headers and common vendor/build output directories such as `node_modules`, `dist`, `.angular`, `coverage` and `out-tsc`.

## Symbol search

`find symbol <name-or-pattern>` searches the current backend and frontend cache versions. It skips repositories that do not yet have a current index.

## Generated-source inclusion policy

The backend source index excludes `obj/`, `bin/`, generated suffixes and files with the standard `<auto-generated` header. A handwritten `*.Designer.cs` file without an auto-generated marker remains included.

The frontend source index excludes declaration files, generated suffixes/headers and common build/vendor directory segments. Exclusion rules are path- and header-based; broad filename fragments are not used to infer generated ownership.

## Relationship semantics

- Backend `calls` are emitted for compiler-resolved invocation targets and explicit/implicit object creation. Other compiler-resolved references remain `references`.
- Frontend `imports` connect source-file observations to locally resolved source files when the TypeScript resolver supplies evidence.
- Frontend `calls` and `references` are emitted only when the TypeScript checker resolves a symbol that belongs to the indexed Program.
- Dynamic dispatch, reflection, runtime behavior and unresolved symbols are not inferred.

## Build and tests

```powershell
npm.cmd ci --prefix tools/frontend-code-indexer
npm.cmd test --prefix tools/frontend-code-indexer
dotnet build tools/ERPm.CodeIndex/ERPm.CodeIndex.csproj
dotnet test tests/ERPm.CodeIndex.Tests/ERPm.CodeIndex.Tests.csproj
```

## Current limitations

- Advanced Angular template binding/DI graph resolution and dynamic route construction are not emitted by the frontend worker.
- The frontend index covers only files reachable from the configured application Program; independent module files not imported by that Program are not included.
- Backend Roslyn workspace diagnostics may indicate partial project loading; dynamic/reflection calls are not represented.
- The index is a retrieval aid, not a complete runtime call graph or a substitute for source inspection.
