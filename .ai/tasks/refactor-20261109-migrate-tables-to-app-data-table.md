# [refactor] Chuyển đổi các trang sử dụng <table> sang <app-data-table> chuẩn hóa

> **Loại:** refactor
> **Ngày tạo:** 2026-11-09 · **Người làm:** loipham · **Người yêu cầu:** loipham
> **Trạng thái:** Done
> **Liên quan:** `ERPm-FE` (submodule) & repo root `ERPm` · Nhánh: `loipham/refactor-app-data-table`

## 1. Mô tả
- Đã rà soát toàn bộ các trang và thành phần giao diện trong `ERPm-FE` đang sử dụng thẻ `<table>` HTML thuần.
- Chuyển đổi toàn bộ các trang danh sách dữ liệu chính (Main Grid Pages) và bảng dòng chứng từ (Detail Line Items) sang component chuẩn hóa doanh nghiệp `<app-data-table>` (`DataTableComponent`, `DataTableCellDirective`, `TableColumn`).
- Đảm bảo tính nhất quán giao diện, responsive desktop/mobile, hỗ trợ sticky header, định dạng số/tiền tệ tự động (`money-cell`), badge trạng thái và sắp xếp cột.

## 2. Kết quả Rà soát & Phân loại màn hình

### Nhóm 1: Các trang danh sách dữ liệu chính (Main Data Grid Pages) — Đã chuyển 100% sang `<app-data-table>`
1. **CRM Partners** (`src/app/modules/CRM/partners/`): Quản lý Khách hàng & Nhà cung cấp.
2. **SD Quotations** (`src/app/modules/SD/quotations/`): Danh sách Báo giá bán hàng.
3. **SD Returns** (`src/app/modules/SD/returns/`): Danh sách Đơn trả hàng / Hoàn tiền.
4. **SD Price Lists** (`src/app/modules/SD/price-lists/`): Danh sách Bảng giá sản phẩm.
5. **WMS Items** (`src/app/modules/WMS/items/`): Danh mục Sản phẩm / Hàng hóa.
6. **WMS Inventory** (`src/app/modules/WMS/inventory/`): Báo cáo & Quản lý Tồn kho.
7. **HRM Employees** (`src/app/modules/HRM/employees/`): Quản lý Danh sách Nhân viên.
8. **HRM Department Levels** (`src/app/modules/HRM/department-levels/`): Quản lý Cấp bậc phòng ban.
9. **HRM Job Positions** (`src/app/modules/HRM/job-positions/`): Quản lý Vị trí chức danh.
10. **SYS Users** (`src/app/modules/SYS/users/`): Quản lý Tài khoản người dùng.
11. **SYS Notification Templates** (`src/app/modules/SYS/notifications/notification-templates/`): Danh mục Mẫu thông báo hệ thống.
12. **SYS Notification Center** (`src/app/modules/SYS/notifications/notification-center/`): Trung tâm thông báo người dùng.
*(Cùng với SD Orders đã được chuyển đổi trước đó)*

### Nhóm 2: Bảng chi tiết dòng chứng từ (Detail Line Items) — Đã chuyển 100% sang `<app-data-table>`
13. **SD Quotation Detail Lines** (`src/app/modules/SD/quotations/quotation-detail/`): Bảng danh sách dòng sản phẩm báo giá (cả 2 chế độ View và Edit inline).
14. **SD Return Detail Lines** (`src/app/modules/SD/returns/return-detail/`): Bảng danh sách sản phẩm hoàn hàng (cả 2 chế độ View và Edit inline).
15. **SD Price List Tier Items** (`src/app/modules/SD/price-lists/components/price-list-items/`): Bảng giá bậc thang theo số lượng.
*(Cùng với SD Order Detail Lines đã được chuyển đổi trước đó)*

### Nhóm 3: Các bảng đặc thù giữ nguyên (Không phù hợp dùng `app-data-table`)
- **Print Preview Dialog** (`src/app/modules/SD/print-preview/print-preview-dialog/`): Bản in khổ nhiệt K80 và khổ A4 để gửi trực tiếp ra máy in qua `window.print()`.
- **POS Cashier** (`src/app/modules/SD/pos/`): Hóa đơn bán lẻ POS tại quầy thu ngân.
- **Permission Matrix** (`src/app/modules/SYS/roles/components/permission-matrix/`): Ma trận phân quyền 2 chiều đa checkbox (Module x Action).
- **Effective Permission Preview** (`src/app/modules/SYS/roles/components/effective-permission-preview/`): Bảng preview ma trận quyền hiệu dụng.
- **Notification Preferences** (`src/app/modules/SYS/notifications/notification-preferences/`): Ma trận cấu hình bật/tắt nhận thông báo (Kênh x Loại thông báo).

## 3. Danh sách Commit
- Submodule `CRM`: `97b4128` - `[refactor](CRM) migrate partners table to app-data-table`
- Submodule `HRM`: `d88e3ba` - `[refactor](HRM) migrate employees, department-levels, and job-positions tables to app-data-table`
- Submodule `SD`: `963b862` - `[refactor](SD) migrate quotations, returns, pricelists, and line item tables to app-data-table`
- Submodule `WMS`: `9cecbf8` - `[refactor](WMS) migrate items and inventory balances tables to app-data-table`
- Repo `ERPm-FE`: `689d037` - `[refactor](FE) migrate main data tables to app-data-table and update submodule pointers`

## 4. Kiểm tra
- **Frontend Build:** `npm run build` chạy thành công với `Exit code 0` (0 error, bundle kích thước chuẩn).
- Kiểm tra tính tương thích Responsive: Toàn bộ bảng đã có `minWidth` chuẩn desktop và chế độ mobile view card tách biệt.
- Toàn bộ directive và template projection (`appDataTableCell`) hoạt động chính xác cho các ô tùy biến (status badge, link điều hướng, hành động xóa/sửa/in).

## 5. Việc còn lại
- Không.
