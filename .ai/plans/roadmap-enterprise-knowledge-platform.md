# Roadmap — Reusable Enterprise Knowledge Platform

> **Status:** Proposed roadmap based on the accepted reusable-platform direction  
> **Date:** 2026-11-11  
> **Pilot workspace:** ERPm  
> **Rule:** No implementation phase is considered complete without merged code and recorded verification evidence.

## 1. Current progress snapshot

### Completed and merged

| Area | Current result | Evidence/status |
|---|---|---|
| Project context metadata | Workspace, repository, domain and integration maps; context policy | Phase 1 merged |
| Workspace discovery | Umbrella root and recursive submodule manifest with exact SHA validation | Implemented in Code Index CLI |
| Backend code extraction | Roslyn definitions/references/call observations, schema v2 | Implemented and locally verified |
| Frontend code extraction | TypeScript Compiler API and Angular/API observations, schema v3 | PR #66 merged; CI passed |
| Cache correctness | Local JSONL cache isolated by repository, commit SHA and indexer/schema version | Implemented; synthetic fake-SHA isolation probe reported successful by user |
| CI integration | Code-index worker/build/tests and real FE indexing/query smoke | Latest recorded CI run #553 passed |

PR #66 merged into root `master` at `72c12421ae8bc6b09b9c326c52cd11d8bece6a64`.

Verification evidence must remain distinct:
- Backend real index: 50,471 records at the exact pinned backend SHA; 6,066 definitions, 44,405 references, 8,807 calls and 35,598 non-call references.
- Frontend CI smoke: 12,880 schema-v3 records from 102 indexed source files in a 161-file TypeScript Program; FE root plus CRM, dashboard, HRM, SD and WMS. Angular/API observations were included.
- User-reported local FE run: 13,140 records across six repositories. This is a separate environment/result from CI; do not treat the difference as a regression without a controlled comparison.
- Latest recorded branch-head CI: run #553, all jobs green, commit `a2a94c7bf63471861ba5e256a12af4e769104911`.
- The user reported that all CI checks passed before PR #66 was merged.

### Existing capabilities, but not yet platform capabilities

- Index generation and JSONL caches are local to a developer/CI execution; there is no Central Knowledge Store yet.
- The CLI can find symbols in available local caches; there is no shared Query API or platform-wide retrieval service.
- Existing code records have provenance and revision isolation, but there is no unified cross-domain knowledge contract yet.
- There is no production Hybrid RAG, centralized ingestion orchestrator, vector/search plane, Context Packet service or MCP Gateway yet.

### Explicitly not complete

- EF Core entity/table/column and migration metadata extraction.
- Unified FE API → BE endpoint → DTO → EF/database trace.
- General relationship graph and multi-hop retrieval.
- Document/business knowledge ingestion.
- Central storage and shared query API.
- Semantic/vector retrieval, reranking and retrieval evaluation.
- Production Context Engine/Context Packet generation.
- MCP Gateway and multi-agent integration.

## 2. Roadmap principles

1. Build a reusable platform core; ERPm is only the first pilot workspace.
2. Preserve the working Roslyn and TypeScript indexers as source-specific extractors; adapt them behind platform contracts rather than rewriting without need.
3. Centralize ingestion and knowledge availability so developers do not each need to build the shared index locally.
4. Keep local indexing/cache for development, diagnostics and offline use.
5. Make workspace isolation, ACL enforcement, provenance and revision-awareness mandatory from the first central-storage design.
6. Start modular; do not split into microservices without an operational reason.
7. Validate retrieval quality with representative tasks before choosing more infrastructure or optimizing vector search.
8. Keep source code and source documents authoritative; indexes and generated summaries are derived data.

## 3. Proposed phases

### Phase 0 — Architecture and platform boundaries

**Goal:** turn the accepted product direction into implementation-ready contracts.

