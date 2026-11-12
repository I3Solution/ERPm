# Retrieval Contract v1 — Request and Result Semantics

> **Status:** Draft for architecture review
> **Date:** 2026-11-12
> **Depends on:** Workspace Boundary, Canonical Knowledge Contract v1, Ingestion v1 and Storage Boundary
> **Scope:** Platform-neutral retrieval request/result semantics, authorization, revision selection, projection availability and evidence
> **Out of scope:** HTTP/OpenAPI or MCP wire schemas, database queries, search vendor selection, ranking model implementation and Context Packet generation

## 1. Purpose

Define one reusable retrieval contract that can be consumed by the platform Query API, MCP tools, internal services and different AI agents. Client adapters may differ, but they must preserve the same scope, revision, evidence and authorization guarantees.

Retrieval returns source-grounded knowledge candidates. It does not generate an answer, synthesize a prompt or replace the later Context Engine. A Context Packet may select and package retrieval results, but it must not weaken their provenance or authorization guarantees.

## 2. Contract principles

1. **Workspace-scoped:** every request resolves to exactly one Knowledge Workspace. Cross-workspace retrieval is denied by default.
2. **Authorization-first:** the caller's identity and effective grants are resolved by trusted platform middleware. Client-supplied Tenant, Workspace, Project or Source identifiers are selectors, never proof of authorization.
3. **Project can only narrow:** the effective result scope is the intersection of the caller's Workspace grants and any requested Project/Source filters. A request cannot widen the caller's permissions.
4. **Published revisions only:** candidates must belong to a committed PublicationManifest and a published SourceRevision.
5. **Evidence-backed:** every returned KnowledgeRecord has at least one authorized Evidence reference sufficient to locate its source.
6. **Projection-aware:** structured, full-text and vector availability are reported independently. An unavailable projection must not be interpreted as an empty canonical knowledge store.
7. **Revision-explicit:** every returned record identifies its SourceRevision. Results from different revisions are never silently represented as one coherent snapshot.
8. **Agent-neutral:** ranking and retrieval behavior are defined without assuming a particular LLM, MCP host or UI.

## 3. Request model

A retrieval request has four conceptual parts:

- **Scope:** the requested Workspace and optional narrowing selectors.
- **Query intent:** free text and/or explicit structured lookup criteria.
- **Revision policy:** active published revisions or caller-pinned revisions.
- **Retrieval policy:** enabled methods, limits, filters and optional verified-relation expansion.

The authenticated principal, effective memberships, source grants and policy version are supplied by the trusted execution context; callers cannot override them in request content.

### 3.1 Scope

Required:
- Tenant ID resolved by the platform.
- Workspace ID requested by the caller and authorized by the platform.

Optional narrowing selectors:
- One or more Project IDs within the selected Workspace.
- One or more Source IDs registered to the selected Workspace.

Rules:
- A Project or Source ID outside the Workspace is invalid and must not be used to probe another Workspace.
- Requested Project/Source selectors are intersected with the caller's effective grants.
- An omitted Project selector means the caller's entire authorized Workspace scope, not an unconditional grant to every Project.
- There is no wildcard or multi-Workspace scope in v1.

### 3.2 Query intent

At least one of the following is required:
- A text query for lexical/vector retrieval.
- Structured lookup criteria, such as payload type, logical key, exact symbol/identifier, record kind or typed domain filters.

A request may provide both. Structured criteria must remain typed and exact; adapters must not silently convert an exact identifier lookup into approximate semantic matching.

The contract distinguishes:
- **Exact lookup:** deterministic identity/identifier/key matching.
- **Structured search:** typed field/filter matching against canonical records.
- **Full-text search:** lexical matching against a ready full-text projection.
- **Vector search:** semantic candidate generation against a ready vector projection.
- **Hybrid search:** merge of explicitly enabled methods under one resolved scope and revision policy.

Automatic intent classification may be implemented by an adapter, but it is not required for contract correctness. The adapter must report which methods actually ran.

### 3.3 Revision selection

Two modes are supported:

- **Active:** resolve the latest valid active published SourceRevision for each authorized selected Source. This is the default.
- **Pinned:** use caller-specified SourceRevision IDs, only when each revision is published, belongs to the selected Workspace/Source and is authorized.

Rules:
- No request may select staging, failed, superseded-unpublished or otherwise uncommitted data.
- A Source without an eligible published revision contributes no candidates and should be identified in response diagnostics without leaking inaccessible source metadata.
- Every result carries its own SourceRevision ID and source revision identity.
- A request combining multiple Sources may resolve one active revision per Source. It must not silently combine multiple revisions of the same Source.
- A pinned historical revision is an explicit historical query, not an implicit fallback when the active projection is stale.

