# Connector, Extractor, Normalizer and Ingestion Lifecycle — Proposed v1

> **Status:** Core v1 ingestion decisions accepted by the user on 2026-11-12; implementation contracts remain to be specified and tested  
> **Date:** 2026-11-12  
> **Depends on:** Accepted Workspace isolation boundary and accepted Canonical Knowledge Contract v1 design decisions  
> **Scope:** Responsibilities, contracts, lifecycle, idempotency, publication and failure semantics  
> **Out of scope:** Physical queues, database tables, API routes and vendor-specific implementations

## 1. Purpose

Define a reusable ingestion pipeline that can bring code, documents, database metadata, business knowledge and development history into the Enterprise Knowledge Platform without coupling the platform core to individual source technologies.

The pipeline separates:
- **Connector:** access and capture source snapshots.
- **Extractor:** understand a source format/technology and produce source-grounded observations.
- **Processor:** optional deterministic transformations of extracted artifacts/observations.
- **Normalizer:** map extracted observations into the canonical Knowledge Contract.
- **Validator:** enforce scope, schema, evidence, revision and relationship invariants.
- **Publisher:** make a validated source revision visible to retrieval clients.
- **Orchestrator:** coordinate the complete run, retries, checkpoints, audit and lifecycle.

These are logical responsibilities. They do not require separate deployable services in v1.

## 2. End-to-end logical flow

Source registration / webhook / schedule / manual trigger
                         |
                         v
                 Ingestion Orchestrator
                         |
                authorize + resolve scope
                         |
                         v
                 Connector: Discover
                         |
                 resolve immutable revision
                         |
                         v
                 Connector: Capture/Fetch
                         |
              SourceSnapshot + ArtifactRefs
                         |
                         v
                  Extractor(s)
                         |
                Extracted Observations
                         |
                         v
                Optional Processors
                         |
                  Processed Batch
                         |
                         v
                   Normalizer
                         |
      KnowledgeRecord + Evidence + resolved Relations
                         |
                         v
                     Validator
                         |
                staged canonical batch
                         |
                         v
                    Publisher
                         |
         publish revision + visibility pointer
                         |
                         v
               Retrieval / Search projections

Search projection building is a separate asynchronous lifecycle after canonical publication. A SourceRevision becomes knowledge-ready for structured retrieval when its canonical publication manifest is committed; full-text/vector availability is reported independently by each projection. See [Search Projection Lifecycle](projection-lifecycle.md) for profile, run, manifest, status and per-revision retrieval contracts.

## 3. Component responsibility boundaries

### 3.1 Connector

A Connector knows how to communicate with one source family/system.

Responsibilities:
- Validate and use a secret/configuration reference supplied by the platform.
- Discover available source revisions or changed items.
- Resolve mutable selectors (branch, URL, collection cursor, database connection target) into deterministic capture inputs.
- Fetch/capture a consistent source snapshot and produce artifact references/content hashes.
- Report upstream identity, source-native metadata, cursor/checkpoint information and transient/permanent errors.
- Support cancellation, bounded paging, rate limiting and retry-safe reads.

A Connector must not:
- Decide Tenant/Workspace/Project ownership.
- Assign canonical KnowledgeRecord IDs or logical keys.
- Infer business meaning or create cross-domain graph edges.
- Bypass platform authorization because it has a service credential.
- Write directly into canonical KnowledgeRecord, Evidence or Relation stores.

Platform-owned Source registration supplies trusted Tenant/Workspace/Project ownership. A connector response may include upstream metadata but cannot override platform scope.

### 3.2 Extractor

An Extractor understands a particular source format or technology, for example Roslyn backend code, TypeScript/Angular frontend code, PDF/DOCX/Markdown structure, EF model/schema/migration metadata, issue tracker objects or Git history.

Responsibilities:
- Consume an immutable captured snapshot, not a moving source.
- Emit typed, source-grounded observations with source-native locators.
- Preserve ambiguity, unsupported syntax and partial extraction explicitly.
- Report diagnostics and coverage/completeness metrics.
- Identify its own name/version and the contract version of its output.

An Extractor must not:
- Determine Tenant/Workspace/Project scope.
- Silently claim unresolved relationships are verified.
- Write canonical stores directly.
- Read arbitrary live source state after the snapshot was captured.
- Silently discard unsupported content without diagnostics.

### 3.3 Processor

A Processor performs an optional, explicit transformation over source artifacts or extraction observations.

Examples:
- Deterministic document segmentation into sections/chunks.
- Text normalization while preserving original text and source locators.
- Language detection.
- Deterministic metadata enrichment from a trusted registry.
- Attachment expansion under an approved policy.

Processor rules:
- Every processor declares input/output types and version.
- Transformations preserve parent evidence and source revision.
- Derived outputs retain links to their input item(s).
- Model-assisted processing is explicitly marked as model inference and never upgrades evidence verification.
- A processor must not change ownership scope or weaken ACL.
- Processors are optional stages; the pipeline records which ones ran.

### 3.4 Normalizer

A Normalizer maps source-specific extraction contracts into the canonical Knowledge Contract.

Responsibilities:
- Map extractor output to namespaced domain/record types and versioned typed payloads.
- Derive stable logicalKey where the payload identity policy permits it.
- Assign canonical claim origin and verification state based on extractor evidence.
- Create canonical Evidence entries from source locators.
- Resolve relation endpoints only from reliable identity mappings; otherwise retain an observation.
- Attach scope from the trusted registered Source/ingestion request, never from untrusted extracted content.
- Produce deterministic output for the same input and version set.

A Normalizer must not:
- Guess missing values or endpoints.
- Fabricate line/page/table locators.
- Merge different concepts solely because their display names match.
- Convert model inference or partial extraction to verified facts.
- Publish records directly.

### 3.5 Validator

Validator responsibilities:
- Validate envelope and payload schema versions.
- Validate required identifiers and payload semantics.
- Verify Tenant/Workspace/Project/Source/SourceRevision ownership consistency.
- Verify all Evidence points to the exact captured source revision and valid locator shape.
- Verify Relations are within the same Workspace and their endpoints are resolvable and authorized under policy.
- Enforce single-source v1 ingestion: each normalized record/relation batch derives from one registered Source and one declared SourceRevision; multiple evidence items from that source are allowed.
- Enforce idempotency and duplicate/conflict rules.
- Evaluate completeness against the source's ingestion profile.

