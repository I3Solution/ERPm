#!/usr/bin/env python3
"""Validate ERPm Markdown task records without rewriting them."""

from __future__ import annotations

import argparse
import re
import sys
from datetime import datetime
from pathlib import Path

TASK_TYPES = {"bug", "change", "refactor", "db", "spike"}
TASK_STATUSES = {"Todo", "Doing", "Blocked", "Done"}
FILENAME_RE = re.compile(
    r"^(?P<type>bug|change|refactor|db|spike)-(?P<date>\d{8})-(?P<slug>[a-z0-9]+(?:-[a-z0-9]+)*)\.md$"
)
STATUS_RE = re.compile(
    r"^\s*>\s*\*\*Trạng thái:\*\*\s*(?P<status>Todo|Doing|Blocked|Done)(?=\s|$|[([])",
    re.MULTILINE,
)
TYPE_RE = re.compile(r"^\s*>\s*\*\*Loại:\*\*\s*(?P<type>[a-z]+)\s*$", re.MULTILINE)
DATE_RE = re.compile(r"^\s*>\s*\*\*Ngày tạo:\*\*\s*(?P<date>\d{4}-\d{2}-\d{2})", re.MULTILINE)
REQUIRED_METADATA = ("Ngày tạo", "Người làm", "Người yêu cầu", "Trạng thái", "Liên quan")
REQUIRED_SECTIONS = ("1", "2", "3", "4", "5")


def validate_task(path: Path, task_root: Path, strict: bool = False) -> list[str]:
    errors: list[str] = []
    name = path.name
    match = FILENAME_RE.fullmatch(name)
    if not match:
        return [
            f"{path}: filename must follow "
            "<type>-YYYYMMDD-<lowercase-kebab-description>.md"
        ]

    try:
        datetime.strptime(match.group("date"), "%Y%m%d")
    except ValueError:
        errors.append(f"{path}: filename contains an invalid calendar date")

    try:
        content = path.read_text(encoding="utf-8-sig")
    except (OSError, UnicodeError) as exc:
        return errors + [f"{path}: cannot read UTF-8 task record ({exc})"]

    type_match = TYPE_RE.search(content)
    if not type_match:
        errors.append(f"{path}: missing metadata '**Loại:** <type>'")
    elif type_match.group("type") not in TASK_TYPES:
        errors.append(f"{path}: unsupported task type '{type_match.group('type')}'")
    elif type_match.group("type") != match.group("type"):
        errors.append(
            f"{path}: filename type '{match.group('type')}' does not match "
            f"metadata type '{type_match.group('type')}'"
        )

    date_match = DATE_RE.search(content)
    if not date_match:
        errors.append(f"{path}: missing metadata '**Ngày tạo:** YYYY-MM-DD'")
    else:
        try:
            datetime.strptime(date_match.group("date"), "%Y-%m-%d")
        except ValueError:
            errors.append(f"{path}: metadata contains an invalid creation date")

    status_match = STATUS_RE.search(content)
    if not status_match:
        errors.append(
            f"{path}: missing or invalid '**Trạng thái:**'; "
            f"allowed values: {', '.join(sorted(TASK_STATUSES))}"
        )

    if strict:
        for label in REQUIRED_METADATA:
            if not re.search(
                rf"\*\*{re.escape(label)}:\*\*\s*\S",
                content,
            ):
                errors.append(f"{path}: missing or empty metadata '**{label}:**'")

    if not re.search(r"^#\s+\S", content, re.MULTILINE):
        errors.append(f"{path}: missing Markdown H1 task title")

    if strict:
        present_sections = set(
            re.findall(r"^##\s+(\d+)\.", content, re.MULTILINE)
        )
        for section in REQUIRED_SECTIONS:
            if section not in present_sections:
                errors.append(f"{path}: missing required section '## {section}.'")

    return errors


def collect_task_files(task_root: Path, explicit_paths: list[str]) -> list[Path]:
    if explicit_paths:
        return [Path(item) for item in explicit_paths]
    return sorted(
        path
        for path in task_root.glob("*.md")
        if path.name not in {"README.md", "_TEMPLATE.md"}
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="repository root")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="require all current template metadata and sections (use for new/updated task records)",
    )
    parser.add_argument("paths", nargs="*", help="optional task files to validate")
    args = parser.parse_args()

    task_root = (args.root / ".ai" / "tasks").resolve()
    paths = collect_task_files(task_root, args.paths)
    if not paths:
        print(f"No task records found under {task_root}")
        return 0

    errors: list[str] = []
    checked = 0
    for candidate in paths:
        path = candidate if candidate.is_absolute() else (args.root / candidate)
        if path.name in {"README.md", "_TEMPLATE.md"}:
            continue
        checked += 1
        errors.extend(validate_task(path, task_root, strict=args.strict))

    if errors:
        print(f"Task progress validation failed: {len(errors)} error(s) across {checked} file(s).")
        for error in errors:
            print(f"::error::{error}")
        return 1

    print(f"Task progress validation passed: {checked} task record(s) checked.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