### 3.4 Filters

Filters may narrow by:
- Source and Project.
- Payload type / record kind.
- Domain-specific typed attributes.
- Verification state or claim kind, when supported by the payload contract.
- Time or revision metadata, where meaningful.

All mandatory Tenant/Workspace/Project/Source ACL filters must be enforced inside the canonical/search query or before any candidate content, count, score, snippet or identifier is exposed. Post-filtering already exposed search candidates is prohibited.

## 4. Retrieval methods and projection availability

The canonical store is available for structured retrieval as soon as a SourceRevision is published. Full-text and vector methods require compatible ready projections.

For each requested method, the response reports:
- Method name.
- State: available, pending, building, failed, stale or unsupported.
- Projection/index version when applicable.
- SourceRevision coverage or the relevant manifest identity.
- A concise unavailable reason when the method did not run.

Rules:
1. A ready projection must match the requested SourceRevision manifest, payload/schema compatibility and effective ACL/policy version.
2. Pending, building, failed or stale projections are not queried as if they were current.
3. If a method is optional and unavailable, hybrid retrieval may continue with available methods and return a partial/degraded capability report.
4. If the caller explicitly marks a method as required and it is unavailable, return a capability-unavailable error rather than silently substituting another method.
5. Missing candidates from an unavailable method do not establish that the source contains no matching knowledge.
6. Projection readiness is evaluated per source/revision/method, not inferred from a single global search-engine health flag.

## 5. Relationship expansion

Relationship expansion is optional and separate from initial candidate generation.

V1 rules:
- Expand only resolved KnowledgeRelations whose endpoints exist, belong to the same Workspace and have supporting Evidence.
- Only relations meeting the accepted verification policy may be traversed; unresolved reference observations are not traversable edges.
- Both endpoint records and the relation's supporting Evidence are independently authorized before returning them.
- Project/Source restrictions apply to both endpoints. A relation cannot be used as a bridge to bypass ACL.
- Default expansion depth is one hop. Higher depth and broader traversal require an explicit policy and resource limit.
- The response records which relation and Evidence caused each expanded result to be included.
- Retrieval never invents a relationship from name similarity or embedding proximity.

## 6. Result model

A successful response contains:

### 6.1 Request and scope summary

- Request ID and contract version.
- Resolved Tenant/Workspace scope and effective Project/Source narrowing (or safe opaque references).
- Applied revision policy and selected published SourceRevision identities.
- Applied filters and retrieval methods.
- Policy/version fingerprint used for authorization and filtering.

The caller must not receive identities or counts for resources outside its effective scope.

### 6.2 Knowledge results

Each result contains:
- KnowledgeRecord ID, record kind, payload type and payload version.
- Typed payload or a bounded projection of it, according to the caller's requested fields and policy.
- Tenant/Workspace/Project scope needed to interpret the record.
- Source ID and exact SourceRevision identity.
- Claim kind and verification state.
- Logical key when the payload contract defines one.
- One or more Evidence references.
- Retrieval provenance: methods that produced the candidate, per-method score/rank where applicable, and whether it was included through relation expansion.

Scores from different retrieval methods are not inherently comparable. The contract carries method-specific scores; a normalized final rank may be returned only with the ranking-policy version that produced it.

### 6.3 Evidence

Every result must include at least one authorized Evidence reference. An Evidence item includes, as available:
- Evidence ID and source/revision identity.
- Source-native locator (for example file path plus line range, document page/section, database object path or Git commit/path).
- Content hash or excerpt hash when available.
- A bounded excerpt only when policy permits disclosure.
- Producer/provenance references needed to trace the observation to its capture/extraction process.

A URI, object key or opaque Evidence ID is not authorization. The platform must authorize evidence resolution and any excerpt/content fetch independently.

### 6.4 Relations

When requested, include only verified, resolved KnowledgeRelations with:
- Relation ID, predicate and endpoint record IDs.
- Supporting Evidence IDs.
- Relation provenance/verification.
- Whether the relation was traversed during this request.

## 7. Ordering, limits and pagination

- Results are ordered by the active ranking policy, then by a stable deterministic tie-breaker.
- The response records the ranking-policy version and participating methods.
- Limits apply to candidate generation, relation expansion and final results separately; server-side ceilings prevent unbounded queries.
- Pagination uses an opaque cursor bound to the normalized request, selected SourceRevision manifests, effective scope, authorization-policy version and ranking/projection versions.
- A cursor must expire or be rejected when its bound scope/policy/revision is no longer valid. It cannot be replayed under a different Workspace or principal.
- Counts are returned only when they can be computed within the caller's authorized scope. Approximate counts must be labeled as approximate.