A validation failure blocks publication of the affected revision unless a documented policy explicitly allows a warning-only condition.

### 3.6 Publisher

Publisher responsibilities:
- Write validated records/evidence/relations into a staging or versioned namespace.
- Ensure the entire required source revision becomes visible through one controlled readiness transition.
- Update the active/default revision pointer only after required stages succeed.
- Record publication metadata, record counts, checksums and stage outputs.
- Ensure failed or superseded batches are not returned by normal retrieval.

The Publisher must be idempotent. Repeating publication for the same validated run cannot duplicate canonical objects or expose mixed revisions.

### 3.7 Orchestrator

Orchestrator responsibilities:
- Accept authorized triggers and create a durable run request.
- Resolve immutable source revision and effective ingestion profile.
- Select compatible connector/extractor/processor/normalizer versions.
- Manage stage ordering, checkpoints, retries, timeout and cancellation.
- Track logs, counts, warnings and failures.
- Coordinate staging and publication.
- Prevent concurrent runs from corrupting or mixing revision state.
- Maintain freshness and last-successful revision metadata.

## 4. Boundary contracts between components

These are logical contract shapes; exact serialization and transport are implementation decisions.

| Contract | Produced by | Consumed by | Minimum content |
|---|---|---|---|
| SourceRegistration | Workspace/Source Management | Orchestrator, Connector | Source ID, scope, type, connector config ref, access mode, project scope |
| DiscoveryResult | Connector | Orchestrator | Candidate revision key, changed item/cursor, upstream metadata |
| SourceSnapshot | Connector | Extractor | Source ID, immutable revision ID/key, artifact refs, content hashes, capture manifest |
| ExtractionBatch | Extractor | Processor, Normalizer | Source snapshot ID, extractor/version, typed observations, native locators, diagnostics and coverage |
| ProcessedBatch | Processor | Normalizer | Input batch refs, processor/version, transformed outputs and parent lineage |
| CanonicalBatch | Normalizer | Validator | KnowledgeRecords, Evidence, candidate relations and producer provenance |
| ValidationReport | Validator | Orchestrator, Publisher | Accepted/rejected item counts, violations, warnings, completeness decision |
| PublicationManifest | Publisher | Search/index workers, Retrieval | Source revision, run ID, canonical record/evidence/relation counts and content hashes |
| IngestionRunReport | Orchestrator | Admin UI, audit/monitoring | Stage state, timing, checkpoints, retry count, warnings, terminal result |

Payloads may be streamed or stored by reference for large sources; the contract must still identify immutable inputs and versioned outputs.

## 5. Source ingestion profile

Each Source references a versioned IngestionProfile that declares policy for that source family.

Minimum logical settings:
- Connector type and compatible version range.
- Extractor selection and required version/capability.
- Optional processor chain and explicit order.
- Normalizer and accepted canonical contract/payload versions.
- Capture/revision strategy.
- Completeness thresholds and mandatory stages.
- Schedule/webhook/manual trigger policy.
- Retry/timeouts/rate limits.
- Source ACL mode and access policy reference.
- Retention and reprocessing policy.
- Publication requirements.

Profiles are configuration, not arbitrary executable code. Only trusted installed components may execute. Untrusted source content and connector-provided metadata are data, never instructions for the orchestrator or agent.

## 6. Immutable snapshot and revision semantics

1. Every run resolves to an immutable SourceRevision before extraction begins.
2. Mutable selectors are only discovery inputs:
   - Git branch/tag selector resolves to an exact commit SHA.
   - Document collection cursor resolves to an item version ID or captured content hash.
   - Database source resolves to an explicit schema snapshot/export and hash, not an assumed live database state.
3. Extractors consume only the captured snapshot/artifact set for that run.
4. If the source changes during fetch and a consistent snapshot cannot be guaranteed, the connector must fail/retry capture rather than publish a mixed snapshot.
5. A re-run against the same source revision with a different extractor/normalizer/payload schema version is a distinct processing result.
6. The Source active revision pointer is updated only after successful publication.

## 7. IngestionRun lifecycle

Proposed state machine:

queued
  -> authorizing
  -> resolving_revision
  -> capturing
  -> extracting
  -> processing
  -> normalizing
  -> validating
  -> staging
  -> publishing
  -> succeeded | succeeded_with_warnings

Any non-terminal stage may transition to:
  -> retry_wait -> previous safe checkpoint
  -> failed
  -> canceled
  -> superseded

Terminal state semantics:

| State | Meaning |
|---|---|
| succeeded | All required ingestion stages completed and canonical records/evidence/relations were published; structured retrieval is available. Search/vector projections have independent statuses. |
| succeeded_with_warnings | Canonical publication completed; optional extraction items/stages had permitted warnings under the source profile. Search/vector projection status remains independent. |
| failed | A required stage failed or validation/publication was rejected; no new revision becomes query-visible |
| canceled | Explicit cancellation completed safely; no partial publication is query-visible |
| superseded | A newer desired revision/pipeline run made this run obsolete before publication |

A record's claim verification state (verified, partial, unknown) is independent from the run terminal state. A run may succeed while containing some partial observations if the source profile allows them and reports the coverage. A failed run cannot be made successful by assigning low evidence quality.

Do not overload job state with source freshness or record confidence.

## 8. Idempotency, concurrency and checkpoints

### 8.1 Idempotency key

Proposed deterministic logical run key:

tenantId
+ workspaceId
+ sourceId
+ sourceRevisionKey/contentHash
+ connectorVersion
+ extractorVersionSet
+ processorVersionSet
+ normalizerVersion
+ envelopeContractVersion
+ payloadSchemaVersionSet
+ ingestionProfileVersion

The key identifies a logical processing result, not one execution attempt. An execution/run ID remains a separate opaque identifier.

Repeating the same logical run:
- Reuses completed immutable stage outputs when checksums and versions match.
- Resumes from a safe checkpoint after a transient failure.
- Does not duplicate canonical records/evidence/relations.
- Does not replace a previously published result with partial output.

A changed source revision or any processing/contract version that affects output creates a distinct logical run key.

### 8.2 Concurrency

- Serialize publication per Source and SourceRevision lineage.
- Multiple sources within one Workspace may ingest concurrently subject to quotas.
- Two runs for different revisions of the same Source may extract concurrently, but only the selected valid desired revision may update the active pointer.
- A slower older revision must not overwrite the pointer after a newer revision has been published.
- All worker messages include run ID, source ID, workspace ID and exact source revision ID; the worker validates them against persisted run metadata.
- Tenant/workspace quotas and connector-specific rate limits are enforced by the orchestrator.

