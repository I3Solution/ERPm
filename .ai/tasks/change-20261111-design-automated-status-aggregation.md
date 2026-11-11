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
- Mỗi lần chạy phải đọc toàn bộ task records đủ điều kiện trên latest `master`, không cộng dồn dữ liệu PR.
- Task cũ không có marker mới được giữ nguyên và loại khỏi aggregation.
- Generator chỉ đưa dữ liệu task vào report; không thêm source commit SHA hoặc timestamp khiến PR không đổi task vẫn tạo commit.
- Repository bắt buộc mọi thay đổi vào `master) phải thông qua PR; workflow không được push trực tiếp hoặc bypass branch protection.
- Workflow xuất bản report qua branch automation chuyên dụng và một PR bot; PR này vẫn chịu toàn bộ review/check policy như PR thông thường.

## 3. Features / Milestones
- [x] Chốt mô hình snapshot rebuild và semantics cho task qua nhiều PR.
- [x] Thiết kế task metadata marker và feature checklist.
- [x] Thiết kế trigger, concurrency, latest-master checkout và safe publication.
- [x] Implement deterministic Python generator, validation, atomic output write và consistency check cho task `Done`.
- [x] Bổ sung unit tests và CI job cho generator.
- [x] Implement post-merge GitHub Actions workflow với quyền ghi giới hạn ở aggregation job.
- [x] Chuyển publication sang bot PR để tuân thủ quy tắc bắt buộc PR vào `master`.
- [x] Verify CI job generator tests trên feature branch.
- [ ] Verify bootstrap, multi-PR/multi-feature, idempotency, malformed records, automation-branch race và status PR flow trên master.

## 4. Cách làm
- Cập nhật quy tắc trong `AGENTS.md` và `.ai/tasks/README.md`.
- Bổ sung aggregation marker và feature checklist vào task template.
- Ghi thiết kế chi tiết trong `.ai/architecture/task-progress-aggregation.md`.
- Tạo `tools/progress/generate_status.py` để đọc toàn bộ task record đủ điều kiện và rebuild báo cáo.
- Tạo `tests/progress/test_generate_status.py` với unittest.
- Bổ sung job `task-progress` vào `.github/workflows/verify.yml`.
- Tạo `.github/workflows/aggregate-task-status.yml` dùng `pull_request_target` merged-only, checkout latest `master`, rebuild, cập nhật dedicated automation branch và mở/cập nhật PR về `master`.
- Workflow không checkout/execute PR head, không push vào `master), không force-push nhánh tích hợp và không bypass review/check policy.

## 5. Kiểm tra
- Đã rà soát contract parser với task template và task record hiện tại.
- CI run #631 (`42993219834`) trên commit `17917e7de29633c3226b27317eebf96045df97e6` thành công; cả 4 jobs `backend`, `frontend`, `code-index`, `task-progress` đều `success`. Job `task-progress` xác nhận bước `python -m unittest discover -s tests/progress -v` thành công.
- Workflow chỉ checkout trusted latest `master), không checkout/execute PR head.
- Workflow dùng quyền `contents: write` và `pull-requests: write` ở aggregation job; output được gửi qua PR trên branch chuyên dụng.
- Chưa kiểm chứng runtime của workflow trên `master); chưa xác nhận quyền tạo/push automation branch và mở PR bằng repository token trong thực tế.

## 6. Việc còn lại
- CI job generator tests đã xác minh thành công (run #631).
- Sau khi merge workflow, chạy `workflow_dispatch` một lần để tạo bootstrap status PR.
- Merge bootstrap status PR theo quy trình review/check bình thường để thay thế frozen legacy `.ai/status.md`.
- Kiểm thử multi-PR cùng task, nhiều feature, malformed records, idempotency, automation-branch race và việc cập nhật cùng một status PR.
- Nếu repository policy không cho phép bot token tạo branch/PR, cần cấu hình credential/app được phê duyệt; không nới lỏng branch protection.

## 7. Evidence và cập nhật
- Commit / PR đã merge: Chưa có.
- CI: [run #631](https://github.com/I3Solution/ERPm/actions/runs/42993219834) — success; 4/4 jobs pass, bao gồm `task-progress`.
- Generator, unit tests, CI job và PR-based post-merge workflow đã được thêm trên feature branch; chưa tạo PR hoặc merge.
- Ngày cập nhật cuối: 2026-11-11
