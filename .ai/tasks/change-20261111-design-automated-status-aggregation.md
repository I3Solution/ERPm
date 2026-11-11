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
- Generator dùng output xác định theo source SHA; không thêm timestamp hiện tại gây thay đổi giả.

## 3. Features / Milestones
- [x] Chốt mô hình snapshot rebuild và semantics cho task qua nhiều PR.
- [x] Thiết kế task metadata marker và feature checklist.
- [x] Thiết kế trigger, concurrency, latest-master checkout và safe push retry.
- [x] Implement deterministic Python generator, validation và atomic output write.
- [x] Bổ sung unit tests và CI job cho generator.
- [ ] Implement post-merge GitHub Actions workflow và quyền ghi tối thiểu.
- [ ] Verify CI, multi-PR/multi-feature, idempotency, malformed records và push-race behavior.

## 4. Cách làm
- Cập nhật quy tắc trong `AGENTS.md` và `.ai/tasks/README.md`.
- Bổ sung aggregation marker và feature checklist vào task template.
- Ghi thiết kế chi tiết trong `.ai/architecture/task-progress-aggregation.md`.
- Tạo `tools/progress/generate_status.py` để đọc toàn bộ task record đủ điều kiện và rebuild báo cáo.
- Tạo `tests/progress/test_generate_status.py` với unittest.
- Bổ sung job `task-progress` vào `.github/workflows/verify.yml`.
- Chưa chỉnh `.ai/status.md`; file lịch sử chỉ được chuyển sang generated output sau khi workflow chạy thành công.

## 5. Kiểm tra
- Đã rà soát contract parser với task template và task record hiện tại.
- Unit tests đã được thêm nhưng chưa có kết quả CI xác nhận trong báo cáo này.
- Chưa có post-merge aggregation workflow; chưa xác minh runtime write vào `master`.

## 6. Việc còn lại
- Implement post-merge workflow, checkout latest master, rebuild và safe push retry.
- Kiểm tra branch protection / quyền ghi của GitHub Actions trước khi bật direct push.
- Chạy CI và xử lý mọi lỗi được báo cáo.
- Kiểm thử multi-PR cùng task, nhiều feature, malformed records, idempotency và race.

## 7. Evidence và cập nhật
- Commit / PR đã merge: Chưa có.
- CI / workflow run và kết quả: Chờ CI xác nhận.
- Ngày cập nhật cuối: 2026-11-11
- Generator và unit tests đã được thêm trên feature branch; chưa tạo PR hoặc merge.
