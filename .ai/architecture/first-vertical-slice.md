# First Vertical Slice — Git Code Knowledge Ingestion

> **Status:** Approved first-slice direction; initial .NET extractor-host implementation in progress (CI and immutable-snapshot feasibility verification pending)
> **Date:** 2026-11-12
> **Depends on:** Accepted Workspace boundary, Canonical Knowledge Contract v1, Ingestion v1 core decisions, Storage Boundary, Retrieval Contract, Projection Lifecycle, Technology Strategy
> **Pilot:** ERPm Git source; all Core contracts remain product- and language-neutral

## 1. Goal

Prove one end-to-end path through the reusable platform:

**One registered Git Source (initially ERPm-BE) → exact immutable capture → Roslyn extractor adapter → canonical adapter → validation → whole-SourceRevision publication → structured retrieval with evidence and Workspace authorization.**

The slice must prove that the platform is reusable beyond ERPm. ERPm is only the first fixture/workspace used to exercise the contracts.

Non-goals: vector search, reranking, production Agent orchestration, autonomous write-capable MCP tools, broad EF/database metadata extraction, rewriting Roslyn/TypeScript indexers, and deploying each logical module as a microservice.

## 2. Runtime shape and language boundaries

- Implement the first Core slice in Go as one modular monolith, following the accepted Technology Strategy.
- Keep current backend Roslyn and frontend TypeScript/Angular indexers unchanged. Their schemas/serializers remain source contracts.
- Narrow the first executable slice to one SourceRevision from the backend repository. Add the frontend extractor as a follow-up source-family integration, not as part of the first publication batch.
- Invoke the existing extractors through a bounded adapter boundary. Before choosing subprocess, HTTP/gRPC worker or another transport, inspect their actual CLI inputs/outputs, runtime dependencies, snapshot behavior and error/exit semantics. Do not invent a transport or rewrite the extractors to fit Go.
- Use Python only if the slice demonstrates a concrete AI/ML requirement. The initial deterministic code extraction path does not require a Python runtime.
- Do not create public SDK packages until an independent extension consumer exists. The first extractor adapter is an internal conformance implementation of the future extension contract.
- No customer-supplied extension code runs in-process with the Core.

## 3. Logical module ownership

| Go module boundary | Responsibility in this slice |
|---|---|
| controlplane | Resolve registered Tenant/Workspace/Project/Source and trusted profile configuration |
| identity | Resolve principal and authorize source ingestion and retrieval actions |
| connector/git | Resolve a requested Git selector to exact commit SHA; capture/verify immutable source snapshot |
| ingestion | Create one IngestionRun; coordinate stage attempts, checkpoints, retry and cancellation state |
| extractoradapter | Invoke the backend Roslyn extractor for the first slice and validate its declared source schema/version |
| normalization | Apply Code Index Adapter Contract v1 and trusted Source/SourceRevision binding |
| validation | Validate canonical schemas, lineage, evidence, scope, counts and required completeness policy |
| publication | Commit one PublicationManifest for the complete SourceRevision and advance the ready pointer |
| retrieval | Query structured canonical knowledge, apply Workspace/Project/ACL/revision scope before returning evidence |
| integration | Expose minimal authenticated platform API; MCP read-only tools are a later thin adapter, not a prerequisite for slice correctness |

These are package/module ownership boundaries inside one Go application, not separate deployment units.

## 4. End-to-end flow

1. **Register source:** create Tenant, Workspace, optional Project and Git Source through trusted control-plane operations. Source registration owns connector configuration and secret references.
2. **Authorize trigger:** caller requests ingestion for the registered Source. Resolve scope from stored registration; reject caller-supplied ownership overrides.
3. **Resolve immutable revision:** Git Connector resolves branch/tag/commit selector to a full commit SHA and captures a consistent tree manifest. Record repository identity, commit SHA, tree/content hashes and capture provenance.
4. **Create run:** create the single durable IngestionRun with pinned IngestionProfile and component versions. Duplicate trigger/idempotency behavior follows the Ingestion Contract.
5. **Extract:** invoke the backend Roslyn extractor against the immutable backend Source snapshot. Its output declares source schema version, repository identity and exact SHA. Mixed or mismatched revision output is rejected. Frontend extraction is a separate follow-up integration.
6. **Stage:** retain raw JSONL output and source manifests in run-scoped staging. Staging is invisible to normal Retrieval.
7. **Normalize:** map backend v2 records through Code Index Adapter Contract v1 into the accepted canonical code payload types. Unsupported project/dependency rows are explicitly counted/reported, never silently discarded. Frontend v3 mapping remains a follow-up source-family integration.
8. **Validate:** validate schema, trusted ownership, SourceRevision lineage, Evidence locators, payload identity, relationship-promotion conditions, count reconciliation and required completeness metrics.
9. **Publish:** publish the entire SourceRevision atomically through one PublicationManifest and readiness transition. On failure, keep the last good revision active and leave staging non-queryable.
10. **Retrieve:** perform exact structured lookup within one authorized Workspace/Project and return canonical records with Evidence and exact SourceRevision. No result may leak from a sibling Workspace/Project or another SHA.

