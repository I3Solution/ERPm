# ERPm — Trạng thái hiện hành

> Cập nhật: 2026-11-10
> Nguồn trạng thái: các plan/task và commit đã merge; không suy diễn trạng thái từ log lịch sử.
> Lịch sử trước Phase 1: [status-archive-2026-11-10.md](history/status-archive-2026-11-10.md).

## Workspace baseline

- Umbrella repository: `I3Solution/ERPm`, default integration branch: `master`.
- Baseline snapshot: `a87ffcb2638075f7496b48bc615bd6c516d95db1`.
- FE baseline gitlink: `ERPm-FE@427ac894cdcf22a3f83ad11c8ac87d817cbec126`.
- FE Phase 1 branch pointer: `ERPm-FE@dbeaf66687454452886201bb669df1e25478d893`.
- BE baseline gitlink: `ERPm-BE@38763b0b67b96d5998dda76cd71e7015b458b5f4`.
- BE Phase 1 branch pointer: `ERPm-BE@56385da65226f72c3b66f9c839e2fc430ce85210`.
- Chi tiết ownership và quan hệ tích hợp: [Context Workspace Map](context/README.md).

## Current focus

- Các kế hoạch gần nhất hiện diện trong repo: Step 22, Step 23 và Step 24.
- Kế hoạch Step 24: [FE List/Detail and Integration](plans/plan-step-24-fe-list-detail-and-integration.md).
- Các task phát sinh gần nhất được ghi riêng trong `.ai/tasks/`; kiểm tra trạng thái file task và PR/commit trước khi nhận định tiến độ.
- Không coi nội dung lịch sử trong archive là công việc đang mở hoặc bằng chứng nghiệm thu mới.

## In-Progress

- [ ] Phase 1 — Context Optimization: chuẩn hóa bootstrap instructions, workspace metadata, context policy và current status/history separation.
  - Branch: `loipham/step-context-phase1`.
  - Log triển khai: [step-context-optimization-phase1.md](steps/step-context-optimization-phase1.md).

## Next Steps

1. Review các metadata trong `.ai/context/` cùng owner của FE/BE để xác nhận domain boundaries và integration contracts.
2. Kiểm tra recursive submodule checkout, đặc biệt nested HRM gitlink từng có SHA chưa tra cứu được ở snapshot audit.
3. Đo lại lượng tài liệu bootstrap mà coding agent thực sự đọc trước/sau thay đổi.
4. Review domain boundaries và hoàn thiện endpoint/DTO integration map.

## Rules

- Chỉ mục `Completed` ghi việc đã merge và có bằng chứng kiểm tra; nội dung đang làm nằm trong `In-Progress`.
- Mỗi task/step giữ chi tiết tại plan hoặc task file; status chỉ giữ snapshot ngắn và liên kết.
- Không xóa lịch sử. Khi cần rút gọn status, archive snapshot trước rồi mới thay thế.
