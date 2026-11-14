# [fix](IAM) BUG-20261107e: PUT /auth/users/{id} không gửi employeeId thì giữ liên kết nhân viên

> **Loại:** bug · **Người làm:** Thiện (Dev 1) · **Trạng thái:** Doing (chờ tester và merge)
> **Liên quan:** phát hiện bởi tester erpm-44 · nhánh `thien/fix-user-update-keeps-employee-link` (BE)

## Hiện tượng và nguyên nhân
- Sửa tài khoản mà body không có `employeeId` thì liên kết nhân viên bị gỡ im lặng, tài khoản mất vai trò/phạm vi theo chức danh. Nguyên nhân: `UserAccessRequest.EmployeeId` mặc định `null`, `LinkEmployeeAsync(null)` gỡ liên kết.

## Hợp đồng mới
- Thiếu `employeeId` = giữ nguyên liên kết; `employeeId: null` = gỡ; có số = đổi sang nhân viên đó.
- `UserAccessRequest.EmployeeId` thành property `init` có cờ `EmployeeIdSent` (System.Text.Json chỉ gọi setter khi trường có trong body, kể cả null). Phản hồi vẫn trả đúng nhân viên đang liên kết.
- FE: form tài khoản (`user-form-dialog`) là nơi duy nhất gọi `updateUser` và luôn gửi `employeeId` từ ô chọn, nên không cần sửa FE.

## Kiểm tra
- `dotnet build src/ERPm.API` 0 warning/0 error.
- Kiểm bind JSON bằng chương trình tạm (ngoài repo): thiếu trường → `sent=False`; `null` → `sent=True, null`; `7` → `sent=True, 7`.
- Verification không tham chiếu được dự án API nên không có test tự động; cần tester kiểm qua API thật.

## Còn lại
- Tester: khóa/mở tài khoản (không gửi employeeId) không đổi liên kết; gửi `employeeId=null` thì gỡ. Thiện gõ merge.
