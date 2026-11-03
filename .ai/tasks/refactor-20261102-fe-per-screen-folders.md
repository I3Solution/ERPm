# [refactor] FE: mỗi màn một thư mục riêng, sub-widget vào `components/`

> **Loại:** refactor
> **Ngày tạo:** 2026-11-02 · **Người làm:** Thiện (AI executor) · **Người yêu cầu:** Thiện (qua BA)
> **Trạng thái:** Doing (đã di chuyển màn rời; đã tách `roles`, chờ tester và lệnh merge)
> **Liên quan:** AGENTS.md (quy tắc thư mục), tham chiếu `ART-ERP-FE/src/app/pages/` (ví dụ `ADMIN/permission/`, `CRM/business-partner-detail/components/bp-items/`)

## 1. Mô tả
Nhiều màn đang nằm rời, phẳng ngay dưới gốc module, ví dụ `modules/HRM/employees.component.ts` thay vì `modules/HRM/employees/employees.component.ts`. Cần:
1. Mỗi màn một thư mục con mang tên màn, đủ 4 file (.ts/.html/.scss/.spec.ts).
2. Sub-widget của một màn vào `components/` con của màn đó.
3. Màn mới (kể cả S20.4.5) đã làm đúng kiểu này; refactor này chỉ dọn màn cũ.

Phạm vi kiểm: HRM (`employees`, `job-positions`, `org-tree`), SYS (`users`, `roles` và tách `roles` thành `permission-matrix/`, `policy-json-editor/`, `effective-permission-preview/`, `user-role-assignment/`), và ACC/CRM/MFG/PM/PUR/SCM/SD/WMS/dashboard nếu cùng kiểu lỗi.

## 2. Phân tích
- Màn nằm trong submodule (`ERPm-FE-HRM`, WMS, CRM...) cần commit và PR riêng ở từng submodule, push submodule trước.
- Thứ tự: sau S20.4.5. Không đổi hành vi.

## 3. Cách làm
- `git mv` để giữ lịch sử; sửa import tương đối, `loadComponent` trong `app.routes.ts`, đường dẫn trong spec.
- Tách `roles.component` thành thư mục con theo mục 1, mỗi widget một component riêng.

## 4. Kiểm tra
- Bằng chứng không đổi hành vi: `ng build` 0 lỗi, Karma đạt toàn bộ (hiện 109/109 trước refactor), so số test trước/sau; tester kiểm tay hồi quy các màn bị di chuyển.

## 4b. Đã làm (2026-11-02)
Di chuyển bằng `git mv`, sửa import tương đối và route, không đổi hành vi:
| Module | Màn đã vào thư mục riêng |
| :--- | :--- |
| HRM | `employees/`, `job-positions/`, `org-tree/` |
| CRM | `partners/` |
| SD | `pos/` |
| WMS | `items/`, `inventory/` |
| dashboard | `dashboard/` |
`SYS/users`, `SYS/roles`, `SYS/notifications/*`, `HRM/department-levels`, `HRM/work-histories` đã đúng chuẩn. ACC/MFG/PM/PUR/SCM chỉ có README, chưa có màn.
Bằng chứng không đổi hành vi: `ng build` 0 lỗi; Karma 111/111 trước và sau; mọi màn giữ nguyên route.

## 4c. Tách `SYS/roles` (2026-11-03)
Mỗi widget một component riêng trong `SYS/roles/components/`, hành vi không đổi:
| Component | Việc |
| :--- | :--- |
| `permission-matrix` | Ma trận quyền theo module, tick Cho phép / Từ chối; phát ra mô hình mới, không tự sửa |
| `data-scope` | Phạm vi dữ liệu và danh sách đơn vị của CUSTOM_BRANCHES |
| `policy-json-editor` | Ô JSON chính sách, dùng chung cho role và chính sách riêng của tài khoản |
| `account-access` | Tab Tài khoản: chọn tài khoản, lưu quyền riêng; chứa 2 component dưới |
| `user-role-assignment` | Role bổ sung và chính sách riêng của một tài khoản |
| `effective-permission-preview` | Xem trước quyền hiệu lực kèm nguồn cấp |
`roles.component` còn danh sách role, bản nháp, lưu và xung đột 409. Bằng chứng: `ng build` 0 lỗi; Karma 145/145 (trước tách 112 + 33 spec mới của các component con, các spec cũ về ma trận và tài khoản chuyển sang component tương ứng).

## 5. Việc còn lại
- Tester kiểm tay màn Vai trò: mở role, tick Cho phép/Từ chối, chọn phạm vi, chế độ JSON, tab Tài khoản.
- Nhánh refactor cũ đã merge; PR tách roles: nhánh `thien/refactor-roles-split`.
