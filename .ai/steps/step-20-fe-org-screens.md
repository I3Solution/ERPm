# Step 20.4.2 + 20.6.6 — FE màn tổ chức / chức danh / nhân viên / user (đang làm)

> Ngày: 2026-10-31 · Plan: [PLAN-STEP-20 §Phase 20.4](../plans/plan-step-20-iam-dynamic-role-and-organization.md) Task 20.4.2 (và 20.6.6) · Nhánh `thien/step20-fe-org` (tách từ `thien/step20-fe-auth` vì cần `can()` và `permissionGuard`) · Trạng thái: **đang làm, xong bước (a) và (b); còn (c) (d) (e)**

## 1. Phạm vi đã chốt (BA, ghi trong plan)
Một cây chung Tập đoàn › Công ty › Chi nhánh › Phòng ban; tổ chức, chức danh, nhân viên đặt trong `ERPm-FE-HRM`, màn user đặt trong `modules/SYS`; cấp phòng ban chỉ là ô chọn; QTCT và màn danh mục cấp để Task 20.4.5. Task BE 20.3.3 (sửa / xóa chi nhánh) làm riêng.

## 2. Tiến độ

| Bước | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| (a) | `core/models/org.models.ts`, `OrgAdminService` (chi nhánh, phòng ban, chức danh, nhân viên, role, user), spec | Xong · FE `2ab6716` |
| (b) | Màn cây tổ chức `/org` (HRM): cây một khối, panel chi tiết, form chi nhánh / phòng ban, tab Role của phòng ban, menu "Quản trị" | Xong · HRM `caef915`, FE `dc4cd39` |
| (c) | Chức danh + gán role cho chức danh | Chưa làm |
| (d) | Nhân viên + nút "Cấp tài khoản" | Chưa làm |
| (e) | Màn user (`modules/SYS`) với ô chọn nhân sự | Chưa làm |

## 3. Chi tiết bước (b)
- **Cây:** một danh sách phẳng dựng từ cây chi nhánh và phòng ban; biểu tượng riêng cho tập đoàn, công ty, chi nhánh, phòng ban; phòng ban hiện tên cấp. Chi nhánh luôn tải; phòng ban chỉ tải cho công ty đang chọn (bộ chọn công ty khi có nhiều công ty).
- **Quyền:** nút hiện theo `can()`: `sys:branch:create|edit|delete`, `hrm:department:create|edit|delete`, tab Role cần `sys:role:view`, lưu Role cần `sys:role:edit`. Route `/org` cần `hrm:department:view`.
- **Form:** `FormGroup` + `<app-form-control>`. Cấp mặc định của phòng ban là cấp sâu hơn cha một bậc; đổi cha thì danh sách cấp lọc lại.
- **BE đi kèm** (nhánh `thien/step20-fe-org-be`, BE `00ad5e6`): bộ lọc `GET /hrm/departments?companyId=`, 36 khóa từ điển mới (`menu.admin`, `menu.org`, `org.*`) thêm vào cả `system_dictionary.json` và `system.json` (cùng blob `d3c3acb`).

## 4. Lệnh đã chạy
```
npm run build                                   # 0 lỗi
npx ng test --watch=false --browsers=ChromeHeadless
dotnet run --project tests/ERPm.Verification --no-build
```

## 5. Kết quả kiểm tra (Verification)
- `npm run build`: 0 lỗi. Karma: **28/28** (21 + 7 spec của `OrgTreeComponent`).
- BE `thien/step20-fe-org-be`: build 0 warning / 0 error, `ERPm.Verification` **109/109** (108 + 1 check lọc theo công ty).
- Kiểm tay trên trình duyệt (Chrome headless qua CDP, DB tạm, API từ nhánh BE ở `127.0.0.1:5143`, `ng serve` ở `:4200`, dữ liệu giả, không chụp ảnh; môi trường đã dọn): **12/12 đạt** với admin và viewer:
  - cây hiển thị Tập đoàn › Công ty › Chi nhánh; chi nhánh có nút Chỉnh sửa, Xóa, Thêm phòng ban;
  - tạo phòng ban dưới chi nhánh, rồi phòng ban con (cấp tự chọn sâu hơn, API lưu `Path`/`Depth` đúng);
  - tab Role liệt kê role, lưu cấp role kèm "áp dụng cho phòng ban con";
  - xóa phòng ban còn phòng ban con bị từ chối, xóa lá thì hàng biến mất;
  - viewer gõ `/org` bị đẩy về `/forbidden` và không thấy mục menu.
- **Chưa kiểm:** sửa / xóa / đổi cha node chi nhánh và công ty trên giao diện, vì API của nhánh này chưa có `PUT/DELETE /branches` (Task 20.3.3 nằm ở nhánh BE khác, ERPm-BE#2). Mã FE cho hai thao tác đã viết, kiểm tay sau khi 20.3.3 được merge.
- Thanh menu dưới (mobile) chưa có mục Quản trị; màn quản trị chỉ có ở thanh bên desktop.

## 6. Checklist cho mỗi PR
- [ ] Khóa từ điển mới nằm trong cả 2 file (`system_dictionary.json` và `system.json`), so mã băm git trước khi push.
- [ ] `npm run build` 0 lỗi, Karma đạt; BE `dotnet build` 0 / 0 và `ERPm.Verification` đạt.
- [ ] Nút ẩn / hiện theo `can()`, kể cả nút ở trạng thái "danh sách trống".

## 7. Việc tiếp theo
- Merge thứ tự: ERPm-BE (`thien/step20-fe-org-be`) → ERPm-FE-HRM → ERPm-FE → ERPm (root), sau các PR của S20.4.1 (nhánh `thien/step20-fe-auth`).
- Làm (c) chức danh, (d) nhân viên, (e) user.