### 8.3 Checkpoints and retry

- Retry transient network errors, throttling and temporary upstream failures with bounded backoff.
- Do not blindly retry permanent authentication, schema incompatibility, invalid ownership or malformed source errors.
- Persist a safe checkpoint only after a stage output is durably stored and content-hashed.
- A retry verifies the checkpoint's input revision and producer versions before reuse.
- A component crash must not make uncommitted staged data visible.

## 9. Validation and publication atomicity

Publication provides revision-level visibility, not record-by-record partial visibility.

Recommended logical pattern:
1. Store stage outputs in a run-scoped staging namespace.
2. Validate counts, hashes, schema, ownership and mandatory evidence.
3. Write canonical records/evidence/relations as a versioned batch.
4. Commit a canonical publication manifest for the complete SourceRevision.
5. Transition the SourceRevision to published/knowledge-ready and update its active pointer in one controlled transaction/compare-and-swap operation.
6. Retrieval may immediately use structured canonical queries against published records.
7. Enqueue full-text/vector projection work asynchronously; each projection publishes its own manifest/readiness state when complete.

If any required step fails before the ready transition:
- Keep the last successful revision available according to policy.
- Keep the failed run for diagnostics/audit.
- Ensure incomplete staging data is invisible to normal retrieval.
- Clean staging artifacts according to retention policy.

Do not delete the previous valid revision merely because a new run was attempted.

## 10. Freshness and source state

Track separate concepts:
- **Latest discovered revision:** newest upstream revision observed.
- **Latest captured revision:** immutable snapshot successfully captured.
- **Latest published revision:** newest SourceRevision with a committed canonical publication manifest.
- **Active/default revision:** revision selected by workspace/source policy for normal retrieval.
- **Last successful run:** latest run whose canonical publication succeeded.
- **Projection readiness:** separate per-projection state/version and the newest SourceRevision covered by that projection.

The latest discovered revision may be newer than the active/published revision. Expose this lag to operators rather than pretending the knowledge is current.

A Source can be active even when a recent ingestion failed; retrieval may continue using its previous valid published revision unless the source has been suspended/revoked.

## 11. Security and trust boundaries

- Connector secrets are retrieved by secret reference; they never enter stage payloads, logs or Context Packets.
- The platform, not the connector/extractor, assigns Tenant/Workspace/Project scope.
- A source's upstream ACL model is enforced according to its registered access mode.
- Workers receive least-privilege access to only the source snapshot and scope required for their run.
- Extracted documents, code comments, issue descriptions and metadata are untrusted data. They cannot instruct a worker or agent to change policy, reveal secrets or execute tools.
- A connector cannot expand its access by returning a new URL, repository or external source; new origins require source registration and approval.
- Logs record stage metadata and sanitized diagnostics, not arbitrary full document content or secrets.
- Every manual re-run, profile change, credential change and publication action is audited.

## 12. Error model and observability

Each diagnostic includes:
- Stable error code and stage.
- Transient/permanent classification.
- Source/sourceRevision/run IDs.
- Affected artifact/item count.
- Safe human-readable summary.
- Retryability and next action.
- Sanitized upstream status/reference.
- Producer version.

Minimum metrics:
- Ingestion duration by stage and source family.
- Source revision discovery-to-publication lag.
- Records/evidence/relations produced and rejected.
- Source snapshot size and bytes.
- Retry count and failure rate by error class.
- Extractor coverage and unsupported item count.
- Publication success/rollback count.
- Stale active revision age.

Do not make content quality, run state and freshness one ambiguous status field.

## 13. V1 implementation boundary

Recommended first end-to-end vertical slice:
- One registered Git Source in one Knowledge Workspace.
- One exact commit SHA captured by a Git Connector.
- Existing Roslyn or TypeScript indexer used as an Extractor through an adapter; do not rewrite the current indexers.
- One Normalizer maps only the accepted initial types: code.file, code.symbol, code.reference_observation, code.api_observation.
- Single-source Evidence only.
- Validator checks scope, revision, provenance, typed payload and no cross-workspace/project mismatch.
- Publisher stages and publishes one complete source revision.
- Read-only retrieval smoke proves two authorized clients can read the same published revision, and another Workspace cannot.

Document, Database and Business connectors can be added after the v1 contracts and first code vertical slice are stable.

## 14. Acceptance scenarios

1. A Git branch moves after discovery; the run continues against the captured SHA only.
2. A connector returns scope IDs inconsistent with the registered Source; the platform ignores/rejects them and does not publish.
3. An extractor outputs partial/unknown observations; verification state is preserved and completeness policy is applied.
4. A normalizer cannot resolve a reference target; it emits an observation, not a graph edge.
5. A processor fails after extraction; the run retries from a validated durable checkpoint without duplicate records.
6. A validator detects cross-workspace evidence or relation endpoints; the entire required revision is blocked from publication.
7. A publisher crashes before the ready transition; the previous valid revision remains queryable and new staging data remains invisible.
8. A publisher repeats the same manifest; no duplicate canonical records/evidence/relations are created.
9. Two runs for different revisions complete out of order; an older run cannot replace a newer active revision.
10. A permanent schema incompatibility is not retried indefinitely.
11. A revoked Source or Workspace prevents new ingestion and retrieval according to the revocation policy.
12. A completed run with permitted warnings is distinguishable from a failed run and exposes the exact warnings/coverage.

## 15. Accepted v1 ingestion decisions

The platform owner explicitly accepted the following decisions on 2026-11-12:

1. **IngestionRun identity:** one durable `IngestionRun` represents the requested ingestion work and owns its lifecycle, retry attempts and stage history. V1 does not introduce a separate first-class `IngestionRequest` entity. Individual attempts/stage executions may be recorded as child operational entries for diagnostics and recovery.
2. **Canonical publication vs search projections:** publishing canonical records, evidence and relations makes a SourceRevision knowledge-ready for structured retrieval. Full-text/vector projections have their own asynchronous lifecycle and statuses (`pending`, `building`, `ready`, `failed`, `stale`); their delay/failure does not roll back canonical publication. Retrieval capabilities must disclose which projections are ready and must never treat missing projection results as evidence that no knowledge exists.
3. **Atomicity unit:** publication is atomic for the entire SourceRevision. Large inputs may be written in chunks to staging, but no part is query-visible until the complete revision's publication manifest and readiness pointer are committed.
4. **V1 triggers:** support authorized manual triggers and webhooks. Scheduled ingestion is deferred until usage and operational needs justify it.
5. **Optional partial extraction:** an otherwise valid SourceRevision may publish with warnings when only optional items/stages are incomplete and the source's explicit completeness thresholds are met. The run must report omissions, counts and coverage.
6. **Required data/stage failure:** missing mandatory data, failed required stages, invalid ownership/provenance/schema, or a completeness threshold violation blocks publication of the new revision. The last successfully published revision remains available under source policy.

