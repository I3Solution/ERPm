# Refactor: lưu ma trận role trong 1 transaction (IAM)

- **Trạng thái:** Doing (đã merge BE 64cc59e, chờ tester kiểm lại)
- **Loại / tag:** refactor / `[refactor]`
- **Trello:** https://trello.com/c/ZaCzcH2C
- **Nhánh:** `thien/refactor-role-matrix-transaction` (BE)

## Lý do
Thẻ cho rằng lưu ma trận quyền là "1 SaveChanges/role, rời rạc" nên lỗi giữa chừng có thể ghi dở.

## Kết luận khảo sát
- Ma trận của một role là **một cột jsonb** (`PolicyDocument`), nên sửa role là một `UPDATE` duy nhất; mọi statement lưu cùng lúc hoặc không lưu gì. `SaveChangesAsync` của EF luôn chạy trong một giao dịch cơ sở dữ liệu, nên không có chỗ ghi dở.
- Các thao tác nhiều dòng (`SetUserAccess`, `SetJobPositionRoles`, `SetDepartmentRoles`) cũng gom xóa + thêm + cập nhật vào một `SaveChangesAsync`, tức một giao dịch.
- Vì vậy **không cần gói thêm transaction tường minh**; thêm sẽ chỉ lồng giao dịch.

## Sửa thật tìm thấy
`SetUserAccessAsync` phát thông báo `SYS_ROLE_CHANGED` **trước** khi lưu. Nếu lưu lỗi, người dùng vẫn nhận "quyền của bạn đã đổi" dù dữ liệu không đổi. Đã chuyển việc phát sau `SaveChangesAsync` và `Invalidate` (hành vi không đổi khi thành công).

## Bằng chứng không đổi hành vi / chống tái phát
- Test mới trong `IamChecks`: một giao dịch khác giữ khóa dòng người dùng; lưu phân quyền (xóa/thêm role + inline policy) bị PostgreSQL từ chối quá hạn khóa (mã 55P03) giữa lúc đang lưu; sau đó không còn dòng `UserRole` nào và `InlinePolicy` vẫn rỗng.
- `dotnet build`: 0 warning, 0 error; `ERPm.Verification`: 280 check đạt (279 cũ + 1).

## Việc còn lại
- Tester kiểm lại sau khi merge; chuyển `Done` và ghi commit merge.
- Không đụng tới chuyện "lưu ma trận của nhiều role cùng lúc" vì giao diện hiện chỉ sửa từng role.
