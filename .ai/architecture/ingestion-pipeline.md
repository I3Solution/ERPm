# Connector, Extractor, Normalizer and Ingestion Lifecycle — Proposed v1

> **Status:** Draft for architecture review  
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

Search projection building may execute as a post-publication stage or as a required pre-publication stage according to source policy. A revision must not be marked query-ready until every stage declared mandatory by that source's ingestion profile is complete.

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
| succeeded | All required stages completed; revision was published and is query-ready under the configured profile |
| succeeded_with_warnings | Required stages completed and published; optional items/stages had explicitly permitted warnings, all reported |
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
4. Build mandatory retrieval projections or mark them as a required follow-up stage.
5. Commit a publication manifest for the complete revision.
6. Transition the SourceRevision to ready and update its active pointer in one controlled transaction/compare-and-swap operation.
7. Retrieval reads only published/ready revisions.

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
- **Latest published revision:** newest fully query-ready revision.
- **Active/default revision:** revision selected by workspace/source policy for normal retrieval.
- **Last successful run:** latest successful processing run and pipeline version set.

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

## 15. Decisions to review

1. Is the proposed Connector / Extractor / optional Processor / Normalizer / Validator / Publisher / Orchestrator separation accepted?
2. Should IngestionRun itself represent the durable requested job plus execution, or should v1 distinguish a durable IngestionRequest from one or more execution attempts?
3. Should search/vector projection be a mandatory pre-publication stage for the first vertical slice, or can canonical structured retrieval be ready first with search projections following?
4. Should v1 publication atomicity be per SourceRevision, as proposed, or is a smaller independently visible unit required for very large sources?
5. Which trigger types are required in the first slice: manual only, webhook, or schedule as well?
6. What is the acceptable policy for a source revision with optional but incomplete extraction: publish with warnings or keep the previous active revision?

Until reviewed, these are proposals rather than implementation requirements. No vendor, queue, database or deployment technology is selected by this document.