Deliverables:
- [ ] Platform context and bounded-context diagram.
- [ ] Tenant/workspace/project/source hierarchy and detailed isolation rules.
  - Core decision accepted by user on 2026-11-12: Knowledge Workspace is the primary isolation boundary; Project may only narrow access inside it.
  - Detailed Tenant/identity/ACL/source policy remains under review. See [Workspace Boundary](../architecture/workspace-boundary.md).
- [x] Canonical Knowledge Record, Evidence, Relation and Source Revision machine-readable schemas, plus the four initial Code payload schemas and identity rules.
  - Core v1 decisions accepted on 2026-11-12. Payload schemas and the backend v1/v2 + frontend v3 adapter mapping contract are now documented and covered by CI tests; runtime adapter remains a Phase 2 deliverable. See [Canonical Knowledge Contract](../architecture/canonical-knowledge-contract.md) and [Code Index Adapter Contract](../architecture/code-index-adapter-contract.md).
- [x] Define logical stage I/O contracts for Connector, Extractor, optional Processor, Normalizer, Validator and Publisher, including child attempt/checkpoint records.
  - Proposed StageInvocation/StageAttempt and stage-specific manifest schemas, valid fixtures and CI semantic tests are now present. The detailed stage I/O/retry/cancellation semantics are a design draft pending user review; no runtime workers or protocol are implemented. See [Connector and Ingestion Pipeline](../architecture/ingestion-pipeline.md).
- [x] Define Control Plane, Artifact Store, Canonical Knowledge Store, Search Projection Store, staging and cache responsibilities.
  - Five logical storage defaults accepted on 2026-11-12: one relational deployment initially for Control Plane + Canonical Store with separate modules; policy-driven source/history retention; exact Git SHA/hash provenance with archive when replay/retention requires it; separate full-text/vector logical adapters; and a two-Workspace isolation benchmark scenario. See [Storage Boundary](../architecture/storage-boundary.md).
  - Physical vendor/topology, concrete retention/legal deletion rules and execution of the benchmark remain open.
