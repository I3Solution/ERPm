# [change] Đơn giản hóa quy tắc quản lý trạng thái task

> **Loại:** change
> **Ngày tạo:** 2026-11-11 · **Người làm:** Agent · **Người yêu cầu:** Project owner
> **Trạng thái:** Doing
> **Liên quan:** [Enterprise Knowledge Platform Architecture](../architecture/enterprise-knowledge-platform.md), [Roadmap](../plans/roadmap-enterprise-knowledge-platform.md)
> **Phạm vi:** Root repository; AGENTS.md, .ai/tasks/, .ai/status.md, architecture/roadmap, CI workflow

## 1. Mô tả
- Đơn giản hóa quản lý tiến độ trong repository nhiều developer/Agent.
- Mỗi task tự quản lý status và progress trong task record riêng.
- Cấm cập nhật file status chung.
- Bỏ qua task lịch sử, không migration/validate hồi tố.

## 2. Phân tích
- File status chung tạo điểm tranh chấp khi nhiều PR/Agent hoạt động đồng thời.
- Task record đã có trường trạng thái, tiến độ, verification và việc còn lại.
- Không cần validator, status generator hoặc post-merge aggregation cho yêu cầu hiện tại.

## 3. Cách làm
- Cập nhật AGENTS.md và task-record guidance.
- Cập nhật architecture/roadmap theo mô hình task-level ownership.
- Đánh dấu .ai/status.md là snapshot legacy/frozen.
- Gỡ validator, test và CI job đã thêm ở bước trước.

## 4. Kiểm tra
- Đang kiểm tra thay đổi trên feature branch; chưa có kết quả CI cuối cùng.

## 5. Việc còn lại
- Xác nhận workflow CI sau khi gỡ task-progress job.
- Sau khi CI hoàn tất, cập nhật trạng thái và evidence.

## 6. Evidence và cập nhật
- Commit / PR đã merge: Chưa có.
- CI / workflow run và kết quả: Đang chờ.
- Ngày cập nhật cuối: 2026-11-11
- Chưa có PR hoặc merge; tất cả thay đổi nằm trên feature branch.
