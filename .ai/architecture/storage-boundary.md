# Storage Boundary — Proposed Platform Storage Architecture

> **Status:** Draft for architecture review  
> **Date:** 2026-11-12  
> **Depends on:** Accepted Workspace isolation boundary, accepted Canonical Knowledge Contract v1 decisions, accepted Ingestion v1 decisions  
> **Scope:** Logical storage responsibilities, ownership, consistency, publication, retrieval and lifecycle  
> **Out of scope:** Vendor selection, physical DDL, deployment topology and capacity sizing

## 1. Purpose

Define where each category of platform data is authoritative, where it is stored logically, and how the stores interact without making the platform dependent on one database or search product.

The platform must preserve:
- Tenant and Knowledge Workspace isolation.
- Immutable source snapshots and revisions.
- Canonical typed records, evidence and verified relations.
- Atomic visibility for a complete SourceRevision.
- Independent asynchronous full-text/vector projection lifecycle.
- Rebuildability of derived indexes and caches.
- Auditable ingestion, access, publication, retention and deletion.

The boundaries in this document are logical. They do not require separate database servers or microservices. V1 should prefer a small number of technologies that satisfy multiple logical roles while preserving clear module/API ownership.

## 2. Storage domains and authority

~~~~text
                  Platform APIs / Ingestion Orchestrator
                                  |
                +-----------------+------------------+
                |                 |                  |
                v                 v                  v
          Control Plane      Artifact Store    Canonical Knowledge
          (transactional)    (immutable blobs)  Store (typed facts)
                |                 |                  |
                |                 |                  |
                +-----------------+------------------+
                                  |
                         Publication Catalog
                        (manifest + ready pointer)
                                  |
                    +-------------+-------------+
                    |                           |
                    v                           v
             Full-text Projection        Vector Projection
                    |                           |
                    +-------------+-------------+
                                  |
                           Retrieval Engine
                                  |
                       ACL + scope revalidation
                                  |
                            Context Engine

Operational run/checkpoint state is owned by the Control Plane; large intermediate
artifacts may be stored by reference in the Artifact Store under staging retention.
Caches are disposable accelerators, never the source of truth.
~~~~

| Logical store | What it owns | Authority |
|---|---|---|
| Control Plane Store | Tenant/workspace/project/source metadata, policies, profiles, source revisions, ingestion runs, publication manifests/pointers, projection status and audit metadata | Authoritative for platform ownership, configuration and lifecycle state |
| Artifact Store | Captured source snapshots, original documents/files, large immutable payloads, extraction artifacts and retained evidence excerpts | Authoritative for retained source bytes/snapshot artifacts |
| Canonical Knowledge Store | KnowledgeRecord, Evidence, KnowledgeRelation and typed domain payloads | Authoritative for normalized knowledge facts |
| Search Projection Store | Full-text, keyword, vector and ranking projections | Derived and rebuildable |
| Operational staging | Run-scoped incomplete batches, intermediate output and manifests before publication | Not visible to normal retrieval; lifecycle controlled by the run |
| Cache | Hot metadata, retrieval results or reusable computed data | Disposable; every entry must be safely scoped/versioned |

There may be physical consolidation. For example, control metadata and canonical records may initially share one relational database, and full-text/vector indexes may share one search engine. Logical ownership and consistency rules remain separate even when the physical system is shared.

## 3. Control Plane Store

The Control Plane is the authority for platform control and lifecycle metadata.

Owns:
- Tenant, Workspace and Project identities and lifecycle.
- Membership, role/grant, access policy and source ACL configuration references.
- Source registration, connector type/configuration reference and access mode.
- Versioned IngestionProfile and selected trusted component versions.
- SourceRevision identities, revision keys, hashes, capture state and pointers.
- IngestionRun lifecycle, attempts/stage events, checkpoints, warnings and diagnostics metadata.
- PublicationManifest, current/active SourceRevision pointer and canonical readiness state.
- Versioned ProjectionProfiles, ProjectionRuns, ProjectionStatuses and the desired/ready manifest pointer per SourceRevision and projection kind.
- Audit events and retention/deletion workflow metadata.

