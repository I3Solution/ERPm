# ERPm — Trạng thái hiện hành

> Cập nhật: 2026-11-11  
> Nguồn trạng thái: merged PRs, plan/step và verification có bằng chứng.  
> Lịch sử trước Phase 1: [status-archive-2026-11-10.md](history/status-archive-2026-11-10.md).

## Workspace baseline

- Umbrella repository: `I3Solution/ERPm`, integration branch: `master`.
- Root snapshot verified by user: `468e7025fa4dee1e61bb651ed58c106361f05639`.
- Backend gitlink and checkout: `ERPm-BE@235173fd193ae2fb60081fa4573434f5edd506f3`.
- Frontend gitlink: `ERPm-FE@62270988b42eece930c702d1272fe857d31bcbb9`.
- Recursive FE module pins observed: ACC `2061e4d7424539f1fe7de920ede86a81264e9098`; CRM `9b66e321d6cff83ed703d080c3e5e19996816477`; HRM `f66e1bb61fe222684a9c63addde93c11d1559df3`; MFG `438693239d984e3c2ae060d4f24033ab41d7855d`; PM `e0d4154fede259e9c9da778e8f77aff947640e29`; PUR `c7e1c0c7f0957a91bba5e8892d1257d4640a2e33`; SCM `0661fdfb7361957b1594890d5efa7a2bc9329624`; SD `750960006dd1190682556334fdf3a64b6273aad4`; WMS `fd320c77642a0860ca8cfad25de10ea9bd1e796c`; dashboard `4380f4b433de6ec86be5b4934279af177be5dca5`.
- Workspace map and ownership: [Context Workspace Map](context/README.md).

## Completed

- [x] Phase 1 — Context Optimization; implementation and available static/integration validation merged. Empirical context/token benchmark remains deferred until a suitable real task.
- [x] Phase 2 architecture and implementation plan — PR #57.
- [x] Initial Code Index CLI and workspace manifest — PR #58.
- [x] Backend Roslyn indexer quality — PR #60 implementation; PR #61 documentation follow-up.
  - CI run #432 passed backend, frontend and code-index jobs.
  - User-run unit tests: 12 passed, 0 failed.
  - User-run real Backend index 0.2.0 at exact root-pinned SHA `235173fd193ae2fb60081fa4573434f5edd506f3`: 50,471 records; 195 syntax trees included, 45 excluded; 0 `obj/bin` path records.
  - Index distribution: 6,066 definitions; 44,405 references; 8,807 calls; 35,598 non-call references.
  - `BaseCrudController` lookup and representative call/reference samples inspected successfully.
  - Old 0.1.0 baseline is from a different BE SHA; no controlled count comparison is claimed. Its cache remains preserved.
  - Dedicated inheritance/implementation relations are deferred to Step 2.5.

## In Progress

- LD.5 BE: danh sách SD nhẹ (summary, lọc ngày, q, sort), chờ tester và merge; FE chờ khung LD.1.
- [ ] Phase 2 Step 2.3 — Frontend TypeScript/Angular indexer (implementation on `loipham/phase2-frontend-typescript-indexer`; not merged yet).
  - Plan: [plan-step-2.3-frontend-typescript-indexer.md](plans/plan-step-2.3-frontend-typescript-indexer.md).
  - Implemented schema v3, isolated Node worker with TypeScript 5.8.3 lockfile, .NET CLI orchestration, repository/SHA-aware caches, TypeScript definitions/imports/references, Angular component/service/guard/route metadata and HttpClient API evidence.
  - Pinned FE CI smoke: 161 Program source files; 102 indexed source files; 12,880 records across FE root, CRM, dashboard, HRM, SD and WMS. Angular: 63 components, 18 services, 3 guards, 46 routes. API: 34 calls (17 GET, 9 POST, 5 PUT, 3 DELETE); URL evidence: 4 literal, 16 interpolated, 14 dynamic.
  - Latest branch-head CI run #542 passed all three jobs (backend, frontend and code-index) at `1bb5bf789f62100e4d4d413a91217e5cd35a64ed`. The code-index job includes Node worker tests, .NET build/tests, pinned manifest validation, actual FE indexing and definition/API query smoke tests.
  - Local Windows verification and PR review remain pending; no FE application files or app manifests/lockfiles were changed.

## Next Steps

1. Complete local Windows verification for Step 2.3: restore worker dependencies, run tests/build, index the pinned FE Program, inspect symbol/API queries and confirm cache SHA isolation.
2. Open and review the Step 2.3 implementation PR against root `master`; merge only after local verification and full CI pass.
3. Step 2.4: EF Core model and migration metadata.
4. Step 2.5: unified query, inheritance/implementation and cross-layer tracing.
5. Step 2.6: retrieval quality, performance and context/token evaluation on representative real tasks.

## Rules

- Only mark work completed after merge and verification evidence.
- Keep implementation details in the relevant plan/step log; status remains a concise snapshot.
- Preserve local user changes. Never reset, clean, or overwrite unrelated working-tree modifications.
- Never commit generated index/cache files.
- Index only exact root-pinned recursive submodule revisions; reject mixed-SHA results.