Full-text/vector ProjectionRun starts only after canonical publication and remains independently ready/failed. It is not required for this first structured-retrieval acceptance path.

## 5. First-slice acceptance scenarios

### A. Revision and provenance
- A branch selector resolves to one full commit SHA; every extractor output and canonical record is bound to that exact SourceRevision.
- A mixed-SHA batch, repository mismatch or changed snapshot fails closed.
- Evidence path/line ranges are preserved; offsets exist only where source schema provides them.
- Raw source output and adapter/component versions remain traceable.

### B. Publication and recovery
- No staged record is retrievable before the whole SourceRevision commits.
- A failed mandatory stage or invalid manifest does not replace the last published revision.
- Retrying an identical stage input is idempotent; changed input fingerprint cannot reuse an old checkpoint.
- Concurrent/out-of-order runs cannot let an older revision replace a newer desired revision.
- Counts reconcile across capture, extraction, normalization, validation and publication.

### C. Workspace and authorization
- Two Workspaces ingest identical repository content/hash without sharing authorization or retrieval scope.
- A caller in Workspace A cannot infer Workspace B's records, artifacts, counts or snippets.
- Project-scoped retrieval cannot include sibling Project content.
- Admin roles do not imply content-read permission; source-level policy only narrows grants.
- Revocation is enforced before returning cached or indexed candidates.

### D. Client behavior
- Two independent clients query the same published revision and receive equivalent authorized evidence.
- A request pinned to a different SourceRevision never receives records from the active revision by accidental fallback.
- API response includes source/revision/evidence references and explicit capability/readiness state.

## 6. Implementation sequence after design approval

1. **Extractor feasibility spike:** backend Roslyn invocation and output behavior have been inspected. Specify a generic external adapter request/result protocol and a thin .NET host that reuses the existing Roslyn library without changing analysis semantics. Inspect/refactor the frontend TypeScript worker separately when onboarding that source family.
2. **Go foundation:** create one Go module, config/logging/tracing/test conventions and minimal application composition. Do not pre-create all logical packages; introduce only those required by the slice.
3. **Control-plane and Git capture path:** implement source registration fixtures, trusted scope resolution and exact snapshot capture.
4. **Extractor adapters and normalization:** wrap existing extractors without modifying their source contracts; implement canonical adapter and explicit omission accounting.
5. **Validation and publication:** implement staged, whole-revision publication and recoverable run state.
6. **Structured retrieval and ACL:** implement scope-first retrieval and evidence response.
7. **Conformance/integration tests:** run the acceptance scenarios with at least two Workspaces and pinned revisions.
8. **Benchmark and review:** record workload, environment and numeric targets before measuring; compare the Go implementation with a small C# reference only if needed to validate the language choice.

## 7. Open decisions / discovery gates

The following must be established from source evidence before implementation:
- exact backend/frontend extractor entry points, arguments, output schema negotiation and exit/error behavior;
- whether each extractor can consume an immutable captured worktree without mutating it;
- how submodules/gitlinks and multiple repositories are registered as separate Sources; do not combine their records into one SourceRevision batch in v1;
- whether both extractors can run in a reproducible isolated environment and how tool versions are pinned;
- artifact store implementation and publication transaction/CAS mechanism;
- identity provider and service-to-service workload identity;
- minimal API protocol and authentication transport;
- initial completeness thresholds for supported/unsupported code item families.

Do not resolve these by guessing. Record discoveries in the task and update the design before code.

## 8. Extractor feasibility findings from the current repository

Inspected at the root PR snapshot used for this design (root submodule gitlinks: ERPm-BE `235173fd193ae2fb60081fa4573434f5edd506f3`, ERPm-FE `62270988b42eece930c702d1272fe857d31bcbb9`):

