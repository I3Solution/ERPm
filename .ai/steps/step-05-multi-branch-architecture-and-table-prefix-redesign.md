# 📝 Step 05: Tái Cấu Trúc Database Xoay Quanh Branch Phân Cấp & Chuẩn Hóa Tiền Tố Bảng tbl_{MODULE}_{ENTITY}

## 🎯 Mục tiêu
1. **Kiến trúc Tâm điểm Chi nhánh (Multi-Branch Core):**
   - Tạo thực thể và bảng `"tbl_SYS_Branch"` quản lý mạng lưới chi nhánh công ty.
   - Hỗ trợ phân cấp cha - con đa cấp (`parent_id REFERENCES "tbl_SYS_Branch"(id)`).
   - Chi nhánh gốc (Tổng công ty / Head Office) có mã code là `'root'`.
   - Mọi hoạt động kho bãi (`tbl_WMS_Warehouse`), hóa đơn bán hàng (`tbl_SALES_Invoice`), phiếu nhập kho (`tbl_WMS_StockReceipt`), phiếu xuất kho (`tbl_WMS_StockIssue`), và bút toán sổ cái kế toán (`tbl_ACC_JournalEntry`) đều mang `branch_id` bắt buộc để phân quyền và theo dõi chứng từ theo từng chi nhánh.
2. **Chuẩn hóa Tiền tố Tên Bảng `tbl_{MODULE}_{ENTITY}`:**
   - Áp dụng cấu trúc tiền tố chuẩn cho toàn bộ 18 bảng trong hệ thống:
     - **SYS (Hệ thống):** `tbl_SYS_Branch`, `tbl_SYS_Language`, `tbl_SYS_Dictionary`
     - **WMS (Kho & Danh mục):** `tbl_WMS_Item`, `tbl_WMS_Category`, `tbl_WMS_UnitOfMeasure`, `tbl_WMS_Warehouse`, `tbl_WMS_StockBalance`, `tbl_WMS_StockReceipt`, `tbl_WMS_StockReceiptItem`, `tbl_WMS_StockIssue`, `tbl_WMS_StockIssueItem`
     - **CRM (Đối tác & Khách hàng):** `tbl_CRM_Partner`
     - **SALES (Bán hàng & POS):** `tbl_SALES_Invoice`, `tbl_SALES_InvoiceItem`
     - **ACC (Kế toán & Sổ cái):** `tbl_ACC_Account`, `tbl_ACC_JournalEntry`, `tbl_ACC_JournalEntryLine`
