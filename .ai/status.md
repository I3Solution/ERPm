# ERPm — Trạng thái hiện hành

> Cập nhật: 2026-11-10
> Nguồn trạng thái: các plan/task, commit đã merge và kết quả verification có bằng chứng.
> Lịch sử trước Phase 1: [status-archive-2026-11-10.md](history/status-archive-2026-11-10.md).

## Workspace baseline

- Umbrella repository: `I3Solution/ERPm`, default integration branch: `master`.
- Baseline snapshot trước Phase 1: `a87ffcb2638075f7496b48bc615bd6c516d95db1`.
- Phase 1 merge commit: `6c3204172ade56ac6b575f38d34dc38f8b85d049`.
- FE gitlink tại Phase 1: `ERPm-FE@dbeaf66687454452886201bb669df1e25478d893`.
- BE gitlink tại Phase 1: `ERPm-BE@56385da65226f72c3b66f9c839e2fc430ce85210`.
- Chi tiết ownership và quan hệ tích hợp: [Context Workspace Map](context/README.md).

## Current focus

- Các kế hoạch gần nhất hiện diện trong repo: Step 22, Step 23 và Step 24.
- Kế hoạch Step 24: [FE List/Detail and Integration](plans/plan-step-24-fe-list-detail-and-integration.md).
- Các task phát sinh gần nhất được ghi riêng trong `.ai/tasks/`; kiểm tra trạng thái file task và PR/commit trước khi nhận định tiến độ.
- Không coi nội dung lịch sử trong archive là công việc đang mở hoặc bằng chứng nghiệm thu mới.

## Completed

- [x] Phase 1 — Context Optimization: bootstrap theo task, workspace/domain metadata, progressive context policy và tách current status khỏi lịch sử.
  - Verification: recursive submodule checkout thành công; root GitHub Actions backend/frontend checks đều PASS; bốn file YAML metadata parse thành công.
  - Implementation PRs: root #54, FE #28, BE #39.
  - Benchmark token/context thực tế được hoãn đến task đầu tiên phù hợp; không dùng task giả để tạo baseline.

## In-Progress

- [ ] Phase 2 — Code Intelligence & Dependency Indexing: lập kế hoạch kiến trúc và chuẩn bị vertical slice đầu tiên. Chi tiết: [Phase 2 plan](plans/plan-phase2-code-intelligence.md). Implementation chưa bắt đầu.

## Next Steps

1. Hoàn tất Step 2.1: chốt index contract, workspace manifest và cache/provenance policy.
2. Hoàn tất Step 2.2: xây dựng Backend Roslyn vertical slice, kiểm thử bằng fixture và truy vấn symbol thực tế.
3. Sau khi vertical slice đạt tiêu chí, triển khai TypeScript/Angular indexer và database metadata index theo [Phase 2 plan](plans/plan-phase2-code-intelligence.md).
4. Khi có task code thực tế phù hợp, đo baseline token/context theo cùng task; không dùng task giả để tạo số liệu.

## Rules

- Chỉ mục `Completed` ghi việc đã merge và có bằng chứng kiểm tra; nội dung đang làm nằm trong `In-Progress`.
- Mỗi task/step giữ chi tiết tại plan hoặc task file; status chỉ giữ snapshot ngắn và liên kết.
- Không xóa lịch sử. Khi cần rút gọn status, archive snapshot trước rồi mới thay thế.
