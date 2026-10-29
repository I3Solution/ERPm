# 🚀 STEP 01: THIẾT LẬP KIẾN TRÚC BACKEND CLEAN ARCHITECTURE & KHỞI TẠO CSDL CỐT LÕI

> **Thời gian thực hiện:** 2026-10-11  
> **Người thực hiện:** AI Agent  
> **Giai đoạn / Sprint:** Phase 1 (MVP) - Sprint 1.1: Khởi tạo Kiến trúc Lõi & Master Data  
> **Trạng thái:**  Hoàn thành (Completed)  

---

### 1. Mục tiêu của bước
1. Chuyển đổi solution .NET 8 từ project đơn lẻ sang cấu trúc **Clean Architecture 4 tầng chuẩn Enterprise**:
   - `ERPm.Domain` (Core Business Entities, Enums, Interfaces)
   - `ERPm.Application` (DTOs, Interfaces, Service Contracts, ApiResponse)
   - `ERPm.Infrastructure` (EF Core, Npgsql PostgreSQL, DataSeeder, Service Implementations)
   - `ERPm.API` (Controllers, Middleware, Swagger OpenAPI)
2. Thiết lập môi trường PostgreSQL 16 với file cấu hình `docker-compose.yml`.
3. Xây dựng toàn bộ các Entity cốt lõi tuân thủ chặt chẽ [PROJECT_MASTER.md](../../PROJECT_MASTER.md):
   - **Đa ngôn ngữ (i18n):** `AppLanguage`, `AppDictionary` và thuộc tính `Translations` kiểu PostgreSQL `JSONB`.
   - **Phân hệ ITEM (Hàng hóa):** `Item`, `Category`, `UnitOfMeasure` với kiểu số tiền & số lượng `decimal(18, 4)`.
   - **Phân hệ Khách hàng / Đối tác:** `Partner` (Khách hàng & NCC, hạn mức công nợ).
   - **Hạt nhân Kế toán (Double-Entry):** `Account`, `JournalEntry`, `JournalEntryLine`.
4. Cấu hình Fluent API EF Core, DataSeeder dữ liệu mẫu ban đầu, và sinh Migration đầu tiên `Initial_Core_Schema`.
5. Xây dựng các API Controllers đầu tiên:
   - `LocalizationController` (`GET /api/v1/localization/languages`, `GET /api/v1/localization/{langCode}`).
   - `ItemsController` (CRUD đầy đủ sản phẩm, hỗ trợ song ngữ JSONB).

---

### 2. Danh sách các file đã tạo & cấu hình

#### 2.1. Cấu hình Solution & Hạ tầng:
- `docker-compose.yml`: Khởi chạy nhanh PostgreSQL 16 Alpine và pgAdmin 4.
- `ERPm.sln`: Cập nhật cấu hình 4 projects Clean Architecture.

#### 2.2. Domain Layer (`src/ERPm.Domain/`):
- `Common/BaseEntity.cs`: `BaseEntity`, `BaseAuditableEntity`, `IAuditable`, `ISoftDelete`, `ITenant`.
- `Entities/Localization/AppLanguage.cs`: Entity ngôn ngữ hệ thống (`vi`, `en`).
- `Entities/Localization/AppDictionary.cs`: Entity lưu trữ từ điển tĩnh key-value.
- `Entities/Catalog/ItemType.cs`: Enum phân loại (Goods, Service, Combo).
- `Entities/Catalog/UnitOfMeasure.cs`: Entity Đơn vị tính (`Translations` JSONB).
- `Entities/Catalog/Category.cs`: Entity Danh mục phân cấp cây.
- `Entities/Catalog/Item.cs`: Entity Hàng hóa/Sản phẩm (`SalePrice`, `CostPrice` decimal(18,4), `Translations` JSONB).
- `Entities/Partner/PartnerType.cs` & `Partner.cs`: Quản lý khách hàng, nhà cung cấp, công nợ.
- `Entities/Accounting/AccountEnums.cs`: Enum `AccountType` và `VoucherStatus`.
- `Entities/Accounting/Account.cs`: Entity Hệ thống tài khoản kế toán chuẩn.
- `Entities/Accounting/JournalEntry.cs` & `JournalEntryLine.cs`: Entity Bút toán Nợ/Có chuẩn kế toán kép.

#### 2.3. Application Layer (`src/ERPm.Application/`):
- `Common/ApiResponse.cs`: Standard API Response Wrapper (`ApiResponse<T>` & `PagedResult<T>`).
- `Common/Interfaces/IApplicationDbContext.cs`: Contract DbContext cho Inversion of Control.
- `DTOs/Localization/LocalizationDtos.cs`: DTOs ngôn ngữ và bundle từ điển.
- `DTOs/Catalog/CatalogDtos.cs`: DTOs phân hệ Hàng hóa, lọc tìm kiếm, phân trang.
- `Features/Localization/ILocalizationService.cs`: Contract dịch thuật và từ điển.
- `Features/Catalog/IItemService.cs`: Contract quản lý nghiệp vụ sản phẩm.

