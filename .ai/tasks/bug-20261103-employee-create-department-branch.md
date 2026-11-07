# [bug] Thêm nhân viên báo "Kho và chi nhánh không khớp" khi phòng ban không thuộc chi nhánh đã chọn

> **Loại:** bug
> **Ngày tạo:** 2026-11-03 · **Người làm:** Thiện (AI executor) · **Người yêu cầu:** BA (Phúc báo "thêm nhân viên không được")
> **Trạng thái:** Done (merge theo lệnh Thiện 2026-11-03; HRM `9b2346d`, BE `a969c18`, FE `e9cf053`, root `afbe117`; tester erpm-5c PASS cả trình duyệt: Karma 133/133, Verification 136, Hrm 28)
> **Liên quan:** S20.4.5 (quy tắc M1/BA chọn (b)), `OrgRules.RequirePlacementAsync`

## 1. Hiện tượng
Màn Nhân viên, bấm Thêm, chọn chi nhánh rồi chọn một phòng ban: lưu thất bại với thông báo "Kho và chi nhánh không khớp." (nhắc tới kho, không liên quan nhân viên). Người dùng không biết sai chỗ nào.

## 2. Cách tái hiện
API, tài khoản admin trên DB test: `POST /api/v1/hrm/employees` với `branchId=4` (cửa hàng), `departmentId=4` (Phòng Kinh doanh của chi nhánh 3, không nằm trên nhánh cha của chi nhánh 4) trả 400 `error.inventory.branch_mismatch`. Cùng dữ liệu nhưng `branchId=3` trả 200. Tạo với dữ liệu hợp lệ bằng admin đều 200. Các tài khoản `ketoan`, `banhang` nhận 403 ở danh sách nhân viên (không có quyền HRM), nên không có nút Thêm.

## 3. Nguyên nhân gốc
- BE (quy tắc S20.4.5): phòng ban phục vụ chi nhánh của nó và các chi nhánh con; chi nhánh chọn phải nằm trong cây con đó.
- Form nhân viên chỉ lọc phòng ban theo công ty, không theo chi nhánh (form QTCT đã lọc, form nhân viên bị sót).
- Mã lỗi dùng lại `error.inventory.branch_mismatch` của nghiệp vụ kho nên thông báo sai ngữ cảnh.

## 4. Cách sửa
- FE `employees.component`: thêm `formBranchId`, lọc `departmentOptions` theo chuỗi chi nhánh (như form QTCT), `onBranchChange()` bỏ phòng ban không còn phù hợp.
- BE `HrmServices.cs`: dùng `error.org.department_branch_mismatch` (phòng ban) và `error.org.branch_mismatch` (chi nhánh ngoài công ty); thêm 2 khóa VI/EN vào `system_dictionary.json` và `system.json` (giống hệt).

## 5. Kiểm tra
- Verification BE 136/136 (check chi nhánh-phòng ban đổi sang khóa mới); `dotnet build` 0 warning, 0 error.
- FE `ng build` 0 lỗi; Karma 112/112 (thêm 1 spec lọc phòng ban theo chi nhánh).

## 6. Việc còn lại
- Tester thử trên trình duyệt: chọn chi nhánh thì danh sách phòng ban thu hẹp; thông báo lỗi mới hiện đúng VI/EN.
- Nếu Phúc gặp lỗi khác (video), cần mô tả thao tác và thông báo lỗi. Cũng nên hỏi Phúc đang thao tác trên DB nào: DB Neon dùng chung hiện chưa có công ty/chi nhánh/chức danh nên form không có gì để chọn.
