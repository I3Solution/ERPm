# [change] Thiết kế Storage Boundary cho Enterprise Knowledge Platform

> **Loại:** change  
> **Ngày tạo:** 2026-11-12 · **Người làm:** AI Agent (ChatGPT) · **Người yêu cầu:** User  
> **Trạng thái:** Doing
> **Progress aggregation:** v1  
> **Liên quan:** .ai/architecture/workspace-boundary.md, .ai/architecture/canonical-knowledge-contract.md, .ai/architecture/ingestion-pipeline.md  
> **Phạm vi:** Root repository — logical storage architecture

## 1. Mô tả

Thiết kế ranh giới lưu trữ logic cho Control Plane, Artifact Store, Canonical Knowledge Store, Search Projection Store, operational staging và cache. Làm rõ data authority, workspace isolation, publication consistency, read path, retention và tiêu chí đánh giá công nghệ.

Không chọn vendor, tạo physical schema/migration hoặc triển khai storage runtime trong task này.

## 2. Phân tích

- Control Plane là authority cho ownership, configuration, source revisions, IngestionRun, publication catalog và projection state.
- Artifact Store lưu snapshot/source bytes và artifact lớn bất biến.
- Canonical Knowledge Store lưu KnowledgeRecord, Evidence, KnowledgeRelation và typed payload.
- Search Projection Store chứa full-text/vector/ranking projection có thể rebuild.
- Staging thuộc lifecycle của IngestionRun; dữ liệu chưa publish không được xuất hiện trong Retrieval.
- Cache là disposable và bắt buộc gắn scope, ACL/policy version, source revision và projection/contract version.
- Atomicity theo toàn bộ SourceRevision; canonical publication không phụ thuộc search/vector projection hoàn tất.

## 3. Features / Milestones

- [x] Xác định storage domains và data authority.
- [x] Xác định trách nhiệm Control Plane, Artifact Store, Canonical Store và Search Projection Store.
- [x] Đề xuất publication catalog/manifest, read path, staging và cache isolation.
- [x] Đề xuất retention/deletion/recovery và security requirements.
- [x] Review và ghi nhận default cho deployment consolidation, Git snapshot/archive, retention policy, projection adapters và benchmark scenario.
- [ ] Thực thi benchmark hai Workspace và chốt các ngưỡng định lượng.

Giữ nguyên các feature đã hoàn thành; chỉ bổ sung feature khi scope thực sự mở rộng.

## 4. Cách làm

- Dựa trên Workspace Boundary, Canonical Knowledge Contract và Ingestion Pipeline đã được review ở mức nguyên tắc.
- Tạo .ai/architecture/storage-boundary.md.
- Cập nhật architecture và roadmap để liên kết Storage Boundary và ghi nhận các quyết định đã được user chấp thuận.
- Không chọn công nghệ hoặc thay đổi runtime code.
- Không sửa .ai/status.md.

## 5. Kiểm tra

- Đối chiếu storage ownership với SourceRevision, IngestionRun, KnowledgeRecord, Evidence và KnowledgeRelation.
- Kiểm tra canonical publication có thể hoàn tất trước search/vector projection.
- Kiểm tra revision staging không hiển thị trước khi manifest/readiness pointer commit.
- Chưa có physical schema, benchmark hoặc automated test; đây là design proposal.

## 6. Việc còn lại

- Tạo benchmark corpus và thực thi kịch bản tối thiểu với hai Workspace, ACL tách biệt, cùng content hash, ingestion lỗi, out-of-order revision, projection failure/rebuild và stale cache.
- Chốt retention/legal deletion theo từng deployment trước production.
- Tạo technology ADR dựa trên kết quả benchmark; chưa chọn vendor hoặc physical topology trong task thiết kế logic này.

## 7. Evidence và cập nhật

- PR: [#70](https://github.com/I3Solution/ERPm/pull/70), đang mở.
- Tài liệu chính: .ai/architecture/storage-boundary.md.
- Ngày cập nhật cuối: 2026-11-12.
- Đã ghi nhận năm quyết định logical storage được user chấp thuận ngày 2026-11-12.
- Chưa chạy benchmark thực tế; vendor selection, retention duration/legal deletion và physical deployment còn mở.
