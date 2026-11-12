# Canonical Knowledge Contract — Proposed v1

> **Status:** Core v1 design decisions accepted by the user on 2026-11-12; implementation schema remains to be specified and tested  
> **Date:** 2026-11-12  
> **Scope:** Common envelope, typed payloads, evidence, relations, source revisions and versioning  
> **Compatibility rule:** Existing code-index schemas v1/v2/v3 remain immutable

## 1. Purpose

Define a project-neutral contract that lets the Enterprise Knowledge Platform ingest, store, link and retrieve different knowledge domains through one platform surface without flattening their domain-specific structure.

The contract must support code and architecture knowledge, documents and extracted sections/chunks, database schemas/constraints/migration observations, business terms/processes/rules, and development history such as commits, pull requests and issues.

This is a logical interchange contract, not a physical database schema or a decision to use a particular storage product.

## 2. Contract design principles

1. **One common envelope, many typed payloads.** Common identity, scope, provenance and lifecycle fields are shared; domain facts remain typed.
2. **Workspace-first ownership.** Every knowledge record belongs to exactly one Tenant and Knowledge Workspace. Project is optional and can narrow authorization inside that Workspace.
3. **Evidence is first-class.** A record or relation must be traceable to source revisions and source-native locations.
4. **Observations are not inferred facts.** Preserve whether content was directly observed, deterministically extracted, asserted by a human or inferred by a model.
5. **Source revisions are immutable.** A new source revision or extractor/schema version creates a new derived result; do not silently overwrite historical evidence.
6. **Relations are explicit.** Name similarity is not proof of a relation. Resolved graph edges require endpoints and supporting evidence.
7. **Search indexes are projections.** Embeddings, chunks for search, normalized text and reranker features do not replace canonical records or original artifacts.
8. **Extensible but versioned.** Domain payloads evolve independently from the common envelope; incompatible changes require explicit version changes.
9. **No platform dependency on ERPm technology.** The shared envelope must not require Roslyn, Angular, EF Core, PostgreSQL or a particular document parser.

## 3. Logical contract model

~~~~text
Tenant
└── Workspace                         primary isolation boundary
    ├── Project?                      optional narrower scope
    ├── Source
    │   └── SourceRevision             immutable source snapshot
    ├── KnowledgeRecord                common envelope + typed payload
    │   ├── Evidence*                  one or more source-grounded locators
    │   └── KnowledgeRelation*         explicit resolved edges
    └── IngestionRun                   operational lineage

Search projections (full-text / vector / ranking features)
    └── point back to KnowledgeRecord + source/evidence revision
~~~~

| Concept | Meaning | Canonical or derived |
|---|---|---|
| Source | Registered origin such as repository, document collection or database metadata export | Canonical control metadata |
| SourceRevision | Immutable version/snapshot of a Source | Canonical control metadata |
| KnowledgeRecord | A typed knowledge item in a Workspace | Canonical |
| Evidence | Source-native proof/location supporting a record or relation | Canonical |
| KnowledgeRelation | A resolved, typed edge between two KnowledgeRecords | Canonical |
| IngestionRun | One execution of connectors/extractors/normalizers against explicit inputs | Operational lineage |
| SearchProjection | Full-text/vector/reranking representation derived from records | Derived/rebuildable |
| Artifact | Original or large source stored outside the record envelope | Source asset / immutable artifact |

## 4. KnowledgeRecord common envelope

Proposed logical JSON shape:

~~~~json
{
  "contract": {
    "name": "ekp.knowledge-record",
    "version": "1.0"
  },
  "recordId": "opaque-platform-id",
  "logicalKey": "source-scoped-stable-identity",
  "scope": {
    "tenantId": "tenant-id",
    "workspaceId": "workspace-id",
    "projectId": null
  },
  "classification": {
    "domain": "code",
    "recordType": "code.symbol"
  },
  "claim": {
    "kind": "deterministic_extraction",
    "verification": "verified"
  },
  "payload": {
    "type": "code.symbol",
    "version": "1.0",
    "data": {}
  },
  "evidenceIds": ["evidence-id"],
  "provenance": {
    "ingestionRunId": "run-id",
    "producer": {
      "connector": "git",
      "extractor": "roslyn",
      "extractorVersion": "0.2.0",
      "normalizer": "ekp-code-normalizer",
      "normalizerVersion": "1.0.0"
    }
  },
  "accessPolicyRef": "effective-source-or-project-policy",
  "createdAtUtc": "2026-11-12T00:00:00Z"
}
~~~~

