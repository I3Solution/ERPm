# [spike] First Vertical Slice — Git Code Knowledge Ingestion Design

> **Loại:** spike
> **Ngày tạo:** 2026-11-12 · **Người làm:** AI Agent (ChatGPT) · **Người yêu cầu:** User
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** .ai/plans/roadmap-enterprise-knowledge-platform.md, .ai/architecture/technology-strategy.md, .ai/architecture/code-index-adapter-contract.md, .ai/architecture/ingestion-pipeline.md
> **Phạm vi:** Root repository — first reusable Go Core vertical slice design

## 1. Mô tả

Thiết kế luồng end-to-end đầu tiên cho Enterprise Knowledge Platform: registered Git Source → exact SourceRevision capture → existing backend/frontend extractors → Canonical Knowledge adapter → validation → atomic publication → structured retrieval. ERPm chỉ là pilot; không thay đổi contract hiện tại hoặc rewrite indexers.

## 2. Phân tích

- Go là ngôn ngữ Core đã được chấp thuận; triển khai ban đầu theo modular monolith.
- Python chưa cần cho deterministic code extraction; chỉ thêm khi có AI/ML workload cụ thể.
- Existing Roslyn và TypeScript extractors giữ nguyên; transport/invocation phải được xác minh từ source trước khi thiết kế adapter runtime.
- Slice phải chứng minh Workspace isolation, revision provenance, whole-revision publication và evidence retrieval.
- Không triển khai vector search, public SDK, MCP write tools hoặc microservices trong slice đầu.

## 3. Features / Milestones

- [x] Xác định mục tiêu, phạm vi và logical Go module ownership cho first vertical slice.
- [x] Xác định end-to-end flow và acceptance scenarios về revision, publication, ACL và client evidence.
- [x] Ghi nhận discovery gates cho extractor invocation, immutable capture, submodule mapping và storage commit.
- [ ] Inspect actual backend/frontend extractor entry points and define evidence-backed invocation adapter contract.
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
- Chưa chạy runtime build/test vì chưa có runtime implementation.

## 6. Việc còn lại

- Inspect source extractor invocation và snapshot behavior trước khi code.
- Chốt physical storage/transaction và identity integration qua ADR/benchmark.
- Chờ user review slice boundary trước khi tạo Go runtime foundation.

## 7. Evidence và cập nhật

- PR: [#70](https://github.com/I3Solution/ERPm/pull/70), đang mở.
- CI baseline: [Run #1013](https://github.com/I3Solution/ERPm/actions/runs/43179810828), 5/5 jobs passed trước khi bổ sung slice design.
- Ngày cập nhật cuối: 2026-11-12.
- Đây là design proposal; chưa có runtime implementation hoặc runtime verification.
