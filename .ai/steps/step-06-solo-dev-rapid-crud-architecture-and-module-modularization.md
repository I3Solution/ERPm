# 🚀 STEP 06: KIẾN TRÚC GENERIC BASE CRUD TYPE-SAFE & CHUẨN HÓA MODULE FOLDER CHO SOLO DEVELOPER

> **Ngày thực hiện:** 2026-10-13  
> **Người thực hiện:** AI Assistant (Antigravity) & Lead Solo Developer  
> **Mục tiêu:** Cung cấp giải pháp tối ưu cho lập trình viên solo: Giảm thời gian viết code lặp lại (Boilerplate CRUD) xuống mức tối thiểu (chỉ 5-10 dòng code cho 1 bảng), nhưng đảm bảo **100% Type-Safe**, compile-time checking, không dùng runtime reflection nguy hiểm; đồng thời chuẩn hóa cấu trúc thư mục theo Module (SYS, WMS, CRM, SALES, PURCHASE, ACC).

---

## 📌 1. BỐI CẢNH & PHÂN TÍCH YÊU CẦU

- **Nhu cầu của Solo Developer:** Một mình phát triển và bảo trì hệ thống ERP lớn gồm hàng chục bảng master data và chứng từ. Việc viết lặp lại hàng nghìn dòng code CRUD thủ công (Controller, DTO, Service, EF Core) gây lãng phí thời gian và dễ nhầm lẫn.
- **Tại sao không dùng mô hình Dynamic Reflection (như PhotoboothBE)?**
  - Mất hoàn toàn type-safety (dùng `dynamic dto`, `Dictionary<string, string>`).
  - Swagger không sinh schema request/response chuẩn.
  - Reflection runtime gây sụt giảm hiệu năng, khó debug và nguy cơ bảo mật Mass-Assignment.
- **Giải pháp triển khai trong Step 06:**
  - Xây dựng framework **Generic Strongly-Typed Base CRUD**:
    - `IBaseCrudService<TEntity, TDto, TCreateDto, TUpdateDto, TKey>`
    - `BaseCrudService<TEntity, TDto, TCreateDto, TUpdateDto, TKey>` (Tích hợp Mapster hiệu năng cao, EF Core Paging, Soft-delete tự động, Virtual Extension Hooks).
    - `BaseCrudController<TEntity, TDto, TCreateDto, TUpdateDto, TKey>` (5 endpoints chuẩn RESTful, Swagger documentation tự động).
    - Đăng ký DI **Open Generics**: Tự động giải quyết `IBaseCrudService` mà không cần viết Service riêng cho các bảng CRUD danh mục thuần túy.
  - Chuẩn hóa module và phân cấp thư mục theo quy ước tiền tố bảng:
    - **SYS:** `tbl_SYS_Branch`, `tbl_SYS_Language`, `tbl_SYS_Dictionary`
    - **WMS:** `tbl_WMS_Category`, `tbl_WMS_UnitOfMeasure`, `tbl_WMS_Item`, `tbl_WMS_Warehouse`, ...
    - **CRM:** `tbl_CRM_Partner`
    - **SALES:** `tbl_SALES_Order`, `tbl_SALES_OrderItem`, `tbl_SALES_Invoice`, `tbl_SALES_InvoiceItem`
    - **PURCHASE:** `tbl_PURCHASE_Order`, `tbl_PURCHASE_OrderItem`
    - **ACC:** `tbl_ACC_Account`, `tbl_ACC_JournalEntry`, `tbl_ACC_JournalEntryLine`

---

## 🛠️ 2. DANH SÁCH FILE ĐÃ TẠO & CẬP NHẬT

### 2.1. Framework Base CRUD & Common
- `src/ERPm.Application/Common/Crud/BaseFilterQuery.cs` (Định nghĩa query phân trang, tìm kiếm keyword, sắp xếp).
- `src/ERPm.Application/Common/Crud/IBaseCrudService.cs` (Interface Base CRUD strongly-typed).
- `src/ERPm.Infrastructure/Services/Common/BaseCrudService.cs` (Triển khai logic EF Core, Mapster, Paging, Virtual Hooks).
- `src/ERPm.API/Controllers/Base/BaseCrudController.cs` (Base controller chuẩn RESTful).

### 2.2. Domain Entities & Database DDL
- `src/ERPm.Domain/Entities/Sales/SalesOrder.cs` (`tbl_SALES_Order`, `tbl_SALES_OrderItem`).
- `src/ERPm.Domain/Entities/Purchase/PurchaseOrder.cs` (`tbl_PURCHASE_Order`, `tbl_PURCHASE_OrderItem`).
- `database/erpm_schema.sql` (Bổ sung bảng `tbl_SALES_Order`, `tbl_SALES_OrderItem`, `tbl_PURCHASE_Order`, `tbl_PURCHASE_OrderItem`).
- `src/ERPm.Infrastructure/Persistence/ApplicationDbContext.cs` (Ánh xạ Fluent API và DbSets cho SalesOrder và PurchaseOrder).

### 2.3. DTOs & Modular Controllers Mẫu
- `src/ERPm.Application/DTOs/Sales/SalesOrderDtos.cs`
- `src/ERPm.Application/DTOs/Purchase/PurchaseOrderDtos.cs`
- `src/ERPm.Application/DTOs/Catalog/CatalogDtos.cs` (Bổ sung `CreateCategoryRequest`, `CreateUomRequest`, ...).
- `src/ERPm.API/Controllers/WMS/CategoriesController.cs` (Áp dụng `BaseCrudController`, chỉ 10 dòng code).
- `src/ERPm.API/Controllers/WMS/UnitsOfMeasureController.cs` (Áp dụng `BaseCrudController`, chỉ 10 dòng code).
- `src/ERPm.API/Controllers/SALES/SalesOrdersController.cs` (Kế thừa `BaseCrudController` + Action xác nhận đơn).
- `src/ERPm.API/Controllers/PURCHASE/PurchaseOrdersController.cs` (Kế thừa `BaseCrudController` + Action xác nhận đơn).

### 2.4. Đăng ký Dependency Injection
- `src/ERPm.Infrastructure/DependencyInjection.cs`:
  - Thêm open generic: `services.AddScoped(typeof(IBaseCrudService<,,,,>), typeof(BaseCrudService<,,,,>));`
  - Thêm package `Mapster`.

---

## 💻 3. KẾT QUẢ KIỂM TRA (VERIFICATION)

- **Lệnh thực hiện:** `dotnet build`
- **Kết quả:** Build thành công hoàn toàn (**0 Warning, 0 Error**).
- **Kiểm tra tính tiện dụng:**
  - Thêm một bảng danh mục mới (ví dụ `Category` hoặc `UnitOfMeasure`): Chỉ cần khai báo Entity, DTO, và 1 file Controller kế thừa `BaseCrudController`. Toàn bộ 5 endpoints RESTful hoạt động ngay lập tức mà không cần viết Service riêng hay đụng vào Program.cs/DI.
  - Khi cần can thiệp logic: Override các hook ảo như `ApplyFilters`, `BeforeCreateAsync`, `AfterCreateAsync`, `BeforeUpdateAsync` cực kỳ tường minh, 100% Type-Safe.

---

## 🔮 4. HƯỚNG ĐI CHO STEP TIẾP THEO
- Tích hợp thêm các màn hình quản lý Danh mục đơn vị tính và Đơn hàng mua/bán (Purchase Order / Sales Order) lên giao diện Frontend Angular + Ionic khi cần.
- Bổ sung unit test / integration test cho các hook mở rộng của Base CRUD.