### Backend Roslyn extractor
- Implementation: `tools/ERPm.CodeIndex/Indexing/BackendRoslynIndexer.cs`, currently exposed through the root .NET 10 executable `tools/ERPm.CodeIndex/Program.cs`.
- The indexer is a .NET library class (`IndexAsync(repositoryPath, repositoryId, commitSha, cancellationToken)) it opens the single top-level solution using MSBuildWorkspace and returns records in memory.
- The current CLI is not a generic adapter protocol. It accepts hard-coded `index repo erpm-be`, discovers the ERPm umbrella root, verifies recursive submodule status, and writes JSONL to the local `.ai/code-index/cache/<repo>/<sha>/<indexerVersion>/symbols.jsonl` path.
- Dependencies include MSBuild Locator and Roslyn Workspaces; execution requires a compatible .NET 10 SDK/MSBuild environment.

### Frontend TypeScript extractor
- Implementation: `tools/frontend-code-indexer/index.mjs` and `indexer.mjs`; package requires Node >=22 and pins TypeScript 5.8.3.
- The worker reads one JSON workspace manifest from stdin, emits one JSONL record per stdout line, writes diagnostics to stderr and exits non-zero on failure.
- The current .NET `FrontendWorkerRunner` owns process invocation, validates schema-v3 output, checks repository/SHA/path and writes records into the same local cache tree.
- The TypeScript indexer currently expects a repository entry named `erpm-fe` and uses that repository's `tsconfig.app.json` as its Program root; it can attribute records to nested repositories in the manifest.

### Consequence for the platform adapter
The current tooling is a developer-workspace indexer, not yet a deployable, generic platform Extractor contract. It has no stable external invocation protocol for the Go Core, and it assumes the ERPm umbrella checkout/cache layout. In addition, the frontend manifest may include nested Git submodules; the current TypeScript Program can emit observations for multiple repository owners. Canonical Ingestion v1 normalizes one SourceRevision per batch and defers cross-source derivation, so frontend submodule records must be split into separately registered SourceRevision ingestions rather than published as one combined batch.

Do not call the current CLI directly from Go and claim it is a reusable adapter. For the first slice, the selected design is a thin .NET extractor-host command that accepts an explicit execution-workspace path, trusted SourceRevision binding and run-scoped output directory through a versioned request/result protocol. It reuses the existing Roslyn analysis class and source schema. It does not require a broad rewrite of the existing workspace-oriented CLI; the new host command must dispatch before the legacy umbrella manifest is loaded.

Keep the host out of the Go Core process, preserve the existing analysis semantics and source schema, and make any remaining ERPm-specific assumptions explicit configuration rather than hidden hard-coded identifiers. This is a wrapper/integration change, not a rewrite of the extractor.

## 9. Git Source capture and immutable execution snapshot v1

> **Status:** Proposed first-slice policy, based on inspection of the pinned ERPm-BE revision.

### 9.1 Source of truth

- The registered Git Source identifies one repository; the trigger's branch/tag/commit selector is only a request to resolve a revision.
- The Git Connector resolves the selector to a full commit SHA and records the commit object ID, root tree object ID, repository identity and capture timestamp.
- The Connector must not use the user's current ERPm umbrella working directory as the platform source of truth. Dirty files, local branches and uncommitted changes are excluded.
- The first pilot revision inspected is ERPm-BE commit `235173fd193ae2fb60081fa4573434f5edd506f3`. Its tree contains one root solution (`ERPm.sln`), no nested Git submodule entries, no `.gitattributes`, and no files larger than 50 MiB. This is evidence for this pinned revision only, not a universal property of future revisions.

### 9.2 Capture procedure

1. Fetch/resolve the exact commit from the registered remote using connector credentials.
2. Verify the commit object and root tree; reject a selector that moves during resolution or cannot be fetched completely.
3. Enumerate the Git tree recursively and create a capture manifest with each path, Git mode, blob object ID and size, plus commit/tree IDs and a manifest digest.
4. Materialize the exact commit into a content-addressed immutable snapshot. Reject unresolved gitlinks in v1; each submodule must be registered as its own Source and ingested as its own SourceRevision.
5. Verify the materialized file set and content against the captured tree manifest. Symlink targets and executable modes must be represented explicitly; reject unsafe paths escaping the snapshot root.
6. Mark the snapshot immutable and mount it read-only for the extractor invocation.

The implementation may use a detached checkout or an equivalent Git-object materializer, but it must prove the same tree/content invariants. Do not assume that a Git commit SHA alone proves that a mutable working directory still contains those bytes.

### 9.3 Build workspace versus immutable snapshot

Roslyn/MSBuild may require restore and may write intermediate files. Therefore the extractor must not write into the canonical immutable snapshot.

- Keep the captured snapshot read-only.
- Create a per-invocation writable execution workspace from that snapshot and verify its source-file manifest before running the extractor.
- Put `obj`, NuGet package cache, temporary files and diagnostics in isolated writable locations. Never share writable build outputs across tenants or SourceRevisions.
- Disable network egress by default during extraction; if package restore is required, perform it in a separately controlled dependency-preparation step using approved feeds and pinned dependencies, then run analysis without unrestricted network access.
- After extraction, verify that the immutable source snapshot is unchanged. Build-generated files in the execution workspace are not source records and must not enter the capture manifest.

### 9.4 First-slice rejection conditions

Fail capture closed when the commit/tree cannot be verified, the repository identity differs, a gitlink is present but not separately registered, a path escapes the snapshot root, or the materialized source-file manifest differs from the Git tree. A failed capture must not create a publishable SourceRevision.

## 10. Proposed backend extractor-host process contract v1

> **Status:** Proposed adapter protocol for the first source family; not yet a published extension SDK or approved runtime schema.

The Go Core invokes the existing .NET Roslyn extractor as an isolated process. The process is a trusted, platform-managed component for this first pilot, not arbitrary customer code.

### 10.1 Invocation

- One invocation processes exactly one registered SourceRevision.
- The Go Orchestrator creates a unique run/stage output directory and a writable per-invocation execution workspace copied from the verified immutable snapshot. The immutable snapshot itself remains read-only and is never passed as a writable build directory.
- The host receives one bounded JSON request document on stdin. The request contains:
  - protocol version and invocation ID;
  - registered Source ID and SourceRevision ID;
  - repository identity, exact full commit SHA, root tree ID, capture-manifest ID and capture-manifest SHA-256;
  - writable execution-workspace root path inside the execution sandbox (derived from the verified immutable snapshot);
  - output directory path inside the run-scoped writable staging mount;
  - extractor identity/version, requested source schema version and bounded configuration.
- The host must not resolve Git branches, fetch from remote repositories, select Workspace/Project ownership, read platform secrets or write to canonical storage.
- The host verifies request shape and that paths remain inside the assigned mounts. The trusted capture service remains authoritative for commit/tree provenance.

### 10.2 Output

- The host writes an immutable records.jsonl and result-manifest.json into the assigned output directory.
- JSONL contains only source-contract records (initially backend code-index schema v2); logs never appear in the records file.
- The result manifest declares protocol version, invocation ID, Source/SourceRevision IDs, repository ID, commit SHA, capture-manifest ID and digest, extractor name/version, source schema version, output relative path, record count, byte length, SHA-256, diagnostic counts and completion outcome.
- Stdout is reserved for bounded human-readable progress only; stderr is reserved for diagnostics. The machine-readable result is the manifest and output artifact, not parsed console text.
- Exit code zero means the manifest and artifact were fully written and closed. Any non-zero exit, missing manifest, hash mismatch, lineage mismatch or schema violation fails the stage. Partial output remains quarantined staging and is never publishable.

### 10.3 Core-side verification

Go validates the result manifest against the invocation it issued, including exact capture-manifest ID/digest echo, verifies output path containment, byte length and SHA-256, then streams each JSONL record through the declared source schema validator. It independently checks repository ID, exact SHA, allowed relative paths and supported source record kinds before the Canonical Adapter runs.

The Go Core derives counts/hashes from the artifact and compares them with the manifest; it does not trust the extractor's reported counts as the sole evidence of completeness.

### 10.4 Compatibility and deployment

- The initial host may be added as a dedicated command/entry point in the existing .NET code-index tool, provided the old local CLI behavior remains compatible.
- Reuse BackendRoslynIndexer without changing its symbol/reference analysis semantics or source record schema.
- Pin the .NET runtime/SDK, MSBuild/Roslyn dependencies and host version in the trusted extractor profile. The inspected ERPm-BE revision pins .NET SDK 10.0.403 with latestPatch roll-forward; preflight SDK selection from the execution-workspace working directory and fail with an explicit prerequisite error when unavailable.
- The host is replaceable by another language implementation only if it passes the same request/result contract and conformance fixtures.
- This protocol does not prescribe the future public plugin transport. A later SDK may wrap the same logical invocation/result contract over HTTP/gRPC or an asynchronous execution service.



### 10.5 Fit to the current .NET tool

The existing `BackendRoslynIndexer.IndexAsync(repositoryPath, repositoryId, commitSha, cancellationToken)` already accepts an explicit repository path and revision identity. The first host can therefore reuse the analysis implementation without changing symbol/reference extraction semantics.

The current `Program.cs` resolves `WorkspaceManifestReader.Read()` before command dispatch, so a generic host mode cannot simply reuse the current startup path. The implementation must route the new host command before loading the ERPm umbrella manifest:
- add a dedicated protocol command/mode to the existing tool executable (or a small host entry point referencing the same indexer assembly);
- deserialize and validate the versioned request;
- invoke `BackendRoslynIndexer` with the supplied verified execution-workspace path and trusted repository/revision values;
- write JSONL and result manifest to the caller-owned staging directory;
- leave existing `workspace`, `index repo` and `find symbol` behavior backward-compatible.

The preferred minimum change is a dedicated host command in the existing executable, not a second copy of Roslyn analysis code. A separate host project is justified only if dependency isolation or deployment testing demonstrates a concrete benefit.

### 10.5.1 Initial implementation snapshot

The first implementation now adds an `extractor-host` command to the existing executable and dispatches it before `WorkspaceManifestReader.Read()`. It accepts one protocol-v1 JSON request from stdin, validates the declared revision/capture identity and workspace/output boundary, reuses `BackendRoslynIndexer`, and writes `records.jsonl` plus `result-manifest.json` with echoed lineage, byte length, SHA-256 and record count. The legacy `workspace`, `index repo` and `find symbol` paths remain on their previous dispatch path. Protocol unit tests cover unsupported protocol versions, malformed commit/capture digests, missing solution, output nested in the execution workspace, artifact hash/count and manifest JSON round-trip.

This is an initial trusted host prototype, not a complete process sandbox. CI Run #1110 passed all five workflow jobs and verified the .NET build, all 32 code-index unit tests and a real host smoke invocation against a Git-archive snapshot of the pinned ERPm-BE commit. Roslyn/MSBuild emitted 36,374 records for the pinned revision. The smoke test creates a read-only snapshot and a separate writable execution copy, invokes the host under the source-pinned .NET SDK, independently verifies result-manifest hash/byte/count/revision fields and confirms the snapshot content remains unchanged. This demonstrates Roslyn/MSBuild deployment feasibility for the pinned pilot revision only. Go must still independently verify all returned data and enforce process-tree timeout/cancellation, resource limits, mount isolation and network restrictions.

### 10.6 Host and capture conformance tests

The first implementation and subsequent Core conformance suite must cover at least:
1. valid request produces JSONL plus a manifest whose independently recomputed count, byte length and SHA-256 match;
2. unsupported protocol/schema version is rejected;
3. Source ID, SourceRevision ID, repository ID, full SHA and capture-manifest digest are echoed exactly and validated by Core;
4. output path traversal/symlink escape and source path outside assigned mounts are rejected;
5. mixed-revision records, malformed JSONL and unsupported source schema are rejected before normalization;
6. non-zero exit, missing manifest, truncated output and digest/count mismatch leave staging quarantined;
7. cancellation/timeout kills the complete host process tree and leaves no publishable artifact;
8. read-only captured snapshot remains unchanged while MSBuild/NuGet/temp writes stay inside the isolated execution workspace;
9. legacy local CLI commands continue to pass existing tests;
10. retries may produce different artifact hashes because GeneratedAtUtc changes; the attempt artifact hash is integrity evidence, while canonical identity and source revision remain stable.

Before enabling any network access for dependency restore, prove whether `MSBuildWorkspace.OpenSolutionAsync` requires restore for this solution and define an allowlisted, pinned dependency preparation step. The extractor process itself must not have unrestricted outbound network access.

## 11. Explicit exclusions

- No vector/embedding provider or full-text vendor selection.
- No production Python AI/ML worker until a concrete AI/ML stage is selected.
- No public multi-language SDK release.
- No runtime for all six ingestion stages before the first path demonstrates the required boundaries.
- No schema rewrite to match Go structs.
- No direct edits to .ai/status.md and no task aggregation workflow.
