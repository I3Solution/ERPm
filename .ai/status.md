# 📊 DỰ ÁN ERPM - BẢNG TRẠNG THÁI HIỆN TẠI (CURRENT STATUS)

> **Cập nhật lần cuối:** 2026-10-22  
> **Giai đoạn hiện tại:** Giai đoạn 1 (Nền tảng Kiến trúc Nhanh & Multi-Branch Deep Dive) -> Chuẩn bị bước vào Giai đoạn 2 (Mua hàng & Sổ quỹ)  
> **Trạng thái:** Backend .NET 8 Clean Architecture hoàn thiện + Multi-Branch Tree Select vô hạn tầng + Lọc dữ liệu cha con tự động cho toàn bộ hệ thống.

---

## 📌 1. TIẾN ĐỘ TỔNG QUAN

| Hạng mục / Phân hệ | Tiến độ | Trạng thái | Ghi chú |
| :--- | :---: | :---: | :--- |
| **Quy chuẩn & Kế hoạch Master** | 100% |  Hoàn thành | Đã tạo `PROJECT_MASTER.md`, `AGENTS.md`, `.ai/` |
| **Backend Clean Architecture (.NET 8)** | 100% |  Hoàn thành | Đã tách 4 tầng, build 0 errors ([step-01.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-01-clean-architecture-and-core-database.md)) |
| **PostgreSQL & Schema Script** | 100% |  Hoàn thành | Đã có [erpm_schema.sql](file:///d:/WORKING%20PLACE/ERPm/database/erpm_schema.sql) 540+ dòng |
| **Phân hệ ITEM & Danh mục** | 100% |  Hoàn thành | Backend CRUD + Frontend Adaptive UI hoàn chỉnh ([step-02.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-02-frontend-angular-ionic-setup.md)) |
| **Phân hệ Đa ngôn ngữ (i18n)** | 100% |  Hoàn thành | Backend Bundle API + Frontend TranslatePipe & Signal (VI/EN) |
| **Frontend Angular + Ionic Hybrid** | 100% |  Hoàn thành | Hoàn thiện tất cả 5 màn hình, build 0 errors ([step-03.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-03-full-mvp-sales-inventory-pos.md)) |
| **Phân hệ Bán hàng & POS Touch** | 100% |  Hoàn thành | Giao diện thu ngân POS, giỏ hàng, thanh toán, in hóa đơn nhiệt |
| **Phân hệ Tồn kho (Inventory)** | 100% |  Hoàn thành | Xem tồn tức thời, cảnh báo hết hàng, lập phiếu nhập kho nhanh |
| **Phân hệ Khách hàng (Partner)** | 100% |  Hoàn thành | Danh bạ KH/NCC, phân loại, hạn mức nợ và theo dõi công nợ |
| **Hạt nhân Kế toán (Double-Entry)** | 100% |  Hoàn thành | Tự động sinh bút toán Nợ/Có (111/131/511/632/156) khi bán hàng |
| **Tâm điểm Chi nhánh (Multi-Branch)** | 100% |  Hoàn thành | Cây phân cấp, branch_id cho toàn bộ chứng từ & kho bãi ([step-05.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-05-multi-branch-architecture-and-table-prefix-redesign.md)) |
| **Framework Base CRUD cho Solo Dev** | 100% |  Hoàn thành | Generic Base CRUD Type-safe + Module Folder ([step-06.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-06-solo-dev-rapid-crud-architecture-and-module-modularization.md)) |
| **Frontend Modularization & 3 Files Triad** | 100% |  Hoàn thành | Tách thư mục modules, tách độc lập .ts, .html, .scss ([step-07.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-07-frontend-modularization-and-component-triad-separation.md)) |
| **Design System & Ionic Customization** | 100% |  Hoàn thành | Tokens, Tables, Ionic Overrides & Reusable UI ([step-08.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-08-modern-design-system-and-ionic-customization.md)) |
| **Multi-Branch Tree-Select & Querying** | 100% |  Hoàn thành | Tree Select menu đệ quy vô hạn + BFS lọc cha con con cháu ([step-09.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-09-multi-branch-nested-tree-select-and-recursive-filtering.md)) |
| **Custom Select, Pointer & Full i18n** | 100% |  Hoàn thành | Custom Select Component, triệt tiêu caret nhấp nháy, phủ song ngữ 100% ([step-10.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-10-custom-select-cursor-and-complete-i18n.md)) |
| **Dynamic Item Attributes (JSONB)** | 100% |  Hoàn thành | Thuộc tính động Schema-driven + PostgreSQL JSONB + GIN Index ([step-11.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-11-dynamic-item-attributes-jsonb.md)) |
| **Git Remote & Gitignore Configuration** | 100% |  Hoàn thành | Cấu hình remote `origin` GitHub & Master `.gitignore` ([step-12.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-12-git-remote-and-gitignore-setup.md)) |
| **Multi-Repo & Submodules Architecture** | 100% |  Hoàn thành | Tách BE/FE thành 2 repo riêng, phân rã submodule FE lồng nhau ([step-13.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-13-multi-repo-and-submodule-enterprise-architecture.md)) |
| **Enterprise Module Acronyms & Gitmodules** | 100% |  Hoàn thành | Chuẩn hóa 10 module viết tắt (ACC, SD, PUR, WMS, CRM, HRM, MFG, SCM, PM, DASHBOARD) ([step-14.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-14-enterprise-erp-module-standardization.md)) |

---

## 🛠️ 2. CÔNG VIỆC VỪA HOÀN THÀNH (COMPLETED IN STEP 14)
- [x] **Chuẩn hóa danh mục 10 Module ERP viết tắt chuẩn mực:**
  - `ACC`, `SD`, `PUR`, `WMS`, `CRM`, `HRM`, `MFG`, `SCM`, `PM`, `DASHBOARD`.
- [x] **Tái cấu trúc CSDL PostgreSQL theo module:**
  - Chuẩn hóa các bảng bán hàng thành `tbl_SALE_Order`, `tbl_SALE_OrderItem`, `tbl_SALE_Invoice`, `tbl_SALE_InvoiceItem`.
  - Giữ vững các bảng `tbl_PURCHASE_...`, `tbl_WMS_...`, `tbl_CRM_...`, `tbl_ACC_...`, `tbl_SYS_...`.
- [x] **Cập nhật Backend Clean Architecture:**
  - Gom các Controllers theo thư mục module: `Controllers/SD/`, `Controllers/PUR/`, `Controllers/WMS/`, `Controllers/CRM/`, `Controllers/SYS/`, `Controllers/DASHBOARD/`.
  - Biên dịch kiểm tra: `dotnet build` đạt **0 Warning, 0 Error**.
- [x] **Cập nhật Frontend Angular 18 Submodules & .gitmodules:**
  - Tách bạch 10 Submodules tương ứng với remote `https://github.com/I3Solution/ERPm-FE-[MODULE].git`.
  - Mỗi submodule đều sở hữu `.ai/plan.md` (kế hoạch con từ task FE giao), `.ai/status.md` và `.ai/steps/`.
  - Biên dịch kiểm tra: `npm run build` đạt **0 Error**.
- [x] **Cập nhật tài liệu hệ thống:** `PROJECT_MASTER.md`, `README.md`, `.gitmodules`.
- [x] **Tách Backend & Frontend thành 2 Git Repo độc lập:**
  - `ERPm-BE`: `https://github.com/I3Solution/ERPm-BE.git` (.NET 8 Clean Architecture, PostgreSQL).
  - `ERPm-FE`: `https://github.com/I3Solution/ERPm-FE.git` (Angular 18 Standalone, Ionic 8 Hybrid).
- [x] **Phân rã 5 Git Submodule cho Frontend:**
  - `catalog`: `https://github.com/I3Solution/ERPm-FE-catalog.git`
  - `dashboard`: `https://github.com/I3Solution/ERPm-FE-dashboard.git`
  - `inventory`: `https://github.com/I3Solution/ERPm-FE-inventory.git`
  - `partners`: `https://github.com/I3Solution/ERPm-FE-partners.git`
  - `sales`: `https://github.com/I3Solution/ERPm-FE-sales.git`
- [x] **Hệ thống Quản lý Kế hoạch & Trạng thái độc lập:**
  - Mỗi repo chính (`ERPm-BE`, `ERPm-FE`) có `PROJECT_MASTER.md`, `AGENTS.md`, `.ai/` riêng.
  - Mỗi submodule FE có `.ai/plan.md` (kế hoạch con từ task FE giao), `.ai/status.md`, `.ai/steps/` riêng.
- [x] **Liên kết Submodules:** Cấu hình `.gitmodules` ở cả tầng Root và tầng Frontend.
- [x] **Kiểm thử biên dịch:** `dotnet build` (0 Error) và `npm run build` (0 Error).
- [x] **Cấu hình Git Remote Repository:**
  - Thiết lập remote `origin` trỏ tới `https://github.com/I3Solution/ERPm.git`.
  - Kiểm tra và xác nhận cả `fetch` và `push` đều kết nối thành công.
- [x] **Chuẩn hóa Master `.gitignore`:**
  - Bổ sung bộ lọc cho .NET 8 (bin, obj, publish, .vs, nupkg, test results, cache).
  - Bổ sung bộ lọc cho Angular 18 & Node.js (node_modules, .angular, dist, coverage, logs).
  - Bổ sung bộ lọc cho IDEs & Hệ điều hành (VS Code, JetBrains, Windows Thumbs/Desktop.ini, macOS .DS_Store).
  - Bảo vệ các tệp bí mật (.env, appsettings local/secrets).
- [x] **Mô hình Thuộc tính Động Schema-Driven (Hybrid Metadata + JSONB):**
  - Tạo bảng metadata `tbl_WMS_ItemAttribute` quản lý danh mục thuộc tính người dùng tự định nghĩa (`code`, `name`, `data_type`, `options`, `unit`, `is_required`, `is_filterable`).
  - Bổ sung cột `attributes jsonb DEFAULT '{}'::jsonb` vào `tbl_WMS_Item` với chỉ mục GIN `idx_tbl_wms_item_attributes_gin` cho tốc độ truy vấn JSON path tức thì.
- [x] **Backend .NET 8 Clean Architecture:**
  - Entity `ItemAttribute`, `Item.Attributes` mapping qua EF Core Npgsql `jsonb` với `ValueComparer`.
  - Base CRUD Controller `ItemAttributesController` hỗ trợ endpoint `/api/v1/wms/item-attributes/by-category/{categoryId?}`.
  - Data Seeder nạp sẵn các thuộc tính thực tế: Màu sắc (`color`), Kích cỡ / Quy cách (`size`), Xuất xứ (`origin`), Thời hạn bảo hành (`warranty_months`).
- [x] **Frontend Dynamic UI (Angular 18 Standalone + Signals):**
  - `ItemService.loadAttributes()` tải danh sách thuộc tính động từ Backend hoặc fallback mặc định.
  - Form tạo sản phẩm mới tự động sinh các trường điều khiển theo kiểu dữ liệu (`Select` dùng `CustomSelectComponent`, `Number`, `Text`, `Date`, `Boolean`).
  - Hiển thị Pills/Badges thuộc tính trên Desktop Table và Mobile Cards.
- [x] **Kỷ luật Kỹ thuật (Technical Discipline):**
  - Toàn bộ comment trong source code (C#, TypeScript, SCSS, SQL) đều 100% Tiếng Anh (English only).
  - Biên dịch kiểm tra: `dotnet build` (0 Warning, 0 Error) và `npm run build` (0 Error).
- [x] **Xây dựng Reusable Component `CustomSelectComponent` (`app-custom-select`):**
  - Xóa bỏ hoàn toàn thẻ `<select>` / `<option>` native thô với nền xanh OS.
  - Tích hợp `ControlValueAccessor` tương thích hoàn hảo với `[(ngModel)]` và Form Controls.
  - Hỗ trợ thanh tìm kiếm lọc tức thì bên trong dropdown (dành cho danh sách nhiều mục).
  - Tự động đóng dropdown khi click ra ngoài hoặc bấm phím Escape.
  - Áp dụng thành công cho: Lọc kho hàng (Inventory), Modal nhập kho (Warehouse, Supplier, Item), Phân loại đối tác (Partners), và Chọn khách hàng (POS).
- [x] **Chuẩn hóa Cursor Pointer & Khắc phục triệt để lỗi con trỏ chuột nhấp nháy trên thẻ `<span>`:**
  - Thiết lập kỷ luật toàn cục: `body *:not(input):not(textarea):not([contenteditable="true"]) { caret-color: transparent !important; }`.
  - Ép `cursor: pointer !important; user-select: none !important;` lên tất cả các vùng tương tác (buttons, select triggers, tree nodes, table headers, pills, chips, icons) và toàn bộ các phần tử con (`*`).
- [x] **Phủ sóng Đa ngôn ngữ (i18n) 100% trên toàn bộ màn hình:**
  - Từ điển `DEFAULT_FALLBACK_DICTIONARY` mở rộng hơn 80+ keys song ngữ Anh - Việt.
  - Thay thế toàn bộ text cứng bằng `translate` pipe trên: Inventory, Catalog, Partners, Dashboard, POS, Branch Tree Select.
- [x] **Kiểm thử biên dịch:**
  - `npm run build`: **0 Warning, 0 Error, Code 0** (12.7s).

---

## 🚀 3. HƯỚNG DẪN KHỞI CHẠY & KIỂM THỬ
1. **Cơ sở dữ liệu:** File độc lập [database/erpm_schema.sql](file:///d:/WORKING%20PLACE/ERPm/database/erpm_schema.sql).
2. **Backend .NET 8 Web API:** Chạy `dotnet run --project src/ERPm.API` (Swagger UI: `http://localhost:5000/swagger`).
3. **Frontend Angular + Ionic:** Chạy `ng serve` trong thư mục `client/` (`http://localhost:4200`).
