# Phase 1 — Context Optimization

## Mục tiêu

Thiết lập nền tảng quản lý context theo mô hình Umbrella-first, Domain-aware, Repository-scoped; giảm bootstrap dư thừa nhưng không làm mất quy tắc kỹ thuật hoặc lịch sử dự án.

## Phạm vi

- [x] Xác minh root branch, HEAD và gitlink FE/BE.
- [x] Tạo nhánh cá nhân `loipham/step-context-phase1` từ root master.
- [x] Tạo workspace/repository/domain/integration metadata ban đầu.
- [x] Viết context policy theo progressive retrieval và provenance.
- [x] Tách current status khỏi snapshot lịch sử.
- [x] Rút gọn root AGENTS thành bootstrap + routing instructions.
- [x] Đồng bộ bootstrap policy với `ERPm-FE/AGENTS.md` và `ERPm-BE/AGENTS.md` trên các nhánh riêng.
- [x] Kiểm tra recursive submodule checkout trong workspace local; FE/BE và nested module submodules, bao gồm HRM, đã được checkout.
- [x] Root GitHub Actions CI sau merge: backend và frontend jobs đều PASS; workflow checkout submodules recursive, build BE/FE và chạy verification/test steps.
- [x] Parse validation cho bốn YAML metadata files: workspace map, repository registry, domain registry và integration map.
- [ ] Đo token/context baseline thực tế trên cùng một task trước/sau — **deferred** đến task code thực tế đầu tiên; không tạo task giả.

## Baseline và revision

- Root baseline trước Phase 1: `I3Solution/ERPm@a87ffcb2638075f7496b48bc615bd6c516d95db1`.
- Root Phase 1 PR head: `cf87df111ba7b9606151b01aff10361462c0a0e9`.
- Root Phase 1 merge commit: `6c3204172ade56ac6b575f38d34dc38f8b85d049`.
- FE baseline gitlink: `427ac894cdcf22a3f83ad11c8ac87d817cbec126`; Phase 1 pinned commit: `dbeaf66687454452886201bb669df1e25478d893`.
- BE baseline gitlink: `38763b0b67b96d5998dda76cd71e7015b458b5f4`; Phase 1 pinned commit: `56385da65226f72c3b66f9c839e2fc430ce85210`.
- Root AGENTS: 192 lines trước tối ưu; root status: 343 lines / 60,103 characters trước khi tách lịch sử.
- Nested HRM gitlink `f66e1bb61fe222684a9c63addde93c11d1559df1` đã checkout thành công trong workspace local.

## Files changed

- `AGENTS.md` (root, FE, BE)
- `.ai/status.md`
- `.ai/history/status-archive-2026-11-10.md`
- `.ai/context/README.md`
- `.ai/context/workspace-map.yaml`
- `.ai/context/repository-registry.yaml`
- `.ai/context/domain-registry.yaml`
- `.ai/context/integration-map.yaml`
- `.ai/context/context-policy.md`
- `.ai/steps/step-context-optimization-phase1.md`

## Verification evidence

- Local recursive checkout: user-provided `git submodule status --recursive` output shows FE/BE at the exact Phase 1 gitlinks and all nested FE module gitlinks, including HRM.
- Root CI on merge commit `6c3204172ade56ac6b575f38d34dc38f8b85d049`:
  - Backend job: SUCCESS.
  - Frontend job: SUCCESS.
  - Workflow uses `actions/checkout` with `submodules: recursive`; backend runs `dotnet build` and verification projects; frontend runs `npm ci`, `npm run build` and `npm test`.
- YAML syntax: all four metadata files parsed successfully with PyYAML.
- FE and BE `AGENTS.md` at their pinned revisions contain the task-scoped bootstrap while retaining repository-specific technical and Git rules.
- This verification does not claim a full semantic audit of every domain boundary or a generated code index.

## Remaining work / deferred validation

1. Capture a repeatable before/after token/context benchmark on the first suitable real implementation task.
2. Confirm domain ownership with FE/BE owners and expand the FE endpoint → BE route/DTO matrix when supported by source tracing.
3. Reconcile the roadmap planning snapshot's Step 22 header with the later Step 23/24 plans as a separate documentation task.

## Completion note

Phase 1 implementation and static/integration verification are complete. The empirical token/context benchmark and deeper domain/contract mapping remain explicitly deferred; they are not represented as completed.