These decisions constrain the logical lifecycle but do not select a queue, database, search engine or deployment topology.

## 16. Remaining design details

1. Review and approve the proposed stage I/O, child attempt and retry/cancellation semantics in section 18 before runtime implementation.
2. Define projection-specific schema, freshness/version compatibility and retrieval behavior when a projection is pending, failed or stale.
3. Define the source-family metric vocabulary, thresholds and required/optional payload classification beyond the generic counters in section 18.
4. Define webhook authentication, replay protection, deduplication and authorization semantics.
5. Define large-revision staging and manifest commit protocol for the chosen storage technology.

These details must be resolved before runtime implementation. No vendor, queue or physical database schema is selected by this document.


## 17. Initial machine-readable schemas v1

Initial JSON Schema Draft 2020-12 artifacts:

- [IngestionProfile v1](../schemas/ingestion-profile-v1.schema.json)
- [IngestionRun v1](../schemas/ingestion-run-v1.schema.json)
- [IngestionStageInvocation v1](../schemas/ingestion-stage-invocation-v1.schema.json)
- [IngestionStageAttempt v1](../schemas/ingestion-stage-attempt-v1.schema.json)
- [SourceCaptureManifest v1](../schemas/source-capture-manifest-v1.schema.json)
- [ExtractionManifest v1](../schemas/extraction-manifest-v1.schema.json)
- [ProcessingManifest v1](../schemas/processing-manifest-v1.schema.json)
- [NormalizationManifest v1](../schemas/normalization-manifest-v1.schema.json)
- [ValidationReport v1](../schemas/validation-report-v1.schema.json)
- [PublicationManifest v1](../schemas/publication-manifest-v1.schema.json)

These schemas encode the accepted v1 lifecycle choices: one durable IngestionRun identity, manual/webhook triggers only, profile-controlled component versions and completeness policy, retryable stage history, and publication manifest scoped to one complete SourceRevision. They do not define a separate IngestionRequest entity.

### 17.1 Cross-field and lifecycle invariants

The Orchestrator/Validator/Publisher must additionally enforce:

1. Run scope and Source ownership are resolved from registered platform metadata; connector/extractor output cannot override Tenant/Workspace/Project.
2. The SourceRevision resolved for a run belongs to the same Source and Workspace as the run.
3. The run's IngestionProfile ID/version and every selected component version are immutable inputs to its logical idempotency key.
4. A retry reuses only durable stage outputs whose input revision, content hash and producer versions match exactly.
5. Permanent authorization, ownership, schema or provenance errors are not retried as transient failures.
6. `succeeded` and `succeeded_with_warnings` require a committed PublicationManifest for the complete SourceRevision; structured retrieval becomes available only after that commit.
7. A failed/canceled/superseded run cannot publish a partial manifest or advance the active Source pointer.
8. Publication is atomic for the entire SourceRevision; chunked staging remains invisible until manifest/readiness commit.
9. Full-text/vector projection jobs are asynchronous and have independent readiness; their failure does not roll back canonical publication.
10. Optional omissions can produce warnings only when the profile permits them and explicit completeness thresholds pass.
11. A newer desired revision cannot be overwritten by an older run completing later; active-pointer changes require a concurrency-safe generation/CAS check.
12. Webhook authentication, signature validation and replay protection are enforced before creating/advancing a run; raw secrets never enter run records.

### 17.2 Deliberately not frozen

- Queue/broker, worker runtime and scheduling technology.
- Exact webhook signature scheme and replay-window storage.
- Physical chunking format, artifact retention and large-revision staging manifest implementation.
- Completeness metric vocabulary and per-source thresholds beyond the generic manifest counters.
- Projection rebuild orchestration, incremental update/delete protocol and schema/model version migration tooling.
- Storage-specific transaction/compare-and-swap implementation.

The schemas are logical contracts and do not authorize a runtime or deployment choice.


## 21. Proposed large-SourceRevision staging and commit protocol

> **Status:** Storage-independent logical protocol proposal; physical transaction, object-store and partition implementation remain for the Storage/Technology ADR.
> **Invariant:** Chunking is an implementation detail. The publication unit remains the complete SourceRevision.

### 21.1 Revision staging namespace

Every ingestion Run writes into an isolated, non-queryable staging namespace scoped by the immutable tuple:

`Tenant + Workspace + Source + SourceRevision + IngestionRun + pipeline fingerprint`.

A staging namespace is never addressable through normal Retrieval. It is not a temporary alias for the active revision.

Large inputs may be processed as deterministic chunks/partitions. Each chunk output is immutable and records:

- stable chunk/partition ID and deterministic ordering key;
- exact Run, SourceRevision, stage invocation and input fingerprint;
- input item range or source-native item-key boundaries;
- output artifact references, content hashes, byte lengths and item counts;
- producer component type/version and output contract version;
- completion state and any bounded diagnostics.

Chunk identity must be derived from stable input identity and the pinned pipeline definition, not from worker arrival order. Repeating the same chunk with the same input fingerprint and output hash is idempotent. Reusing the same chunk identity with different input/output hashes is an integrity conflict and blocks publication.

### 21.2 Revision staging manifest

After all expected chunks are complete, the orchestrator assembles an immutable revision staging manifest that contains:

- exact Tenant/Workspace/Source/SourceRevision and IngestionRun identity;
- capture, extraction, processing and normalization manifest references/hashes;
- the complete ordered set of required chunk/partition manifest IDs and hashes;
- expected, completed, excluded-by-policy and failed item counts by declared unit;
- aggregate artifact byte/item counts and a deterministic root content hash;
- completeness metric evaluations and explicit omission classifications;
- pinned pipeline/profile/component versions.

