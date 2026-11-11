# Reusable Enterprise Knowledge Platform — Architecture

> **Status:** Architecture direction accepted; implementation design to be validated incrementally  
> **Date:** 2026-11-11  
> **First pilot workspace:** `I3Solution/ERPm`  
> **Product direction:** Reusable, multi-workspace Enterprise Knowledge Platform — not an ERPm-specific system

## 1. Vision and boundaries

Build a reusable platform that ingests, organizes, versions, retrieves and serves enterprise knowledge to multiple projects and AI agents.

ERPm is the first pilot workspace. It is a validation environment, not the architectural boundary of the platform.

The platform must be:
- **Project-agnostic:** no hard dependency on .NET, Angular, ERP or a particular repository layout.
- **Multi-workspace:** multiple independent projects can use one platform while preserving data and access boundaries.
- **Multi-source:** source code, technical/business documents, database metadata, Git history, issues and other approved sources.
- **Version-aware:** every item is traceable to the source revision from which it was derived.
- **Evidence-oriented:** retrieval results retain source references, locations, provenance and confidence.
- **Agent-agnostic:** expose stable retrieval/context capabilities without coupling the core to one LLM or coding agent.

## 2. Logical architecture

```text
                    Enterprise Knowledge Platform
┌──────────────────────────────────────────────────────────────────┐
│ Workspace & Access Control                                       │
│ Tenants / Workspaces / Projects / Sources / Policies / ACLs       │
├──────────────────────────────────────────────────────────────────┤
│ Source Connector Framework                                       │
│ Git | Filesystem | Documents | Database Metadata | Issue Trackers │
├──────────────────────────────────────────────────────────────────┤
│ Ingestion & Processing                                           │
│ Discover → Fetch → Parse → Extract → Normalize → Validate        │
├──────────────────────────────────────────────────────────────────┤
│ Knowledge Contracts                                              │
│ Canonical Records | Evidence | Relations | Revisions | ACLs       │
├──────────────────────────────────────────────────────────────────┤
│ Central Knowledge Storage                                        │
│ Control Metadata | Documents/Artifacts | Structured Index         │
│ Full-text/Vector Search | Relationship Index                      │
├──────────────────────────────────────────────────────────────────┤
│ Retrieval & Context                                              │
│ Scope Router → Hybrid Retrieval → Merge/Rerank → Evidence Check   │
│ → Context Assembly → Context Packet                              │
├──────────────────────────────────────────────────────────────────┤
│ Integration                                                      │
│ Query API | MCP Gateway | Agent/Workflow Integrations             │
└──────────────────────────────────────────────────────────────────┘
```

These are logical boundaries, not a requirement to deploy every box as a separate microservice. Start with a modular architecture and extract independently deployable services only when scale, isolation or operational needs justify it.

## 3. Platform core modules

| Module | Responsibility |
|---|---|
| Workspace Management | Tenant/workspace/project lifecycle, source registration and configuration |
| Identity & Access | Authentication integration, workspace/source ACLs and retrieval-time authorization |
| Connector Framework | Common lifecycle for connecting to external knowledge sources |
| Ingestion Orchestrator | Scheduling, webhooks, retries, checkpoints and job status |
| Extractor/Processor Framework | Source-specific parsing, code analysis, document parsing, normalization and enrichment |
| Knowledge Contract | Canonical record, evidence, relationship, revision and provenance contracts |
| Knowledge Storage | Control metadata, original artifacts, structured records and search indexes |
| Retrieval Engine | Scope-aware structured, full-text, vector and relationship retrieval |
| Context Engine | Evidence selection, deduplication, ranking, token budgeting and Context Packet generation |
| Integration Gateway | Query API, MCP tools and agent/workflow adapters |
| Evaluation & Observability | Retrieval evaluation, ingestion health, freshness, cost and audit trails |

## 4. Workspace and isolation model

Initial logical hierarchy:

```text
Platform
└── Tenant
    └── Workspace
        ├── Project
        │   ├── Source (repository, document collection, database metadata source...)
        │   └── Knowledge revisions
        ├── Retrieval policies
        └── Access policies
```

The exact Tenant/Workspace/Project hierarchy is a design baseline and must be validated against the intended deployment model before implementation.

Mandatory rules:
1. Every source and derived knowledge record belongs to an explicit workspace scope.
2. Retrieval must apply workspace scope and authorization filters before returning content.
3. Cross-workspace retrieval is denied by default; any future sharing must be explicit and auditable.
4. Credentials and connector secrets are isolated from knowledge records and are never copied into prompts or index content.
5. Jobs, caches, search indexes and logs must not accidentally mix workspace data.
6. Deletion and re-indexing must be traceable to the owning workspace and source.

## 5. Knowledge domains and source adapters

Knowledge is organized by domain, while sharing one platform contract:

