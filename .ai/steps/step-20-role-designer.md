# Step 20 – S20.4.3 Role designer (ma trận quyền + JSON)

Trạng thái: **Done** (tester PASS lần 2, 2026-11-02; đã merge). BE `bf15bf0`, HRM `2de228c`, FE `c56c982`.

## Mục tiêu
Màn `/roles` cho người quản trị thiết kế vai trò IAM: tách "làm gì" và "thấy dữ liệu của ai", sao chép vai trò, soạn JSON nâng cao, gán vai trò phụ + inline policy cho tài khoản, xem trước quyền hiệu lực có nguồn gốc. Theo thẻ Trello S20.4.3 và bài học HRM9 (`notes/hrm9-ho-so/phan-quyen-hrm9.md`).

## File chính
| Tầng | File |
| :--- | :--- |
| BE | `Services/Iam/IamService.cs` (gom statement có gắn nguồn, `GetEffectiveAsync`), `RoleService.cs` (version, 409), `RolesController.cs` (`GET /sys/roles/users/{id}/effective`), `IamDtos.cs`, `IamRole.cs` (`Version` = xmin), `ApplicationDbContext.cs`, migration `RoleConcurrencyToken` (Up rỗng, xmin là cột hệ thống), `tests/ERPm.Verification/IamChecks.cs` (+2 check) |
| FE | `modules/SYS/roles/` (`roles.component.*`, `policy-matrix.util.*`), `org.models.ts`, `org-admin.service.ts`, `app.routes.ts`, `app.component.html` (menu), `assets/i18n/system.json` |
| Từ điển | `system_dictionary.json` (BE) và `system.json` (FE) giống hệt nhau (hash `dff0c82`) |

## Quyết định thiết kế
- Ma trận chỉ biểu diễn dạng đơn giản: một tập quyền Allow dùng chung một phạm vi dữ liệu + tập Deny. Policy phức tạp (ký tự đại diện, nhiều phạm vi, resources, Deny có phạm vi) tự mở ở chế độ JSON và không cho chuyển về ma trận, để không mất nghĩa.
- Phạm vi `CUSTOM_BRANCHES` chọn đơn vị bằng `BranchSelectComponent`; các mode còn lại (BRANCH, BRANCH_TREE...) tính theo vị trí người giữ vai trò nên không cần chọn đơn vị.
- Version = cột `xmin`; client gửi lại version, lệch thì `error.request.conflict` (409).
- Xem trước hiệu lực: Deny tường minh (`Denied`) tách khỏi `NotGranted`; nguồn dạng `job-position:<mã>`, `department:<mã>`, `user-role:<mã>`, `account-role:<mã>`, `inline-policy`.

## Lệnh và kết quả kiểm tra
- BE: `dotnet build ERPm.sln` 0 warning / 0 error; `dotnet run --project tests/ERPm.Verification` đạt 130/130.
- FE: `ng build` 0 lỗi (cảnh báo budget bundle có sẵn từ trước); Karma 86/86.
- Tester `erpm-60`: lần 1 FAIL (L1-L4), lần 2 PASS; kiểm tay đủ ma trận, JSON, sao chép, tab Tài khoản, 409, 403, dark, mobile 390px.

## Việc còn lại
| Việc | Trạng thái | Ghi chú |
| :--- | :--- | :--- |
| Lưu cả ma trận trong 1 transaction | Todo | Hiện 1 `SaveChanges` cho mỗi role; gộp khi có thao tác nhiều bảng |
| Cache quyền dùng chung nhiều instance | Todo | `permission_version` ở DB/cache phân tán; BA tách task riêng |
| Test "đổi role có hiệu lực ngay" | Todo | Cache hiện làm mới trong cùng tiến trình qua `Invalidate()` |
| Thông báo thân thiện cho 403/409 | Đã có | Banner dùng mã `error.iam.*` và `error.request.conflict` trong từ điển |

## Bước tiếp theo
Tester kiểm tay màn `/roles`; sửa lỗi tester trả về; báo BA; chờ lệnh merge của Thiện.