Does not own:
- Raw source secrets or token values.
- Large source files/document binaries.
- Canonical domain payload bodies at scale when they belong in the Canonical Knowledge Store.
- Embeddings/full-text documents as the primary source of truth.

Control Plane invariants:
1. Every resource has explicit tenant/workspace ownership as appropriate.
2. Child relationships must validate parent ownership; scope IDs supplied by a worker are not trusted.
3. Workspace is the primary isolation key. Project may only narrow access.
4. State transitions are validated and audited.
5. The active SourceRevision pointer never points to an incomplete or unpublished revision.
6. A failed ingestion run cannot replace the last successful pointer.

## 4. Artifact Store

The Artifact Store retains source bytes and larger immutable artifacts that must be traceable to a SourceRevision.

Examples:
- Git source snapshot/archive or immutable object references to exact repository objects.
- Original PDF, DOCX, Markdown, HTML and attachments.
- Database schema export, migration files and captured metadata snapshot.
- Extractor outputs and large intermediate artifacts required for replay.
- Bounded evidence excerpts when retaining them separately is useful.

Responsibilities:
- Store by opaque artifact identity and content hash.
- Preserve immutable revision association and source provenance.
- Support integrity verification and deduplication where safe.
- Enforce workspace-scoped authorization before retrieval/download.
- Apply encryption, retention, legal hold and deletion policies.
- Provide lifecycle rules for abandoned staging artifacts and superseded source captures.

Recommendations:
- Separate immutable source artifacts from temporary staging/intermediate outputs by namespace and retention policy.
- Content-addressed deduplication may reduce storage, but must not bypass workspace ACL. A shared physical blob must have separately authorized ownership/reference records for every Workspace; deduplication must never make one Workspace's existence or access inferable to another.
- Storage keys must use opaque IDs rather than human names, repository URLs, emails or secret-bearing paths.
- The object key or an unguessable URL is not authorization. Every read requires a platform authorization decision.
- Keep source artifact hashes and capture manifests in control metadata so integrity can be checked without downloading every object.

The platform must define whether it retains full Git archives or relies on the upstream repository as the original artifact. Either option must preserve exact commit identity and a recoverable source locator; relying on upstream availability alone is an explicit availability/retention decision, not an assumption.

## 5. Canonical Knowledge Store

The Canonical Knowledge Store owns normalized, typed, workspace-scoped knowledge.

Initial canonical entities:
- KnowledgeRecord and typed payload.
- Evidence and source-native locator.
- KnowledgeRelation with explicit predicate, resolved endpoints and evidence.
- Record/evidence/relation producer provenance and payload version references.

SourceRevision metadata remains owned by the Control Plane. Canonical records reference the immutable SourceRevision ID.

Canonical store rules:
1. Every record/evidence/relation has a mandatory Tenant and Workspace scope.
2. Project scope is optional; a non-null project must belong to that same Workspace.
3. Source and SourceRevision references must be registered and owned by the same Workspace.
4. The store accepts only validated canonical batches from the Publisher path.
5. Historical results are not silently overwritten when source or producer versions change.
6. Relation endpoints must be resolvable and in the same Workspace; cross-project access remains subject to both endpoints' effective ACLs.
7. Domain payload discriminators and versions are preserved and validated.
8. All retrieval paths apply scope/ACL rules; a record ID is not a capability.

The canonical store should optimize for typed lookup, deterministic reads, revision filtering, evidence traversal and stable identity. It is not required to support all semantic search behavior itself.

## 6. Search Projection Store

The Search Projection Store contains derived representations for retrieval.

Projection families may include:
- Full-text/lexical index.
- Keyword and identifier index.
- Vector embeddings/ANN index.
- Optional reranking features or precomputed retrieval metadata.

Every projection must carry or be traceable to:
- Tenant/Workspace/Project scope.
- KnowledgeRecord ID and payload/content hash.
- SourceRevision ID and Evidence references.
- Projection schema/index mapping version.
- Producer details: tokenizer/analyzer version, embedding model/provider/version and vector dimension where applicable.
- ACL/policy version or a reliable invalidation mechanism.
- Projection state and generated timestamp.