| Knowledge domain | Example source adapters | Typical extracted knowledge |
|---|---|---|
| Code | Git repositories, source archives | Files, symbols, definitions, references, calls, imports |
| Architecture | ADRs, diagrams, repository metadata | Components, dependencies, boundaries, integration contracts |
| Database | EF metadata, migrations, schema exports, approved DB metadata | Tables, columns, keys, relations, migration evidence |
| Business | Business specifications, process documents | Business terms, rules, workflows, entities |
| Documentation | PDF, DOCX, Markdown, HTML | Sections, paragraphs, tables, citations |
| Development history | Git commits, PRs, issues | Change history, decisions, implementation links |

A connector discovers and retrieves source material. An extractor understands a source format or technology. A normalizer maps extracted facts into shared contracts. These responsibilities must not be fused into one ERPm-specific pipeline.

## 6. Canonical knowledge and evidence contract

The common envelope should support, at minimum:

- Identity: record ID, tenant/workspace/project/source IDs.
- Classification: knowledge domain, record type, language/technology where relevant.
- Source identity: source URI/path and source type.
- Revision: source revision; Git repository ID and exact commit SHA for code sources; document version or content hash for documents.
- Location: line/span, page, section, table or other source-native locator.
- Content: normalized text and typed domain payload; do not flatten all structured facts into text.
- Relations: typed edges with evidence and resolution status.
- Provenance: connector/extractor name and version, schema version, extraction time and original content hash.
- Quality: confidence/evidence state such as `verified`, `partial` or `unknown`.
- Authorization: security labels/ACL metadata needed to enforce source access during retrieval.

The contract must distinguish source facts from inferred/enriched facts. Name similarity alone is not proof of a relationship. Existing index schemas v1/v2/v3 remain historical, versioned contracts; do not silently reinterpret them as the future platform-wide contract.

## 7. Central storage responsibilities

Keep logical storage responsibilities separate even if the first deployment uses a small number of technologies:

- **Control plane:** tenants, workspaces, projects, sources, connector configuration references, policies, jobs, revisions and audit metadata.
- **Artifact/document storage:** original files and larger extracted artifacts, with stable references and retention policy.
- **Structured knowledge store:** typed records, symbols, metadata and explicit relationships.
- **Search plane:** full-text and vector representations with workspace, revision and ACL filters.
- **Relationship retrieval:** initially may use relational/structured edges; introduce a dedicated graph database only when measured query needs justify it.

A prior technology direction discussed for evaluation is PostgreSQL for control metadata, OpenSearch for full-text/vector search, Haystack for retrieval pipelines, and Go for MCP services. Treat these as candidate/previously discussed choices, not final locked decisions. Validate operational fit, deployment constraints, connector needs and retrieval benchmarks before committing.

## 8. Ingestion lifecycle and freshness

Expected lifecycle:

1. Register a source inside a workspace.
2. Discover source revisions or content changes.
3. Trigger ingestion manually, by webhook or schedule.
4. Fetch a deterministic source snapshot.
5. Parse and extract source-specific knowledge.
6. Normalize and validate records against versioned contracts.
7. Write artifacts and records to central storage.
8. Publish/update search and relationship indexes.
9. Mark the source revision as ready only after required stages succeed.
10. Expose freshness, errors and provenance to retrieval clients.

For Git sources, index an exact commit SHA, not a moving branch name. Branches are pointers to revisions. A query must resolve to an explicit indexed revision or a documented default revision; records from different SHAs must never be silently mixed.

Local indexing remains useful for development, offline work and diagnostics. It is not the shared source of truth in the target architecture.

## 9. Hybrid RAG and context flow

RAG is the retrieval-and-context layer above the knowledge stores, not a synonym for embeddings.

Proposed request flow:
1. Receive a question/task and caller identity.
2. Resolve tenant/workspace/project scope and retrieval policy.
3. Classify intent and identify useful knowledge domains.
4. Retrieve exact structured facts (symbols, API, schema, relations) and semantic/full-text passages in parallel where useful.
5. Expand through verified relationships when the task requires it.
6. Merge, deduplicate and rerank candidates.
7. Re-check source revision, ACL and evidence quality.
8. Assemble a bounded Context Packet containing evidence, citations/locators, provenance and unresolved gaps.
9. Return the packet to the calling agent; the agent remains responsible for reasoning and action.

Use:
- Structured retrieval for exact identifiers, symbol references, API routes and database metadata.
- Full-text retrieval for exact phrases, names and lexical matching.
- Vector retrieval for semantic similarity in documents and business descriptions.
- Relationship retrieval for verified cross-source connections.
- Reranking to prioritize evidence, not to invent missing relationships.

Vector search is one retrieval method, not the knowledge model and not the only source of truth.

## 10. Context Packet contract

A Context Packet should be machine-readable and include:
- Request/workspace scope and selected source revisions.
- Task interpretation and retrieval strategy summary.
- Selected evidence items with source URI, revision, location and provenance.
- Verified relationships and their supporting evidence.
- Confidence/quality and known limitations.
- Deduplicated excerpts or structured payloads.
- Token/size budget and truncation notes.
- Unresolved questions or missing evidence.

