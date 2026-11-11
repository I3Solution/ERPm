# [change] Thiết kế tổng hợp tiến độ task tự động sau khi merge PR

> **Loại:** change
> **Ngày tạo:** 2026-11-11 · **Người làm:** Agent · **Người yêu cầu:** Project owner
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** [Task Progress Aggregation Design](../architecture/task-progress-aggregation.md), [Enterprise Knowledge Platform Roadmap](../plans/roadmap-enterprise-knowledge-platform.md)
> **Phạm vi:** Root repository; task governance, task template, status report design, generator and CI

## 1. Mô tả
Thiết kế và triển khai cơ chế tự động tái tạo `.ai/status.md` sau mỗi PR merge vào `master`, không yêu cầu Developer/Agent chỉnh sửa file tổng. Hỗ trợ task có nhiều feature và tiếp tục qua nhiều PR trên cùng branch.

## 2. Phân tích
- Task record riêng tiếp tục là nguồn dữ liệu gốc.
- `.ai/status.md` là generated output do GitHub Actions sở hữu.
- Mỗi lần chạy phải đọc toàn bộ task record đủ điều kiện trên latest `master`, không cộng dồn dữ liệu PR.
- Task cũ không có marker mới được giữ nguyên và loại khỏi aggregation.
- Generator chỉ đưa dữ liệu task vào report; không thêm source commit SHA hoặc timestamp khiến PR không đổi task vẫn tạo commit status.

## 3. Features / Milestones
- [x] Chốt mô hình snapshot rebuild và semantics cho task qua nhiều PR.
- [x] Thiết kế task metadata marker và feature checklist.
- [x] Thiết kế trigger, concurrency, latest-master checkout và safe push retry.
- [x] Implement deterministic Python generator, validation, atomic output write và consistency check cho task `Done`.
- [x] Bổ sung unit tests và CI job cho generator.
- [x] Implement post-merge GitHub Actions workflow với quyền ghi giới hạn ở aggregation job.
- [ ] Verify CI, bootstrap, multi-PR/multi-feature, idempotency, malformed records và push-race behavior trên master.

## 4. Cách làm
- Cập nhật quy tắc trong `AGENTS.md` và `.ai/tasks/README.md`.
- Bổ sung aggregation marker và feature checklist vào task template.
- Ghi thiết kế chi tiết trong `.ai/architecture/task-progress-aggregation.md`.
- Tạo `tools/progress/generate_status.py` để đọc toàn bộ task record đủ điều kiện và rebuild báo cáo.
- Tạo `tests/progress/test_generate_status.py` với unittest.
- Bổ sung job `task-progress` vào `.github/workflows/verify.yml`.
- Tạo `.github/workflows/aggregate-task-status.yml` dùng `pull_request_target` merged-only, checkout latest `master`, rebuild và push retry.
- Chưa chỉnh `.ai/status.md`; file lịch sử chỉ được thay thế sau khi workflow được merge và chạy thành công.

## 5. Kiểm tra
- Đã rà soát contract parser với task template và task record hiện tại.
- Unit tests đã được thêm vào CI job; chưa xác minh kết quả CI.
- Workflow chỉ checkout trusted latest `master`, không checkout/execute PR head.
- Chưa xác minh quyền direct push của GitHub Actions đối với branch protection trên `master`.

## 6. Việc còn lại
- Xác minh CI job generator tests.
- Sau khi merge workflow, chạy `workflow_dispatch` một lần để bootstrap report.
- Xác minh branch protection và quyền ghi; nếu direct push bị chặn, chuyển sang bot PR theo chính sách repository.
- Kiểm thử multi-PR cùng task, nhiều feature, malformed records, idempotency và race.

## 7. Evidence và cập nhật
- Commit / PR đã merge: Chưa có.
- CI / workflow run và kết quả: Chờ xác nhận.
- Ngày cập nhật cuối: 2026-11-11
- Generator, unit tests, CI job và post-merge workflow đã được thêm trên feature branch; chưa tạo PR hoặc merge.
