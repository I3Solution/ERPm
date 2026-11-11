#!/usr/bin/env python3
"""Rebuild the shared task status report from opted-in Markdown task records."""

from __future__ import annotations

import argparse
import os
import re
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


MARKER = "> **Progress aggregation:** v1"
VALID_STATUSES = ("Todo", "Doing", "Blocked", "Done")
STATUS_ORDER = {"Blocked": 0, "Doing": 1, "Todo": 2, "Done": 3}
FEATURE_HEADING = re.compile(r"^##\s+3\.\s+Features\s*/\s*Milestones\s*$", re.IGNORECASE)
REMAINING_HEADING = re.compile(r"^##\s+6\.\s+Việc còn lại\s*$", re.IGNORECASE)
EVIDENCE_HEADING = re.compile(r"^##\s+7\.\s+Evidence và cập nhật\s*$", re.IGNORECASE)


class TaskRecordError(ValueError):
    """Raised when an opted-in task record violates the aggregation contract."""


@dataclass(frozen=True)
class TaskRecord:
    path: str
    title: str
    owner: str
    status: str
    completed_features: int
    total_features: int
    remaining: str
    evidence: str

    @property
    def progress(self) -> str:
        if self.total_features == 0:
            return "Not tracked"
        return f"{self.completed_features}/{self.total_features} ({self.completed_features * 100 // self.total_features}%)"


def _section(lines: list[str], heading_pattern: re.Pattern[str], source: str) -> list[str]:
    matches = [i for i, line in enumerate(lines) if heading_pattern.match(line.strip())]
    if len(matches) != 1:
        raise TaskRecordError(f"{source}: expected exactly one matching section heading")
    start = matches[0] + 1
    end = len(lines)
    for i in range(start, len(lines)):
        if re.match(r"^##\s+", lines[i].strip()):
            end = i
            break
    return lines[start:end]


def _single_match(pattern: str, text: str, field: str, source: str) -> str:
    matches = re.findall(pattern, text, flags=re.MULTILINE)
    if len(matches) != 1 or not matches[0].strip():
        raise TaskRecordError(f"{source}: expected exactly one non-empty {field}")
    return matches[0].strip()


def parse_task(path: Path, tasks_root: Path) -> TaskRecord | None:
    text = path.read_text(encoding="utf-8-sig")
    lines = text.splitlines()
    if MARKER not in lines:
        return None

    source = path.relative_to(tasks_root.parent.parent).as_posix()
    title = _single_match(r"^#\s+\[[^\]]+\]\s+(.+?)\s*$", text, "task title", source)
    owner = _single_match(r"^\s*>.*\*\*Người làm:\*\*\s*(.+?)(?:\s*·\s*\*\*Người yêu cầu:\*\*.*)?\s*$", text, "task owner", source)
    status = _single_match(r"^\s*>\s*\*\*Trạng thái:\*\*\s*(\S+)\s*$", text, "task status", source)
    if status not in VALID_STATUSES:
        raise TaskRecordError(f"{source}: unsupported status {status!r}; expected one of {', '.join(VALID_STATUSES)}")

    feature_lines = _section(lines, FEATURE_HEADING, source)
    completed = 0
    total = 0
    for line in feature_lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("<!--"):
            continue
        if stripped.startswith("-"):
            match = re.fullmatch(r"-\s+\[([ xX])\]\s+(.+?)\s*", stripped)
            if not match:
                raise TaskRecordError(f"{source}: malformed feature checklist item: {stripped!r}")
            if not match.group(2).strip():
                raise TaskRecordError(f"{source}: feature checklist item has no description")
            total += 1
            completed += match.group(1).lower() == "x"
        elif stripped.startswith(("*", "+")):
            raise TaskRecordError(f"{source}: feature checklist must use '- [ ]' or '- [x]' items")

    remaining_lines = _section(lines, REMAINING_HEADING, source)
    evidence_lines = _section(lines, EVIDENCE_HEADING, source)
    remaining = " ".join(line.strip().lstrip("- ").strip() for line in remaining_lines if line.strip())
    evidence = " ".join(line.strip().lstrip("- ").strip() for line in evidence_lines if line.strip())
    remaining = remaining or "Not specified"
    evidence = evidence or "Not specified"

    return TaskRecord(
        path=source,
        title=title,
        owner=owner,
        status=status,
        completed_features=completed,
        total_features=total,
        remaining=remaining,
        evidence=evidence,
    )