The example is illustrative. Field optionality, exact ID encoding and wire-level required fields must be finalized in a machine-readable schema after review.

### 4.1 Identity

- recordId is an opaque platform identity for this immutable normalized record instance.
- logicalKey is a stable identity of the conceptual item within an explicitly declared identity scope; it helps correlate the same symbol/document entity across source revisions.
- logicalKey is not globally unique, is not an authorization token and must never be used without its scope.
- Display name, qualified name, URL, file path or business code alone must not be treated as platform identity.
- A record version from a different source revision or extractor contract may have a different recordId while retaining the same logicalKey.

Candidate identity scope is declared per payload type, for example workspace + source + domain + record type. The exact uniqueness rule belongs to each domain payload/normalizer, not a universal string convention.

### 4.2 Scope and ownership

- tenantId and workspaceId are mandatory.
- projectId is nullable for Workspace-shared knowledge.
- A non-null projectId must identify a Project belonging to the same Tenant and Workspace.
- A record must never be owned by more than one Workspace.
- Records with evidence from multiple sources are allowed only when all evidence sources belong to the same Workspace.
- Cross-workspace synthesis/federated records are out of scope for v1.
- Scope is validated by the platform, not trusted from untrusted connector payloads.

### 4.3 Classification and typed payload

domain and recordType are controlled, namespaced identifiers. The payload has its own discriminator and schema version:

~~~~json
{
  "domain": "database",
  "recordType": "database.column",
  "payload": {
    "type": "database.column",
    "version": "1.0",
    "data": {
      "schemaName": "public",
      "tableName": "customers",
      "columnName": "customer_id",
      "databaseType": "uuid",
      "nullable": false
    }
  }
}
~~~~

The common envelope must not grow an untyped metadata bag that allows arbitrary consumers to interpret the same field differently. Technology-specific and domain-specific facts belong in a versioned typed payload.

### 4.4 Claim and verification state

These are separate dimensions:

- claim.kind describes how the fact was obtained:
  - source_observation: captured directly from a source.
  - deterministic_extraction: extracted by deterministic parsing/compiler/schema tooling.
  - human_assertion: explicitly entered or approved by a human.
  - model_inference: inferred or generated by an AI model.
- claim.verification describes evidence state:
  - verified: evidence directly supports the stated fact/edge according to the payload verification rule.
  - partial: evidence supports only part of the statement or an endpoint is not fully resolved.
  - unknown: available evidence does not establish the statement.

Do not convert model confidence into a universal probability field unless calibration and meaning are defined for that producer/model. A model-generated assertion must never be represented as a deterministic source fact.

## 5. Source and SourceRevision

A Source is a registered origin inside one Workspace. A SourceRevision captures one immutable snapshot.

| Field | Purpose |
|---|---|
| sourceRevisionId | Opaque platform identity |
| tenantId, workspaceId, sourceId | Ownership/scope validation |
| revisionKind | git_commit, document_version, content_snapshot, database_schema_snapshot, issue_snapshot, etc. |
| revisionKey | Exact upstream revision key (for Git, full commit SHA) |
| contentHash | Hash of captured raw artifact bytes or manifest |
| artifactRef | Stable reference to archived snapshot where retention policy requires it |
| capturedAtUtc | Time the source snapshot was captured |
| sourceObservedAtUtc | Upstream timestamp when reliably available |

Rules:
1. Git branch names are mutable selectors, not revisions; resolve them to an exact commit SHA before extraction.
2. Document version IDs are preferred; otherwise preserve a content hash and connector-provided version metadata.
3. Database metadata uses a captured schema snapshot plus its content hash; do not imply the live database has remained unchanged.
4. A SourceRevision is immutable. Correcting or re-capturing content creates a new revision or capture identity.
5. One Source may have many SourceRevisions; the active/default revision is a mutable pointer maintained separately from immutable revision records.
6. A SourceRevision belongs to exactly one Source and Workspace.

## 6. Evidence contract

