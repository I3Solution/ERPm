# ERPm — Trạng thái hiện hành

> Cập nhật: 2026-11-10  
> Nguồn trạng thái: plan/step, commit đã merge và kết quả verification có bằng chứng.  
> Lịch sử trước Phase 1: [status-archive-2026-11-10.md](history/status-archive-2026-11-10.md).

## Workspace baseline

- Umbrella repository: `I3Solution/ERPm`, integration branch: `master`.
- Current root master baseline: `1f742cb08b9c2bca507b7d1bf285696cf48ff2a5` (PR #60 merge).
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

- LD.5 BE: danh sách SD nhẹ (summary, lọc ngày, q, sort) ([task](tasks/change-20261110-ld5-sd-light-lists.md)), chờ tester và merge; FE chờ khung LD.1.
- [ ] Phase 2 — Backend indexer quality follow-up (implementation merged; real-workspace acceptance pending).
  - Detailed plan: [plan-step-2.2-backend-indexer-quality.md](plans/plan-step-2.2-backend-indexer-quality.md).
  - Step log: [step-2.2-backend-indexer-quality.md](steps/step-2.2-backend-indexer-quality.md).
  - Baseline indexer version: `0.1.0`; preserve its local cache for comparison.
  - Implementation PR: [PR #60](https://github.com/I3Solution/ERPm/pull/60), merged to `master` as `1f742cb08b9c2bca507b7d1bf285696cf48ff2a5`.
  - Current changes: indexer `0.2.0` / schema v2, generated-source filtering, explicit source/target symbol categories, stricter call/reference classification, version-specific symbol search, xUnit tests and CI test step.
  - CI run #432 passed: backend, frontend and code-index jobs all succeeded; code-index build, unit tests and workspace-manifest validation passed.
  - The user's observed `0.1.0` baseline includes 1,661 records from generated paths; the `0.2.0` re-index has not yet been run. Preserve the old cache.

## Next Steps

1. Run the merged indexer `0.2.0` against the exact pinned ERPm-BE SHA in the user's Windows workspace.
2. Compare `0.2.0` against the preserved `0.1.0` baseline: generated paths, relation counts, symbol-kind distribution and representative queries.
3. Record the actual smoke-test results and close the backend quality acceptance criteria only when evidence supports it.
4. Only after backend quality acceptance, proceed to the TypeScript/Angular indexer.
5. Later implement EF metadata, cross-layer tracing and Phase 2 evaluation.
6. Measure context/token impact on a real task; do not claim savings before measurement.

## Rules

- Only mark work Completed after it is merged and has verification evidence.
- Keep implementation detail in the relevant plan/step log; status remains a short snapshot.
- Preserve local user changes. Never reset or overwrite unrelated working-tree modifications.
- Never commit generated index/cache files.