The packet must preserve enough information for an agent or developer to open and verify the original source. It must not present generated summaries as authoritative source facts.

## 11. Security, governance and operations

Security and governance are platform capabilities, not later add-ons:
- Workspace isolation and retrieval-time ACL enforcement.
- Secret references rather than secret values in connector configuration.
- Audit events for ingestion, access and administrative changes.
- Source retention, deletion and re-index lifecycle.
- Encryption and transport security according to deployment environment.
- Prompt-injection-aware treatment of retrieved documents as untrusted data.
- Observability for ingestion failures, freshness, retrieval latency, ranking and cost.
- Evaluation datasets with expected evidence and regression checks.

## 12. Current ERPm pilot assets

Already implemented in the ERPm umbrella repository:
- Phase 1 context metadata: workspace/repository/domain/integration maps and context policy.
- .NET Code Index CLI and recursive workspace manifest validation.
- Backend Roslyn indexer with schema v2.
- Frontend TypeScript/Angular worker with schema v3.
- JSONL records and local cache keyed by repository/revision/indexer contract.
- Provenance and SHA-isolation safeguards.

These are the first **Code Knowledge connector/extractor family** for the platform. They are not yet a centralized knowledge service.

## 13. Explicit non-goals for the first platform increment

- Do not rewrite existing indexers merely to rename them as platform services.
- Do not require every logical module to become a microservice.
- Do not select a vector database before retrieval requirements and evaluation data exist.
- Do not build a vector-only RAG that discards typed symbols, relations or provenance.
- Do not claim a complete runtime call graph, full data-flow analysis or automatic business-rule inference.
- Do not index live production databases without an explicit, approved connector/security design.
- Do not make an agent autonomous simply because it can retrieve knowledge.

## 14. Architecture decisions still to validate

1. Tenant/workspace/project hierarchy and deployment tenancy model.
2. Control-plane and search-plane technology choices.
3. Canonical record and relationship schema, including migration from existing v2/v3 code-index records.
4. Connector SDK/plugin contract and job/event model.
5. Artifact storage and retention.
6. Embedding model/provider strategy, vector dimensions and re-embedding lifecycle.
7. Retrieval evaluation dataset, ranking metrics and acceptance thresholds.
8. Authentication/authorization integration and source ACL mapping.
9. API and MCP boundaries, including which capabilities are read-only initially.
10. Whether the first implementation is a modular monolith, a small set of services, or an existing shared platform integration.

## 15. Architecture acceptance criteria

The architecture is ready for implementation planning when:
- Workspace isolation and source revision semantics are unambiguous.
- Canonical knowledge/evidence contracts are versioned and testable.
- Connectors and extractors have separate responsibilities.
- Central storage responsibilities and failure/retry semantics are defined.
- Retrieval can combine exact structured evidence with semantic/full-text results.
- Every returned item can be traced to an authorized source revision and location.
- Context Packet format and retrieval evaluation criteria are defined.
- The first vertical slice can be implemented without ERPm-specific assumptions in the platform core.


## 16. Task progress aggregation and governance

Task records remain the source of truth. `.ai/status.md` is a generated, read-only projection for project-level visibility.

### 16.1 Ownership

- Each meaningful task has one Markdown record at `.ai/tasks/<type>-YYYYMMDD-*.md`.
- The assigned Agent/developer owns and updates only that task record.
- A task spanning multiple PRs or feature increments keeps the same record and filename.
- The task record's status, feature checklist and verification evidence are authoritative. The report never writes back to task records.

### 16.2 Generated report

- Only the authorized GitHub Actions workflow may write `.ai/status.md`.
- Agents and Developers must never manually create, edit, delete, format, commit or push this file.
- A successful PR merge into `master` triggers a full rebuild from all eligible task records on the latest `master`.
- The generator is deterministic and idempotent: identical task inputs produce identical report content; no commit is created when content is unchanged.
- The report shows task-level status and feature checklist completion separately. It must not infer a task's status from a percentage or infer roadmap phase completion from task counts.
- Historical task records without the current aggregation marker are excluded; no migration or retrospective normalization is required.

### 16.3 Multi-PR behavior

The generator treats the latest task file on `master` as a complete snapshot, not a delta. For example, PR 1 may merge Feature 1 as complete and Feature 2 as pending; PR 2 may later update the same record to show both complete. The second run reads the latest record and rebuilds the report as 2/2. It does not add 1/2 to the previous report or skip the task because it was already processed.

### 16.4 Failure and concurrency

- Workflow runs are serialized with a stable concurrency group and must not cancel the currently running aggregation.
- Every run checks out/fetches the latest `master`, not the PR head or a stale merge snapshot.
- Before writing, the workflow must handle a concurrently advanced `master` with a safe fetch/rebuild/push retry; never force-push.
- If a marked task record is invalid, generation fails and leaves the last valid report unchanged. Do not silently omit malformed new records.
- The workflow requires an explicitly authorized write identity and repository permission to update `master`. If branch protection disallows direct automation commits, use an approved bot-PR strategy rather than weakening protection implicitly.

