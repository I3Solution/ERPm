# Task Records

Mỗi task có một Markdown record riêng. Task record là nơi duy nhất lưu trạng thái và tiến độ của task đó.

## Naming convention

Giữ nguyên quy ước hiện tại:

`.ai/tasks/<type>-YYYYMMDD-<short-description>.md`

Các loại task: `bug`, `change`, `refactor`, `db`, `spike`.

Không tạo TASK-ID registry, YAML/JSON record hoặc file tiến độ dùng chung theo workstream.

## Quy tắc thực hiện

- Với task mới có thay đổi đáng kể về code, kiến trúc, cấu hình, CI/CD hoặc tài liệu dự án: tạo task record khi bắt đầu, theo `_TEMPLATE.md`.
- Nếu tiếp tục cùng một task qua nhiều PR, cập nhật đúng record đó.
- Mỗi Agent chỉ cập nhật record của task mình phụ trách.
- Không cập nhật record của Agent khác nếu không có bàn giao rõ ràng.
- Task cũ trước khi quy tắc này được áp dụng được giữ nguyên và bỏ qua; không migration hoặc kiểm tra hồi tố.
- Thay đổi typo/format hoặc thao tác máy móc có thể không cần record.

## Trạng thái của task

Ghi trạng thái ngay trong task record bằng một trong các giá trị:

- `Todo`: chưa bắt đầu.
- `Doing`: đang thực hiện.
- `Blocked`: đang bị chặn.
- `Done`: hoàn tất phần việc và đã ghi bằng chứng kiểm tra thực tế.

Task record cần nêu rõ phạm vi, tiến độ/các thay đổi, kiểm tra đã chạy và kết quả, việc còn lại, commit/PR/CI liên quan nếu có. Không ghi PASS nếu chưa chạy kiểm tra.

## Shared status report

`.ai/status.md` is a generated report, not a source of task data.

- Agents and Developers must never create, edit, delete, reformat, commit or push manual changes to `.ai/status.md`.
- Only the authorized GitHub Actions workflow may update it after a PR is merged into `master`.
- Every aggregation run reads all eligible task records from the latest `master` and rebuilds the complete report. It never applies incremental PR-only updates.
- A task spanning multiple PRs keeps the same Markdown record. Update that record's feature checklist, status and evidence as work progresses; the next merge causes the report to be rebuilt from the latest snapshot.
- New records opt into aggregation using the exact marker and feature checklist in `_TEMPLATE.md`. Historical records without the marker remain untouched and are excluded; no backfill or migration is performed.
- If a marked record is malformed, generation fails without replacing the last valid report.

See [the aggregation design](../architecture/task-progress-aggregation.md) for workflow, parsing and concurrency details.
