# First Vertical Slice — Git Code Knowledge Ingestion

> **Status:** Proposed implementation design — no runtime implementation authorized by this document alone
> **Date:** 2026-11-12
> **Depends on:** Accepted Workspace boundary, Canonical Knowledge Contract v1, Ingestion v1 core decisions, Storage Boundary, Retrieval Contract, Projection Lifecycle, Technology Strategy
> **Pilot:** ERPm Git source; all Core contracts remain product- and language-neutral

## 1. Goal

Prove one end-to-end path through the reusable platform:

**Registered Git Source → exact immutable capture → existing code extractor(s) → canonical adapter → validation → whole-SourceRevision publication → structured retrieval with evidence and Workspace authorization.**

The slice must prove that the platform is reusable beyond ERPm. ERPm is only the first fixture/workspace used to exercise the contracts.

Non-goals: vector search, reranking, production Agent orchestration, autonomous write-capable MCP tools, broad EF/database metadata extraction, rewriting Roslyn/TypeScript indexers, and deploying each logical module as a microservice.

## 2. Runtime shape and language boundaries

- Implement the first Core slice in Go as one modular monolith, following the accepted Technology Strategy.
- Keep current backend Roslyn and frontend TypeScript/Angular indexers unchanged. Their schemas/serializers remain source contracts.
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
| extractoradapter | Invoke existing backend/frontend extractors and validate their declared source schema/version |
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
5. **Extract:** invoke the existing backend and frontend extractor adapters against the same immutable snapshot. Each output declares source schema version, repository identity and exact SHA. Mixed or mismatched revision output is rejected.
6. **Stage:** retain raw JSONL output and source manifests in run-scoped staging. Staging is invisible to normal Retrieval.
7. **Normalize:** map backend v1/v2 and frontend v3 records through Code Index Adapter Contract v1 into only the accepted canonical code payload types. Unsupported Angular/project/dependency rows are explicitly counted/reported, never silently discarded.
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

1. **Extractor feasibility spike:** inspect exact existing Roslyn and TypeScript worker invocation contracts, output paths, runtime prerequisites, snapshot behavior, exit codes, cancellation and deterministic behavior. Record a supported adapter invocation contract.
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
- how submodules/gitlinks and multiple repositories are represented in one registered Source versus multiple Sources;
- whether both extractors can run in a reproducible isolated environment and how tool versions are pinned;
- artifact store implementation and publication transaction/CAS mechanism;
- identity provider and service-to-service workload identity;
- minimal API protocol and authentication transport;
- initial completeness thresholds for supported/unsupported code item families.

Do not resolve these by guessing. Record discoveries in the task and update the design before code.

## 8. Explicit exclusions

- No vector/embedding provider or full-text vendor selection.
- No production Python AI/ML worker until a concrete AI/ML stage is selected.
- No public multi-language SDK release.
- No runtime for all six ingestion stages before the first path demonstrates the required boundaries.
- No schema rewrite to match Go structs.
- No direct edits to .ai/status.md and no task aggregation workflow.
