# [change] Thiết kế Connector / Extractor / Normalizer và Ingestion Lifecycle

> **Loại:** change  
> **Ngày tạo:** 2026-11-12 · **Người làm:** AI Agent (ChatGPT) · **Người yêu cầu:** User  
> **Trạng thái:** Doing — stage I/O schemas and proposed attempt/retry contract added; latest CI pending  
> **Progress aggregation:** v1  
> **Liên quan:** .ai/architecture/workspace-boundary.md, .ai/architecture/canonical-knowledge-contract.md, .ai/architecture/enterprise-knowledge-platform.md  
> **Phạm vi:** Root repository — kiến trúc ingestion platform

## 1. Mô tả

Thiết kế ranh giới trách nhiệm và contract logic cho Connector, Extractor, Processor, Normalizer, Validator, Publisher và Orchestrator; đồng thời định nghĩa ingestion lifecycle, revision semantics, idempotency, concurrency, checkpoint, atomic publication, freshness và failure behavior.

Chưa triển khai runtime worker, queue, database schema hoặc API.

## 2. Phân tích

- Connector chỉ giao tiếp/capture source; không được tự gán Tenant/Workspace/Project hoặc ghi canonical store.
- Extractor hiểu format/technology và tạo source-grounded observations.
- Processor là stage tùy chọn cho transformation có lineage.
- Normalizer chuyển source-specific observations sang Canonical Knowledge Contract.
- Validator kiểm tra scope, revision, evidence, relation và completeness.
- Publisher làm revision hiển thị theo readiness transition; không để record-level partial visibility.
- Orchestrator điều phối job, retry, checkpoint, audit và concurrency.
- SourceRevision bất biến; Git selector phải resolve về exact commit SHA.
- V1 ưu tiên một SourceRevision trên mỗi normalized batch, cross-source derivation để sau.

## 3. Features / Milestones

- [x] Định nghĩa trách nhiệm Connector, Extractor, optional Processor, Normalizer, Validator, Publisher và Orchestrator.
- [x] Đề xuất boundary contracts giữa các stage.
- [x] Đề xuất IngestionRun lifecycle, idempotency và concurrency/checkpoint semantics.
- [x] Đề xuất validation, staging và atomic publication/freshness model.
- [x] Chốt một IngestionRun quản lý durable request, lifecycle và retry attempts; không tạo IngestionRequest riêng trong v1.
- [x] Tách canonical publication/readiness khỏi trạng thái full-text/vector projection bất đồng bộ.
- [x] Chốt atomic publication theo toàn bộ SourceRevision.
- [x] Chốt trigger v1 gồm manual + webhook; schedule để sau.
- [x] Cho phép publish với warnings khi chỉ thiếu phần optional và đạt completeness policy.
- [x] Chặn publish khi mandatory data/stage hoặc validity/integrity requirement thất bại; giữ revision published tốt trước đó.
- [x] Tạo JSON Schema Draft 2020-12 cho IngestionProfile, IngestionRun và PublicationManifest.
- [x] Thêm valid fixtures và automated schema validation vào CI.
- [x] Định nghĩa proposed StageInvocation và child StageAttempt contracts; liên kết attempt về IngestionRun.
- [x] Tạo JSON Schema và valid fixtures cho SourceCaptureManifest, ExtractionManifest, ProcessingManifest, NormalizationManifest và ValidationReport.
- [x] Định nghĩa input/output mapping cho sáu component stages, checkpoint fingerprint, retry classification, optional Processor, cancellation và supersession.
- [x] Thêm CI schema/semantic tests cho stage contract, manifest lineage, aggregate counts, completeness ratios và retry/checkpoint invariants.
- [ ] User review/approval cho các chi tiết stage I/O, attempt và retry/cancellation semantics.
- [ ] Chốt projection version/readiness, source-specific completeness vocabulary, webhook security và large-revision manifest protocol.

Giữ nguyên các feature đã hoàn thành; chỉ bổ sung feature khi scope thực sự mở rộng.

## 4. Cách làm

- Đọc Workspace Boundary và Canonical Knowledge Contract đã được user review ở mức nguyên tắc.
- Tạo .ai/architecture/ingestion-pipeline.md.
- Gắn task record riêng theo quy ước.
- Chưa tạo code runtime hoặc lựa chọn công nghệ cụ thể.
- Không sửa .ai/status.md.

## 5. Kiểm tra

- Đã kiểm tra pipeline tách khỏi nguồn dữ liệu và không cho Connector/Extractor override scope.
- Đã định nghĩa source revision, provenance, retryable/permanent errors và publication visibility.
- User đã chấp thuận sáu lựa chọn ingestion v1 ngày 2026-11-12: single IngestionRun aggregate, projection readiness độc lập, atomic publication theo SourceRevision, manual + webhook trigger, publish-with-warnings cho phần optional và block publication khi phần required lỗi.
- Canonical publication được định nghĩa là structured-knowledge ready; full-text/vector projection chạy bất đồng bộ và có trạng thái riêng.
- Initial Profile/Run/Publication schemas đã có và CI Run #853 trước bước mở rộng này đã xanh toàn bộ.
- StageInvocation/StageAttempt và năm stage output manifests cùng valid fixtures/semantic tests đã được thêm; CI cho commit mới đang chờ.
- Stage I/O/attempt/retry/cancellation details hiện là proposed v1 draft, chưa ghi nhận là user-approved.
- Chưa có runtime implementation hoặc integration tests.
- Không có claim về build/test runtime.

## 6. Việc còn lại

- User review/approval cho proposed stage I/O, attempt, retry, cancellation và optional Processor semantics.
- Hoàn thiện remaining details cho projection lifecycle, source-family completeness metrics, webhook authentication/replay protection và large-revision commit protocol.
- Thiết kế vertical slice Git Connector → existing Code Extractor adapter → Normalizer → Validator → Publisher.
- Đo retrieval/index projection requirements trước khi chọn search/vector technology.

## 7. Evidence và cập nhật

- PR: [#70](https://github.com/I3Solution/ERPm/pull/70), đang mở.
- CI trước bước stage-contract expansion: [Run #853](https://github.com/I3Solution/ERPm/actions/runs/43154774480) — toàn bộ 5 jobs success.
- CI cho stage-contract expansion: đang chờ workflow của commit mới.
- Tài liệu chính: .ai/architecture/ingestion-pipeline.md.
- Ngày cập nhật cuối: 2026-11-12.
- Sáu quyết định Ingestion v1 đã được user chấp thuận. Proposed stage I/O/attempt/retry contracts, schemas, fixtures và semantic tests đã được thêm; cần CI xác nhận và user review trước runtime implementation.
