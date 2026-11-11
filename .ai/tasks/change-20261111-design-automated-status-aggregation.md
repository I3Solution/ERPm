# [change] Thiết kế tổng hợp tiến độ task tự động sau khi merge PR

> **Loại:** change
> **Ngày tạo:** 2026-11-11 · **Người làm:** Agent · **Người yêu cầu:** Project owner
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** [Task Progress Aggregation Design](../architecture/task-progress-aggregation.md), [Enterprise Knowledge Platform Roadmap](../plans/roadmap-enterprise-knowledge-platform.md)
> **Phạm vi:** Root repository; task governance, task template, status report design

## 1. Mô tả
Thiết kế cơ chế tự động tái tạo `.ai/status.md` sau mỗi PR merge vào `master`, không yêu cầu Developer/Agent chỉnh sửa file tổng. Hỗ trợ task có nhiều feature và tiếp tục qua nhiều PR trên cùng branch.

## 2. Phân tích
- Task record riêng tiếp tục là nguồn dữ liệu gốc.
- `.ai/status.md` là generated output do GitHub Actions sở hữu.
- Mỗi lần chạy phải đọc toàn bộ task record đủ điều kiện trên latest `master`, không cộng dồn dữ liệu PR.
- Task cũ không có marker mới được giữ nguyên và loại khỏi aggregation.

## 3. Features / Milestones
- [x] Chốt mô hình snapshot rebuild và semantics cho task qua nhiều PR.
- [x] Thiết kế task metadata marker và feature checklist.
- [x] Thiết kế trigger, concurrency, latest-master checkout và safe push retry.
- [ ] Implement generator, tests và GitHub Actions workflow.

## 4. Cách làm
- Cập nhật quy tắc trong `AGENTS.md` và `.ai/tasks/README.md`.
- Bổ sung aggregation marker và feature checklist vào task template.
- Ghi thiết kế chi tiết trong `.ai/architecture/task-progress-aggregation.md`.
- Cập nhật roadmap và governance để ghi rõ automation chưa được triển khai; giữ nguyên `.ai/status.md` legacy cho đến khi workflow được triển khai.

## 5. Kiểm tra
- Đã kiểm tra nội dung hiện có của AGENTS.md, task README/template, architecture, roadmap, status.md và workflow CI trên feature branch.
- Chưa có generator, unit tests hoặc GitHub Actions aggregation workflow; chưa có CI evidence cho runtime automation.

## 6. Việc còn lại
- Implement generator và parser/unit tests.
- Implement post-merge workflow với quyền ghi tối thiểu.
- Kiểm thử multi-PR cùng task, multi-feature, concurrency, malformed records, idempotency và push race.

## 7. Evidence và cập nhật
- Commit / PR đã merge: Chưa có.
- CI / workflow run và kết quả: Chưa triển khai.
- Ngày cập nhật cuối: 2026-11-11
- Thiết kế và quy tắc mới nằm trên feature branch; chưa tạo PR hoặc merge.
