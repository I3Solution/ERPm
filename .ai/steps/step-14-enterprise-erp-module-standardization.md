# 🚀 STEP 14: CHUẨN HÓA MÃ VIẾT TẮT MODULE ERP TOÀN DIỆN (BE, FE, DB, GITMODULES)

## 🎯 1. MỤC TIÊU CỦA BƯỚC NÀY
- Chuẩn hóa toàn bộ hệ thống theo danh mục 9 module ERP cốt lõi + Executive Dashboard & System Core.
- Thống nhất tiền tố CSDL PostgreSQL theo module: `tbl_SYS_...`, `tbl_CRM_...`, `tbl_WMS_...`, `tbl_SALE_...`, `tbl_PURCHASE_...`, `tbl_ACC_...`.
- Tái cấu trúc Controllers Backend theo thư mục module: `Controllers/SD/`, `Controllers/PUR/`, `Controllers/WMS/`, `Controllers/CRM/`, `Controllers/SYS/`, `Controllers/DASHBOARD/`, `Controllers/ACC/`.
- Tái cấu trúc Frontend thành 10 Git Submodule độc lập:
  - `ACC`: `https://github.com/I3Solution/ERPm-FE-ACC.git`
  - `SD`: `https://github.com/I3Solution/ERPm-FE-SD.git`
  - `PUR`: `https://github.com/I3Solution/ERPm-FE-PUR.git`
  - `WMS`: `https://github.com/I3Solution/ERPm-FE-WMS.git`
  - `CRM`: `https://github.com/I3Solution/ERPm-FE-CRM.git`
  - `HRM`: `https://github.com/I3Solution/ERPm-FE-HRM.git`
  - `MFG`: `https://github.com/I3Solution/ERPm-FE-MFG.git`
  - `SCM`: `https://github.com/I3Solution/ERPm-FE-SCM.git`
  - `PM`: `https://github.com/I3Solution/ERPm-FE-PM.git`
  - `DASHBOARD`: `https://github.com/I3Solution/ERPm-FE-DASHBOARD.git`
- Đăng ký đầy đủ 10 module vào [.gitmodules](../../ERPm-FE/.gitmodules) của Frontend.
- Cập nhật toàn bộ tài liệu quy chuẩn (`PROJECT_MASTER.md`, `README.md`, `.ai/status.md`).

---

## 📂 2. BẢNG MÃ VIẾT TẮT CHUẨN HÓA
1. **ACC**: Financial & Accounting (Tài chính và Kế toán) -> `tbl_ACC_`
2. **SD**: Sales & Distribution (Quản lý bán hàng và Phân phối) -> `tbl_SALE_`
3. **PUR**: Procurement / Purchasing (Quản lý mua hàng) -> `tbl_PURCHASE_`
4. **WMS**: Warehouse & Inventory Management (Quản lý kho và Hàng tồn kho) -> `tbl_WMS_`
5. **MFG**: Manufacturing / Production Planning (Quản lý sản xuất) -> `tbl_MFG_`
6. **SCM**: Supply Chain Management (Quản lý chuỗi cung ứng) -> `tbl_SCM_`
7. **HRM**: Human Resource Management (Quản lý nhân sự) -> `tbl_HRM_`
8. **CRM**: Customer Relationship Management (Quản lý quan hệ khách hàng) -> `tbl_CRM_`
9. **PM**: Project Management (Quản lý dự án) -> `tbl_PM_`
10. **SYS**: System Core / Branch Engine (Hệ thống & Chi nhánh) -> `tbl_SYS_`
11. **DASHBOARD**: Executive Intelligence (Báo cáo tổng quan)

---

## ✅ 3. KẾT QUẢ KIỂM TRA (VERIFICATION)
1. **Backend .NET 8:** `dotnet build ERPm-BE/ERPm.sln` -> **0 Warning, 0 Error**.
2. **Frontend Angular 18:** `npm --prefix ERPm-FE run build` -> **Bundle Generation Complete (0 Error)**.
3. **Git Submodules:** `git -C ERPm-FE submodule status` -> Cả 10 submodules đều trỏ chính xác HEAD commit `master`.
