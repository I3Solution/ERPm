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

## Không sử dụng status chung

- Không tạo, sửa, cập nhật hoặc tự động sinh nội dung vào `.ai/status.md`.
- `.ai/status.md` là snapshot lịch sử/legacy, không phải nguồn trạng thái hiện hành.
- Không có status generator, PR validator hoặc workflow tổng hợp trạng thái chung trong quy trình này.
- Muốn biết tiến độ, mở task record tương ứng trong `.ai/tasks/`.