Search projection lifecycle is independent from canonical publication and is defined in [Search Projection Lifecycle](projection-lifecycle.md):
- `ProjectionProfile` pins projection kind, builder/configuration version, source payload selection and definition fingerprint.
- `ProjectionRun` owns build/retry lifecycle separately from IngestionRun.
- `ProjectionManifest` is immutable output tied to the exact canonical PublicationManifest.
- `ProjectionStatus` is resolved for one SourceRevision + projection kind + desired profile definition.
- Statuses are `pending`, `building`, `ready`, `failed` and `stale`; only `ready` is retrieval-eligible.

Rules:
1. A search/vector failure does not roll back a published canonical SourceRevision.
2. Structured retrieval may use canonical records as soon as the SourceRevision is published.
3. Full-text/vector retrieval may use only ready projections compatible with the requested SourceRevision, payload/projection version and ACL policy.
4. A query response must disclose per-SourceRevision projection readiness; optional unavailable methods may yield Partial results while required unavailable methods fail with a capability-unavailable error. Absence from an unavailable projection is not proof that no knowledge exists.
5. Candidate filters for Tenant/Workspace/Project and effective ACL must apply inside the search request or before any candidate content/count/snippet is exposed. Post-filtering already exposed candidates is insufficient.
6. Projection rebuilds are idempotent and do not mutate canonical records.
7. A projection can be deleted/rebuilt independently; canonical facts and source evidence remain intact.

A vector database is not the canonical knowledge model. Do not duplicate mutable authoritative facts in embeddings.

## 7. Operational staging and checkpoints

Staging is a logical storage area owned by the IngestionRun.

It may contain:
- Captured batch manifests.
- Raw extraction observations.
- Processed outputs.
- Normalized canonical batches awaiting validation/publication.
- Checkpoint hashes, counts and stage diagnostics.
- A publication manifest awaiting the ready transition.

Rules:
- Every staging item carries run ID, Tenant/Workspace/Source/SourceRevision IDs and producer versions.
- Workers cannot write to the published canonical namespace directly.
- Incomplete staging data is invisible to normal Retrieval APIs and search clients.
- Checkpoints are reusable only when input revision, content hash and all relevant producer/contract versions match.
- Staging data is cleaned or retained according to failure/retry/audit policies.
- Large staging payloads may live in Artifact Store with restricted references and TTL; run state and ownership remain in Control Plane.

No separate queue or staging database product is prescribed here.

## 8. Publication consistency and read visibility

The accepted ingestion decision is atomic publication per complete SourceRevision.

Recommended logical protocol:

1. Connector captures and registers an immutable SourceRevision in the Control Plane.
2. Extractors/processors/normalizer write run-scoped outputs to staging.
3. Validator checks the entire revision's required outputs, scope, provenance, payload contracts, evidence and completeness policy.
4. Publisher writes canonical records/evidence/relations under a versioned unpublished revision namespace. Large sets may be written in chunks.
5. Publisher verifies a complete manifest: counts, hashes, input revision, producer/contract versions and validation report.
6. Control Plane commits the PublicationManifest and transitions the SourceRevision to `published` using one authoritative transaction/compare-and-swap. This is the visibility boundary.
7. The active/default source pointer advances only if the revision is still the valid desired revision and is not older than a newer already-published revision.
8. Retrieval reads only canonical revision namespaces referenced by a committed published manifest.

Consequences:
- No record from a partial revision is visible before step 6.
- The previous published revision remains usable until the new manifest is committed.
- Failed staging or failed canonical writes do not affect the active pointer.
- The platform does not need a distributed transaction across object storage, canonical storage and search systems; it needs durable staged writes plus one authoritative publication decision and idempotent recovery.
- Unreferenced unpublished canonical batches are garbage-collected or retained for diagnostics according to policy.

Search projection publication follows a separate state transition after canonical publication. It may use its own projection manifest and readiness pointer. It cannot alter the canonical publication manifest.

## 9. Read and retrieval path

A retrieval request should follow this logical order:

1. Authenticate the caller and resolve explicit Tenant/Workspace/Project scope.
2. Authorize the requested action and source/project visibility.
3. Read the selected active/pinned SourceRevision and committed PublicationManifest from the Control Plane.
4. Perform structured retrieval against the Canonical Knowledge Store with mandatory scope, revision and ACL constraints.
5. Query only compatible ready Search Projections for lexical/vector candidates.
6. Resolve candidate IDs back to canonical records and Evidence.
7. Revalidate authorization, publication membership, revision and ACL/policy freshness before exposing content.
8. Merge/rank results while preserving projection availability and retrieval provenance.
9. Return evidence-backed records; never synthesize a cross-workspace result in v1.

A missing or stale projection may reduce recall for that retrieval mode but must not expand access or silently imply that the canonical knowledge does not exist.

## 10. Caching

Caches are disposable and cannot be used as authorization authorities.

Cache key dimensions must include, as applicable:
- Tenant ID and Workspace ID.
- Project scope and effective access-policy/ACL version.
- SourceRevision/publication manifest.
- Knowledge record or query identity.
- Payload/contract version.
- Search projection/index/embedding version.
- Retrieval policy and normalization version.

Rules:
- Never cache a result without its full authorization scope.
- Reauthorize or invalidate on membership, project restriction, source ACL, suspension or revocation changes.
- Do not share snippets, query results or embeddings across Workspaces merely because hashes match unless a separately reviewed isolation-safe design exists.
- A cache miss is always safe; a cache hit must be proven to match current scope and versions.

## 11. Retention, deletion and recovery

Lifecycle must coordinate across stores:
- Deleting/suspending a Source prevents new ingestion and retrieval according to its policy.
- Retiring a SourceRevision removes it from active retrieval only through a Control Plane state/pointer transition.
- Workspace deletion begins with an authorization-protected tombstone/suspension, then removes or cryptographically erases canonical data, artifacts, search projections, caches and staging outputs according to policy.
- Deletion is idempotent and produces auditable completion evidence per storage domain.
- Backups and replicas must follow the same retention/legal deletion obligations; exact schedules and legal hold behavior require deployment/legal policy.
- Restore must preserve Tenant/Workspace ownership and must not reactivate a deleted/suspended workspace without an explicit administrative operation.

Retention duration, legal hold, source revocation and hard-delete requirements remain open decisions. Do not hardcode retention periods in v1 contract or infer regulatory requirements.

## 12. Security and isolation requirements

- Tenant/Workspace scope is enforced in every store and every access path.
- Project restrictions can narrow but never widen Workspace membership.
- Artifact downloads require authorization independent of object-key secrecy.
- Canonical writes are accepted only from trusted Publisher/ingestion service identities.
- Search filters are applied before candidate data/count/snippets are exposed.
- Search and cache entries are invalidated or policy-versioned when ACL changes.
- Control Plane secret fields store references to a secret manager; raw credentials are kept outside knowledge stores, artifacts, logs and search.
- Audit data is append-oriented, access-controlled and avoids copying arbitrary knowledge content.
- Cross-store backups, restore, export and deletion preserve scope metadata and access constraints.
- Internal service identities receive least privilege for their store responsibilities.

## 13. Logical mapping to candidate technology capabilities

No vendor is selected by this design. Evaluate candidates against capabilities:

| Logical role | Required capabilities | Candidate class (not a decision) |
|---|---|---|
| Control Plane | Transactions, composite ownership constraints, indexes, audit queries, concurrent pointer updates | Relational database |
| Artifact Store | Immutable/versioned objects, large blob streaming, hashes, lifecycle/retention, scoped access | Object storage or filesystem-compatible blob store |
| Canonical Knowledge Store | Typed records, payload-version handling, scoped lookups, revision filtering, relation traversal | Relational/document/structured store |
| Search Projection Store | Full-text, exact identifier, filters, vector/ANN and index versioning | Search engine and/or vector index |
| Cache | TTL, scoped keys, invalidation and bounded resource use | Distributed or local cache |
| Secrets | Secret references, rotation, least privilege and audit | Secret manager / identity provider facilities |

Previously discussed PostgreSQL and OpenSearch remain candidates, not decisions. A relational database may initially satisfy both Control Plane and Canonical Knowledge Store if performance, payload and query requirements fit. A search engine may host both full-text and vector projections if it meets filtering, versioning and operational criteria.

Do not add a graph database for v1 solely because relations exist; evaluate whether structured relation tables and indexed joins meet the first vertical slice.

