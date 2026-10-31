# Step 20.4.2 + 20.6.6 — FE màn tổ chức / chức danh / nhân viên / user

> Ngày: 2026-10-31 · Plan: [PLAN-STEP-20 §Phase 20.4](../plans/plan-step-20-iam-dynamic-role-and-organization.md) Task 20.4.2 và 20.6.6 · Trạng thái: **xong cả 5 bước (a)–(e); PR cuối chờ review (nhánh `thien/step20-fe-positions`)**

## 1. Phạm vi đã chốt (BA, ghi trong plan)
Một cây chung Tập đoàn › Công ty › Chi nhánh › Phòng ban; tổ chức, chức danh, nhân viên đặt trong `ERPm-FE-HRM`, màn user đặt trong `modules/SYS`; cấp phòng ban chỉ là ô chọn; QTCT và màn danh mục cấp để Task 20.4.5. Task BE 20.3.3 (sửa / xóa chi nhánh) làm riêng và đã merge.

## 2. Tiến độ

| Bước | Nội dung | Commit | Trạng thái |
| :--- | :--- | :--- | :--- |
| (a) | `core/models/org.models.ts`, `OrgAdminService`, spec | FE `2ab6716` | Đã merge master |
| (b) | Màn cây tổ chức `/org`, tab Role của phòng ban, menu "Quản trị" | HRM `caef915`, FE `dc4cd39` | Đã merge master |
| (c) | Chức danh `/job-positions` + role mặc định của chức danh | HRM `efa1436` | Chờ review |
| (d) | Nhân viên `/employees` + nút "Cấp tài khoản" | HRM `e1d9c87` | Chờ review |
| (e) | Màn user `/users` (`modules/SYS`), hộp thoại tài khoản dùng chung | FE `eb856e0` | Chờ review |

BE đi kèm (nhánh `thien/step20-fe-positions-be`, BE `fdd2e68`): danh sách chức danh lọc theo phạm vi, `AccountDto.IsActive`, 38 + 23 khóa từ điển.

## 3. Chi tiết (c)(d)(e)
- **Chức danh (c):** bảng có lọc công ty và từ khóa, sắp theo cấp bậc rồi tên; form tạo / sửa (mã, tên, công ty, phòng ban theo công ty, cấp bậc 1–9, phạm vi dữ liệu mặc định, đang dùng). Chức danh toàn tập đoàn chỉ cho tài khoản có phạm vi không giới hạn (server vẫn là nơi chặn). Tạo xong chuyển thẳng sang tab "Role mặc định"; role chỉ gồm role nhóm và role của công ty đó.
- **Nhân viên (d):** danh sách phân trang theo server (từ khóa, "chưa có tài khoản"); tạo mới nhập công ty, chi nhánh, phòng ban, chức danh (ghi dòng QTCT tuyển dụng); sửa chỉ đổi thông tin cá nhân, các trường tổ chức bị khóa vì thay đổi qua QTCT (Task 20.4.5). Nút **Cấp tài khoản** chỉ hiện với nhân viên chưa có tài khoản và khi có `sys:user:create`, mở hộp thoại với nhân viên đã gắn và khóa.
- **User (e):** danh sách tài khoản kèm nhân viên và trạng thái; sửa (không đổi tên đăng nhập), đổi mật khẩu tùy chọn, gỡ hoặc đổi nhân viên, bật / tắt tài khoản. Hộp thoại `shared/components/user-form-dialog` dùng chung cho màn user và nút "Cấp tài khoản". Quyền Admin chỉ super admin thấy; để trống nhân viên cũng chỉ super admin.
- **Lỗi tìm ra khi kiểm tay và đã sửa:** hàng role của chức danh và của phòng ban được vẽ trước khi form role có control (chờ API role hiện tại), nên tick sớm bị mất và Angular báo thiếu control. Giờ chỉ vẽ sau khi tải xong (`rolesReady`), có spec cho cả hai màn.
- **Lỗi BE tìm ra:** danh sách chức danh chưa lọc theo phạm vi nên admin công ty thấy chức danh công ty khác; đã thêm lọc và check. `GET /auth/users` chưa trả `isActive`, nên sửa user sẽ vô tình kích hoạt lại tài khoản bị thu hồi; đã thêm `IsActive`.

## 4. Lệnh đã chạy
```
npm run build
npx ng test --watch=false --browsers=ChromeHeadless
dotnet run --project tests/ERPm.Verification --no-build
```

## 5. Kết quả kiểm tra (Verification)
- `npm run build`: 0 lỗi. Karma: **53/53** (28 trước đó + 7 chức danh + 6 nhân viên + 4 user + 6 hộp thoại + 2 chống lỗi `rolesReady`).
- BE `thien/step20-fe-positions-be`: build 0 warning / 0 error, `ERPm.Verification` **120/120** (118 trên master + check lọc chức danh + check `isActive`); HRM 28/28 không đổi.
- Kiểm tay trên trình duyệt (Chrome headless qua CDP, DB tạm, API từ nhánh BE, `ng serve`, dữ liệu giả, không chụp ảnh; môi trường đã dọn):
  - **39/39 đạt** trong hai lượt:
    - lượt 1 (27): tạo chức danh có phòng ban và role mặc định → tạo nhân viên → "Cấp tài khoản" → tài khoản mới đăng nhập và nhận đúng quyền của role chức danh (không thừa `sys:user:create`) → trong danh sách user thấy nhân viên → sửa, tắt tài khoản, tài khoản bị tắt không đăng nhập được → viewer gõ `/job-positions`, `/employees`, `/users` đều bị đẩy về `/forbidden`;
    - lượt 2 (12): sửa tên chi nhánh trên cây, tạo rồi xóa một chi nhánh, chi nhánh còn phòng ban bị từ chối và vẫn còn trên cây, tab Role phòng ban lưu cấp role kèm "áp dụng cho phòng ban con".
  - Lượt đầu bắt được lỗi `rolesReady` (xem mục 3), sửa rồi chạy lại toàn bộ.
- Chưa kiểm: đổi cha chi nhánh trên giao diện (form có ô "Cấp trên" nhưng kịch bản chưa chạy); thanh menu dưới (mobile) chưa có mục Quản trị, màn quản trị chỉ có ở thanh bên desktop.

## 6. Checklist cho mỗi PR
- [x] Khóa từ điển mới nằm trong cả 2 file (`system_dictionary.json` và `system.json`), so mã băm git trước khi push (blob `1c47ceb` hai bên).
- [x] `npm run build` 0 lỗi, Karma đạt; BE `dotnet build` 0 / 0 và `ERPm.Verification` đạt.
- [x] Nút ẩn / hiện theo `can()`, kể cả nút ở trạng thái "danh sách trống".
- [x] Push bằng `HEAD:refs/heads/<nhánh>` khi submodule ở detached HEAD, `push.recurseSubmodules=check`.

## 7. Việc tiếp theo
- Review và merge theo thứ tự: ERPm-BE `thien/step20-fe-positions-be` → ERPm-FE-HRM → ERPm-FE → ERPm (root), nhánh `thien/step20-fe-positions`.
- Task 20.4.5 (QTCT và danh mục cấp phòng ban), 20.4.3 (Role designer), 20.4.4 (từ điển), gán `DepartmentId` cho chứng từ, mục Quản trị trên thanh menu dưới.