The manifest is complete only when every required partition is present exactly once, every referenced artifact is durable and hash-verified, all aggregate counts reconcile, and all required completeness rules pass. Optional omissions remain explicit; they are never represented as missing partitions.

### 21.3 Validation and publication barrier

1. Validator reads the immutable staging manifest and its referenced artifacts by streaming or bounded batches; it does not require the entire revision in memory.
2. Validator confirms scope/revision lineage, chunk-set completeness, unique partition identities, content hashes, payload schemas, Evidence locators, count reconciliation and source-profile completeness.
3. Validator emits one ValidationReport bound to the exact staging/NormalizationManifest IDs and hashes.
4. Publisher accepts only a publication-eligible ValidationReport and its exact NormalizationManifest/staging lineage.
5. Publisher commits one PublicationManifest for the entire SourceRevision. The PublicationManifest references the complete input manifests and aggregate root hash; no per-chunk artifact is independently query-visible.
6. A concurrency-safe commit transition publishes the manifest and advances the canonical readiness/active-revision pointer only if the Run still owns the desired revision generation.

The commit transition is the sole visibility barrier. Before it, the entire staged revision is invisible. After it, the entire revision is available to structured Retrieval. Search projections begin independently from the committed PublicationManifest.

### 21.4 Recovery, retries and cleanup

- A worker may resume only a chunk whose input fingerprint, source revision, component version and checkpoint hash match exactly.
- Completed chunks are immutable; retries do not rewrite them in place.
- Missing or corrupt chunks are rebuilt under a new attempt and verified before the final manifest is assembled.
- A conflicting duplicate chunk, changed source snapshot, changed profile/component version or incomplete required partition set invalidates the current staging attempt and blocks publication.
- If the process crashes before the commit barrier, the previous published revision remains active and the incomplete staging namespace remains non-queryable.
- If the commit succeeds but acknowledgement is lost, retry resolves the same commit identity and returns the already committed PublicationManifest; it must not publish a second generation.
- Orphaned staging artifacts are cleaned only after a policy-defined safety/retention interval and after confirming that no committed manifest references them.
- A newer desired SourceRevision prevents an older Run from advancing the active pointer even if the older Run finishes later.

### 21.5 Physical storage decisions deliberately deferred

The protocol does not choose:
- object-store multipart upload, database staging tables or filesystem layout;
- chunk size, partitioning strategy or parallelism limits;
- whether manifest artifacts use a flat list, tree or Merkle structure;
- transaction/outbox/CAS implementation across the canonical metadata store and artifact store;
- exact orphan cleanup and staging retention durations.

Those choices must preserve the logical visibility barrier and be benchmarked against very large revisions, partial worker failure, concurrent revisions and storage outages.

## 20. Proposed webhook authentication and replay protection

> **Status:** Security baseline proposal for review; provider-specific signature formats and deployment controls remain open.
> **Boundary:** A webhook is an untrusted notification that may request source discovery. It is not an authorization grant and is not the source of truth for ownership, profile selection or source revision.

### 20.1 Trust and authorization sequence

The ingress path must execute in this order:

1. Resolve the webhook endpoint to a pre-registered webhook configuration and Source. Do not derive Tenant/Workspace/Project ownership from request body fields.
2. Enforce transport, request-size and rate limits before expensive processing.
3. Read the exact raw request body and required signature/timestamp/key-id headers.
4. Verify the provider-specific signature over the exact bytes and signed metadata; use constant-time comparison and an active/previous key set during rotation.
5. Enforce timestamp freshness within a configured replay window. Reject missing, malformed or out-of-window timestamps when the provider's scheme supports signed timestamps.
6. Validate provider identity, event type allowlist and minimal payload schema. Treat every payload field as untrusted.
7. Resolve the registered Source and authorize that source's webhook trigger policy, current state and effective Workspace policy.
8. Atomically claim the delivery identity in a durable deduplication ledger. A duplicate delivery with the same body hash is acknowledged without creating another Run; reuse of the same delivery identity with a different body hash is rejected and audited as suspicious.
9. Persist the accepted receipt and create or enqueue the single durable IngestionRun using the registered Source and pinned IngestionProfile. The connector, not the webhook body, resolves the immutable SourceRevision.
10. Return an acknowledgement only after the receipt and run/enqueue intent are durably recorded. Processing then continues asynchronously.

Authentication must complete before an event can create or advance an IngestionRun. A valid signature alone does not authorize a Source or Workspace action.

### 20.2 Signature and secret handling

- Use a provider-specific verifier adapter. A generic HMAC-SHA-256 over the exact raw body plus a signed timestamp is the preferred baseline where the provider supports it; do not assume all providers use the same header or canonicalization format.
- Support key identifiers or equivalent rotation metadata where available. Keep a bounded overlap between active and previous secrets during rotation.
- Store only secret references in webhook configuration. Resolve secret bytes through the platform secret manager at verification time.
- Never log signature headers, secret material, access tokens or complete sensitive webhook bodies. Record safe provider/event identifiers, verification outcome and a sanitized diagnostic code.
- Do not accept unsigned query-string secrets as the sole authentication mechanism.
- Enforce TLS at the public ingress boundary; reject unsupported content types and oversized bodies before parsing.

### 20.3 Replay and duplicate-delivery semantics

A delivery identity is scoped by the registered webhook configuration/provider and must be stable for the provider's retry semantics (for example, a provider delivery ID). The durable deduplication record stores:

- webhook configuration ID and registered Source ID;
- provider delivery/event ID and event type;
- signed timestamp or provider event creation time, when available;
- raw body content hash (not necessarily the body itself);
- verification/authorization result and receipt time;
- associated IngestionRun ID when accepted.

The deduplication claim must be atomic under concurrent duplicate deliveries. Retain the identity for at least the provider retry/replay horizon plus the configured security margin; exact duration is a deployment/security policy decision. If the provider supplies no stable delivery ID, use a documented provider-specific event identity/fingerprint and treat it as a weaker guarantee.

A replayed or duplicate delivery must not create a second IngestionRun. A legitimate later event that points to the same SourceRevision may be deduplicated by the Run idempotency key after the provider delivery itself is authenticated and recorded.

### 20.4 Payload and source-revision rules

