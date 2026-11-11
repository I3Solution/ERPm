# Task Progress Records

This directory is the source of truth for task-level progress in the ERPm umbrella repository.

## Required naming convention

Keep the existing convention:

`.ai/tasks/<type>-YYYYMMDD-<short-description>.md`

Allowed task types are defined by the existing template: `bug`, `change`, `refactor`, `db`, and `spike`.

Do not introduce a parallel TASK-ID naming scheme, YAML/JSON task records, or a shared per-workstream progress file.

## When a record is required

Create or update one task record for each meaningful task that changes project code, architecture, configuration, CI/CD, or project documentation.

- Create the record when the task starts, not only when it is finished.
- Commit the record in the same PR as the implementation/documentation it describes.
- If the same task spans multiple PRs, update its existing record.
- Link the relevant step plan, roadmap, issue, commit and PR where applicable.
- Trivial typo/format-only or mechanical changes with no meaningful project impact may be exempt. When uncertain, create a record.

## Ownership

The developer/Agent doing the work updates that task's record. Keep independent tasks in independent files. Do not edit another Agent's record without an explicit handoff.

Agents must not edit `.ai/status.md` directly. It is the project-level generated summary.

## Status and evidence

Use only the statuses in `_TEMPLATE.md`: `Todo`, `Doing`, `Blocked`, `Done`.

A task record must describe scope, implementation, checks actually run, their actual results, remaining work and relevant evidence. Do not claim a test passed unless it was run. A `Done` label alone is not proof of merge or verification.

## Automation contract

- PR validation will check task-record presence and structure for meaningful changes.
- After merge to root `master`, status aggregation will read task records from the latest merged branch state.
- The aggregator will preserve links to task records and GitHub evidence.
- Generated status must be deterministic and safe under concurrent merges.
- The initial publication target is a GitHub Actions artifact. Committing `.ai/status.md` later must use a bot PR/reviewed path, never a direct bot push to protected `master`.

Until the validator and aggregator workflows are implemented, follow these rules manually; do not assume automation is already active.
