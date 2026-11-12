# Search Projection Lifecycle v1

> **Status:** Proposed logical contract; it extends the accepted decision that canonical publication and search projection readiness are independent.
> **Date:** 2026-11-12
> **Depends on:** Workspace Boundary, Canonical Knowledge Contract, Ingestion Pipeline, Retrieval Contract and Storage Boundary.
> **Scope:** Full-text and vector projection profiles, build lifecycle, immutable manifests, per-SourceRevision readiness and Retrieval behavior.
> **Out of scope:** Search vendor, vector database, physical index naming, queue, worker deployment and model/provider selection.

## 1. Purpose

Canonical Knowledge is the source of truth. Full-text and vector indexes are derived, rebuildable projections. This contract defines when a projection is eligible for Retrieval, how its inputs and versions are identified, and how failed or stale builds are exposed without changing canonical publication.

The logical projection kinds in v1 are:

- `full_text`: lexical search, exact text/identifier matching, analyzer and field mapping.
- `vector`: embedding/ANN search over explicitly selected canonical content.

They are separate logical adapters and have independent profiles, manifests, versions and readiness. They may share a physical search engine only after a benchmark proves that isolation, filtering, versioning and operational requirements are met.

## 2. Core invariants

1. A ProjectionRun may start only from a committed PublicationManifest for the exact SourceRevision. Staging or failed canonical revisions are never projection inputs.
2. Projection builds never write or mutate KnowledgeRecord, Evidence, KnowledgeRelation, SourceRevision or PublicationManifest.
3. A projection is query-eligible only when a committed ProjectionManifest matches the selected Tenant/Workspace/Source/SourceRevision, PublicationManifest, ProjectionProfile version and definition fingerprint.
4. Full-text and vector readiness are independent. A ready full-text projection does not imply vector readiness, and vice versa.
5. Projection failure, delay or rebuild never rolls back canonical publication or disables structured retrieval.
6. Projection output is immutable and versioned. Rebuild creates a new manifest/generation; it does not rewrite a prior manifest.
7. A projection candidate is filtered by Workspace/Project/Source ACL and exact published SourceRevision before any hit, count, snippet or identifier is exposed.
8. A projection for an older SourceRevision or different profile/model/analyzer definition is never silently used as though it were current.
9. A previous ready manifest may be retained for audit/recovery, but it is not eligible when the desired revision/profile fingerprint differs.
10. Search/vector results resolve back to canonical record IDs and authorized Evidence; projections are candidate generators, not a new evidence authority.

## 3. ProjectionProfile

A ProjectionProfile is immutable by `profileId + version`. A version change creates a new desired definition and requires a new projection build; it never mutates a previously published ProjectionManifest.

The profile declares:

- `projectionKind`: `full_text` or `vector`.
- Builder component type/version and expected output contract.
- Canonical contract version and supported payload types/versions.
- An immutable configuration reference, configuration fingerprint and configuration contract.
- Build policy: max attempts, minimum indexed ratio, whether skipped items are permitted and full vs incremental rebuild mode.
- A definition fingerprint covering every input that can change query semantics.

The fingerprint must cover, as applicable:

- Canonical and payload schema versions.
- Builder implementation/version and source-field mapping.
- For full-text: indexed fields, analyzer/tokenizer/stemming/language configuration, exact identifier handling and normalization rules.
- For vector: exact embedding provider/model revision (not a mutable `latest` alias), dimensions, normalization/distance contract, text assembly/chunking strategy and truncation rules.
- Any deterministic preprocessing, redaction or filtering rules that affect indexed content.

Secret values and credentials never appear in a profile or fingerprint input document. Profiles carry approved configuration references and non-secret fingerprints only. A builder must reject a missing or changed pinned configuration rather than quietly resolving a mutable default.

## 4. ProjectionRun and idempotency

ProjectionRun is a separate operational aggregate from IngestionRun. Canonical ingestion can finish successfully while one or both projection runs remain queued/building/failed. Projection retries do not reopen the IngestionRun.

One logical ProjectionRun is scoped to:

```text
Tenant + Workspace + Source + SourceRevision
+ PublicationManifest ID/content hash
+ ProjectionKind
+ ProjectionProfile ID/version/definition fingerprint
+ Builder type/version
```

The idempotency key is a deterministic hash of that tuple. A repeated request with the same key reuses a completed compatible manifest or resumes safe build work; it does not create duplicate visible projection generations. A changed source publication, profile definition, model/analyzer or builder version creates a distinct logical build.

