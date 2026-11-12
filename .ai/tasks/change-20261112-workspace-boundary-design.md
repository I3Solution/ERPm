# [change] Thiết kế ranh giới Tenant / Workspace / Project / Source

> **Loại:** change  
> **Ngày tạo:** 2026-11-12 · **Người làm:** AI Agent (ChatGPT) · **Người yêu cầu:** User  
> **Trạng thái:** Doing  
> **Progress aggregation:** v1  
> **Liên quan:** .ai/architecture/enterprise-knowledge-platform.md, .ai/plans/roadmap-enterprise-knowledge-platform.md  
> **Phạm vi:** Root repository — tài liệu kiến trúc Enterprise Knowledge Platform

## 1. Mô tả

Thiết kế ranh giới sở hữu, cô lập dữ liệu và phân quyền cho nền tảng Enterprise Knowledge Platform có khả năng phục vụ nhiều tổ chức, nhiều workspace và nhiều project.

Thiết kế phải phân biệt rõ khái niệm Knowledge Workspace của nền tảng với Agent Workspace Context hiện có trong .ai/context/workspace-map.yaml. Chưa triển khai database schema, API hoặc runtime authorization trong task này.

## 2. Phân tích

- Metadata hiện tại dưới .ai/context/ mô tả developer workspace gồm umbrella repository và các submodule pin SHA; đây là metadata điều hướng agent, không phải registry tenancy của platform.
- Architecture tổng thể đã xác định platform cần multi-workspace, multi-source, revision-awareness và ACL; nhưng chưa có ownership model cụ thể cho Tenant, Workspace, Project và Source.
- Rủi ro chính nếu định nghĩa ranh giới sai: lộ knowledge qua retrieval/search/cache/worker, project scope không rõ ràng, hoặc phải di trú dữ liệu khi mở rộng nhiều workspace.
- Thiết kế hiện tại là đề xuất để review, chưa phải implementation contract được chấp thuận.

## 3. Features / Milestones

- [x] Rà soát metadata hiện tại và phân biệt Agent Workspace Context với Knowledge Workspace.
- [x] Đề xuất hierarchy, ownership và quan hệ Tenant → Workspace → Project → Source.
- [x] Đề xuất identity, authorization inheritance, source ACL mode và isolation requirements.
- [x] Chốt nguyên tắc chính: Knowledge Workspace là ranh giới cô lập dữ liệu; Project chỉ thu hẹp quyền bên trong Workspace.
- [ ] Review và chốt các quyết định chi tiết còn mở về Tenant, quyền kế thừa, source ACL, identity và lifecycle.

Giữ nguyên các feature đã hoàn tất; chỉ bổ sung feature khi scope thực sự mở rộng.

## 4. Cách làm

- Đọc AGENTS.md, .ai/context/README.md, workspace-map.yaml, repository-registry.yaml, context-policy.md, .ai/tasks/README.md và _TEMPLATE.md.
- Tạo .ai/architecture/workspace-boundary.md làm tài liệu thiết kế độc lập.
- Chưa tạo runtime model, migration, API hoặc code authorization.
- Không sửa .ai/status.md.

## 5. Kiểm tra

- Đã đối chiếu thuật ngữ và metadata workspace hiện có với bootstrap/context policy.
- Chưa chạy build hoặc automated tests vì task chỉ tạo tài liệu kiến trúc.
- User đã chấp thuận nguyên tắc cô lập Workspace/Project ngày 2026-11-12.
- Các quyết định chi tiết về Tenant, role inheritance, source ACL, identity và lifecycle vẫn đang ở trạng thái proposal.

## 6. Việc còn lại

- Nhận review cho các quyết định trong .ai/architecture/workspace-boundary.md.
- Core boundary đã được chốt; chi tiết ACL/identity và source access vẫn cần hoàn thiện.
- Canonical Knowledge Contract và Ingestion Pipeline đã có task records riêng trong PR #70.
- Không triển khai schema/runtime trước khi các ranh giới và quy tắc ACL được chấp thuận.

## 7. Evidence và cập nhật

- Commit / PR: PR [#70](https://github.com/I3Solution/ERPm/pull/70) đang mở; branch head `8c303361c9a3fbdf98c449eeffd2e3fb99d96621`.
- CI / workflow run và kết quả: Không áp dụng; chưa chạy CI.
- Tài liệu chính: .ai/architecture/workspace-boundary.md.
- Ngày cập nhật cuối: 2026-11-12.
- Đã draft thiết kế; việc review/approval vẫn còn mở.
