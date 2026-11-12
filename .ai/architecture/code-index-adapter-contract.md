# Code Index → Canonical Knowledge Adapter Contract v1

> **Status:** Design contract for the first code-ingestion vertical slice; no runtime adapter is implemented by this document.
> **Scope:** Normalize existing ERPm backend code-index v1/v2 and frontend code-index v3 records without changing their source contracts.

## 1. Purpose and boundaries

The adapter is an ingestion-boundary component. It consumes validated source-index records plus trusted Source/SourceRevision registration metadata and emits canonical KnowledgeRecord and Evidence objects.

It must not:
- change or rewrite the existing indexer JSONL schemas or serializers;
- trust Tenant, Workspace or Project identifiers supplied inside an index record;
- invent a source revision, line/offset, content hash, semantic identity or relationship endpoint;
- infer a verified graph edge merely because a source-native target identifier is present;
- discard unsupported source record kinds without an explicit omission/quarantine report.

The initial canonical payload scope remains exactly:
- `code.file`
- `code.symbol`
- `code.reference_observation`
- `code.api_observation`

## 2. Trusted input and source binding

For each input batch, the orchestrator supplies a trusted binding:

| Value | Rule |
|---|---|
| Tenant / Workspace | Resolved from authenticated ingestion request and registered Source; never copied from index data |
| Project | Optional trusted registration/configuration value; must belong to the same Workspace |
| Source | Resolve `repositoryId` to one registered Source in that Workspace |
| SourceRevision | Resolve `commitSha` to a captured Git SourceRevision; require exact full-SHA equality |
| Raw record | Validate against the declared immutable source schema v1, v2 or v3 before adaptation |
| Producer | Record source schema version, indexer version and adapter/normalizer version in provenance |

A batch mixing repository IDs or commit SHAs is rejected for this v1 single-source normalization path. A record with a different SHA is rejected rather than silently attached to the requested revision.

## 3. Source record mapping

| Source contract | Source `kind` | Canonical payload | v1 behavior |
|---|---|---|---|
| Backend v1 | `definition` | `code.symbol` | Map; no source symbol kind exists, so preserve `unknown` rather than guess |
| Backend v1 | `reference` | `code.reference_observation` | Map the occurrence and raw nullable source/target identifiers |
| Backend v2 | `definition` | `code.symbol` | Map the symbol kind and source-native symbol ID |
| Backend v2 | `reference` | `code.reference_observation` | Map relation, source/target identifiers and source/target kind evidence |
| Frontend v3 | `file` | `code.file` | Map path/language/file source ID; create no backend file record that was not emitted |
| Frontend v3 | `definition` | `code.symbol` | Map declaration; current TypeScript symbol IDs are revision-local locators |
| Frontend v3 | `reference` | `code.reference_observation` | Map resolved compiler reference/call observations |
| Frontend v3 | `relationship` | `code.reference_observation` | Map import occurrence; unresolved local target remains an observation |
| Frontend v3 | `api` | `code.api_observation` | Preserve HTTP method, URL kind, expression and literal-path evidence |
| Frontend v3 | `angular` | **No v1 mapping** | Preserve raw record and report an explicit unsupported-kind omission; do not recast as symbol/API |
| Backend v1/v2 | `project`, `dependency` | **No v1 mapping** | Preserve raw record and report an explicit unsupported-kind omission |
| Any | Unknown schema version or kind | **No mapping** | Fail closed or quarantine; never guess from fields |

For frontend v3, `symbolKind: "module"` on a `relationship` row describes an import occurrence. It does not create a `code.module` payload or a resolved graph edge by itself.

## 4. Canonical envelope and Evidence mapping

For each supported source row:

1. Generate a new immutable platform `recordId`; do not reuse a source-native `symbolId` as the canonical record ID.
2. Set `classification.domain = "code"` and `classification.recordType = payload.type`.
3. Set `payload.version = "1.0"` and validate `payload.data` against the matching payload schema.
4. Set `claim.kind = "deterministic_extraction"`.
5. Map source `evidence` exactly to `claim.verification` (`verified`, `partial`, or `unknown`); never upgrade it.
6. Create Evidence tied to the registered Source and exact SourceRevision. Use a repository-relative code locator with the source `path`, `startLine` and `endLine`; preserve `startOffset`/`endOffset` when v3 provides them. Do not synthesize offsets for v1/v2.
7. Preserve source-native IDs and indexer/schema versions for traceability, but use canonical record IDs when later creating KnowledgeRelation endpoints.
8. Keep the original JSONL row or a lossless immutable reference to it in the ingestion artifact/staging lineage so future adapters can reprocess it.