- [x] Add machine-readable IngestionProfile, IngestionRun, StageInvocation/Attempt, stage output manifests and ValidationReport contracts.
  - The six core Ingestion v1 decisions were accepted on 2026-11-12. Stage manifests and semantic CI tests cover run/source/revision lineage, checkpoint integrity, optional processors, retry classification and publication eligibility; [CI Run #926](https://github.com/I3Solution/ERPm/actions/runs/43156485888) passed all five jobs for commit `52a75c94b9c4b49e295a18fe5f7939be7ae46e9c`.
- [x] Define full-text/vector ProjectionProfile, ProjectionRun, ProjectionManifest and per-SourceRevision ProjectionStatus, with Retrieval readiness/coverage semantics.
  - Schemas, fixtures and semantic tests are added in [Search Projection Lifecycle](../architecture/projection-lifecycle.md) and [Retrieval Contract](../architecture/retrieval-contract.md). Runtime projection builders and index stores remain Phase 2/3 implementation work; CI for the new projection contracts is pending.
- [ ] Complete operational security and remaining ingestion details.
  - Proposed source-family completeness vocabulary and empty-source/publication rules are drafted in [Connector and Ingestion Pipeline](../architecture/ingestion-pipeline.md) section 19; per-source thresholds and metric schema evolution remain open.
  - Provider-neutral webhook authentication/replay/deduplication requirements are drafted in section 20; provider-specific verifier details remain open.
  - Large-SourceRevision staging, chunk reconciliation and whole-revision publication barrier are drafted in section 21; physical storage/transaction mapping remains open.
  - Proposed StageInvocation/Attempt, retry/cancellation and optional Processor details still require user review.
- [x] Define Retrieval request/result and Context Packet semantic contracts.
  - Seven Retrieval v1 semantic defaults and seven Context Packet v1 semantic defaults were accepted on 2026-11-12. See [Retrieval Contract](../architecture/retrieval-contract.md) and [Context Packet Contract](../architecture/context-packet-contract.md).
  - Retrieval Request/Result/Error and Context Packet/Profile schemas, valid examples and CI semantic tests now exist. Protocol mappings, cursor signing and runtime implementation remain open.
- [ ] Security/ACL and provenance requirements.
- [ ] Technology decision records with benchmark/operational rationale.

**Exit criteria:** contracts are reviewable, versioned and testable; the first vertical slice can be implemented without ERPm-specific assumptions in the core.

### Phase 1 — Platform Core and Workspace Management

**Goal:** establish the reusable foundation.

Deliverables:
- [ ] Workspace/project/source registration model.
- [ ] Workspace-scoped configuration and authorization boundary.
- [ ] Versioned platform contracts and compatibility policy.
- [ ] Connector/extractor plugin contract.
- [ ] Ingestion job model, idempotency key and status lifecycle.
- [ ] Source revision registry and freshness state.
- [ ] Audit and observability baseline.

**Exit criteria:** create two independent test workspaces, register sources, run isolated ingestion jobs and prove no cross-workspace retrieval or data leakage.

### Phase 2 — Central Ingestion and Code Knowledge

**Goal:** move current code indexing from developer-local execution into a shared ingestion pipeline.

Deliverables:
- [ ] Wrap the existing Roslyn indexer as a backend code extractor.
- [ ] Wrap the TypeScript/Angular worker as a frontend code extractor.
- [ ] Run extraction against exact source snapshots/commit SHAs in CI or an ingestion worker.
- [ ] Publish validated records to central storage only after a complete successful job.
- [ ] Maintain per-source revision status and retry/rebuild behavior.
- [ ] Add query access to centrally indexed code knowledge.
- [ ] Keep local CLI/cache as an optional development path.

**Exit criteria:** a commit in the ERPm pilot triggers central indexing; two separate developer clients can query the same indexed revision without running index locally; a different SHA cannot receive records from the wrong revision.

### Phase 3 — Central Knowledge Store and Retrieval API

**Goal:** expose consistent, workspace-scoped knowledge access.

Deliverables:
- [ ] Control metadata store.
- [ ] Artifact/document storage.
- [ ] Structured knowledge and relationship storage.
- [ ] Full-text search.
- [ ] Vector search only where justified by the retrieval evaluation.
- [ ] Workspace/ACL/revision filters applied before results leave the service.
- [ ] Versioned Retrieval API and machine-readable evidence responses.

**Exit criteria:** exact symbol search, lexical search and scoped knowledge lookup return traceable evidence from central storage.

### Phase 4 — Multi-source Enterprise Knowledge Ingestion

**Goal:** ingest knowledge beyond code.

Initial source families:
- [ ] Markdown, PDF, DOCX and HTML documents.
- [ ] Architecture decisions, specifications and technical documentation.
- [ ] Database schema exports, EF metadata and migration evidence.
- [ ] Git commits, pull requests and issue history.
- [ ] Business process and business-rule documents.

**Exit criteria:** at least one non-code source is ingested into a second workspace using the same platform contracts and can be retrieved with source/page/section evidence.

### Phase 5 — Hybrid RAG and Retrieval Quality

**Goal:** combine exact, lexical, semantic and relationship retrieval.

Deliverables:
- [ ] Intent and scope routing.
- [ ] Structured retrieval for symbols, APIs and database metadata.
- [ ] Full-text retrieval for exact phrases and identifiers.
- [ ] Vector retrieval for semantic passages.
- [ ] Verified relationship expansion.
- [ ] Candidate merge, deduplication and reranking.
- [ ] Evidence quality and ACL/revision revalidation.
- [ ] Evaluation dataset and regression benchmark.

**Exit criteria:** representative code and document questions meet agreed evidence recall/precision and latency thresholds; every answer candidate remains traceable to source evidence.

### Phase 6 — Context Engine

**Goal:** convert retrieved knowledge into reliable agent context.

Deliverables:
- [ ] Context Packet schema and versioning.
- [ ] Evidence selection and deduplication.
- [ ] Token/size budget and truncation strategy.
- [ ] Source revision and citation preservation.
- [ ] Confidence, gaps and unresolved relationships.
- [ ] Task-specific context profiles/policies.

**Exit criteria:** an agent receives a bounded packet that can be independently verified against original sources and does not hide missing evidence.

### Phase 7 — MCP Gateway and Agent Integration

**Goal:** make the platform accessible to different AI agents.

Deliverables:
- [ ] Read-only MCP tools for workspace/source discovery and knowledge retrieval.
- [ ] Retrieval/context APIs for non-MCP clients.
- [ ] Authentication and workspace authorization propagation.
- [ ] Agent-specific adapters without coupling platform core to a specific vendor.
- [ ] Usage/audit telemetry and rate limits.

**Exit criteria:** at least two distinct client types can query the same workspace with the same authorization and evidence guarantees.

### Phase 8 — Evaluation, Operations and Scale

**Goal:** make the platform reliable to operate.

Deliverables:
- [ ] Ingestion freshness and failure dashboards.
- [ ] Retrieval quality and regression evaluation.
- [ ] Re-index/re-embedding/version migration workflows.
- [ ] Backup, retention and deletion workflows.
- [ ] Cost, latency and throughput baselines.
- [ ] Operational runbooks and deployment model.

**Exit criteria:** repeatable deployment and recovery; measurable ingestion freshness and retrieval quality; workspace isolation proven under operational tests.

## 4. Immediate next plan

Do not begin another indexer feature or create a PR for EF metadata yet. First complete Phase 0 in this order:

1. **Workspace boundary:** core isolation principle accepted; a proposed role/action matrix is now drafted. Review Tenant deployment assumptions, role inheritance, restricted Project behavior, workspace-shared source access, upstream ACL and identity model using [Workspace Boundary](../architecture/workspace-boundary.md).
2. **Canonical Knowledge Contract:** core v1 decisions, shared envelope schemas, four Code payload schemas, payload identity rules and source-index adapter mapping design are now documented. CI verification is recorded on PR #70; runtime adapter implementation belongs to Phase 2. See [Canonical Knowledge Contract](../architecture/canonical-knowledge-contract.md) and [Code Index Adapter Contract](../architecture/code-index-adapter-contract.md).
3. **Revision/provenance:** align SourceRevision, evidence locators and producer/payload versions with the exact immutable snapshot model.
4. **Connector and ingestion contracts:** core Run/trigger/publication choices and proposed stage I/O, child attempt, checkpoint and retry schemas are documented in [Connector and Ingestion Pipeline](../architecture/ingestion-pipeline.md); stage-contract CI Run #926 passed. Source-family completeness vocabulary, webhook security and large-revision staging/commit protocols are now drafted in sections 19–21; obtain review before finalizing their machine-readable fields and physical mappings.
5. **Storage boundary:** logical defaults are accepted in [Storage Boundary](../architecture/storage-boundary.md); build the two-Workspace benchmark and defer vendor/physical-topology decisions to technology ADRs.
6. **Retrieval contract:** seven semantic defaults are accepted in [Retrieval Contract](../architecture/retrieval-contract.md); define machine-readable fields, errors, cursor semantics, protocol mapping and two-Workspace acceptance fixtures.
7. **Context Packet:** semantic defaults are accepted in the [Context Packet Contract](../architecture/context-packet-contract.md); initial JSON Schema Draft 2020-12 files, valid examples and schema/semantic CI tests now exist for ContextPacket and ContextProfile. Adapter mappings and broader evaluation fixtures remain open.
8. **Remaining contract schemas and adapters:** ProjectionProfile/Run/Manifest/Status and per-revision Retrieval readiness schemas are now drafted in [Search Projection Lifecycle](../architecture/projection-lifecycle.md); wait for CI and review semantics. Complete remaining security/protocol details and implement/verify runtime adapters and projection builders in Phase 2/3. Canonical Code payload schemas and source-index mapping design have passed CI on PR #70.
9. **Technology ADRs:** record the current direction for evaluation—Go as the primary Core Platform implementation candidate, Python for AI/ML runtime, and language-neutral API/MCP/contracts for multilingual extensions—then validate candidates against the contracts and a small benchmark. Do not rewrite existing contracts or create runtime scaffolding before the ADR and vertical-slice boundary are agreed.
10. **First vertical slice design:** centralize the existing ERPm code index without changing its source-analysis semantics.

## 5. First vertical slice acceptance scenario

Use ERPm as the pilot, but keep the contracts project-neutral:

1. Register an ERPm workspace and its root Git source.
2. A commit SHA is discovered and an ingestion job is created.
3. Backend and frontend extractors index that exact snapshot.
4. The job validates schema, provenance, repository identity and SHA consistency.
5. The complete revision is published to central storage atomically or through a versioned ready-state transition.
6. Developer A and Developer B query the same revision and receive the same evidence.
7. A client requesting another revision cannot accidentally receive records from the first revision.
8. A second sample workspace can be registered without ERPm-specific code in the platform core.

## 6. Cross-cutting capability — Automated task progress report

**Execution status (2026-11-12): PAUSED.** The workflow `.github/workflows/aggregate-task-status.yml` was removed from `master` in PR #69. The generator, tests and design documents remain for possible future work; no automatic aggregation is currently active.

**Goal:** keep task-level ownership independent while maintaining one continuously refreshed project status report without requiring any Developer to edit a shared file.

- [x] Keep the existing Markdown task-record naming convention.
- [x] Each Agent/developer owns only the task record for their assigned work.
- [x] A task that spans multiple PRs reuses the same record and updates its feature checklist and evidence.
- [x] Add the aggregation marker and feature/milestone checklist to the task template.
- [x] Implement a deterministic generator that reads eligible task records and rebuilds `.ai/status.md` from scratch.
- [x] Add parser/unit tests for valid, malformed, legacy, multi-feature and repeated-update task records; CI verified successfully in [run #631](https://github.com/I3Solution/ERPm/actions/runs/42993219834).
- [x] Implement the GitHub Actions workflow definition; intentionally disabled/removed in PR #69 pending a future redesign.
- [x] Respect mandatory PR-only changes to `master`: publish the generated report through a dedicated automation branch and a bot PR; never push directly to `master`.
- [x] Serialize aggregation runs, always read latest `master`, and use a force-with-lease update only on the workflow-owned automation branch.
- [x] Grant only the aggregation job `contents: write` and `pull-requests: write`; generated status PRs remain subject to normal review/check rules.
- [x] Support an approved `STATUS_AGGREGATION_TOKEN` so required PR CI workflows can run; the default `GITHUB_TOKEN` fallback does not trigger normal PR workflows.
- [ ] Verify multiple sequential PRs updating the same task, concurrent merges, unchanged output, malformed records and recovery.

**Target operating contract if the feature is resumed after redesign:**

1. Task Markdown files are the only manually maintained progress source.
2. `.ai/status.md` is generated output. Agents and Developers are prohibited from manually creating, editing, deleting, formatting, committing or pushing it.
3. After each merged PR into `master`, GitHub Actions reads all eligible task records from the latest `master`, regenerates the complete report and opens/updates one dedicated bot PR. It never applies PR-only incremental updates. The report becomes the current merged snapshot after that status PR passes normal review/check requirements and merges.
4. The report is a projection; it does not modify task records and does not independently certify the truth of their claims.
5. Historical records without the new aggregation marker are excluded and left unchanged.

See [Task Progress Aggregation Design](../architecture/task-progress-aggregation.md) for the implementation contract. This capability is repository workflow automation, not part of the Enterprise Knowledge Platform runtime.

## 7. Decisions deliberately deferred

- Final database/search/vector technology and hosting topology.
- Dedicated graph database.
- Embedding provider/model and re-embedding cadence.
- Microservice boundaries and deployment count.
- Full EF metadata extraction and broad cross-layer graph implementation.
- Write-capable MCP tools and autonomous agent execution.

These decisions require contract clarity and measurable requirements first.
