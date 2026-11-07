# Refactor: phiên bản quyền dùng chung nhiều instance (IAM)

- **Trạng thái:** Done (BE 9f84091; tester erpm-44 PASS, thử 2 tiến trình API thật cùng DB: đổi quyền ở instance này, instance kia thấy ngay)
- **Loại / tag:** refactor / `[refactor]`
- **Trello:** https://trello.com/c/i16woq9C
- **Nhánh:** `thien/refactor-permission-version` (BE), đã gộp nhánh `thien/refactor-role-matrix-transaction` để tránh xung đột cùng tệp kiểm thử

## Lý do
`IamService` cache principal trong bộ nhớ từng tiến trình, khóa theo một bộ đếm `static long _version` của chính tiến trình đó. Khi chạy nhiều instance API, đổi role ở một instance chỉ làm instance đó bỏ cache; instance khác giữ quyền cũ tới khi cache hết hạn (5 phút) hoặc restart.

## Phạm vi và cách làm
- Phiên bản quyền chuyển sang **sequence PostgreSQL** `erpm_permission_version` (migration `AddPermissionVersion`), chung cho mọi instance.
- `Invalidate()` gọi `nextval` trên sequence; mỗi lần tạo principal, `GetPrincipalAsync` đọc phiên bản hiện tại (`pg_sequence_last_value`) và đưa vào khóa cache. Instance khác thấy phiên bản mới ở yêu cầu kế tiếp nên dựng lại principal từ role mới, không cần restart, không cần Redis hay kênh sự kiện.
- Cache vẫn là bộ nhớ từng instance (rẻ); chỉ phần khóa là chung. Chi phí thêm: một truy vấn nhỏ cho mỗi lần lấy principal (đã có sẵn một truy vấn người dùng).
- Bỏ biến `static` nên không còn trạng thái ẩn theo tiến trình.

## Bằng chứng
- Test mới trong `IamChecks`: hai `IamService` với hai `MemoryCache` riêng trên cùng DB; instance A cache principal, instance B đổi chính sách người dùng, A thấy quyền mới ngay, rồi đổi lại cũng thấy. Lưu ý: test chạy trong một tiến trình nên nó không phân biệt được với mã cũ (bộ đếm static dùng chung trong tiến trình); bằng chứng thật là khóa cache nay đọc từ DB, không còn biến static.
- `dotnet build`: 0 warning, 0 error; `ERPm.Verification`: 282 check đạt (279 cũ + 2 + 1 của refactor lưu role).
- Migration chỉ tạo sequence (không đổi dữ liệu); `migration matches current model` đạt.

## Chưa làm
- Chưa kiểm bằng hai tiến trình API thật; cần thử tay hoặc test tích hợp riêng khi có môi trường nhiều instance.
- Các thay đổi ảnh hưởng quyền mà không gọi `Invalidate()` (nếu có) vẫn như cũ.
