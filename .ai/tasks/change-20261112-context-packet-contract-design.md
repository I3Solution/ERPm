# [change] Thiết kế Context Packet Contract v1 cho Enterprise Knowledge Platform

> **Loại:** change
> **Ngày tạo:** 2026-11-12 · **Người làm:** AI Agent (ChatGPT) · **Người yêu cầu:** User
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** .ai/architecture/workspace-boundary.md, .ai/architecture/canonical-knowledge-contract.md, .ai/architecture/retrieval-contract.md, .ai/architecture/storage-boundary.md
> **Phạm vi:** Root repository — agent context packaging contract

## 1. Mô tả

Định nghĩa Context Packet trung lập với agent/protocol, đóng gói Retrieval Result thành context có giới hạn token, bảo toàn Evidence, SourceRevision, trust labels, authorization scope và thông tin thiếu hụt.

Không triển khai LLM prompt, model/tokenizer runtime, API/MCP adapter hoặc conversation memory trong task này.

## 2. Phân tích

- Retrieval trả về candidate và evidence; Context Engine chọn lọc và đóng gói cho một task/invocation.
- Packet chỉ thuộc một Workspace và một principal/audience; không phải authorization token hoặc knowledge source of truth.
- Mọi factual item phải truy nguyên về KnowledgeRecord/Evidence/SourceRevision và source-native locator.
- Generated summary là derived/untrusted content, phải liệt kê input evidence và producer/template version.
- Source content và generated summary không được biến thành instruction đáng tin cậy cho agent.
- Token budget là hard ceiling; metadata về scope, provenance, trust và limitation không được âm thầm cắt bỏ.
- Packet immutable sau khi phát hành, có expiry và authorization revalidation trước khi delivery.

## 3. Features / Milestones

- [x] Xác định ranh giới Retrieval Result và Context Packet.
- [x] Xác định packet envelope, context item kinds và provenance requirements.
- [x] Xác định trust/instruction-safety labels và generated-summary lineage.
- [x] Xác định selection, deduplication, conflict, token budget và completeness semantics.
- [x] Xác định lifecycle, authorization freshness, expiry, cache/retention và acceptance scenarios.
- [x] Review và chốt bảy default ở mục 14 của context-packet-contract.md ngày 2026-11-12.
- [x] Tạo JSON Schema Draft 2020-12 cho ContextPacket v1 và ContextProfile v1.
- [ ] Định nghĩa adapter mappings và automated schema/semantic validation fixtures.

Giữ nguyên các feature đã hoàn thành; chỉ bổ sung feature khi scope thực sự mở rộng.

## 4. Cách làm

- Dựa trên Workspace Boundary, Canonical Knowledge Contract, Storage Boundary và Retrieval Contract v1.
- Tạo .ai/architecture/context-packet-contract.md.
- Đồng bộ architecture và roadmap, giữ Context Engine độc lập với một LLM/vendor cụ thể.
- Không triển khai prompt rendering, runtime hoặc transport adapter.
- Không sửa .ai/status.md.

## 5. Kiểm tra

- Kiểm tra mỗi factual item có Evidence và exact SourceRevision.
- Kiểm tra source/summary trust labels và generated-summary lineage.
- Kiểm tra budget có hard limit, omission/truncation rõ ràng và không cắt metadata bắt buộc.
- Kiểm tra ACL revocation trước delivery và giới hạn không thể recall nội dung đã gửi ra ngoài.
- Chưa có machine-readable schema hoặc automated test; đây là semantic draft.

## 6. Việc còn lại

- Hoàn thiện adapter mappings cho Query API/MCP/IDE clients.
- Tạo automated schema validation và semantic fixtures; chọn JSON/Protobuf trong protocol ADR.
- Định nghĩa adapter mapping cho Query API/MCP/IDE clients mà không mất trust/provenance metadata.
- Thiết kế evaluation dataset cho evidence coverage, token efficiency, omission rate và prompt-injection containment.

## 7. Evidence và cập nhật

- PR: [#70](https://github.com/I3Solution/ERPm/pull/70), đang mở.
- Tài liệu chính: .ai/architecture/context-packet-contract.md.
- Ngày cập nhật cuối: 2026-11-12.
- User đã chấp thuận bảy semantic default Context Packet v1 ngày 2026-11-12.
- Semantic contract đã được chốt; chưa có machine-readable schema, adapter mapping, evaluation fixture hoặc runtime implementation.