File-level evidence uses the source file row's own span. Backend v1/v2 do not emit `kind: "file"`; the adapter must not fabricate a file-level KnowledgeRecord from a definition/reference row.

## 5. Logical identity rules

A logical key is unique only within its declared Tenant/Workspace/Source identity scope. It is neither a record ID nor an authorization token.

| Payload | Rule | Derivation |
|---|---|---|
| `code.file` | **Required** | Source-scoped path identity: normalize separators to `/`, reject absolute paths and `..` segments, preserve case, then encode the tuple `["code.file", sourceId, normalizedPath]` deterministically. A rename/move is a new logical identity unless a future, separately evidenced rename relation is introduced. |
| `code.symbol` | Conditional | Required only when the adapter has a collision-free compiler-semantic identity that is proven stable across revisions. Encode `["code.symbol", sourceId, language, symbolKind, compilerSemanticKey]`. Otherwise mark identity as `revision_local` and omit `logicalKey`. Never use display name, qualified name or current frontend offset-based `symbolId` alone as a stable key. |
| `code.reference_observation` | **Omit** | An occurrence is revision/evidence-locator scoped. Keep source/target source-native IDs as observations; do not claim cross-revision conceptual identity. |
| `code.api_observation` | **Omit** | An API call observation is occurrence-scoped to an exact source revision and Evidence locator. Do not key it by URL or method alone. |

The payload's `code.symbol.data.identity` declares whether identity is `stable` (`compiler_semantic_key`) or `revision_local` (`source_locator`). A stable identity requires a non-empty envelope `logicalKey`; a revision-local identity forbids it. For the current frontend v3 producer, `symbolId` includes path and start offset, so it is always revision-local. For a source symbol whose stable identity cannot be distinguished from a display-name fallback, the adapter must also choose revision-local.

The exact byte-level logical-key encoder remains a versioned implementation detail; the tuple and normalization rules above are normative. Consumers must not parse the opaque `logicalKey` string.

## 6. Relationship promotion

A `code.reference_observation` never becomes a `KnowledgeRelation` solely because `targetSymbolId` is non-null.

Promotion requires all of the following:
- source observation is `verified`;
- target resolution is marked `resolved` by the source extractor;
- source and target source-native IDs each map unambiguously to canonical `code.symbol`/file records in the same Workspace and SourceRevision;
- relation predicate is recognized and its semantics are supported;
- Evidence locator supports the exact relation occurrence.

If any condition is missing, keep the KnowledgeRecord observation and do not emit a graph edge. V1 source contracts may not expose enough information to promote every compiler-resolved reference; that is an intentional conservative limit.

## 7. Explicitly unsupported v1 observations

Frontend Angular metadata (`component`, `service`, `guard`, `route`) and backend `project`/`dependency` rows are not in the four accepted payload types. The adapter must preserve their raw rows, count them in an omission/coverage report and apply the IngestionProfile's required/optional completeness policy. It must not report a complete extraction when required observations were omitted.

A future `code.angular_observation`, `code.project` or `code.dependency` type requires its own reviewed payload contract and version; this document does not approve those types.

## 8. Acceptance checks for the first adapter

1. Every supported source row validates against its declared v1/v2/v3 schema before mapping.
2. Every output record has trusted Tenant/Workspace/Source/SourceRevision binding and exactly one SourceRevision.
3. A source `commitSha` mismatch or mixed repository/revision batch is rejected.
4. Evidence preserves path and line range exactly; offsets are present only when the source contract provides them.
5. v1 definitions map to `code.symbol` with `symbolKind: "unknown"`; no kind is guessed.
6. Frontend v3 definitions never receive a stable `logicalKey` from the offset-based source `symbolId`.
7. Reference/import rows remain observations unless both canonical endpoints and relation evidence are verified.
8. Angular/project/dependency rows appear in an explicit omission/coverage report and remain available for reprocessing.
9. The source indexer schemas/fixtures and generated cache formats remain unchanged.

## 9. Scope boundary

This is a design contract and payload-schema milestone only. It does not implement adapter code, change the indexers, migrate local caches, add a database/API/worker, or select a storage vendor.
