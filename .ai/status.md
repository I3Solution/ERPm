# ERPm — Trạng thái hiện hành

> Cập nhật: 2026-11-10
> Nguồn trạng thái: các plan/task, commit đã merge và kết quả verification có bằng chứng.
> Lịch sử trước Phase 1: [status-archive-2026-11-10.md](history/status-archive-2026-11-10.md).

## Workspace baseline

- Umbrella repository: `I3Solution/ERPm`, integration branch: `master`.
- Phase 1 merge commit: `6c3204172ade56ac6b575f38d34dc38f8b85d049`.
- Phase 2 architecture plan merged by PR #57: `fa9c58f51d2b0de2c32de2a8e3c6368d39dd891b`.
- BE gitlink: `ERPm-BE@56385da65226f72c3b66f9c839e2fc430ce85210`.
- FE gitlink: `ERPm-FE@dbeaf66687454452886201bb669df1e25478d893`.
- Chi tiết ownership và quan hệ tích hợp: [Context Workspace Map](context/README.md).

## Completed

- [x] Phase 1 — Context Optimization: bootstrap theo task, workspace/domain metadata, progressive context policy và tách current status khỏi lịch sử.
  - Verification: recursive submodule checkout thành công; root GitHub Actions backend/frontend checks đều PASS; bốn file YAML metadata parse thành công.
  - Implementation PRs: root #54, FE #28, BE #39.
  - Benchmark token/context thực tế được hoãn đến task đầu tiên phù hợp; không dùng task giả để tạo baseline.
- [x] Phase 2 architecture and implementation plan — [PR #57](https://github.com/I3Solution/ERPm/pull/57) merged.

## In-Progress

- [ ] Phase 2 — Step 2.1 + Step 2.2 initial vertical slice. Implementation branch: `loipham/phase2-code-indexer-backend`.
  - Added versioned JSON Schema, recursive workspace manifest reader, local cache policy, CLI skeleton, and initial Roslyn backend definitions/reference indexer.
  - **Verification pending:** no local build, fixture test, or ERPm indexing smoke test has been run yet. See [Phase 2 plan](plans/plan-phase2-code-intelligence.md).

## Next Steps

1. Review and merge the initial code-indexer PR after inspecting its implementation scope.
2. Run .NET build and workspace-manifest smoke test using the pinned SDK and recursively initialized submodules.
3. Run backend indexing and query a known symbol; fix build/runtime issues and add fixture tests.
4. Complete missing Step 2.2 edges (project references, inheritance/implementation and caller validation) before declaring the vertical slice complete.
5. Continue with TypeScript/Angular and EF metadata indexers only after the backend slice is verified.
6. Measure token/context impact on a real task; do not claim savings before measurement.

## Rules

- Only mark work Completed after it is merged and has verification evidence.
- Keep implementation detail in the relevant plan/step log; status remains a short snapshot.
- Preserve local user changes. Never reset or overwrite unrelated working-tree modifications.