- The endpoint is bound to one registered Source or an explicitly allowlisted set of Sources; payload cannot choose another Tenant, Workspace, Project, Source, connector, secret reference or IngestionProfile.
- Event type and changed-item hints may narrow discovery work but cannot assert that a revision is complete or publishable.
- The Connector resolves the exact immutable SourceRevision and captures a consistent snapshot. A branch name, URL, mutable cursor or revision string from the webhook is only an input hint until the Connector validates it.
- Webhook URLs, callback URLs and arbitrary fetch targets in payloads must never be fetched by the Orchestrator. Any upstream access occurs through the configured Connector with its own allowlist and egress policy.
- Invalid, unauthorized, stale or conflicting events are rejected without creating an IngestionRun; safe audit metadata may be retained according to policy.

### 20.5 Operational and acceptance requirements

- Per-webhook and per-source rate limits, body-size limits, concurrency limits and bounded acknowledgement deadlines.
- Metrics for signature failures, stale timestamps, duplicate deliveries, conflicting delivery IDs, authorization denials, queue/dispatch delay and accepted events.
- Alert on repeated signature failures, delivery-ID/body-hash conflicts and abnormal event volume.
- Test valid delivery, invalid signature, altered body, stale timestamp, unknown key ID, key rotation overlap, concurrent duplicate deliveries, same ID/different body, unauthorized Source, disabled Source, malformed payload and downstream enqueue failure.
- If durable receipt succeeds but Run dispatch fails, a recoverable outbox/dispatch state must ensure the accepted event is eventually enqueued without creating duplicate Runs. The physical outbox/transaction mechanism is deferred to the storage ADR.

A durable webhook receipt/deduplication ledger is an ingress-security record, not a separate first-class IngestionRequest. The accepted v1 aggregate remains one IngestionRun per logical ingestion work.

## 19. Proposed source-family completeness metric vocabulary

> **Status:** Proposed vocabulary for review; no source-family thresholds or payload requirements are approved by this section.
> **Purpose:** make partial extraction measurable without confusing output volume, source freshness, evidence quality or ingestion success.

### 19.1 Metric record semantics

A completeness metric is a named, versioned measurement over an explicitly defined population. Its stable name identifies the numerator and denominator meaning; the profile pins which metrics are required and the applicable threshold.

Every evaluated metric must satisfy these rules:

1. Numerator and denominator count the same unit and population. Do not divide extracted files by discovered symbols, or accepted records by source bytes.
2. The denominator must be derived from a documented population source: an authoritative connector enumeration, a deterministic structural count, or an explicitly declared estimate.
3. Required publication gates must use exact/authoritative or deterministic denominators. Estimated denominators may be diagnostic only unless a reviewed source-family policy explicitly permits them.
4. Report unsupported, excluded, failed and intentionally skipped items separately. Unsupported content is not silently removed from the denominator.
5. A zero-item source is not represented as a fabricated 100% ratio. It requires an explicit empty-source policy and a separate minimum-item/empty-allowed decision. A required metric with no evaluable denominator is indeterminate and cannot silently pass.
6. Ratios are bounded to [0, 1], counts are non-negative integers, and the evaluated numerator cannot exceed its denominator unless the metric definition explicitly uses a different unit.
7. Completeness is distinct from correctness/verification confidence. A 100% extraction ratio does not prove that extracted claims are correct.
8. Metric definitions and denominator rules are versioned. Changing the population definition or numerator semantics requires a metric definition version change and profile review.

### 19.2 Common metric families

| Stable metric name | Numerator / denominator | Typical stage | Meaning |
|---|---|---|---|
| `capture.items` | captured eligible source items / enumerated eligible source items | Connector | Whether all expected source items were captured |
| `capture.bytes` | captured bytes / expected bytes | Connector | Byte-level capture completeness when the source provides an authoritative expected size |
| `extract.items_supported` | successfully extracted supported items / captured items eligible for this extractor | Extractor | Coverage of supported input items |
| `extract.observations` | emitted observations / expected observations | Extractor | Use only when the source can provide a deterministic expected observation population |
| `normalize.items` | source observations mapped to canonical records or explicitly classified observations / normalizable observations | Normalizer | Whether normalizable observations were accounted for |
| `validate.records_accepted` | accepted canonical records / normalized candidate records | Validator | Acceptance ratio after schema and semantic validation |
| `validate.evidence_coverage` | accepted records with at least one valid Evidence / accepted records requiring Evidence | Validator | Evidence attachment coverage |
| `validate.relations_resolved` | resolved, evidence-backed relations / resolvable relation candidates | Validator | Relationship resolution coverage; normally diagnostic unless the source profile requires it |

These names are a shared vocabulary, not a universal requirement that every source family emits every metric. A profile must select only metrics whose populations can be measured reliably.

### 19.3 Source-family metric profiles

| Source family | Candidate required metrics | Candidate diagnostic metrics | Denominator guidance |
|---|---|---|---|
| Git repository/code | `capture.items`, `extract.items_supported`, `validate.evidence_coverage` | unsupported file count, parse failures by language, symbol/reference counts | Use the captured tree/file manifest as the item population; distinguish excluded files by explicit policy from failed capture |
| Document collection | `capture.items`, `extract.items_supported`, `validate.evidence_coverage` | pages/sections parsed, OCR use/failures, unsupported format count, empty document count | Use the connector's enumerated document/version manifest; page count is a separate unit from document count |
| Database metadata | `capture.items`, `extract.items_supported`, `validate.evidence_coverage` | tables/views/columns/constraints parsed, unsupported object types, permission-denied objects | Use an authoritative schema catalog/export snapshot and report permission-filtered objects separately |
| Git history / issue tracker | `capture.items` | commits/PRs/issues captured, comments/attachments omitted, rate-limit truncation | Use the exact bounded time/cursor/revision window and record pagination completion |
| Business knowledge | Profile-specific; require explicit enumerated source scope and evidence coverage | documents/sections/terms/rules parsed, unresolved references | Do not claim completeness without a source-owned inventory or a declared bounded collection |

A metric may be required for one source profile and diagnostic for another. The profile must also classify source item types as mandatory, optional, excluded-by-policy or unsupported. Mandatory items cannot be converted into optional warnings by an extractor response.

### 19.4 Publication decision rules

