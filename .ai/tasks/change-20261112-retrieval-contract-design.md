# [change] Thiết kế Retrieval Contract v1 cho Enterprise Knowledge Platform

> **Loại:** change
> **Ngày tạo:** 2026-11-12 · **Người làm:** AI Agent (ChatGPT) · **Người yêu cầu:** User
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** .ai/architecture/workspace-boundary.md, .ai/architecture/canonical-knowledge-contract.md, .ai/architecture/ingestion-pipeline.md, .ai/architecture/storage-boundary.md
> **Phạm vi:** Root repository — platform retrieval request/result semantics

## 1. Mô tả

Định nghĩa hợp đồng truy vấn tri thức dùng chung cho Query API, MCP và các agent/client khác nhau. Hợp đồng phải giữ nguyên Workspace isolation, revision selection, authorization, evidence provenance và trạng thái khả dụng của các search projection.

Không triển khai API, database query, search engine, ranking model hoặc Context Packet trong task này.

## 2. Phân tích

- Retrieval trả về knowledge candidates có evidence, không tạo câu trả lời hoặc prompt context.
- Mỗi request chỉ thuộc một Knowledge Workspace; Project/Source selector chỉ được thu hẹp quyền.
- Principal, membership và effective ACL được resolve từ trusted platform context, không tin dữ liệu do client tự khai.
- Chỉ truy vấn SourceRevision đã publish và nằm trong committed PublicationManifest.
- Structured retrieval có thể dùng ngay sau canonical publication; full-text/vector phụ thuộc projection readiness.
- Mỗi result cần exact SourceRevision và ít nhất một Evidence locator được authorize.
- Quan hệ chỉ được mở rộng khi resolved, verified, có evidence và cả hai endpoint đều được phép truy cập.

## 3. Features / Milestones

- [x] Xác định phạm vi Workspace/Project/Source và nguyên tắc authorization-first.
- [x] Xác định active/pinned SourceRevision selection và quy tắc published-only.
- [x] Xác định retrieval methods, projection availability và partial-result semantics.
- [x] Xác định result, Evidence, relation expansion, pagination, caching và diagnostics.
- [x] Review và chốt bảy default semantic ở mục 14 của retrieval-contract.md ngày 2026-11-12.
- [x] Tạo JSON Schema Draft 2020-12 cho Retrieval Request, Result và Error.
- [x] Thêm valid fixtures và automated schema/semantic validation vào CI.
- [ ] Hoàn thiện protocol mapping và two-Workspace integration fixtures.

Giữ nguyên các feature đã hoàn thành; chỉ bổ sung feature khi scope thực sự mở rộng.

## 4. Cách làm

- Dựa trên Workspace Boundary, Canonical Knowledge Contract, Ingestion Pipeline và Storage Boundary.
- Tạo .ai/architecture/retrieval-contract.md.
- Đồng bộ architecture và roadmap để tách Retrieval Result khỏi Context Packet.
- Không chọn vendor, tạo endpoint hoặc thay đổi runtime code.
- Không sửa .ai/status.md.

## 5. Kiểm tra

- Đối chiếu mọi retrieval method với Workspace/Project/Source effective ACL.
- Kiểm tra active/pinned selection chỉ đọc committed published revisions.
- Kiểm tra projection unavailable không bị diễn giải thành Empty.
- Kiểm tra Evidence, relation endpoints, pagination cursor và cache đều gắn scope/policy/revision.
- JSON Schema Draft 2020-12 và valid fixtures đã được tạo; automated schema/semantic tests đã được thêm vào CI, đang chờ kết quả run.
- Chưa có OpenAPI/Protobuf mapping hoặc two-Workspace integration test.

## 6. Việc còn lại

- Xác định cursor token encoding/signing, payload-specific filter catalog và ranking policy.
- Hoàn thiện protocol adapters và two-Workspace integration fixtures trước khi triển khai retrieval runtime.
- Đối chiếu Retrieval Result với [Context Packet Contract](../architecture/context-packet-contract.md), bảo đảm item provenance, ACL và projection diagnostics không bị mất khi đóng gói.

## 7. Evidence và cập nhật

- PR: [#70](https://github.com/I3Solution/ERPm/pull/70), đang mở.
- Tài liệu chính: .ai/architecture/retrieval-contract.md.
- Ngày cập nhật cuối: 2026-11-12.
- Bảy default semantic Retrieval v1 đã được user chấp thuận ngày 2026-11-12.
- Semantic draft, ba JSON Schema v1 và valid fixtures đã có; CI validation đã được thêm nhưng chưa có kết quả xác nhận.
- Protocol mapping, two-Workspace integration fixtures và runtime implementation còn mở.
