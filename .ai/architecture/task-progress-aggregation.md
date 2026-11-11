# Task Progress Aggregation — Design

> **Status:** Generator, unit tests and CI test job implemented on the feature branch; post-merge workflow implemented but not yet exercised on `master`.
> **Scope:** ERPm umbrella repository only. This is repository governance/CI automation, not part of the Enterprise Knowledge Platform runtime.

## 1. Goals

- Keep task progress owned by the Agent/developer doing the work.
- Provide one project-level `.ai/status.md` that updates automatically after every PR merge into `master`.
- Support one task progressing through multiple features and multiple PRs, including repeated updates on the same feature branch.
- Avoid manual shared-file edits, lost updates, duplicate counting and dependency on a Developer's local machine.

## 2. Source of truth and generated output

| Data | Authority | Maintainer |
|---|---|---|
| Task status | Task record header | Assigned Agent/developer |
| Feature/milestone completion | Checklist in the task record | Assigned Agent/developer |
| Verification/evidence | Task record evidence section and linked CI/PR | Assigned Agent/developer |
| Project-wide summary | `.ai/status.md` | GitHub Actions only |

The generator is read-only with respect to task records. It must never infer or write task status back into a task file.

## 3. Task record contract

New records opt into aggregation with this exact metadata line:

```md
> **Progress aggregation:** v1
```

The task template also provides one dedicated section:

```md
## 3. Features / Milestones
- [ ] Feature 1 — independently verifiable outcome.
- [ ] Feature 2 — independently verifiable outcome.
```

Rules:

- Keep the existing filename convention; no TASK-ID registry and no YAML/JSON sidecar.
- The task status remains one of `Todo`, `Doing`, `Blocked`, `Done`.
- The generator counts only checkboxes in the dedicated Features / Milestones section.
- Do not remove completed checklist entries merely to change the denominator. Add entries only when scope genuinely expands.
- A task spanning PRs reuses the same file. Each merged PR carries the latest complete snapshot of that file.
- Historical records without the marker are excluded without migration or backfill.
- A marked record missing required fields, containing an unknown status or malformed feature checklist is an error. The generator must fail before replacing the report.

A task with no feature checklist items has progress `Not tracked`; it must not be reported as 0% or 100%.

## 4. Aggregation algorithm

Every run performs a full rebuild:

1. Read all Markdown task files under `.ai/tasks/` from latest `master`.
2. Ignore records without the exact `Progress aggregation: v1` marker.
3. Parse and validate every opted-in record.
4. Extract filename, title, owner, status, feature checklist counts, remaining work and evidence summary.
5. Calculate feature progress as completed checklist items / total checklist items. Keep task status independent from this percentage.
6. Sort records deterministically: Blocked, Doing, Todo, Done; then filename.
7. Render the complete report in memory.
8. Compare with current `.ai/status.md`; write only if content differs.

The report includes:
- source commit SHA (no wall-clock generation timestamp, so identical source input produces identical output);
- task counts grouped by status;
- feature completion totals for records with tracked features;
- task table with status, feature progress, owner and record link;
- blocked tasks and remaining work;
- verification/evidence summaries.

Malformed opted-in records fail generation; they are not silently converted into warnings or omitted.

Do not calculate roadmap phase percentages from raw task counts. A task may cover multiple phases and task sizes are not comparable. Phase rollups require an explicit future mapping contract.

## 5. Multi-PR and multi-feature semantics

Example task record on `master` after PR 1:

- Feature 1: checked
- Feature 2: unchecked
- Task status: Doing

The report shows 1/2 features complete.

After PR 2 updates the same task record and merges:

- Feature 1: checked
- Feature 2: checked
- Task status: Done

The next aggregation reads the latest full task record and reports 2/2. It does not skip the task because it appeared in an earlier run, and it does not add the new count to the old report.

This is snapshot replacement, not event accumulation. Repeated workflow execution against the same `master` state produces the same output.

## 6. GitHub Actions workflow

Implemented in `.github/workflows/aggregate-task-status.yml`.

- Trigger: `pull_request_target` targeting `master`, event type `closed`, gated by `github.event.pull_request.merged == true`. Also supports `workflow_dispatch` for bootstrap/manual recovery.
- `pull_request_target` is used so merged PRs from forks can be handled with base-repository permissions. The workflow never checks out or executes PR-head code; it checks out only trusted latest `master`.
- Workflow-level permissions are read-only. Only the aggregation job receives `contents: write`.
- Checkout explicitly fetches latest `master`, not the PR head and not an assumed event snapshot.
- Concurrency uses one stable group with `cancel-in-progress: false`.
- The generator runs in CI; Developers are not required to install or execute it locally.
- The bot commits only when `.ai/status.md` changes.
- The workflow listens to merged-PR events, not push events, so its own generated commit cannot recursively trigger aggregation.
- Branch protection may reject direct bot pushes. The workflow does not weaken protection; if direct write is disallowed, the approved bot-PR strategy must be configured instead.

### Bootstrap behavior

The first PR that introduces this workflow cannot trigger it because GitHub evaluates `pull_request_target` workflows from the base branch, where the workflow file does not exist yet. After this branch is merged, run the workflow once through `workflow_dispatch` to generate the initial report. Subsequent merged PRs trigger it automatically.

### Race handling

Concurrency serializes workflow runs, but a human PR can still advance `master` while a run is generating. Therefore the workflow:

1. Fetches latest `master` before parsing.
2. Generates from that exact checked-out tree.
3. Attempts a normal non-force push.
4. If the push is rejected, fetches latest `master`, regenerates and retries up to three times.
5. Never force-pushes or overwrites a newer commit.

GitHub concurrency may replace an older pending run with a newer pending run. This is safe because each executing run rebuilds from the latest `master`; the latest queued run covers all merged changes, rather than processing only its triggering PR.

## 7. Failure behavior and observability

- Invalid opted-in task record: fail the workflow and leave the last valid `.ai/status.md` untouched.
- Missing/legacy marker: exclude the record by design; do not rewrite it.
- No report content change: succeed without a commit.
- Push race: refetch/rebuild/retry; fail visibly after the retry limit.
- Branch protection rejection: workflow fails visibly; no policy is bypassed.
- Workflow failure must be visible in GitHub Actions. A later merged PR or manual dispatch can trigger a fresh full rebuild.

## 8. Implementation status

1. Task template and Agent/Developer rules — implemented.
2. Deterministic generator and parser tests — implemented.
3. CI job for generator tests — implemented; CI result pending verification.
4. Post-merge workflow and least-privilege token scope — implemented on feature branch; not yet exercised against protected `master`.
5. End-to-end multi-PR, concurrent merge, idempotency and push-race tests — pending.
6. Replace the frozen legacy `.ai/status.md` only after the workflow is merged and its first successful run completes.

## 9. Explicit non-goals

- No central task database, TASK-ID registry, YAML/JSON task store or external project-management dependency.
- No task migration/backfill for historical records.
- No PR validator or local generator requirement.
- No automatic mutation of task status based on checklist percentage.
- No automatic roadmap phase completion percentage without explicit task-to-phase mapping.