- A missing mandatory item, incomplete authoritative enumeration, capture inconsistency or failed required stage blocks publication regardless of aggregate ratio.
- Optional omissions may produce `passed_with_warnings` only when every required metric passes, every omitted item is classified and reported, and the pinned profile allows that warning category.
- An unsupported item can be optional only when the source profile explicitly classifies its type as optional/excluded; the extractor cannot self-declare mandatory data optional.
- A high aggregate ratio must never compensate for a failed mandatory item class or a missing required stage.
- Empty-source publication is allowed only when the profile explicitly allows empty revisions and the connector proves the source enumeration completed successfully with zero eligible items.
- Source freshness, retrieval projection readiness and record verification confidence remain separate dimensions; they are not folded into completeness ratios.

### 19.5 Current schema gap and follow-up

The initial IngestionProfile v1 and ValidationReport v1 schemas carry required metric names, aggregate minimum coverage and numerator/denominator/ratio/pass values. They do not yet encode per-metric thresholds, denominator provenance/quality, item-class mandatory status or an explicit indeterminate/empty-population result.

Before finalizing machine-readable source-family profiles, review whether v1 should add:
- per-metric policy entries (required/optional, minimum ratio and optional minimum count);
- denominator basis/quality and population description;
- source item-class disposition (mandatory, optional, excluded-by-policy, unsupported);
- explicit empty-source permission and an indeterminate evaluation state.

Do not silently reinterpret existing v1 fields to carry these additional semantics. Any schema change must preserve current fixtures/consumers or use an explicit contract versioning decision.

## 18. Proposed Stage I/O, attempt, checkpoint and retry contracts v1

> **Status:** Machine-readable design draft added on 2026-11-12; detailed stage semantics are proposed for review and are not yet marked user-approved.  
> **Boundary:** Logical contracts only. No worker, queue, API, database table or vendor-specific implementation is introduced.

### 18.1 Stage graph and invocation boundary

The component execution graph is:

```text
Connector.Capture
       |
       v
Extractor.Extract
       |
       v
Processor.Process (zero or more, ordered by profile)
       |
       v
Normalizer.Normalize
       |
       v
Validator.Validate
       |
       v
Publisher.Publish
       |
       v
PublicationManifest (canonical revision ready)
       |
       +----> asynchronous Search Projection jobs (outside this stage chain)
```

Orchestrator states `authorizing` and `resolving_revision` are preflight/control-plane transitions, not component stage invocations. A stage invocation is created only after the platform has resolved the registered Source, trusted Workspace scope, effective profile version and exact immutable SourceRevision selector. The connector then captures the already resolved revision; it cannot replace it with a different branch head or source.

The `IngestionRun` remains the aggregate root. `IngestionStageInvocation` is the immutable instruction/input contract for one component attempt. `IngestionStageAttempt` is the child operational record for that attempt and records its state, diagnostics and durable output checkpoint. Each Run `stageEvents[]` summary may reference the child record through `stageAttemptId`; the Run does not duplicate the complete attempt payload.

### 18.2 Common input and output envelope

Every component receives an `IngestionStageInvocation` containing:

- `runId`, `invocationId`, trusted Tenant/Workspace/Project scope, registered `sourceId` and exact `sourceRevisionId/revisionKind/revisionKey`.
- The pinned IngestionProfile ID/version and selected component type/version. Processor invocations also include their zero-based profile order.
- Immutable input artifact references (zero for a capture stage that reads the registered Source directly), each with artifact ID, role, opaque storage reference, media type, content hash and byte length.
- `inputFingerprint`, `idempotencyKey`, expected output contract and deadline.
- An optional prior checkpoint reference only when resuming the same logical stage work.

The expected output contract is discriminator-bound to the stage; e.g. an extractor invocation cannot declare a Publisher manifest output. Component configuration is resolved from the trusted profile/secret broker. Secret values, tokens and credentials never appear in invocation, attempt, manifest or diagnostic payloads.

A successful attempt produces a stage-specific immutable manifest (or the existing PublicationManifest for Publisher) and records its reference/content hash in `IngestionStageAttempt`. Failed, retry-waiting, skipped or canceled attempts do not expose an output manifest/checkpoint; any partial artifacts remain uncommitted and invisible. Large content stays in artifacts; manifests carry bounded metadata and references rather than embedding source/document/code bodies.

### 18.3 Stage input/output contracts

| Stage | Required input | Output contract | Required behavior |
|---|---|---|---|
| Connector.Capture | Trusted Source registration/profile, resolved SourceRevision, approved connector configuration reference | [SourceCaptureManifest](../schemas/source-capture-manifest-v1.schema.json) | Capture a consistent immutable snapshot; report exact revision key, content hash, artifact refs and consistency strategy. No Tenant/Workspace assignment from connector data. |
| Extractor.Extract | SourceCaptureManifest and its immutable captured artifacts | [ExtractionManifest](../schemas/extraction-manifest-v1.schema.json) | Emit source-native observations as artifacts; report observation counts, unsupported counts, coverage metrics and omission report. Preserve source locators and evidence quality. |
| Processor.Process | ExtractionManifest or immediately preceding ProcessingManifest plus its artifacts | [ProcessingManifest](../schemas/processing-manifest-v1.schema.json) | Optional ordered transform; every output artifact declares parent artifact IDs; preserve source revision and parent lineage. |
| Normalizer.Normalize | ExtractionManifest plus zero or more ordered ProcessingManifests selected by the orchestrator | [NormalizationManifest](../schemas/normalization-manifest-v1.schema.json) | Emit canonical KnowledgeRecord, Evidence and only already-resolved/evidence-backed KnowledgeRelation artifacts; report payload versions, counts, unsupported and omitted observations. |
| Validator.Validate | NormalizationManifest, referenced canonical staging artifacts and trusted Source/Project/SourceRevision/ACL metadata | [ValidationReport](../schemas/validation-report-v1.schema.json) | Validate schemas, ownership, source revision, evidence, identity, relation endpoints, counts and profile completeness. Do not mutate normalized artifacts. |
| Publisher.Publish | Publication-eligible ValidationReport and its exact NormalizationManifest/staging artifacts | [PublicationManifest](../schemas/publication-manifest-v1.schema.json) | Publish the complete SourceRevision atomically; the manifest records both input manifest IDs/hashes, eligible validation outcome and published counts. Update readiness/active pointer only through the concurrency-safe publication transition. |

The Publisher is not permitted to accept a blocked ValidationReport or reconstruct missing normalized data. A `passed_with_warnings` report may publish only when every required metric passes and every warning is permitted by the pinned IngestionProfile. A run becomes `succeeded` or `succeeded_with_warnings` only after the PublicationManifest and ready-state transition commit.