## 14. Technology evaluation criteria

Compare candidate combinations using representative platform workloads:

1. Transactional correctness for scope ownership and publication pointer changes.
2. Workspace/tenant isolation enforcement and defense-in-depth.
3. Query performance for exact symbol, source revision, evidence and relation traversal.
4. Full-text identifier matching and vector retrieval quality/latency where applicable.
5. Bulk ingestion throughput and revision-level publication behavior.
6. Rebuild/re-index cost and projection version migration.
7. Backup, restore, retention, deletion and export.
8. Operational complexity for a small team and self-hosted/managed deployment options.
9. Cost at pilot scale and plausible multi-workspace growth.
10. SDK/tooling fit for .NET/TypeScript extractors and future independent connectors.

A benchmark must use anonymized or approved representative corpus and include at least two isolated Workspaces, distinct ACL scopes, one failed ingestion, one out-of-order revision publication and one projection rebuild.

## 15. Acceptance scenarios

1. Two Workspaces can store identical content hashes without exposing existence or data across scopes.
2. A Project-scoped query cannot read a sibling restricted Project.
3. A staged but unpublished revision is invisible to structured and search retrieval.
4. A failed canonical publish leaves the previous active SourceRevision unchanged.
5. A complete SourceRevision is published once even when its records were written in many chunks.
6. Search/vector projection failure leaves canonical structured retrieval available and reports projection status.
7. A search projection from an older source revision cannot return candidates as if current.
8. ACL revocation blocks stale cache and search results before content is exposed.
9. Workspace deletion/revocation propagates to artifacts, canonical records, projections, staging and caches.
10. Restoring a backup does not accidentally reactivate suspended/deleted Workspace data.
11. Rebuilding a projection does not modify KnowledgeRecord, Evidence or SourceRevision identity.
12. Re-indexing with a new producer version preserves prior provenance and respects retention policy.

## 16. Accepted storage decisions (2026-11-12)

The following are accepted logical defaults for the first platform implementation. They do not select specific vendors or require separate infrastructure for every logical store.

1. **Control Plane + Canonical Knowledge Store:** begin with one relational database deployment, while keeping separate logical modules, schemas and write/read ownership. Reconsider physical separation only when measured scale, availability, security or operational requirements justify it.
2. **Git source snapshots:** always preserve the exact repository identity, commit SHA, tree/content hashes and capture manifest as revision provenance. Do not duplicate the entire repository on every ingestion by default. Keep an immutable Artifact Store archive when replay/retention policy requires it, when upstream availability cannot be relied on, or when a captured snapshot is required to reproduce extraction. Upstream commit references alone are not a substitute for an explicit retention/availability decision.
3. **Retention and deletion:** use policy-driven retention across source artifacts, canonical history, staging, projections, caches, audit records, backups and replicas. Do not hardcode a universal duration in v1 contracts. Preserve source/processing history for the configured retention period; legal hold, hard-delete semantics and concrete durations must be settled for each deployment before production.
4. **Full-text + vector:** keep full-text and vector as separate logical projection adapters with independent versions, readiness and rebuild lifecycle. They may share one physical search engine only if benchmark results prove required filtering/isolation, versioning, quality, latency and operational fit.
5. **Initial benchmark:** use at least two isolated Workspaces with different effective ACLs and at least one Project-restricted scope. Include identical content hashes across Workspaces, a representative code corpus, failed ingestion, out-of-order SourceRevision publication, projection failure/rebuild, ACL revocation and stale-cache/search checks. Use approved or anonymized data. Measure isolation correctness, publication correctness, query quality/latency, ingestion throughput, rebuild cost and operational complexity.

## 17. Remaining storage decisions

The accepted defaults above settle the logical direction. The following remain open and must not be inferred as already implemented:

- Select the relational database, Artifact Store/object storage and search technology through technology ADRs and benchmark evidence.
- Define deployment-specific retention durations, legal hold, source revocation, backup expiry and hard-delete completion requirements.
- Define which Git sources require archived snapshots versus upstream-backed replay, including retention exceptions.
- Build the benchmark corpus and agree numeric quality, latency, throughput and cost thresholds.
- Decide physical deployment topology and capacity sizing after representative workload measurements.