## 8. Partial results and diagnostics

A retrieval response distinguishes:
- Complete: all requested required methods ran against compatible data.
- Partial: one or more optional methods or selected sources were unavailable, but usable results were returned.
- Empty: all required methods ran successfully and no matching authorized records were found within the resolved published revisions.
- Failed: the request could not be safely or correctly executed.

Diagnostics may include:
- Projection states and coverage.
- Sources without an eligible published revision.
- Truncation/limit indicators.
- Unsupported filters or methods.
- Stale cursor/policy information.
- Partial source or revision coverage.

Diagnostics must not reveal inaccessible source names, record IDs, hit counts, snippets or existence. Do not return a generic Empty outcome when a required retrieval method did not execute.

## 9. Errors

The wire-level error shape is deferred, but the contract distinguishes at least:

- Invalid request or incompatible filter/payload type.
- Unauthenticated caller.
- Forbidden or unavailable Workspace/Project/Source scope.
- Requested pinned revision not published or not selectable.
- Required retrieval method or projection unavailable.
- Expired/invalid pagination cursor.
- Query/resource limits exceeded.
- Internal retrieval failure.

Adapters may map these categories to protocol-specific status codes, but must not weaken scope or disclose cross-workspace existence while doing so.

## 10. Caching and authorization freshness

A cached response/candidate set is reusable only when its key and validation cover:
- Tenant, Workspace, effective Project/Source scope and principal/policy fingerprint.
- Normalized query and typed filters.
- Selected SourceRevision/publication manifests.
- Canonical payload and contract versions.
- Projection/index/embedding and ranking-policy versions.
- Relationship expansion policy and result limits.

Membership, ACL, Source policy or Workspace lifecycle changes must invalidate or revalidate affected cache entries before any content is exposed. Cache state is never an authorization authority.

## 11. Responsibilities by layer

- **API/MCP adapter:** validate protocol input, bind authenticated principal, normalize request and map the stable response/error contract.
- **Scope resolver / authorization layer:** resolve Workspace and effective grants; reject invalid or unauthorized narrowing selectors.
- **Revision resolver:** select only committed published SourceRevision manifests.
- **Structured retriever:** exact and typed queries against canonical records.
- **Projection retrievers:** query compatible ready full-text/vector projections with mandatory filters applied before candidate exposure.
- **Relation expander:** traverse authorized verified relations under limits.
- **Result assembler:** resolve canonical records/Evidence, revalidate ACL/revision, deduplicate same record candidates across methods and produce diagnostics.
- **Context Engine:** consumes retrieval results later; it does not change retrieval authorization or fabricate evidence.

## 12. Security invariants

1. No cross-Workspace reads in v1.
2. Project and Source scopes only narrow the effective Workspace grants.
3. Authorization is resolved by trusted platform identity, never by a prompt or caller-provided ACL claims.
4. Every retrieval method, count, facet, snippet, cursor and relation expansion respects the same effective scope.
5. Authorization and publication membership are revalidated before content leaves the platform.
6. Search/vector/cache data cannot become a side channel for inaccessible records.
7. Retrieved text is untrusted source data; it must not be treated as executable instructions by an agent.
8. Audit records capture the principal, resolved scope, selected revisions, methods and outcome without indiscriminately copying sensitive query/result content.

## 13. Acceptance scenarios

1. A caller in Workspace A cannot retrieve Workspace B records, even when query text, identifiers and content hashes are identical.
2. A Project-scoped caller cannot retrieve a sibling restricted Project.
3. A caller cannot pass a Source/Project ID from another Workspace to probe whether it exists.
4. A staged or failed SourceRevision never appears in structured, full-text or vector retrieval.
5. Active mode selects only the active published revision for each selected Source; it does not mix two revisions of the same Source.
6. Pinned mode returns only the exact authorized published revision requested.
7. Structured retrieval works when vector/full-text projections are pending or failed and reports those states.
8. A required unavailable projection returns a capability-unavailable error, not a false Empty result.
9. Stale projection candidates and stale cache entries are rejected after revision or ACL changes.
10. A verified relation cannot expose an unauthorized endpoint or its supporting Evidence.
11. Pagination cursor cannot be reused with a different Workspace, principal, policy version or SourceRevision set.
12. Every result can be traced to an authorized SourceRevision and source-native Evidence locator.

