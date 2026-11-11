from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tools.progress.generate_status import (
    TaskRecordError,
    load_tasks,
    render_report,
    write_if_changed,
)


def task_text(status: str = "Doing", features: tuple[bool, ...] = (True, False)) -> str:
    checklist = "\n".join(
        f"- [{'x' if done else ' '}] Feature {index + 1} — verifiable result."
        for index, done in enumerate(features)
    )
    if not checklist:
        checklist = "No feature checklist is tracked for this task."
    return f"""# [change] Task A

> **Ngày tạo:** 2026-11-11 · **Người làm:** Agent A · **Người yêu cầu:** Project owner
> **Trạng thái:** {status}
> **Progress aggregation:** v1

## 1. Mô tả
Task fixture.

## 2. Phân tích
Analysis.

## 3. Features / Milestones
{checklist}

## 4. Cách làm
Implementation.

## 5. Kiểm tra
Checks.

## 6. Việc còn lại
- Finish remaining feature.

## 7. Evidence và cập nhật
- CI: pending.
- Ngày cập nhật cuối: 2026-11-11
"""


class GenerateStatusTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.tasks = self.root / ".ai" / "tasks"
        self.tasks.mkdir(parents=True)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def write_task(self, name: str, content: str) -> Path:
        path = self.tasks / name
        path.write_text(content, encoding="utf-8")
        return path

    def test_legacy_record_without_marker_is_ignored(self) -> None:
        self.write_task(
            "legacy.md",
            "# [change] Legacy task\n\n> **Trạng thái:** Doing\n",
        )
        self.write_task("task-a.md", task_text())
        records = load_tasks(self.tasks)
        self.assertEqual([record.path for record in records], ["tasks/task-a.md"])
        self.assertEqual(records[0].path, "tasks/task-a.md")

    def test_multiple_pr_snapshots_rebuild_latest_feature_progress(self) -> None:
        path = self.write_task("change-20261111-task-a.md", task_text(features=(True, False)))
        first = load_tasks(self.tasks)
        self.assertEqual((first[0].completed_features, first[0].total_features), (1, 2))
        first_report = render_report(first, "merge-sha-1")
        self.assertIn("1/2 (50%)", first_report)

        # PR 2 updates the same task record with the complete latest checklist.
        path.write_text(task_text(status="Done", features=(True, True)), encoding="utf-8")
        second = load_tasks(self.tasks)
        self.assertEqual(len(second), 1)
        self.assertEqual((second[0].completed_features, second[0].total_features), (2, 2))
        second_report = render_report(second, "merge-sha-2")
        self.assertIn("2/2 (100%)", second_report)
        self.assertNotIn("1/2 (50%)", second_report)
        self.assertIn("| Done |", second_report)

    def test_malformed_opted_in_record_fails_entire_load(self) -> None:
        malformed = task_text().replace("- [ ] Feature 2", "- Feature 2")
        self.write_task("bad.md", malformed)
        with self.assertRaisesRegex(TaskRecordError, "malformed feature checklist"):
            load_tasks(self.tasks)

    def test_unknown_status_is_rejected(self) -> None:
        self.write_task("bad-status.md", task_text(status="AlmostDone"))
        with self.assertRaisesRegex(TaskRecordError, "unsupported status"):
            load_tasks(self.tasks)

    def test_task_without_features_is_not_reported_as_zero_percent(self) -> None:
        self.write_task("no-features.md", task_text(features=()))
        record = load_tasks(self.tasks)[0]
        self.assertEqual(record.progress, "Not tracked")
        report = render_report([record], "sha")
        self.assertIn("Feature completion: **Not tracked**", report)

    def test_output_write_is_idempotent(self) -> None:
        output = self.root / ".ai" / "status.md"
        self.assertTrue(write_if_changed(output, "# Report\n"))
        self.assertFalse(write_if_changed(output, "# Report\n"))
        self.assertEqual(output.read_text(encoding="utf-8"), "# Report\n")

    def test_duplicate_required_sections_are_rejected(self) -> None:
        content = task_text() + "\n## 3. Features / Milestones\n"
        self.write_task("duplicate-section.md", content)
        with self.assertRaisesRegex(TaskRecordError, "exactly one matching section"):
            load_tasks(self.tasks)


if __name__ == "__main__":
    unittest.main()