def load_tasks(tasks_root: Path) -> list[TaskRecord]:
    if not tasks_root.is_dir():
        raise TaskRecordError(f"task directory does not exist: {tasks_root}")
    records: list[TaskRecord] = []
    for path in sorted(tasks_root.rglob("*.md")):
        if path.name.lower() in {"readme.md", "_template.md"}:
            continue
        record = parse_task(path, tasks_root)
        if record is not None:
            records.append(record)
    return sorted(records, key=lambda item: (STATUS_ORDER[item.status], item.path.casefold()))


def render_report(records: Iterable[TaskRecord], source_sha: str) -> str:
    records = list(records)
    counts = {status: sum(record.status == status for record in records) for status in VALID_STATUSES}
    tracked = [record for record in records if record.total_features]
    completed_features = sum(record.completed_features for record in tracked)
    total_features = sum(record.total_features for record in tracked)
    feature_summary = (
        f"{completed_features}/{total_features} ({completed_features * 100 // total_features}%)"
        if total_features else "Not tracked"
    )

    lines = [
        "# ERPm — Aggregated Task Status",
        "",
        "> This file is generated by GitHub Actions. Do not edit it manually.",
        f"> Source: master at {source_sha or 'unknown'}",
        "",
        "## Overview",
        "",
        f"- Tasks: **{len(records)}**",
        f"- Status: {', '.join(f'{status} {counts[status]}' for status in VALID_STATUSES)}",
        f"- Feature completion: **{feature_summary}** across tasks with tracked features",
        "",
        "## Task Progress",
        "",
        "| Task | Status | Features | Owner |",
        "|---|---|---:|---|",
    ]
    if records:
        for record in records:
            title = record.title.replace("|", r"\|")
            owner = record.owner.replace("|", r"\|")
            lines.append(f"| [{title}]({record.path}) | {record.status} | {record.progress} | {owner} |")
    else:
        lines.append("| No aggregated tasks | — | — | — |")

    blocked = [record for record in records if record.status == "Blocked"]
    lines.extend(["", "## Blocked Tasks", ""])
    if blocked:
        for record in blocked:
            lines.append(f"- **[{record.title}]({record.path})** — {record.remaining}")
    else:
        lines.append("- None")

    lines.extend(["", "## Verification Evidence", ""])
    with_evidence = [record for record in records if record.evidence != "Not specified"]
    if with_evidence:
        for record in with_evidence:
            lines.append(f"- **[{record.title}]({record.path})** — {record.evidence}")
    else:
        lines.append("- No evidence recorded.")

    lines.extend(["", "---", "", "Generated deterministically from the current task records on master.", ""])
    return "\n".join(lines)


def write_if_changed(output: Path, content: str) -> bool:
    if output.exists() and output.read_text(encoding="utf-8") == content:
        return False
    output.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary_name = tempfile.mkstemp(prefix=f".{output.name}.", dir=output.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(content)
        os.replace(temporary_name, output)
    except Exception:
        try:
            os.unlink(temporary_name)
        except FileNotFoundError:
            pass
        raise
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tasks-dir", type=Path, default=Path(".ai/tasks"))
    parser.add_argument("--output", type=Path, default=Path(".ai/status.md"))
    parser.add_argument("--source-sha", default=os.environ.get("GITHUB_SHA", ""))
    args = parser.parse_args()

    try:
        records = load_tasks(args.tasks_dir)
        report = render_report(records, args.source_sha)
        changed = write_if_changed(args.output, report)
    except (OSError, TaskRecordError) as error:
        parser.exit(1, f"status generation failed: {error}\n")

    print(f"{'Updated' if changed else 'Unchanged'} {args.output} ({len(records)} task records)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
