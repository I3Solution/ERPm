# [spike] First Vertical Slice — Git Code Knowledge Ingestion Design

> **Loại:** spike
> **Ngày tạo:** 2026-11-12 · **Người làm:** AI Agent (ChatGPT) · **Người yêu cầu:** User
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** .ai/plans/roadmap-enterprise-knowledge-platform.md, .ai/architecture/technology-strategy.md, .ai/architecture/code-index-adapter-contract.md, .ai/architecture/ingestion-pipeline.md
> **Phạm vi:** Root repository — first reusable Go Core vertical slice design

## 1. Mô tả

Thiết kế luồng end-to-end đầu tiên cho Enterprise Knowledge Platform: one registered Git Source (initially ERPm-BE) → exact SourceRevision capture → backend Roslyn extractor host → Canonical Knowledge adapter → validation → atomic publication → structured retrieval. ERPm chỉ là pilot; không thay đổi contract hiện tại hoặc rewrite indexers.

## 2. Phân tích

- Go là ngôn ngữ Core đã được chấp thuận; triển khai ban đầu theo modular monolith.
- Python chưa cần cho deterministic code extraction; chỉ thêm khi có AI/ML workload cụ thể.
- Existing Roslyn và TypeScript extractors giữ nguyên; first slice giới hạn một SourceRevision từ backend để tuân thủ ingestion v1 single-source batch. Frontend/submodule extraction là follow-up riêng.
- Backend CLI hiện hard-code ERPm workspace/submodule/cache; cần external .NET host/protocol tổng quát nhưng không thay đổi Roslyn analysis semantics.
- Slice phải chứng minh Workspace isolation, revision provenance, whole-revision publication và evidence retrieval.
- Không triển khai vector search, public SDK, MCP write tools hoặc microservices trong slice đầu.

## 3. Features / Milestones

- [x] Xác định mục tiêu, phạm vi và logical Go module ownership cho first vertical slice.
- [x] Xác định end-to-end flow và acceptance scenarios về revision, publication, ACL và client evidence.
- [x] Ghi nhận discovery gates cho extractor invocation, immutable capture, submodule mapping và storage commit.
- [x] Inspect actual backend/frontend extractor entry points and record current invocation/runtime constraints.
- [x] Draft backend extractor-host process protocol v1: bounded JSON stdin request, immutable JSONL + result manifest artifacts, independent Go-side hash/schema/lineage verification.
- [x] Inspect pinned ERPm-BE Git tree and SDK prerequisites: one root solution, no nested gitlinks, .NET SDK 10.0.403 pinned.
- [x] Draft immutable Git capture and isolated writable build-workspace policy; captured snapshot remains read-only.
- [x] Specify the minimum .NET host integration point: dispatch before WorkspaceManifestReader, reuse BackendRoslynIndexer, preserve legacy CLI behavior.
- [x] Bind extractor result to the exact capture manifest ID/digest; host receives a writable execution copy, never the immutable snapshot mount.
- [x] Define host/capture conformance tests for protocol, hashes, path isolation, revision lineage, cancellation, snapshot immutability and retries.
- [x] Implement the first managed .NET extractor-host command and protocol-v1 request/result manifest while preserving the legacy CLI entry points.
- [x] Add protocol tests for version/revision/digest validation, output-vs-workspace isolation, artifact byte/hash/count binding and result-manifest JSON round-trip.
- [x] CI build and protocol unit tests pass; host smoke test executes against a read-only Git-archive snapshot and separate writable execution copy, validates artifact hash/count/lineage and confirms snapshot content unchanged.
- [x] Complete the full five-job CI run and review all jobs; Run #1110 passed 5/5.
- [ ] Design frontend multi-repository output partitioning into separate registered SourceRevision runs.
- [ ] User review/approval design boundary and acceptance criteria before runtime scaffolding.
- [ ] Implement the approved vertical slice incrementally in Go.

## 4. Cách làm