ProjectionRun states:

| State | Meaning |
|---|---|
| `queued` | Build requested; no builder is currently working |
| `building` | Builder is executing against the pinned PublicationManifest |
| `succeeded` | A complete ProjectionManifest is committed and status may become ready |
| `failed` | Build is terminally unsuccessful; canonical publication remains usable |
| `canceled` | Build stopped by an authorized cancellation |
| `superseded` | A newer desired profile/build generation made this run obsolete |

Transient storage/network/worker errors may retry within the profile limit. Invalid profile/configuration, unsupported payload version, unavailable pinned model, revision mismatch, ownership mismatch or integrity failure are permanent until corrected. Attempt count and diagnostics belong to ProjectionRun; detailed builder-attempt records can be introduced later if operational requirements justify them.

## 5. ProjectionManifest and atomic readiness

A successful builder emits an immutable ProjectionManifest containing:

- The exact PublicationManifest ID and content hash used as input.
- Scope, Source and SourceRevision.
- ProjectionKind, ProjectionProfile ID/version/fingerprint and builder version.
- Projection version/generation.
- Output artifact references, hashes, byte lengths and item counts.
- Source/eligible/indexed/skipped/failed counts and an aggregate content hash.

The manifest has state `ready` only after all output artifacts are durable and verified. The semantic invariant is:

```text
indexedItems + skippedItems + failedItems = eligibleItems
sum(outputArtifacts.itemCount) = indexedItems
indexedItems / eligibleItems >= profile.minimumIndexedRatio
```

The ratio check is applied when `eligibleItems > 0`. A profile that disallows skipped items rejects any non-zero skipped count. Empty eligible input can publish an empty but valid projection generation only when the source selection and completeness policy explicitly allow it.

Build into an isolated, non-queryable generation. Verify artifacts, counts, source publication, ACL metadata and fingerprint; then commit the manifest and move the projection readiness pointer through a concurrency-safe compare-and-swap transition. A crash before that transition leaves only non-queryable staging artifacts.

The manifest is not a public URL or authorization grant. Opaque storage references are resolved only after Workspace/Source authorization.

## 6. ProjectionStatus and revision-specific readiness

ProjectionStatus is resolved for one exact tuple:

```text
Tenant + Workspace + Source + SourceRevision + ProjectionKind
+ desired ProjectionProfile ID/version/definition fingerprint
+ canonical PublicationManifest ID
```

Statuses:

| State | Meaning | Retrieval eligible? |
|---|---|---:|
| `pending` | No compatible projection has been built | No |
| `building` | A compatible ProjectionRun is queued/working | No |
| `ready` | A ProjectionManifest matches the exact desired tuple | Yes |
| `failed` | Latest desired build failed and no compatible ready manifest exists | No |
| `stale` | A previous manifest exists but revision/profile/fingerprint is no longer desired, or projection access was revoked | No |

`eligibleForRetrieval` is true if and only if state is `ready`. A status marked failed/stale may retain the last manifest reference for operator diagnostics, but the Retriever must never query it. Status is a current pointer/snapshot; immutable ProjectionRun and ProjectionManifest records preserve history.

A failed rebuild must not replace a still-compatible ready manifest with an ineligible state. If a compatible ready manifest already serves the exact desired revision/profile, it remains ready while a redundant repair/rebuild runs. If the desired revision or definition changes, the old manifest becomes stale for the new desired tuple and cannot serve as fallback.

## 7. Retrieval behavior

Retrieval selects canonical SourceRevisions first, then resolves projection readiness against those exact revisions. It never selects a projection and infers which canonical revision it represents.

For each requested `full_text` or `vector` method, the result reports one revision state for every selected SourceRevision:

- `available`: exact compatible ready manifest exists.
- `pending`, `building`, `failed`, `stale` or `unsupported`: no eligible manifest exists for that revision.

Aggregation in the method report:

- `available` when every selected revision is ready.
- `partial` when selected revisions have heterogeneous readiness; `coverage` lists only ready revisions.
- Otherwise the aggregate state is the common unavailable state.
- `ran` is true only when the method actually ran against at least one ready selected revision.

Required/optional method semantics:

