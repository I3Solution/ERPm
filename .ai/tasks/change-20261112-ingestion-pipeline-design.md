# [change] Thiết kế Connector / Extractor / Normalizer và Ingestion Lifecycle

> **Loại:** change  
> **Ngày tạo:** 2026-11-12 · **Người làm:** AI Agent (ChatGPT) · **Người yêu cầu:** User  
> **Trạng thái:** Doing  
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
- [ ] Chốt child attempt/stage records, projection version/readiness, completeness metrics, webhook security và large-revision manifest protocol.

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
- Chưa có implementation hoặc automated tests; tài liệu là proposal cho review.
- Không có claim về build/test runtime.

## 6. Việc còn lại

- Chuẩn hóa contracts machine-readable cho stage inputs/outputs, IngestionRun và attempt/stage history.
- Hoàn thiện remaining details cho projection lifecycle, completeness metrics, webhook authentication/replay protection và revision manifest protocol.
- Thiết kế vertical slice Git Connector → existing Code Extractor adapter → Normalizer → Validator → Publisher.
- Đo retrieval/index projection requirements trước khi chọn search/vector technology.

## 7. Evidence và cập nhật

- PR: [#70](https://github.com/I3Solution/ERPm/pull/70), đang mở.
- CI: Chưa có kết luận PASS tổng thể cho PR tại lần cập nhật này.
- Tài liệu chính: .ai/architecture/ingestion-pipeline.md.
- Ngày cập nhật cuối: 2026-11-12.
- Sáu quyết định Ingestion v1 đã được user chấp thuận; các operational details và implementation còn mở.
