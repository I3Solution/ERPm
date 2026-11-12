# [change] Thiết kế Canonical Knowledge Contract v1

> **Loại:** change  
> **Ngày tạo:** 2026-11-12 · **Người làm:** AI Agent (ChatGPT) · **Người yêu cầu:** User  
> **Trạng thái:** Doing — payload schemas and adapter contract added; CI verification pending  
> **Progress aggregation:** v1  
> **Liên quan:** .ai/architecture/workspace-boundary.md, .ai/architecture/enterprise-knowledge-platform.md, Phase 0 roadmap  
> **Phạm vi:** Root repository — platform knowledge/evidence/relation contract

## 1. Mô tả

Đề xuất contract dữ liệu chung cho Enterprise Knowledge Platform, cho phép nhiều domain (Code, Architecture, Document, Database, Business, Development History) dùng chung envelope nhưng vẫn giữ typed payload đặc thù.

Thiết kế phải hỗ trợ Workspace isolation, provenance, immutable source revisions, evidence-first retrieval và quan hệ có kiểm chứng. Không triển khai database schema, API hoặc index migration trong task này.

## 2. Phân tích

- Code index hiện có ba contract lịch sử: backend v1/v2 và frontend v3. Các schema này source-specific và phải tiếp tục được giữ nguyên.
- Dùng một common envelope với typed payload và adapter ở ingestion boundary để không ép mọi domain vào một enum hoặc metadata bag không có semantics.
- Tách KnowledgeRecord, Evidence, KnowledgeRelation và SourceRevision để phân biệt knowledge item, bằng chứng nguồn, graph edge đã resolve và snapshot nguồn.
- Tách assertion origin (source observation / deterministic extraction / human assertion / model inference) khỏi verification state (verified / partial / unknown).
- Search/vector index là derived projection, không phải canonical source of truth.

## 3. Features / Milestones

- [x] Rà soát code index v1/v2/v3 và các invariant provenance hiện có.
- [x] Đề xuất common envelope, typed payload families và workspace scope.
- [x] Đề xuất Evidence, KnowledgeRelation, SourceRevision, provenance và versioning semantics.
- [x] Chốt envelope split thành KnowledgeRecord / Evidence / KnowledgeRelation / SourceRevision.
- [x] Chốt logicalKey bắt buộc cho entity có identity ổn định; optional cho chunk/observation không có identity ổn định.
- [x] Chốt payload v1 ban đầu: code.file, code.symbol, code.reference_observation, code.api_observation.
- [x] Hoãn cross-source derived records; v1 tập trung single-source ingestion.
- [x] Chốt không ghi đè lịch sử extraction/payload; retention duration và deletion obligations vẫn cần thiết kế.
- [x] Tạo JSON Schema Draft 2020-12 cho KnowledgeRecord, Evidence, KnowledgeRelation và SourceRevision envelope.
- [x] Thêm valid fixtures và automated schema validation vào CI.
- [x] Tạo bốn payload-specific JSON Schemas Draft 2020-12 và valid fixtures cho `code.file`, `code.symbol`, `code.reference_observation`, `code.api_observation`.
- [x] Chốt identity policy theo từng payload, gồm quy tắc `logicalKey` conditional cho `code.symbol`.
- [x] Định nghĩa adapter mapping từ backend v1/v2 và frontend v3 sang Canonical Knowledge, bao gồm unsupported-kind reporting.

Giữ nguyên các feature đã hoàn thành; chỉ bổ sung feature khi scope thực sự mở rộng.

## 4. Cách làm

- Đọc schema v1/v2/v3 và plan Phase 2 Code Intelligence.
- Tạo .ai/architecture/canonical-knowledge-contract.md.
- Map records hiện có vào canonical types bằng adapter concept; không thay đổi schema hoặc serializer cũ.
- Không sửa .ai/status.md.

## 5. Kiểm tra

- Đối chiếu required fields và enums của backend v1/v2 và frontend v3.
- Kiểm tra thiết kế giữ exact source revision, repository-relative paths, evidence state và frontend typed Angular/API observation.
- Thêm payload-schema tests, invalid discriminator/resolution tests và `logicalKey` semantic tests; kết quả CI cho commit mới đang chờ.
- Initial JSON Schema envelope và valid fixtures đã được thêm; automated schema validation dùng chung CI job, kết quả đang chờ.
- Payload-specific data semantics và cross-record runtime validator chưa được triển khai.
- Chưa chốt physical storage, ID encoding hay role/ACL implementation.

## 6. Việc còn lại

- Chờ CI xác nhận bộ payload-schema/identity tests mới.
- Review adapter mapping contract trước khi triển khai runtime adapter trong Phase 2.
- Đồng bộ contract với [Connector and Ingestion Pipeline](../architecture/ingestion-pipeline.md).
- Tiếp tục review các quyết định wire-level, ID/identity derivation và retention/deletion.
- Kết nối contract với Connector/Extractor/Normalizer/Ingestion design; không migrate cache cũ hoặc thêm document/database extractors trước khi contract implementation được duyệt.

## 7. Evidence và cập nhật

- Commit / PR: thuộc PR [#70](https://github.com/I3Solution/ERPm/pull/70), đang mở.
- CI / workflow run và kết quả: CI tổng thể của PR đang chạy tại lần cập nhật cuối; chưa có kết luận PASS.
- Tài liệu chính: .ai/architecture/canonical-knowledge-contract.md.
- Ngày cập nhật cuối: 2026-11-12.
- User đã chấp thuận 5 quyết định v1 ngày 2026-11-12. Initial envelope schemas và validation fixtures đã được thêm; CI chưa xác nhận kết quả ở lần cập nhật này. Payload details, adapter và runtime implementation còn mở.