3. **Đồng bộ toàn diện giữa Database PostgreSQL, Backend .NET 8 và Frontend Angular + Ionic:**
   - Script SQL [database/erpm_schema.sql](file:///d:/WORKING%20PLACE/ERPm/database/erpm_schema.sql) đã được làm mới hoàn toàn và nạp trực tiếp vào PostgreSQL `erpm_db`.
   - Backend EF Core `ApplicationDbContext.cs` ánh xạ chuẩn xác tên bảng và quan hệ Foreign Key.
   - Thêm `IBranchService`, `BranchService`, `BranchesController` phục vụ API lấy danh sách chi nhánh và cây phân cấp.
   - Tạo `BranchService` trên Angular quản lý chi nhánh hiện tại (`currentBranch`) và cây chi nhánh.

---

## 📁 Danh sách File Đã Tạo & Chỉnh Sửa

1. **Domain:**
   - [Branch.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Domain/Entities/System/Branch.cs) *(Mới)*: Thực thể chi nhánh phân cấp kế thừa `BaseAuditableEntity`.
   - [Warehouse.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Domain/Entities/Inventory/Warehouse.cs): Thêm `BranchId` và navigation `Branch`.
   - [SalesInvoice.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Domain/Entities/Sales/SalesInvoice.cs): Thêm `BranchId` và navigation `Branch`.
   - [StockReceipt.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Domain/Entities/Inventory/StockReceipt.cs): Thêm `BranchId` và navigation `Branch`.
   - [StockIssue.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Domain/Entities/Inventory/StockIssue.cs): Thêm `BranchId` và navigation `Branch`.
   - [JournalEntry.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Domain/Entities/Accounting/JournalEntry.cs): Thêm `BranchId` và navigation `Branch`.

2. **Application:**
   - [IApplicationDbContext.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Application/Common/Interfaces/IApplicationDbContext.cs): Bổ sung `DbSet<Branch> Branches`.
   - [BranchDtos.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Application/DTOs/System/BranchDtos.cs) *(Mới)*: DTO chi nhánh dạng phẳng và cây (`BranchDto`, `CreateBranchRequest`).
   - [IBranchService.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Application/Features/System/IBranchService.cs) *(Mới)*: Interface nghiệp vụ quản lý chi nhánh.
   - [SalesDtos.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Application/DTOs/Sales/SalesDtos.cs): Bổ sung `BranchId` vào `CreateSalesInvoiceRequest` và `SalesInvoiceDto`.
   - [InventoryDtos.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Application/DTOs/Inventory/InventoryDtos.cs): Bổ sung `BranchId` vào `WarehouseDto` và `CreateStockReceiptRequest`.

3. **Infrastructure:**
   - [ApplicationDbContext.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Infrastructure/Persistence/ApplicationDbContext.cs): Cấu hình toàn bộ 18 bảng sang chuẩn `tbl_{MODULE}_{ENTITY}` và Fluent API thiết lập quan hệ FK cho `Branch`.
   - [BranchService.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Infrastructure/Services/BranchService.cs) *(Mới)*: Xử lý lấy danh sách chi nhánh, cây phân cấp và tạo chi nhánh mới.
   - [SalesInvoiceService.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Infrastructure/Services/SalesInvoiceService.cs): Tự động gán `BranchId` từ yêu cầu hoặc kho sở hữu cho Hóa đơn bán hàng, Phiếu xuất kho và Bút toán sổ cái.
   - [StockService.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Infrastructure/Services/StockService.cs): Gán `BranchId` cho phiếu nhập kho và trả thông tin `BranchId` của kho.
   - [DependencyInjection.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Infrastructure/DependencyInjection.cs): Đăng ký `IBranchService`.
   - [DataSeeder.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Infrastructure/Persistence/Seeders/DataSeeder.cs): Khởi tạo chi nhánh gốc `'root'` (Tổng Công Ty) và liên kết kho `KHO01`.

4. **API:**
   - [BranchesController.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.API/Controllers/BranchesController.cs) *(Mới)*: Cung cấp API GET `/api/v1/branches`, GET `/api/v1/branches/tree`, POST `/api/v1/branches`.

5. **Database Script:**
   - [database/erpm_schema.sql](file:///d:/WORKING%20PLACE/ERPm/database/erpm_schema.sql): Cập nhật toàn bộ script DDL và seed data sang chuẩn `tbl_{MODULE}_{ENTITY}`.

6. **Frontend:**
   - [branch.service.ts](file:///d:/WORKING%20PLACE/ERPm/client/src/app/core/services/branch.service.ts) *(Mới)*: Service Angular quản lý signals chi nhánh và chi nhánh hiện hành.
   - [sales.service.ts](file:///d:/WORKING%20PLACE/ERPm/client/src/app/core/services/sales.service.ts): Bổ sung `branchId`.
   - [stock.service.ts](file:///d:/WORKING%20PLACE/ERPm/client/src/app/core/services/stock.service.ts): Bổ sung `branchId`.

7. **Tài liệu:**
   - [PROJECT_MASTER.md](file:///d:/WORKING%20PLACE/ERPm/PROJECT_MASTER.md): Cập nhật quy chuẩn thiết kế Database và Multi-Branch.

---

## 🔍 Kết Quả Kiểm Tra (Verification)

1. **Khởi tạo và kiểm tra PostgreSQL:**
   - Chạy script [database/erpm_schema.sql](file:///d:/WORKING%20PLACE/ERPm/database/erpm_schema.sql) thành công 100%.
   - Danh sách 18 bảng mang tiền tố chuẩn xác: `tbl_SYS_Branch`, `tbl_WMS_Item`, `tbl_SALES_Invoice`, `tbl_ACC_JournalEntry`, v.v.
   - Chi nhánh gốc `'root'` đã tồn tại trong `tbl_SYS_Branch`.
2. **Kiểm tra API Branch (`/api/v1/branches` & `/tree`):**
   - `GET /api/v1/branches` -> Trả về chi nhánh gốc `'root'`.
   - `POST /api/v1/branches` -> Tạo thành công chi nhánh con `CN_HCM` (Chi Nhánh Hồ Chí Minh) có `parentId` trỏ về `root`.
   - `GET /api/v1/branches/tree` -> Trả về cấu trúc cây phân cấp chuẩn, `root` chứa con `CN_HCM`.
3. **Kiểm tra API Catalog (`/api/v1/items`):**
   - Trả về danh sách sản phẩm từ bảng mới `"tbl_WMS_Item"`.
4. **Kiểm tra Bán hàng & Bút toán Kế toán Đa chi nhánh (`/api/v1/sales/pos-checkout`):**
   - Đơn bán hàng `HD0001` được tạo thành công:
     - Gán `branch_id = 00000000-0000-0000-0000-000000000001` (`root`).
     - Phiếu xuất kho `PXK0001` sinh ra trong `"tbl_WMS_StockIssue"` mang `branch_id` của `root`.
     - Bút toán sổ cái `PKT0001` sinh ra trong `"tbl_ACC_JournalEntry"` mang `branch_id` của `root`.
5. **Kiểm tra Compile:**
   - Backend .NET: `dotnet build` -> **0 Warning, 0 Error**.
   - Frontend Angular: `ng build` -> **Hoàn thành thành công (0 error)**.
