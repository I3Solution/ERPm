# Step 2.2 Follow-up — Backend Indexer Quality

**Status:** Planned; implementation not started  
**Plan:** [plan-step-2.2-backend-indexer-quality.md](../plans/plan-step-2.2-backend-indexer-quality.md)  
**Branch:** `loipham/phase2-backend-indexer-quality`  
**Base root commit:** `d72119b308d6d11f4ba886e4368ab2f53616cb53`  
**Backend source SHA:** `56385da65226f72c3b66f9c839e2fc430ce85210`

## Baseline evidence

- User-run workspace status validated 12 repositories against recursive gitlink SHAs.
- User-run backend index: 148,944 records at the pinned backend SHA.
- User-reported distribution: 142,818 references; 6,126 definitions; 127,338 calls; 15,480 references.
- User-reported generated-path records: 1,661.
- Samples confirmed field/backing-field symbol IDs and namespace-level source context for using references.
- The baseline cache under indexer version `0.1.0` must remain untouched.

## Work completed in this planning step

- [x] Confirmed root `master` HEAD before branch creation.
- [x] Inspected current BackendRoslynIndexer, IndexRecord, v1 JSON Schema, CLI and README.
- [x] Defined generated-source filtering, symbol-kind classification, relation semantics, tests, versioning and acceptance criteria.
- [ ] Implementation PR created and merged.
- [ ] CI build/tests passed.
- [ ] Real ERPm re-index and query smoke test passed.
- [ ] New index compared with preserved `0.1.0` baseline.

## Verification log

No implementation build, test, or new index run has been performed in this planning step. Do not report these as passed.

## Safety constraints

- No application source or submodule gitlink changes.
- No changes to root/backend `global.json`.
- Do not reset, clean, or overwrite the user's local ERPm-BE working-tree modification.
- Do not delete or overwrite the existing generated `0.1.0` cache.
