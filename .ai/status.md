> **LEGACY / FROZEN:** This file is a historical snapshot only. Do not update it, use it as live task status, or regenerate it. Current progress belongs in each task record under `.ai/tasks/`.

# ERPm / Enterprise Knowledge Platform — Current Status

> Updated: 2026-11-11  
> Product direction: reusable, multi-workspace Enterprise Knowledge Platform. ERPm is the first pilot workspace, not the platform boundary.  
> Integration branch: `master`. This status update is being prepared on `loipham/architecture-enterprise-knowledge-platform`; it has not been merged.

## Current architecture direction

- Build a reusable platform core that is project-, language-, repository- and agent-agnostic.
- Support multiple isolated workspaces and multiple knowledge sources.
- Separate connectors, source-specific extractors, normalization/contracts, storage, retrieval, context assembly and agent integrations.
- Use a central knowledge store and shared retrieval service as the target architecture.
- Keep local index/cache for development, diagnostics and offline workflows; it is not the shared source of truth.
- Use Hybrid RAG: structured, full-text, semantic/vector and verified relationship retrieval.
- Preserve provenance, exact source revisions, evidence quality and authorization through ingestion and retrieval.

Architecture: [Reusable Enterprise Knowledge Platform](architecture/enterprise-knowledge-platform.md)  
Roadmap: [Enterprise Knowledge Platform Roadmap](plans/roadmap-enterprise-knowledge-platform.md)

## Workspace and implementation baseline

- Umbrella repository: `I3Solution/ERPm`; integration branch: `master`.
- Latest recorded PR #66 merge commit: `72c12421ae8bc6b09b9c326c52cd11d8bece6a64`.
- Backend pinned revision recorded during Phase 2 verification: `ERPm-BE@235173fd193ae2fb60081fa4573434f5edd506f3`.
- Frontend pinned revision recorded during Phase 2 verification: `ERPm-FE@62270988b42eece930c702d1272fe857d31bcbb9`.
- Workspace map and ownership: [Context Workspace Map](context/README.md).

## Completed and merged

- [x] Phase 1 — Context Optimization: workspace/repository/domain/integration metadata and context policy.
- [x] Phase 2 foundation — Code Index CLI and recursive workspace manifest validation.
- [x] Backend Roslyn indexer quality — schema v2, generated-source filtering, symbol-kind classification and calls/references distinction.
- [x] Frontend TypeScript/Angular indexer — schema v3, isolated TypeScript 5.8.3 worker, Angular/API observations and .NET CLI orchestration; PR #66 merged.
- [x] Revision-aware local cache — repository ID, exact commit SHA and indexer/schema version isolation.
- [x] CI integration for code-index build/tests, manifest validation, FE indexing and query smoke checks.

### Verification evidence

- Backend real index: 50,471 records at the verified pinned backend SHA; 6,066 definitions, 44,405 references, 8,807 calls and 35,598 non-call references. User inspected representative symbol/reference/call samples.
- Frontend CI smoke: 12,880 schema-v3 records from 102 indexed source files in a 161-file TypeScript Program; attributed to FE root, CRM, dashboard, HRM, SD and WMS.
- User-reported local FE run: 13,140 records across six repositories. This is a separate environment/result from CI; the count difference is not classified as a regression.
- Latest recorded branch-head CI run #553: all jobs green at `a2a94c7bf63471861ba5e256a12af4e769104911`.
- PR #66 merged into `master` at `72c12421ae8bc6b09b9c326c52cd11d8bece6a64`.

## Current capability boundaries

### Available now

- Project Map / metadata routing for the ERPm workspace.
- Local CLI workspace validation and backend/frontend code indexing.
- JSONL index records with schema and source provenance.
- Local caches isolated by repository, SHA and indexer/schema version.
- Basic local symbol lookup against generated cache records.

### Not implemented yet

- Central Knowledge Store or shared central index.
- Central ingestion orchestration triggered by GitHub/webhooks/CI.
- Shared Query API or platform service.
- Unified platform-wide Knowledge Record/Evidence/Relation contract.
- EF Core metadata and migration extraction.
- Complete FE API → BE route → DTO → EF/database trace.
- Document/business/development-history ingestion.
- Hybrid RAG, vector search, reranking and retrieval evaluation.
- Production Context Engine / Context Packet service.
- MCP Gateway and multi-agent integration.
- Multi-workspace authorization and isolation implementation.

**Important:** each developer currently has a local cache; the current system does not automatically share index data between developer machines. Centralized indexing and shared retrieval are planned platform capabilities, not existing behavior.

## Next milestone

**Phase 0 — Architecture and platform boundaries**

1. Define Tenant / Workspace / Project / Source hierarchy and isolation semantics.
2. Define canonical Knowledge Record, Evidence, Relation and Source Revision contracts.
3. Define connector, extractor and processor plugin boundaries.
4. Define central storage responsibilities: control metadata, artifacts, structured records, search and relationships.
5. Define ingestion lifecycle, idempotency, retries, atomic publish and freshness.
6. Define Retrieval API and Context Packet contracts.
7. Record technology decisions with operational and retrieval benchmarks.
8. Design the first project-neutral vertical slice using ERPm as the pilot.

See [the platform roadmap](plans/roadmap-enterprise-knowledge-platform.md) for phases, deliverables and exit criteria.

## Workstream notes

- The earlier Phase 2 plan remains as implementation history. Its unimplemented EF/cross-layer/evaluation items are deferred and will be reconsidered under the reusable platform roadmap.
- Existing code index schemas v1/v2/v3 remain versioned historical contracts; do not silently reinterpret them as the future platform-wide knowledge contract.
- Other ERPm product workstreams are tracked separately and are not automatically part of the Enterprise Knowledge Platform roadmap.

## Working rules

- Work on feature branches; do not implement directly on `master`.
- Do not create a PR unless explicitly requested.
- Mark work complete only after merge and recorded verification evidence.
- Preserve user working-tree changes. Do not reset, clean or overwrite unrelated local modifications.
- Preserve the user's local `global.json` changes; do not modify or reset them.
- Never commit generated index/cache files.
- Index Git sources at exact revisions; never silently mix SHAs.