#### 2.4. Infrastructure Layer (`src/ERPm.Infrastructure/`):
- `Persistence/ApplicationDbContext.cs`: EF Core Fluent API, cấu hình JSONB mapping, decimal(18,4), soft-delete query filter và auditing timestamp.
- `Persistence/Seeders/DataSeeder.cs`: Nạp dữ liệu mẫu ban đầu (ngôn ngữ `vi`/`en`, nhãn UI, ĐVT, Hệ thống TK 111, 112, 131, 156, 331, 511, 632, 642, 911).
- `Services/LocalizationService.cs`: Hiện thực hóa logic lấy từ điển ngôn ngữ.
- `Services/ItemService.cs`: Hiện thực hóa CRUD ITEM với Soft-delete.
- `DependencyInjection.cs`: Đăng ký Npgsql DbContext, Services vào DI Container.
- `Persistence/Migrations/20261011071959_Initial_Core_Schema.cs`: Migration CSDL đầu tiên.

#### 2.5. API Layer (`src/ERPm.API/`):
- `Middlewares/ExceptionHandlingMiddleware.cs`: Bắt ngoại lệ tập trung và format JSON chuẩn.
- `Controllers/BaseApiController.cs`: Base controller route `/api/v1/[controller]`.
- `Controllers/LocalizationController.cs`: Endpoints phục vụ từ điển tĩnh cho frontend cache.
- `Controllers/ItemsController.cs`: Endpoints CRUD hàng hóa.
- `Program.cs`: Pipeline cấu hình Swagger UI, CORS, Middleware và DI.
- `appsettings.json`: Cấu hình chuỗi kết nối PostgreSQL.

---

### 3. Các lệnh đã thực thi
```bash
# Tạo các project class library và webapi
dotnet new classlib -n ERPm.Domain -o src/ERPm.Domain -f net8.0
dotnet new classlib -n ERPm.Application -o src/ERPm.Application -f net8.0
dotnet new classlib -n ERPm.Infrastructure -o src/ERPm.Infrastructure -f net8.0
dotnet new webapi -n ERPm.API -o src/ERPm.API -f net8.0

# Cấu hình Solution và Project References
dotnet sln ERPm.sln add src/ERPm.Domain src/ERPm.Application src/ERPm.Infrastructure src/ERPm.API
dotnet add src/ERPm.Application reference src/ERPm.Domain
dotnet add src/ERPm.Infrastructure reference src/ERPm.Application src/ERPm.Domain
dotnet add src/ERPm.API reference src/ERPm.Application src/ERPm.Infrastructure

# Cài đặt NuGet Packages
dotnet add src/ERPm.Application package Microsoft.EntityFrameworkCore --version 8.0.8
dotnet add src/ERPm.Application package FluentValidation.DependencyInjectionExtensions --version 11.9.2
dotnet add src/ERPm.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL --version 8.0.4
dotnet add src/ERPm.Infrastructure package Microsoft.EntityFrameworkCore.Tools --version 8.0.8
dotnet add src/ERPm.Infrastructure package Dapper --version 2.1.35
dotnet add src/ERPm.API package Microsoft.EntityFrameworkCore.Design --version 8.0.8

# Tạo EF Core Code-First Migration
dotnet ef migrations add Initial_Core_Schema -p src/ERPm.Infrastructure -s src/ERPm.API -o Persistence/Migrations

# Biên dịch kiểm tra toàn bộ solution
dotnet build ERPm.sln
```

---

### 4. Kết quả kiểm tra & Xác nhận (Verification)
- [x] **Biên dịch:** Lệnh `dotnet build ERPm.sln` chạy thành công với **`0 Errors`**, **`0 Warnings`**.
- [x] **Kiến trúc phân tầng:** Domain tách biệt hoàn toàn; Application chỉ phụ thuộc Domain; Infrastructure đảm nhiệm EF Core & Npgsql; API mỏng chỉ đóng vai trò Presentation.
- [x] **Chuẩn hóa Kế toán & Dữ liệu:** Tất cả các trường tiền tệ (`SalePrice`, `CostPrice`, `CreditLimit`, `DebtBalance`, `DebitAmount`, `CreditAmount`) được khai báo kiểu `decimal(18, 4)`.
- [x] **Đa ngôn ngữ:** Cột `translations` dạng PostgreSQL `jsonb` được cấu hình tự động serialize/deserialize qua EF Core.
- [x] **EF Core Migration:** Đã sinh file migration `Initial_Core_Schema` chuẩn PostgreSQL.
- [x] **Docker Compose:** Đã có file `docker-compose.yml` sẵn sàng khởi chạy PostgreSQL 16 với port 5432.

---

### 5. Hướng đi cho bước tiếp theo (Step 02)
1. Khởi động container PostgreSQL qua `docker compose up -d` và kiểm tra kết nối CSDL thực tế.
2. Khởi tạo dự án Frontend **Angular 18/19 Standalone Components + Ionic Framework (Capacitor ready)** trong thư mục `client/`.
3. Tích hợp `TranslateService` trên Angular để kết nối với API `/api/v1/localization/{langCode}` và xây dựng layout Responsive đầu tiên (Adaptive giữa Desktop và Mobile).