## 14. Accepted Retrieval v1 decisions (2026-11-12)

The following seven semantic defaults were accepted by the user on 2026-11-12. They are the contract baseline for subsequent machine-readable schemas and protocol adapters.

1. **Scope:** exactly one Workspace per request. Project/Source filters only narrow the caller's effective grants and are intersected with server-resolved authorization.
2. **Revision selection:** active published revision is the default. Historical/debug queries must pin exact published SourceRevision IDs; there is no silent historical fallback.
3. **Methods:** structured/exact retrieval is the baseline. Full-text/vector are optional or explicitly requested hybrid methods whose readiness is reported per source/revision.
4. **Required methods:** methods are optional unless explicitly marked required. An unavailable optional method yields a Partial response when usable results remain; an unavailable required method yields a capability-unavailable failure, never a false Empty.
5. **Relations:** one-hop verified/resolved expansion is the default, with result limits and independent Evidence/ACL checks on both endpoints.
6. **Results:** every KnowledgeRecord result carries its exact SourceRevision and at least one authorized Evidence reference. Method-specific scores remain distinguishable from final ranking.
7. **Pagination and caching:** opaque cursors and cached candidates/results are bound to effective principal/scope, authorization-policy version, revision manifests and relevant projection/ranking versions.

## 15. Remaining contract work

The accepted semantics do not yet define wire-level schemas or authorize runtime implementation. The following remain open:

- Required JSON/Protobuf fields, ID encoding, enum compatibility and error payload shape.
- Query text and typed-filter schema for the four initial code payloads and later domain payloads.
- Opaque cursor format, signing/encryption, expiry and invalidation behavior.
- Ranking policy schema, deterministic tie-breakers, score normalization and evaluation thresholds.
- Retrieval API and MCP protocol mapping, including authentication propagation and rate/resource limits.
- Machine-readable acceptance fixtures and integration tests against two isolated Workspaces.

After these are specified, define protocol adapters. Do not implement an API or select a search engine from this semantic contract alone.


## 16. Machine-readable schemas v1

Initial JSON Schema Draft 2020-12 artifacts:

- [Retrieval Request v1](../schemas/retrieval-request-v1.schema.json)
- [Retrieval Result v1](../schemas/retrieval-result-v1.schema.json)
- [Retrieval Error v1](../schemas/retrieval-error-v1.schema.json)

The request schema defines one-Workspace selectors, text/typed query intent, active or pinned revision policy, requested methods with required/optional semantics, one-hop relation expansion and bounded query limits. The result schema carries resolved scope/policy fingerprint, selected published revisions, per-method readiness/coverage, evidence-backed KnowledgeRecord results, ranking version, pagination and safe diagnostics. The error schema keeps failed requests distinct from Empty results.

### 16.1 Cross-field invariants

JSON Schema validates shape and local constraints. The platform must additionally enforce:

1. Authenticated principal, Tenant and effective grants are resolved by trusted middleware; caller request fields are selectors, not authorization claims.
2. Project/Source selectors must belong to the selected Workspace and only narrow server-resolved grants.
3. Pinned revisions must be published and belong to the selected Workspace/Source; active mode resolves only the active published revision for each source.
4. A successful outcome (complete, partial or empty) requires every requested required method to have run successfully against compatible data. A required-method failure uses the Retrieval Error contract.
5. Partial requires at least one usable result and an optional capability/source gap; Empty means all required methods ran and no authorized matching records were found.
6. Every result Workspace matches the response Workspace; every record revision appears in selectedRevisions.
7. Every result has at least one authorized Evidence reference matching the record's Source and exact SourceRevision.
8. A relation-expanded result includes a resolved verified relation and authorized Evidence for both endpoints; expansion never bypasses Project/Source restrictions.
9. `maxResults` cannot exceed `maxCandidates`; method kinds are unique per request and resource ceilings are enforced server-side.
10. `hasMore=true` requires an opaque cursor bound to principal, effective scope, policy, selected revision manifests and ranking/projection versions.
11. Diagnostics, counts, snippets and identifiers must not disclose inaccessible resources.
12. Cached results are revalidated against current authorization and publication state before exposure.

### 16.2 Deliberately not frozen

- Opaque cursor encoding/signing/encryption and storage.
- Exact payload-specific filter field catalogs and operator compatibility.
- Ranking/score normalization policy and evaluation thresholds.
- HTTP/OpenAPI, MCP and internal RPC wire bindings.
- Canonical ID encoding and schema registry governance.

These remain contract/technology ADR work. JSON Schema validation is not runtime authorization or a substitute for two-Workspace integration tests.
