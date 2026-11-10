# Step 2.2 Follow-up — Backend Indexer Quality

**Status:** Implementation in progress; verification pending  
**Plan:** [plan-step-2.2-backend-indexer-quality.md](../plans/plan-step-2.2-backend-indexer-quality.md)  
**Branch:** `loipham/phase2-backend-indexer-quality-impl`  
**Base root commit:** `a459edbc87d92ee959cdc42572235a40aee44aab` (PR #59 merge)  
**Backend source SHA:** `56385da65226f72c3b66f9c839e2fc430ce85210`

## Baseline evidence

- User-run workspace status validated 12 repositories against recursive gitlink SHAs.
- User-run backend index: 148,944 records at the pinned backend SHA.
- User-reported distribution: 142,818 references; 6,126 definitions; 127,338 calls; 15,480 references.
- User-reported generated-path records: 1,661.
- Samples confirmed field/backing-field symbol IDs and namespace-level source context for using references.
- The baseline cache under indexer version `0.1.0` must remain untouched.

## Implementation progress

- [x] Created implementation branch from the verified PR #59 merge commit.
- [x] Added generated-source filtering for `obj/`, `bin/`, `.g.cs`, `.g.i.cs`, `.generated.cs`, auto-generated headers and out-of-repository source paths.
- [x] Added explicit Roslyn symbol classification and schema v2 (`symbolKind`, `sourceSymbolKind`); retained schema v1.
- [x] Tightened `calls` classification to invocation targets and explicit/implicit object creation.
- [x] Updated symbol search to read only the current indexer-version cache.
- [x] Added xUnit regression tests and wired them into CI.
- [x] Updated CLI documentation.
- [ ] CI build/tests passed.
- [ ] Real ERPm re-index and query smoke test passed.
- [ ] New index compared with preserved `0.1.0` baseline.

## Work completed in the planning step

- [x] Confirmed root `master` HEAD before branch creation.
- [x] Inspected current BackendRoslynIndexer, IndexRecord, v1 JSON Schema, CLI and README.
- [x] Defined generated-source filtering, symbol-kind classification, relation semantics, tests, versioning and acceptance criteria.

## Verification log

Implementation files have been committed to the remote branch through GitHub file operations. No local build, test, or new index run has been performed in this session. CI and real-workspace verification remain pending; do not report them as passed.

## Safety constraints

- No application source or submodule gitlink changes.
- No changes to root/backend `global.json`.
- Do not reset, clean, or overwrite the user's local ERPm-BE working-tree modification.
- Do not delete or overwrite the existing generated `0.1.0` cache.
