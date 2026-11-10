# ERPm — Trạng thái hiện hành

> Cập nhật: 2026-11-10  
> Nguồn trạng thái: plan/step, commit đã merge và kết quả verification có bằng chứng.  
> Lịch sử trước Phase 1: [status-archive-2026-11-10.md](history/status-archive-2026-11-10.md).

## Workspace baseline

- Umbrella repository: `I3Solution/ERPm`, integration branch: `master`.
- Current root baseline: `d72119b308d6d11f4ba886e4368ab2f53616cb53` (PR #58 merge).
- Backend gitlink: `ERPm-BE@56385da65226f72c3b66f9c839e2fc430ce85210`.
- Frontend gitlink: `ERPm-FE@dbeaf66687454452886201bb669df1e25478d893`.
- Chi tiết ownership và quan hệ tích hợp: [Context Workspace Map](context/README.md).

## Completed

- [x] Phase 1 — Context Optimization: bootstrap theo task, workspace/domain metadata, progressive context policy và tách current status khỏi lịch sử.
  - Verification: recursive submodule checkout thành công; root GitHub Actions backend/frontend checks PASS; bốn file YAML metadata parse thành công.
  - Implementation PRs: root #54, FE #28, BE #39; validation follow-up #55.
  - Benchmark token/context thực tế vẫn được hoãn đến task phù hợp.
- [x] Phase 2 architecture and implementation plan — [PR #57](https://github.com/I3Solution/ERPm/pull/57) merged.
- [x] Initial Code Index CLI implementation — [PR #58](https://github.com/I3Solution/ERPm/pull/58) merged.
  - Added workspace manifest validation, local cache, JSONL index contract and initial Roslyn backend definitions/references indexer.
  - User confirmed PR #58 CI passed.
  - User ran `workspace status`; all 12 root/recursive repositories matched expected pinned SHAs.
  - User ran backend indexing successfully at the pinned BE SHA; output contained 148,944 records.
  - User queried `BaseCrudController` and inspected index statistics/samples.

## In Progress

- [ ] Phase 2 — Backend indexer quality follow-up.
  - Detailed plan: [plan-step-2.2-backend-indexer-quality.md](plans/plan-step-2.2-backend-indexer-quality.md).
  - Step log: [step-2.2-backend-indexer-quality.md](steps/step-2.2-backend-indexer-quality.md).
  - Baseline indexer version: `0.1.0`; preserve its local cache for comparison.
  - Known quality work: exclude generated paths/files; classify Roslyn symbol kinds explicitly; preserve valid namespace source context and calls/references semantics; add fixture regression tests; version the new index separately.
  - The user's observed baseline includes 1,661 records from generated paths. This is not yet corrected or re-measured.

## Next Steps

1. Merge the backend indexer quality plan/step documentation PR.
2. Implement the follow-up on a new `loipham/*` branch from current `master`.
3. Add deterministic fixture tests and CI coverage.
4. Run the new indexer version against the exact pinned ERPm-BE SHA and compare against the preserved `0.1.0` baseline.
5. Only after backend quality acceptance, proceed to the TypeScript/Angular indexer.
6. Later implement EF metadata, cross-layer tracing and Phase 2 evaluation.
7. Measure context/token impact on a real task; do not claim savings before measurement.

## Rules

- Only mark work Completed after it is merged and has verification evidence.
- Keep implementation detail in the relevant plan/step log; status remains a short snapshot.
- Preserve local user changes. Never reset or overwrite unrelated working-tree modifications.
- Never commit generated index/cache files.
