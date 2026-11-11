import tempfile
import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "progress"))
from validate_tasks import validate_task


VALID_TASK = """# [bug] Sample task

> **Loại:** bug
> **Ngày tạo:** 2026-11-11 · **Người làm:** Developer · **Người yêu cầu:** Team
> **Trạng thái:** Doing (waiting for verification)
> **Liên quan:** Step 1

## 1. Mô tả
Description.

## 2. Phân tích
Analysis.

## 3. Cách làm
Implementation.

## 4. Kiểm tra
Not run yet.

## 5. Việc còn lại
Verification.
"""


class ValidateTaskTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.task_root = self.root / ".ai" / "tasks"
        self.task_root.mkdir(parents=True)

    def tearDown(self):
        self.temp_dir.cleanup()

    def write_task(self, name="bug-20261111-sample-task.md", content=VALID_TASK):
        path = self.task_root / name
        path.write_text(content, encoding="utf-8")
        return path

    def test_accepts_valid_task_and_status_note(self):
        path = self.write_task()
        self.assertEqual([], validate_task(path, self.task_root))

    def test_rejects_invalid_filename(self):
        path = self.write_task("bug-20261340-Bad_Name.md")
        errors = validate_task(path, self.task_root)
        self.assertTrue(any("filename" in error for error in errors))

    def test_rejects_filename_metadata_type_mismatch(self):
        path = self.write_task(content=VALID_TASK.replace("**Loại:** bug", "**Loại:** change"))
        errors = validate_task(path, self.task_root)
        self.assertTrue(any("does not match" in error for error in errors))

    def test_rejects_unknown_status(self):
        path = self.write_task(content=VALID_TASK.replace("Doing (waiting for verification)", "InProgress"))
        errors = validate_task(path, self.task_root)
        self.assertTrue(any("Trạng thái" in error for error in errors))

    def test_rejects_missing_required_section(self):
        path = self.write_task(content=VALID_TASK.replace("## 4. Kiểm tra", "## Kiểm tra"))
        errors = validate_task(path, self.task_root)
        self.assertTrue(any("## 4." in error for error in errors))

    def test_rejects_missing_metadata(self):
        path = self.write_task(content=VALID_TASK.replace("> **Ngày tạo:** 2026-11-11 · ", ""))
        errors = validate_task(path, self.task_root)
        self.assertTrue(any("Ngày tạo" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
