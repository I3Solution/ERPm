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
- [ ] Đồng bộ AGENTS bootstrap với FE/BE sau khi xác minh trạng thái branch và revision mới nhất.
- [ ] Chạy recursive submodule checkout/CI validation trong môi trường local.
- [ ] Đo token/context baseline thực tế trên cùng một task trước/sau.

## Baseline đã xác minh

- Root: `I3Solution/ERPm@a87ffcb2638075f7496b48bc615bd6c516d95db1`, branch `master`.
- FE gitlink: `427ac894cdcf22a3f83ad11c8ac87d817cbec126`.
- BE gitlink: `38763b0b67b96d5998dda76cd71e7015b458b5f4`.
- Root AGENTS: 192 lines.
- Root status: 343 lines / 60,103 characters.
- Root roadmap header references Step 22 while repository tree already contains a Step 24 plan; needs a separate content reconciliation after review.

## Files changed

- `AGENTS.md`
- `.ai/status.md`
- `.ai/history/status-archive-2026-11-10.md`
- `.ai/context/README.md`
- `.ai/context/workspace-map.yaml`
- `.ai/context/repository-registry.yaml`
- `.ai/context/domain-registry.yaml`
- `.ai/context/integration-map.yaml`
- `.ai/context/context-policy.md`
- `.ai/steps/step-24-context-optimization-phase1.md`

## Verification

- GitHub branch creation succeeded from the exact root master SHA.
- Repository tree confirms the FE/BE gitlinks and metadata file paths.
- Content/schema validation and recursive submodule tests remain pending; do not treat the metadata as a generated code index.

## Remaining work

1. Review the metadata with project owners, especially domain boundaries and integration coverage.
2. Align FE/BE AGENTS instructions without changing their code or module gitlinks unexpectedly.
3. Run recursive submodule checkout and the root CI workflow in a local environment.
4. Capture a repeatable before/after context-token benchmark.
