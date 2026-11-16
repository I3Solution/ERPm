# refactor-20261116-ui-std-gd4-lock
- Status: Done
- Owner: Dev 2 ERPm
- Goal: UI-STD GĐ4 — lock the standard: CI check against hard-coded sizes on buttons/inputs/tables/titles in screens + AGENTS.md rule.
## Checklist
- [x] tools/check-ui-std.mjs + baseline (17 files) + CI step + AGENTS.md rule (ERPm-FE#78, merged 928b0cc, CI green)
## Follow-up (separate work, not part of this record)
- Pay down baseline (pos.component.scss 25 first), then rerun `node tools/check-ui-std.mjs --write`.
## Verification
- CI verify green on FE#78. Negative test run locally: added `.x-btn { height }` to partners scss -> check failed as expected. Build/ng test not run locally.
