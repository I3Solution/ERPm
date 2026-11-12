# [spike] Technology Strategy ADR for Enterprise Knowledge Platform

> **Loại:** spike
> **Ngày tạo:** 2026-11-12 · **Người làm:** AI Agent (ChatGPT) · **Người yêu cầu:** User
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** .ai/plans/roadmap-enterprise-knowledge-platform.md, .ai/architecture/enterprise-knowledge-platform.md, .ai/architecture/storage-boundary.md
> **Phạm vi:** Root repository — technology strategy and future runtime layout

## 1. Mô tả

Đề xuất công nghệ cho Enterprise Knowledge Platform độc lập với ERPm: Go là ngôn ngữ chính của Core Platform, Python cho AI/ML Runtime chuyên biệt và extension hỗ trợ đa ngôn ngữ qua contract/API/MCP. Chưa tạo runtime hoặc SDK.

## 2. Phân tích

- Platform chưa có Core Runtime production cần migration; hiện có architecture, contract, schema và semantic tests.
- Go là ứng viên Core nhờ concurrency, deployment và backend ecosystem; không tuyên bố Go mạnh hơn C# về AI.
- Python giữ lợi thế hệ sinh thái AI/ML.
- C#/.NET vẫn là ngôn ngữ extension và phương án đối chứng nếu benchmark cho thấy phù hợp hơn.
- Khả năng mở rộng đa ngôn ngữ phụ thuộc contract/versioning, process isolation, security và conformance tests, không phụ thuộc Core language.
- Modular monolith trước; không tách microservice hoặc tạo runtime hàng loạt sớm.

## 3. Features / Milestones

- [x] Ghi nhận Go Core + Python AI/ML + multilingual extension là technology direction đề xuất.
- [x] Xác định trách nhiệm ngôn ngữ theo bounded capability và nguyên tắc không rewrite existing indexers.
- [x] Đề xuất process-isolated extension model và language-neutral contract/conformance requirements.
- [x] Đề xuất repository layout tương lai, không tạo placeholder runtime directories.
- [ ] User review/approval ADR trước khi xem đây là technology lock.
- [ ] Thiết kế benchmark/vertical-slice acceptance targets sau khi boundary được duyệt.
- [ ] Triển khai runtime foundation theo vertical slice đã được phê duyệt.

## 4. Cách làm

- Tạo .ai/architecture/technology-strategy.md.
- Cập nhật platform architecture và roadmap để loại bỏ gợi ý công nghệ cũ mâu thuẫn.
- Không tạo Go module, Python package, SDK, API, database migration, worker hoặc queue.
- Không sửa .ai/status.md.

## 5. Kiểm tra

- Review consistency với Workspace, Canonical Knowledge, Ingestion, Retrieval, Projection và Storage contracts.
- Xác nhận repository layout là proposed-only; không có runtime scaffold.
- CI kiểm tra Markdown/JSON contract theo workflow hiện có.

## 6. Việc còn lại

- Chờ user review/approval ADR.
- Chốt numeric benchmark workload/targets và vertical slice boundary trước runtime.

## 7. Evidence và cập nhật

- PR: [#70](https://github.com/I3Solution/ERPm/pull/70), đang mở.
- CI baseline: [Run #1013](https://github.com/I3Solution/ERPm/actions/runs/43179810828), 5/5 jobs success cho commit 91147cda903f1d48cb2cef235dc52b842e2e5aec.
- Ngày cập nhật cuối: 2026-11-12.
- ADR là proposal; chưa có user approval cho technology lock hoặc runtime implementation.