Evidence is first-class and can support one KnowledgeRecord or one KnowledgeRelation.

~~~~json
{
  "evidenceId": "opaque-evidence-id",
  "scope": {
    "tenantId": "tenant-id",
    "workspaceId": "workspace-id",
    "projectId": null
  },
  "sourceId": "source-id",
  "sourceRevisionId": "source-revision-id",
  "locator": {
    "kind": "source_span",
    "path": "src/Customers/Customer.cs",
    "startLine": 10,
    "endLine": 18
  },
  "contentHash": "sha256-of-evidence-or-source-fragment",
  "excerptRef": null,
  "capture": {
    "method": "compiler_symbol",
    "producerVersion": "0.2.0"
  }
}
~~~~

Locator is a discriminated union, not one universal path/line structure:

- Code: repository-relative path, line range and optional character offsets/symbol ID.
- Document: artifact URI, page, section heading/ID, paragraph/table/cell locator.
- Database: schema/table/column/constraint/migration/operation locator, plus file/line for migration SQL when available.
- Business: document section, policy/rule ID, process/activity ID or authoritative system object reference.
- Development history: commit, PR, issue or comment identifier and URL.

Evidence may store a bounded excerpt or a protected reference to it. Large source content and full documents stay in artifact storage. Every excerpt preserves a content hash and source revision locator so it can be checked against the original snapshot.

Evidence inherits the ACL of its Source. A record cannot become readable because an evidence excerpt was copied into another record with weaker access.

## 7. KnowledgeRelation contract

A KnowledgeRelation represents a resolved directed edge between two canonical records.

~~~~json
{
  "relationId": "opaque-relation-id",
  "scope": {
    "tenantId": "tenant-id",
    "workspaceId": "workspace-id",
    "projectId": null
  },
  "sourceRecordId": "record-a",
  "predicate": "code.calls",
  "targetRecordId": "record-b",
  "assertion": {
    "kind": "deterministic_extraction",
    "verification": "verified"
  },
  "evidenceIds": ["evidence-id"],
  "producerVersion": "1.0.0"
}
~~~~

Rules:
1. Both endpoints and the relation belong to the same Workspace.
2. Retrieval authorizes both endpoints and the relation before exposing the edge.
3. A cross-project edge is allowed only when policy permits access to both endpoints; project scope cannot widen visibility.
4. A resolved relation requires a real target recordId. Do not fabricate a target from a matching name.
5. Unresolved or ambiguous references remain typed observations/candidates in a domain payload; they are not traversable graph edges.
6. Predicates use a controlled namespaced vocabulary, such as code.calls, code.references, database.maps_to or business.implements. The vocabulary and semantics are versioned; these examples are not a final complete enum.
7. Relations are immutable assertions with evidence. Retraction or supersession is explicit and traceable; do not silently mutate historical evidence.

This separation prevents partially resolved v2/v3 reference observations from being mistaken for verified graph edges.

## 8. Initial payload families

| Domain | Initial record types (examples) |
|---|---|
| code | code.file, code.module, code.symbol, code.reference_observation, code.api_observation, code.route_observation |
| architecture | architecture.component, architecture.decision, architecture.dependency |
| document | document.artifact, document.section, document.chunk, document.table |
| database | database.schema, database.table, database.column, database.constraint, database.migration, database.migration_operation |
| business | business.term, business.entity, business.process, business.activity, business.rule, business.role |
| development_history | development_history.commit, development_history.pull_request, development_history.issue |

Not every source fact should be promoted to a graph node. Use an observation payload for unresolved or source-specific constructs until a stable canonical identity and semantics exist.

## 9. Search projections and embeddings

Search data is derived from canonical records and is disposable/rebuildable.

A projection should carry:
- recordId and content/payload hash.
- Workspace/project scope.
- Source revision and evidence references.
- Projection type (full-text, vector, keyword/identifier, reranking feature).
- Projection schema version.
- Embedding model/provider/version and vector dimension when applicable.
- ACL/policy version or a reliable invalidation key.

Rules:
- Search and vector candidate filtering must apply Tenant/Workspace and effective ACL constraints before exposing candidates.
- Post-filtering after returning unscoped candidates is insufficient.
- Re-embedding or changing tokenizer/analyzer creates a new projection version, not a new source fact.
- Deleting/rebuilding a projection must not delete the canonical KnowledgeRecord or source artifact.
- Embedding text must retain a pointer to evidence and must not be the only persisted representation of a fact.