### 18.4 Manifest lineage and artifact rules

All stage manifests carry the same `runId`, Tenant/Workspace/Project scope, `sourceId` and `sourceRevisionId`. The SourceCaptureManifest carries the full resolved revision identity and capture content hash. Every downstream manifest must reference its input manifest IDs and content hashes; the PublicationManifest explicitly records the NormalizationManifest and ValidationReport references/hashes. All artifacts remain tied to that same source revision.

Artifact references are immutable and include:

- A platform artifact ID and opaque storage reference.
- Media type, content hash and byte length.
- A role/type that identifies the artifact's contract (snapshot, observations, processed observations, KnowledgeRecord, Evidence or Relation set).

The artifact storage reference is not a public URL or authorization grant. Artifact access is checked against the owning Workspace/Source ACL at read time. Hash and byte length are verified before a checkpoint can be reused. Raw snapshots and unsupported source rows remain preserved according to the source/retention policy; omission reports make unsupported or dropped content explicit.

### 18.5 Child attempt and checkpoint semantics

- Each component execution has a unique `attemptId` and `invocationId`. `attemptNumber` is stage-local and increases only when that same logical stage work is retried. The Run's `attemptCount/retryCount` remain aggregate summary counters.
- Attempt states are `started`, `succeeded`, `succeeded_with_warnings`, `failed`, `retry_wait`, `skipped` or `canceled`. A terminal failed attempt is retained; a retry creates a new child attempt rather than rewriting the prior attempt's history.
- A checkpoint is committed only after the output manifest and every referenced artifact have been durably stored, content-hashed and verified. A successful attempt must reference both its output manifest and checkpoint.
- Checkpoint reuse requires the same `runId`, SourceRevision, profile version, component type/version, stage, processor ordinal (when relevant) and `inputFingerprint`. A mismatch invalidates that checkpoint and all downstream outputs that depend on it.
- The stage idempotency key is derived from the logical Run key, stage, component/version, ordered input content hashes, profile version and processor ordinal. Attempt number is deliberately excluded so a retry represents the same logical work; `attemptId` remains unique.
- A crash before checkpoint commit leaves output artifacts uncommitted and invisible; they are not a safe resume point and may be cleaned under retention policy.

### 18.6 Retry, optional processor, cancellation and supersession

**Retry classification**

| Class | Examples | Behavior |
|---|---|---|
| Transient | Network interruption, rate limiting, temporary upstream/storage unavailability, worker interruption, safely repeatable timeout | Retry with bounded backoff, respecting profile `maxAttempts` and `maxBackoffSeconds`; reuse only a verified matching checkpoint |
| Permanent | Authentication/authorization denial, Workspace ownership mismatch, wrong SourceRevision, inconsistent snapshot, unsupported/invalid schema, invalid provenance/identity, required completeness failure, policy denial | Do not retry automatically; require corrected credentials/configuration/source or a new Run |
| Not applicable | Explicit cancellation, skipped optional stage, superseded Run | Do not schedule retry |

A timeout is transient only when repeating the stage is safe under the same idempotency key. Every retry stores a diagnostic with stable code, category, transient/permanent classification, retryable flag and sanitized summary. Never persist secrets, raw tokens or arbitrary source content in diagnostics.

**Optional Processor**

- If no Processor is configured, the orchestrator records `skipped/not_configured` in the Run summary and does not create a worker invocation.
- A configured Processor with `required: true` blocks publication after permanent failure or exhausted retries.
- A configured Processor with `required: false` may be skipped after failure only when the profile permits optional warnings, all required completeness thresholds pass, and the Normalizer contract declares it can consume the upstream input without that Processor. Otherwise the failure is effectively required and blocks publication.
- A skipped Processor must be visible in Run diagnostics and coverage/omission reporting. It cannot silently pass through as if it succeeded.

**Cancellation and supersession**

- Cancellation stops new stage invocations and requests cooperative cancellation of active work. Uncheckpointed artifacts remain invisible.
- Cancellation and Publisher commit must be serialized: if publication committed first, the Run is successful; if cancellation wins before commit, no new active pointer is advanced.
- A superseded Run may finish non-publishing work for diagnostics, but the Publisher must reject an outdated desired-revision generation. An older SourceRevision must never replace a newer active pointer.
- Failed, canceled or superseded Runs cannot create a published partial-revision manifest.

### 18.7 Cross-stage invariants and validation

The CI schema/semantic tests now cover the following design invariants:

1. Stage name and expected output contract must match.
2. A successful attempt has an output manifest and durable checkpoint; checkpoint input fingerprint, manifest ID and output hash match the attempt.
3. `retry_wait` requires at least one transient retryable diagnostic; permanent errors cannot be flagged retryable.
4. Every capture/extraction/processing/normalization/validation manifest has matching Run, Workspace, Source and SourceRevision lineage.
5. Extraction aggregate observation count equals the artifact counts; coverage ratios reconcile with numerator/denominator.
6. Processor output artifacts declare parent artifact IDs and `lineagePreserved: true`.
7. Normalization aggregate record/evidence/relation counts reconcile with their artifact counts and payload counts.
8. Validation accepted + rejected counts reconcile to the NormalizationManifest; completeness pass flags reconcile to configured minimum ratios.
9. A blocked ValidationReport is never publication-eligible. `passed_with_warnings` requires warnings only and passing required completeness metrics.
10. Run stage summaries can reference child StageAttempt records without creating a separate IngestionRequest entity.
11. A published PublicationManifest references the exact NormalizationManifest and an eligible ValidationReport; published record/evidence/relation counts equal the Validator's accepted counts.

These tests validate contract behavior; runtime authorization, storage durability, hash verification, atomic publication and cancellation races still require integration tests in a later implementation phase.

### 18.8 Remaining decisions

The schemas intentionally leave these items open:

- Per-source metric vocabulary, required/optional item classification and how an extractor estimates the denominator.
- Webhook signature scheme, replay store and event deduplication.
- Exact artifact chunking, retention and manifest commit protocol for the selected storage technology.
- Projection queue/build orchestration, incremental update/delete protocol and reindex/compaction operations; logical schemas and per-revision Retrieval readiness are defined in [Search Projection Lifecycle](projection-lifecycle.md).
- Whether and how multiple Processor outputs may branch instead of remaining a strictly ordered chain.

No queue, orchestration engine, storage vendor, REST route or worker deployment is selected by this stage-contract draft.
