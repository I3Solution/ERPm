# [change] Thiết kế Canonical Knowledge Contract v1

> **Loại:** change  
> **Ngày tạo:** 2026-11-12 · **Người làm:** AI Agent (ChatGPT) · **Người yêu cầu:** User  
> **Trạng thái:** Doing  
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
- [ ] Review và chốt envelope split, logicalKey policy, payload v1 scope, cross-source derivation và retention.

Giữ nguyên các feature đã hoàn thành; chỉ bổ sung feature khi scope thực sự mở rộng.

## 4. Cách làm

- Đọc schema v1/v2/v3 và plan Phase 2 Code Intelligence.
- Tạo .ai/architecture/canonical-knowledge-contract.md.
- Map records hiện có vào canonical types bằng adapter concept; không thay đổi schema hoặc serializer cũ.
- Không sửa .ai/status.md.

## 5. Kiểm tra

- Đối chiếu required fields và enums của backend v1/v2 và frontend v3.
- Kiểm tra thiết kế giữ exact source revision, repository-relative paths, evidence state và frontend typed Angular/API payload.
- Chưa có machine-readable schema hoặc automated tests; đây là design proposal.
- Chưa chốt physical storage, ID encoding hay role/ACL implementation.

## 6. Việc còn lại

- Review các quyết định trong mục 14 của canonical-knowledge-contract.md.
- Sau khi chốt, tạo machine-readable schema/fixtures và adapter contract.
- Thiết kế vertical slice ingestion bằng Code Source trước; không migrate cache cũ hoặc thêm document/database extractors trước khi contract được chấp thuận.

## 7. Evidence và cập nhật

- Commit / PR: thuộc PR [#70](https://github.com/I3Solution/ERPm/pull/70), đang mở.
- CI / workflow run và kết quả: CI tổng thể của PR đang chạy tại lần cập nhật cuối; chưa có kết luận PASS.
- Tài liệu chính: .ai/architecture/canonical-knowledge-contract.md.
- Ngày cập nhật cuối: 2026-11-12.
- Đã draft contract; approval và implementation còn mở.
