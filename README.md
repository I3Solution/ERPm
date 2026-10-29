# 🏛️ ERPM - ENTERPRISE MULTI-REPOSITORY ARCHITECTURE

> **Tổ chức:** [I3Solution](https://github.com/I3Solution)  
> **Parent Umbrella Repository:** `https://github.com/I3Solution/ERPm.git`

Hệ thống **ERPm** (Quản trị Bán hàng, Tồn kho & Kế toán mở rộng) được chuẩn hóa theo mô hình **Enterprise Multi-Repository & Git Submodules** với các mã viết tắt module ERP chuẩn quốc tế:

```text
ERPm (Parent Umbrella Orchestrator: https://github.com/I3Solution/ERPm.git)
│
├── 📂 ERPm-BE (Backend .NET 8 Clean Architecture)
│   └── Remote: https://github.com/I3Solution/ERPm-BE.git
│       ├── Controllers: ACC/, SD/, PUR/, WMS/, CRM/, SYS/, DASHBOARD/
│       └── Database DDL: tbl_SYS_..., tbl_CRM_..., tbl_WMS_..., tbl_SALE_..., tbl_PURCHASE_..., tbl_ACC_...
│
└── 📂 ERPm-FE (Frontend Angular 20 + Ionic 8 Hybrid)
    ├── Remote: https://github.com/I3Solution/ERPm-FE.git
    │
    └── 📦 10 Feature Module Git Submodules:
        ├── 1. ACC       -> https://github.com/I3Solution/ERPm-FE-ACC.git       (Tài chính & Kế toán - Sổ cái, Công nợ, Dòng tiền)
        ├── 2. SD        -> https://github.com/I3Solution/ERPm-FE-SD.git        (Bán hàng & Phân phối - POS Touch, Báo giá, Đơn bán)
        ├── 3. PUR       -> https://github.com/I3Solution/ERPm-FE-PUR.git       (Mua hàng - Yêu cầu mua, Đơn mua PO, NCC)
        ├── 4. WMS       -> https://github.com/I3Solution/ERPm-FE-WMS.git       (Kho & Hàng tồn kho - Item Master, Tồn tức thời, Nhập/Xuất)
        ├── 5. MFG       -> https://github.com/I3Solution/ERPm-FE-MFG.git       (Sản xuất - Lập KH sản xuất, Định mức BOM, Điều phối)
        ├── 6. SCM       -> https://github.com/I3Solution/ERPm-FE-SCM.git       (Chuỗi cung ứng - Luồng cung ứng từ NCC đến Phân phối)
        ├── 7. HRM       -> https://github.com/I3Solution/ERPm-FE-HRM.git       (Nhân sự - Hồ sơ, Chấm công, Tính lương, KPI)
        ├── 8. CRM       -> https://github.com/I3Solution/ERPm-FE-CRM.git       (Khách hàng - Danh bạ đối tác, Tiềm năng, Chăm sóc)
        ├── 9. PM        -> https://github.com/I3Solution/ERPm-FE-PM.git        (Dự án - Lập kế hoạch, Nguồn lực, Chi phí & Tiến độ)
        └── 10. DASHBOARD-> https://github.com/I3Solution/ERPm-FE-DASHBOARD.git (Báo cáo & Tổng quan điều hành)
```

---

## 📌 QUY ƯỚC ĐẶT TÊN VIẾT TẮT CHUẨN DOANH NGHIỆP

| Mã Module | Tên Phân Hệ | Mục tiêu & Phạm vi | Tiền tố Bảng CSDL | Git Submodule FE |
| :---: | :--- | :--- | :---: | :--- |
| **`ACC`** | **Financial & Accounting** | Sổ cái, công nợ phải thu/phải trả, tài sản, ngân sách, báo cáo tài chính | `tbl_ACC_` | `ERPm-FE-ACC` |
| **`SD`** | **Sales & Distribution** | Bán hàng POS, báo giá, đơn hàng, hóa đơn, chính sách giá | `tbl_SALE_` | `ERPm-FE-SD` |
| **`PUR`** | **Procurement / Purchasing** | Yêu cầu mua hàng, quản lý nhà cung cấp, đơn đặt hàng (PO) | `tbl_PURCHASE_` | `ERPm-FE-PUR` |
| **`WMS`** | **Warehouse & Inventory** | Xuất-nhập-tồn, định vị kho bãi, kiểm kê, danh mục Item & Thuộc tính động | `tbl_WMS_` | `ERPm-FE-WMS` |
| **`MFG`** | **Manufacturing / Production** | Lập kế hoạch sản xuất, điều phối máy móc, định mức BOM, tiến độ xưởng | `tbl_MFG_` | `ERPm-FE-MFG` |
| **`SCM`** | **Supply Chain Management** | Tối ưu hóa chuỗi cung ứng từ nhà cung ứng đến phân phối người dùng | `tbl_SCM_` | `ERPm-FE-SCM` |
| **`HRM`** | **Human Resource Management** | Hồ sơ nhân viên, chấm công, bảng lương, bảo hiểm, đánh giá hiệu suất | `tbl_HRM_` | `ERPm-FE-HRM` |
| **`CRM`** | **Customer Relationship** | Quản lý khách hàng, lịch sử giao dịch, hạn mức công nợ, chiến dịch | `tbl_CRM_` | `ERPm-FE-CRM` |
| **`PM`** | **Project Management** | Quản lý dự án nội bộ & dịch vụ, phân bổ nguồn lực, chi phí & tiến độ | `tbl_PM_` | `ERPm-FE-PM` |
| **`SYS`** | **System Administration** | Chi nhánh đa tầng (`Branch`), Phân quyền, Ngôn ngữ & Từ điển i18n | `tbl_SYS_` | Core App |
| **`DASHBOARD`** | **Executive Intelligence** | Biểu đồ KPI, doanh thu tức thời, cảnh báo kho, top bán chạy | API Query | `ERPm-FE-DASHBOARD` |

---

## 🚀 HƯỚNG DẪN CLONE TOÀN BỘ HỆ THỐNG
```bash
# Clone đệ quy toàn bộ umbrella repo và tất cả 10 submodules:
git clone --recurse-submodules https://github.com/I3Solution/ERPm.git
```