## 10. Provenance and idempotency

Every ingestion result must be traceable through:

~~~~text
Source → SourceRevision → IngestionRun → Producer versions
       → KnowledgeRecord → Evidence → Source locator
                           └────────→ KnowledgeRelation
~~~~

Required provenance:
- Connector identity/version.
- Extractor identity/version.
- Normalizer identity/version.
- Contract and payload schema versions.
- Ingestion run identity and input SourceRevision IDs.
- Exact source locator and content hash in Evidence.
- Generation/capture timestamp.

Idempotency:
- An ingestion run is keyed by explicit source/revision inputs and a pipeline version set.
- Repeating the same run with the same inputs must not duplicate records, evidence or relations.
- A changed source revision, extractor version, normalizer version or payload schema version creates a distinct processing result.
- Preserve historical results for audit/replay according to retention policy; do not silently overwrite them.
- A stable logicalKey supports correlation across revisions, but it does not replace run idempotency.

## 11. Versioning and compatibility

Use independent version dimensions:
1. Envelope contract version: common ownership, identity, claim and provenance structure.
2. Payload schema version: domain-specific structure such as code.symbol/1.0 or database.column/1.0.
3. Producer version: connector/extractor/normalizer implementation version.
4. Source revision: exact source snapshot identity.
5. Search projection version: tokenizer, embedding model or index mapping version.

Compatibility policy:
- Additive optional envelope fields may be backward-compatible if unknown fields are handled safely.
- Renaming/removing required fields, changing semantics, weakening workspace scope or changing discriminators is breaking.
- Domain payload changes are versioned independently from the common envelope.
- Consumers declare supported contract and payload versions; unsupported versions fail closed or are routed through an explicit adapter.
- Never reinterpret a historical v1/v2/v3 source record in place.

## 12. Mapping from the existing ERPm code index

Existing schemas remain immutable source-extractor contracts:
- Backend v1: .ai/code-index/schema/index-record-v1.schema.json.
- Backend v2: .ai/code-index/schema/index-record-v2.schema.json.
- Frontend v3: .ai/code-index/schema/index-record-v3.schema.json.

Initial adapter direction:

| Existing source record | Canonical representation |
|---|---|
| v1/v2 definition | code.symbol with language-specific symbol payload and Evidence |
| v1/v2 reference | code.reference_observation; create a KnowledgeRelation only when source and target records are resolved and evidence supports the predicate |
| v1/v2 project / dependency | typed code project/dependency payload or resolved relation after endpoints are registered |
| v3 file / module | code.file / code.module |
| v3 definition | code.symbol |
| v3 reference / relationship | code.reference_observation; promote only verified resolved edges |
| v3 angular | typed Angular component/service/guard/route observation payloads |
| v3 api | code.api_observation with HTTP method and URL classification preserved |

The adapter preserves the original raw source record or a lossless reference to it for audit and reprocessing. It must not manufacture line offsets, resolve a dynamic API path by guessing, or convert unknown/partial observations into verified.

No migration of existing caches is required for the first platform slice. Source indexers can continue emitting v1/v2/v3 while central ingestion adapters normalize them into the canonical contract.

## 13. Validation requirements

A future schema/adapter test suite must prove:

1. Missing Tenant or Workspace scope is rejected.
2. A Project from another Workspace is rejected.
3. Evidence from a different Workspace cannot attach to a record.
4. A relation whose endpoints do not share the same Workspace is rejected.
5. Unresolved reference observations do not become graph edges.
6. Every source-derived record has traceable evidence and an exact source revision.
7. A record preserves its typed payload discriminator and schema version.
8. Unsupported payload/contract versions fail closed.
9. Repeating the same ingestion input is idempotent.
10. Re-indexing a new source SHA does not overwrite the prior revision's evidence.
11. ACL revocation prevents retrieval of stale search/vector candidates and cached Context Packets.
12. Existing code-index v1/v2/v3 schemas and serializers remain unchanged.

## 14. Accepted v1 design decisions

The platform owner explicitly accepted these decisions on 2026-11-12:

1. Keep the logical model split into `KnowledgeRecord`, `Evidence`, `KnowledgeRelation` and `SourceRevision`.
2. `logicalKey` is required for domain entities with a stable conceptual identity. It is optional for chunks, transient observations or other items without a reliable cross-revision identity. Each payload type must declare its identity rule.
3. The first code-ingestion payload scope is `code.file`, `code.symbol`, `code.reference_observation` and `code.api_observation`.
4. V1 ingestion is single-source per normalized record/relation set. Cross-source derived records are deferred until single-source ingestion is stable. A future record may cite multiple sources only under a separately reviewed same-Workspace derivation contract.
5. Historical extractor/payload results are not silently overwritten. Retention is policy-controlled; preserve lineage and enough original evidence to support audit/reprocessing. Exact retention duration and deletion obligations remain open.

These are accepted architecture decisions. They do not approve physical DDL, API routes, machine-readable schema requiredness, payload details beyond the listed initial scope, or production implementation.

## 15. Remaining decisions to review before implementation

1. Exact wire-level required/optional envelope fields and ID encoding.
2. The complete payload schemas for the four initial code types.
3. How retention interacts with legal deletion, source revocation and artifact storage.
4. Exact canonical identity/key derivation rules for each code payload type.

1. Is the proposed envelope split into KnowledgeRecord, Evidence, KnowledgeRelation and SourceRevision accepted?
2. Should logicalKey be mandatory for all record types, or optional for content chunks/observations without stable identity?
3. Which initial payload types are required for the first vertical slice (recommended: code.file, code.symbol, code.reference_observation, code.api_observation)?
4. Should derived cross-source records be permitted in v1 when every evidence item is inside the same Workspace, or deferred until after single-source ingestion is stable?
5. What retention policy should apply to old extractor/payload versions after reprocessing?

The contract is a proposal until these choices are reviewed. Physical database DDL, REST/MCP routes and a full domain schema registry are out of scope for this document.


## 16. Initial machine-readable schemas v1

Initial JSON Schema Draft 2020-12 artifacts:

- [KnowledgeRecord v1](../schemas/knowledge-record-v1.schema.json)
- [Evidence v1](../schemas/evidence-v1.schema.json)
- [KnowledgeRelation v1](../schemas/knowledge-relation-v1.schema.json)
- [SourceRevision v1](../schemas/source-revision-v1.schema.json)

These schemas formalize the shared envelope and ownership/provenance structures for the first four accepted code payload types. The `payload.data` object remains typed by `payload.type` and `payload.version`; its detailed per-type fields are intentionally not frozen in this initial envelope schema.

### 16.1 Cross-record invariants

The platform validator must enforce relationships that a single-object JSON Schema cannot prove:

1. `classification.recordType` equals `payload.type`; the payload type is supported by the declared domain and version.
2. Tenant/Workspace scope is assigned from trusted Source registration and cannot be overridden by connector/extractor content.
3. A non-null Project belongs to the same Tenant and Workspace.
4. Every `evidenceIds` entry resolves to Evidence in the same Workspace and the same declared SourceRevision lineage.
5. Evidence source/revision ownership resolves to the registered Source and captured immutable snapshot; locator and content hash must be verified against that snapshot.
6. Each relation's source/target records and relation scope belong to the same Workspace; relation Evidence supports the predicate and the edge is verified.
7. Unresolved or ambiguous references remain observation payloads and cannot be serialized as KnowledgeRelation.
8. `logicalKey` requiredness and derivation are declared by each payload identity policy; do not infer a universal rule from display names or paths.
9. Single-source v1 normalization ensures a record/relation batch is derived from one registered Source and one SourceRevision. Cross-source derived records remain deferred.
10. Unsupported envelope or payload versions fail closed or require an explicit versioned adapter; historical records are never reinterpreted in place.

### 16.2 Deliberately not frozen

- Detailed fields and validation semantics for each code payload's `data`.
- Per-payload logical identity derivation and uniqueness scope.
- Final ID encoding, schema registry URI and compatibility tooling.
- Retention/deletion implementation and legal-hold behavior.
- Physical DDL and database vendor.

The initial schemas do not alter or replace existing backend code-index v1/v2 or frontend code-index v3 source contracts.