- Tạo .ai/architecture/first-vertical-slice.md.
- Không tạo Go module/runtime scaffold trong bước design.
- Không thay đổi existing indexer schema/serializer hoặc canonical contract.
- Không sửa .ai/status.md.

## 5. Kiểm tra

- Đối chiếu flow với Canonical Knowledge, Code Index Adapter, Ingestion, Storage, Retrieval, Projection và Workspace contracts.
- Acceptance scenarios bao gồm tối thiểu hai Workspaces, exact SHA, failed stage, retry, out-of-order revision, ACL revoke và equivalent evidence.
- Source inspection evidence: backend is a .NET 10 library invoked by a hard-coded ERPm CLI and writes local JSONL cache; frontend worker consumes a manifest on stdin and emits JSONL on stdout, but current runner performs validation/cache writing and frontend Program root is tied to erpm-fe.
- Pinned ERPm-BE commit `235173fd193ae2fb60081fa4573434f5edd506f3` has root `ERPm.sln`, no nested gitlinks, no .gitattributes and pins .NET SDK 10.0.403 (`rollForward: latestPatch`).
- `BackendRoslynIndexer` currently accumulates records in memory and stamps `GeneratedAtUtc`; output artifact hashes therefore bind one invocation and are not deterministic across retries. Canonical identity must exclude this timestamp.
- Initial runtime prototype is now present: `extractor-host` dispatches before `WorkspaceManifestReader`, validates the protocol request, reuses `BackendRoslynIndexer`, and writes `records.jsonl` plus a lineage/hash/count result manifest. Protocol unit tests have been added; CI Run #1110 completed successfully (5/5 jobs). The code-index job verified the .NET build, all 32 code-index unit tests and the managed-host smoke test against the pinned immutable ERPm-BE snapshot. Roslyn/MSBuild indexed 36,374 records; the smoke validated artifact SHA-256/byte length/count/revision lineage and confirmed snapshot content remained unchanged. A later documentation-only follow-up commit has its own CI run pending.

## 6. Việc còn lại

- Source inspection completed: backend Roslyn can be reused through a thin .NET host; current CLI itself is hard-coded to ERPm workspace/submodule/cache. Proposed host protocol is documented in section 10; it preserves existing Roslyn analysis and schema while returning run-scoped immutable artifacts. Frontend worker consumes manifest/stdin and emits JSONL/stdout but can emit records for nested repositories.
- First executable slice is narrowed to one backend SourceRevision. Frontend integration must partition nested-repository output into independent SourceRevision ingestions; cross-source batch publication remains deferred.
- Validate capture manifest/materialization parity, read-only snapshot behavior and MSBuild writable workspace with a focused feasibility spike.
- Chốt physical storage/transaction và identity integration qua ADR/benchmark.
- The user approved proceeding with the first-slice implementation. The first .NET host/protocol implementation is in place and CI Run #1110 passed 5/5. Its code-index job confirms build, 32 unit tests and immutable-snapshot smoke; Roslyn/MSBuild extracted 36,374 records from the pinned ERPm-BE revision. Remaining work is Core-side process/artifact hardening before the Go Core foundation.

## 7. Evidence và cập nhật

- PR: [#70](https://github.com/I3Solution/ERPm/pull/70), đang mở.
- CI baseline: [Run #1044](https://github.com/I3Solution/ERPm/actions/runs/43181828139), 5/5 jobs passed for commit `763d62ab26951708506a7823ccea51fc71e75967`; later snapshot-design commits are awaiting their own CI.
- Ngày cập nhật cuối: 2026-11-12.
- Implementation commit(s): host command/protocol, unit tests, immutable-snapshot smoke and documentation are on `loipham/phase0-workspace-boundary` / PR #70.
- Verification: CI Run #1110 passed 5/5 jobs. Code-index build succeeded; 32/32 unit tests passed; immutable-snapshot smoke extracted 36,374 records and passed artifact/snapshot checks.
- Latest docs-only follow-up CI: Run #1114 pending at the time of this update.
- Đây là design proposal; chưa có runtime implementation hoặc runtime verification.
