# Step 2.2 Follow-up — Backend Indexer Quality

**Status:** Implementation merged via PR #60; CI passed; real-workspace verification pending  
**Plan:** [plan-step-2.2-backend-indexer-quality.md](../plans/plan-step-2.2-backend-indexer-quality.md)  
**Implementation branch:** `loipham/phase2-backend-indexer-quality-impl`  
**PR:** [#60](https://github.com/I3Solution/ERPm/pull/60), merged to `master`  
**Root master merge commit:** `1f742cb08b9c2bca507b7d1bf285696cf48ff2a5`  
**Backend source SHA:** `56385da65226f72c3b66f9c839e2fc430ce85210`

## Baseline evidence

- User-run workspace status validated 12 repositories against recursive gitlink SHAs.
- User-run backend index: 148,944 records at the pinned backend SHA.
- User-reported distribution: 142,818 references; 6,126 definitions; 127,338 calls; 15,480 references.
- User-reported generated-path records: 1,661.
- Samples confirmed field/backing-field symbol IDs and namespace-level source context for using references.
- The baseline cache under indexer version `0.1.0` must remain untouched.

## Implementation and CI progress

- [x] Created implementation branch from the verified PR #59 merge commit.
- [x] Added generated-source filtering for `obj/`, `bin/`, `.g.cs`, `.g.i.cs`, `.generated.cs`, auto-generated headers and out-of-repository source paths.
- [x] Added explicit Roslyn symbol classification and schema v2 (`symbolKind`, `sourceSymbolKind`); retained schema v1.
- [x] Tightened `calls` classification to invocation targets and explicit/implicit object creation.
- [x] Updated symbol search to read only the current indexer-version cache.
- [x] Added xUnit regression tests and wired them into CI.
- [x] Updated CLI documentation.
- [x] PR #60 merged to `master`.
- [x] GitHub Actions run #432 passed backend, frontend and code-index jobs.
- [x] Code-index CI passed CLI build, xUnit unit tests and pinned workspace-manifest validation.
- [ ] Real ERPm 0.2.0 re-index and query smoke test passed.
- [ ] New index compared with preserved `0.1.0` baseline.

## Verification log

**CI:** PASS — run #432, PR #60 head `52457bf16997f0918b2b1af6614040840670eb08`.

**Merge:** PR #60 merged on 2026-11-10; root master merge commit `1f742cb08b9c2bca507b7d1bf285696cf48ff2a5`.

**Local workspace:** Not yet run. On the user's next work session, re-index the exact pinned backend revision `56385da65226f72c3b66f9c839e2fc430ce85210` with indexer `0.2.0`, inspect representative queries and compare against the preserved `0.1.0` cache. Record actual counts, generated-path exclusion, relation/symbol-kind distribution and source spans. CI success alone does not complete Step 2.2.

## Safety constraints

- No application source or submodule gitlink changes.
- No changes to root/backend `global.json`.
- Do not reset, clean, or overwrite the user's local ERPm-BE working-tree modification.
- Do not delete or overwrite the existing generated `0.1.0` cache.