1. An optional projection unavailable for some/all selected revisions is skipped for those revisions. If other requested methods return usable results, the overall outcome is Partial and diagnostics disclose the omitted projection coverage.
2. A required projection must be ready for every selected SourceRevision. Otherwise Retrieval returns the existing capability-unavailable failure category (`required_method_unavailable`), never a false Empty or a successful partial response.
3. A missing projection result never proves that no canonical knowledge exists.
4. Structured retrieval remains available from canonical storage as soon as the PublicationManifest is committed, regardless of full-text/vector status.
5. When a projection is ready for only a subset of selected SourceRevisions, the Retriever must not substitute an older revision for the missing one. It may query only the ready subset when the method is optional and report the exact per-revision coverage.
6. Every candidate is revalidated against the currently selected PublicationManifest and Workspace/Project ACL before its canonical record or Evidence is returned.

The Retrieval cursor fingerprint includes the selected publication manifests, ProjectionManifest IDs/versions/fingerprints used by each method, effective scope/policy fingerprint and ranking-policy version. A changed readiness pointer, ACL or selected revision invalidates or rejects the cursor.

## 8. Freshness, rebuild and supersession

Freshness is tracked independently for each projection kind. A Source may have:

- Canonical revision R2 published and structured-ready.
- Full-text R2 pending/building while full-text R1 remains stored but stale for active R2.
- Vector R2 ready.
- A full-text builder failure that does not affect canonical or vector readiness.

On new SourceRevision publication, create pending desired statuses for each configured projection. On profile/builder/model/analyzer definition upgrade, mark the previous generation stale for the new desired definition and schedule a rebuild according to policy.

A slower R1 projection run cannot move the active projection pointer backward after R2 has become the desired/published revision. Commit checks compare the desired source revision, profile fingerprint and generation/CAS token. Superseded builds remain diagnosable but cannot publish as current.

Rebuild never changes KnowledgeRecord/Evidence IDs or canonical publication state. Projection cleanup follows retention/deletion policy and must not remove canonical source data.

## 9. Security and observability

- Apply Workspace/Project/Source filters before search candidate counts, facets, identifiers, scores or snippets are exposed.
- Projection artifacts inherit the source Workspace boundary; content-hash deduplication must not reveal cross-Workspace existence.
- A revoked Workspace/Source or revoked projection policy makes the relevant status ineligible immediately, even when an old manifest exists.
- Query workers use least privilege and never accept Workspace/source filters solely from untrusted projection metadata.
- Diagnostics expose stable codes, status and safe summaries only; no hidden source names, snippets or hit counts leak across access boundaries.
- Record profile ID/version, definition fingerprint, builder version, SourceRevision, PublicationManifest, ProjectionRun, ProjectionManifest, counts, duration, retries and failure category.

## 10. Acceptance scenarios

1. Canonical publication succeeds while full-text and vector are both pending; structured Retrieval works.
2. Full-text is ready while vector fails; full-text Retrieval works, optional vector is reported failed/partial, canonical and full-text remain ready.
3. A required vector method is unavailable for one of three selected revisions; Retrieval returns capability-unavailable, not Empty/Partial.
4. A vector profile upgrades to a new embedding model revision; the old manifest becomes stale for the new desired fingerprint and cannot be silently queried.
5. R2 is published while R1 projection is still building; R1 completion cannot replace R2 readiness.
6. A builder crashes before manifest/ready-pointer commit; no staging output is queryable.
7. A manifest whose source publication hash differs from the canonical PublicationManifest is rejected.
8. A Workspace/ACL revocation prevents old projection candidates and cursors from being exposed.
9. Rebuilding a projection leaves canonical record/evidence/revision IDs unchanged.
10. Identical content hashes in two Workspaces do not reveal each other's projection existence or counts.

## 11. Initial machine-readable schemas

- [ProjectionProfile v1](../schemas/projection-profile-v1.schema.json)
- [ProjectionRun v1](../schemas/projection-run-v1.schema.json)
- [ProjectionManifest v1](../schemas/projection-manifest-v1.schema.json)
- [ProjectionStatus v1](../schemas/projection-status-v1.schema.json)

Valid examples are under `../schemas/examples/`. CI validates schema shape and cross-record lineage/count/readiness semantics. These artifacts remain logical contracts and do not select a search vendor, embedding provider, physical index naming convention or deployment topology.

## 12. Deliberately deferred

- Search engine/vector-store vendor and physical index or collection layout.
- Embedding provider/model choice, dimensions and commercial/hosting constraints.
- Exact analyzer dictionaries and language-specific search tuning.
- Incremental update/delete protocol, compaction and index-generation cleanup.
- Numeric latency, throughput, cost and retrieval-quality thresholds.
- Projection queue, orchestration runtime and operational dashboard implementation.
