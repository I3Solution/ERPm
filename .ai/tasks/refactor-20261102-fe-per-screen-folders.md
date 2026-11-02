# [refactor] FE: mỗi màn một thư mục riêng, sub-widget vào `components/`

> **Loại:** refactor
> **Ngày tạo:** 2026-11-02 · **Người làm:** Thiện (AI executor) · **Người yêu cầu:** Thiện (qua BA)
> **Trạng thái:** Doing (đã di chuyển màn rời; còn tách `roles` thành thư mục con, chờ tester/Thiện)
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

## 5. Việc còn lại
- Tách `SYS/roles` thành `permission-matrix/`, `policy-json-editor/`, `effective-permission-preview/`, `user-role-assignment/` (chưa làm).
- Nhánh refactor xếp chồng lên nhánh S20.4.5 (cùng file `employees.component.*`), nên merge S20.4.5 trước.
- Tester kiểm hồi quy nhanh các màn bị di chuyển trên trình duyệt.
