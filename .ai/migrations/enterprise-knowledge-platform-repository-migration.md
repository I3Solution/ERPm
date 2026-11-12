# Enterprise Knowledge Platform Repository Migration Plan

- Status: Proposed migration plan
- Baseline repository: `I3Solution/ERPm`
- Baseline PR: [#70](https://github.com/I3Solution/ERPm/pull/70)
- Baseline branch: `loipham/phase0-workspace-boundary`
- Baseline commit: `89dd4c12b20a92b95c245fe1e5665ac868e04825`
- Migration planning branch: `loipham/platform-repository-migration`
- Target repository: personal GitHub account, private; repository name to be confirmed before creation
- Merge policy: PR #70 remains open and unmerged throughout migration preparation

## 1. Goals

Create an independently owned Enterprise Knowledge Platform repository without making ERPm a runtime or source-code dependency of the Platform.

The Platform is a reusable product for multiple systems. ERPm is the first pilot integration used to validate the generic capabilities. A future system must be able to integrate through stable Platform contracts and reusable services rather than reimplementing IndexSource, ingestion, retrieval, or RAG.

The migration must preserve design decisions, schema contracts, test evidence, and traceability to the ERPm pilot implementation.

## 2. Non-goals

- Do not merge or close PR #70 as part of this migration.
- Do not delete, rewrite, or relocate ERPm application/indexer code during planning.
- Do not create the personal target repository until its exact owner/name and visibility are confirmed.
- Do not introduce Go Core, Python AI runtime, SDKs, API servers, MCP servers, databases, queues, or workers merely as migration scaffolding.
- Do not treat the current .NET Extractor Host prototype as a production sandbox.
- Do not change ERPm application behavior or its existing developer workflow.
- Do not modify `.ai/status.md` or re-enable task-status aggregation workflows.

## 3. Repository ownership boundary

### 3.1 Target Platform repository

The following assets belong in the independent Platform repository:

- Product architecture, technology strategy, ADRs, and Platform roadmap.
- Canonical Knowledge, Evidence, Relation, SourceRevision, Ingestion, Publication, Projection, Retrieval, Context Packet, Workspace, and Storage contracts.
- JSON Schemas, payload schemas, and valid example fixtures for those contracts.
- Language-neutral Connector, Extractor, Processor, Extension, and integration contracts as they are defined.
- Platform-owned contract, conformance, and reusable integration tests.
- Platform CI that validates Platform assets without requiring an ERPm checkout.

### 3.2 ERPm repository

The following remain ERPm-owned:

- ERPm business/application source code and repository-specific configuration.
- Existing ERPm Roslyn and TypeScript indexers and their implementation details.
- ERPm-specific source registration/configuration and pilot fixtures.
- ERPm-specific Extractor adapter/entry point that invokes the existing ERPm indexer.
- ERPm application CI and tests.
- ERPm-specific smoke/integration workflow that checks compatibility with the Platform contracts.

### 3.3 Boundary requiring deliberate extraction

The current Extractor Host implementation is located in `tools/ERPm.CodeIndex` and is coupled to ERPm project structure and indexer types. Do not copy it wholesale into the Platform repository.

Separate responsibilities as follows:

| Responsibility | Target |
|---|---|
| Language-neutral Extractor invocation/result contract | Platform contracts |
| Generic process runner, lifecycle, timeout and resource-control abstractions | Platform Core, when implemented |
| Generic artifact verification rules and contract tests | Platform Core/contracts |
| ERPm Roslyn indexer and ERPm-specific host adapter | ERPm |
| ERPm-specific smoke test and pinned pilot revision | ERPm integration test |
| Production isolation/sandbox implementation | Future Platform work; not proven by current prototype |

The current contract references ERPm-specific schema/version types. Those references must be removed or replaced with contract-owned identifiers before the contract is considered portable.

## 4. Inventory of PR #70 changes

The inventory below covers the 86 changed paths reported by GitHub for PR #70 at the baseline commit above.

### 4.1 Platform architecture — migrate

- `.ai/architecture/canonical-knowledge-contract.md`
- `.ai/architecture/code-index-adapter-contract.md`
- `.ai/architecture/context-packet-contract.md`
- `.ai/architecture/enterprise-knowledge-platform.md`
- `.ai/architecture/first-vertical-slice.md`
- `.ai/architecture/ingestion-pipeline.md`
- `.ai/architecture/projection-lifecycle.md`
- `.ai/architecture/retrieval-contract.md`
- `.ai/architecture/storage-boundary.md`
- `.ai/architecture/technology-strategy.md`
- `.ai/architecture/workspace-boundary.md`
- `.ai/plans/roadmap-enterprise-knowledge-platform.md`

### 4.2 Platform schemas and fixtures — migrate

- All files under `.ai/schemas/`, including:
  - schema README;
  - canonical, ingestion, retrieval, projection, context, evidence, source-revision and payload schemas;
  - valid example fixtures under `.ai/schemas/examples/`;
  - typed code payload schemas under `.ai/schemas/payloads/`.

These contracts and fixtures are Platform-owned and must not depend on ERPm namespace, project path, or build tooling.

### 4.3 Platform decision/task records — migrate

- All nine task records:
  - `.ai/tasks/change-20261112-canonical-knowledge-contract.md`
  - `.ai/tasks/change-20261112-context-packet-contract-design.md`
  - `.ai/tasks/change-20261112-first-vertical-slice-design.md`
  - `.ai/tasks/change-20261112-ingestion-pipeline-design.md`
  - `.ai/tasks/change-20261112-projection-lifecycle-design.md`
  - `.ai/tasks/change-20261112-retrieval-contract-design.md`
  - `.ai/tasks/change-20261112-storage-boundary-design.md`
  - `.ai/tasks/change-20261112-technology-strategy.md`
  - `.ai/tasks/change-20261112-workspace-boundary-design.md`

Preserve their decision history and distinguish accepted decisions from proposals still awaiting approval.

### 4.4 CI and tests — split by ownership

- `tests/context_contracts/test_context_packet_contract.py`: migrate to Platform contract/conformance tests, adjusting paths and CI invocation.
- `.github/workflows/verify.yml`: do not copy unchanged. Split into:
  - Platform CI: schema validation, contract tests, language-specific Platform tests; no ERPm checkout.
  - ERPm CI: existing application/indexer build and tests.
  - ERPm pilot integration CI: pinned ERPm revision and compatibility tests against a versioned Platform contract/artifact.
- `tests/ERPm.CodeIndex.Tests/ExtractorHostProtocolTests.cs`: keep ERPm implementation tests in ERPm; add/relocate only language-neutral contract conformance tests to Platform after separating the contract.
- `tests/ERPm.CodeIndex.Tests/extractor-host-smoke.sh`: keep as ERPm-specific pilot smoke test. It must not become a prerequisite for ordinary Platform CI.

### 4.5 ERPm implementation — keep in ERPm

- `tools/ERPm.CodeIndex/Indexing/ExtractorHostCommand.cs`
- `tools/ERPm.CodeIndex/Indexing/ExtractorHostProtocol.cs` (implementation-specific pieces remain; portable contract definition is extracted separately)
- `tools/ERPm.CodeIndex/Models/ExtractorHostRequest.cs` (split portable DTO contract from ERPm-specific types)
- `tools/ERPm.CodeIndex/Models/ExtractorHostResultManifest.cs` (split portable manifest contract from ERPm-specific types)
- `tools/ERPm.CodeIndex/Program.cs`
- `tools/ERPm.CodeIndex/README.md` (retain ERPm-specific usage; link to the Platform contract documentation)

## 5. Migration phases and gates

### Phase 0 — Baseline and migration plan

- Record PR #70 URL, base/head refs, exact head SHA, changed-file inventory, and latest CI evidence.
- Create this migration planning branch from the exact PR head.
- No source relocation or PR merge.

Exit gate: inventory and ownership boundary reviewed.

### Phase 1 — Prepare the personal Platform repository

- Confirm the personal GitHub owner/login, repository name, and Private visibility.
- Check repository creation permissions.
- Create an independent repository with a protected default branch and minimal CI/ownership rules.
- Do not add premature runtime scaffolding.

Exit gate: target repository exists and its ownership/access model is confirmed.

### Phase 2 — Migrate Platform-owned assets

- Move architecture, roadmap, schemas, examples, and decision/task records.
- Preserve commit provenance where practical.
- Record a source-to-target path map and source baseline SHA.
- Keep ERPm implementation paths in ERPm.

History strategy must be selected before the copy: prefer a Git history-preserving extraction (for example, a filtered history/subtree strategy) if it can be validated cleanly. If that is impractical, use a clearly documented baseline import with original source commit references. Do not claim full history preservation unless verified.

Exit gate: target contents reconcile against the approved inventory and provenance is documented.

### Phase 3 — Establish independent Platform CI

- Validate all JSON Schemas and example fixtures.
- Run context/contract/conformance tests from the Platform repository.
- Ensure workflows do not checkout ERPm or depend on ERPm paths, SDK pins, submodules, or secrets.
- Add minimal repository governance and contribution instructions.

Exit gate: Platform CI passes with no ERPm checkout.

### Phase 4 — Reconnect ERPm as the first external pilot

- Publish/version the portable Extractor and integration contracts.
- Keep ERPm's Roslyn/TypeScript indexer implementations in ERPm.
- Adapt ERPm's host/adapter to implement the Platform contract.
- Test exact pinned SourceRevision capture, artifact verification, canonical normalization, publication, and structured retrieval.
- Verify that a second hypothetical integration can use the same Platform workflow without copying ERPm-specific logic.

Exit gate: ERPm pilot passes through the same public integration boundary intended for future systems.

### Phase 5 — Resume the Platform roadmap

Resume the approved Platform roadmap only after the independent repository and ERPm pilot boundary are proven. Prioritize reusable integration/extension contracts and the first end-to-end Knowledge → Retrieval → RAG capability; do not prematurely implement all SDKs or runtimes.

## 6. Validation checklist

- [ ] Platform repository is owned by the user's personal GitHub account and is Private.
- [ ] PR #70 remains open and unmerged until migration reconciliation is complete.
- [ ] Every PR #70 changed path has an approved target disposition.
- [ ] Platform architecture/schemas/contracts contain no accidental ERPm implementation dependency.
- [ ] ERPm-specific indexers and adapters remain in ERPm.
- [ ] Platform CI passes without checking out ERPm.
- [ ] ERPm CI remains functional.
- [ ] ERPm pilot integration uses versioned Platform contracts.
- [ ] SourceRevision, commit/tree identity, capture manifest, artifact digest, and Evidence provenance remain verifiable.
- [ ] No claim is made that the prototype provides production-grade sandbox isolation.
- [ ] No PR is merged without the user's explicit approval.

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Copying ERPm-specific host code into Platform | Extract language-neutral contract; keep ERPm adapter/indexer in ERPm |
| Platform CI remains coupled to ERPm | Create a standalone Platform CI and keep pilot CI separate |
| Losing design/commit provenance | Preserve filtered Git history where verified; otherwise retain exact source SHA and path map |
| Contract drifts between repositories | Version contracts and add conformance tests on both sides |
| Credentials tied to a personal token | Use local credentials only for development; later use least-privilege GitHub App/service identity |
| Migration accidentally disrupts ERPm contributors | Keep ERPm paths/workflows stable and use separate branches/PRs |
| Treating pilot smoke as sandbox proof | Explicitly retain sandboxing as an uncompleted production requirement |

## 8. Current execution status

Completed:
- PR #70 is open and unmerged at baseline head `89dd4c12b20a92b95c245fe1e5665ac868e04825`.
- Migration planning branch `loipham/platform-repository-migration` was created from that exact commit.
- The 86 changed paths were inventoried and assigned provisional dispositions in this plan.

Not yet performed:
- Personal target repository creation.
- File migration or source relocation.
- CI workflow split.
- Contract extraction/refactoring.
- ERPm pilot reconnection.
- PR #70 merge or closure.
