# 📋 KẾ HOẠCH TRIỂN KHAI STEP 01: CLEAN ARCHITECTURE & CƠ SỞ DỮ LIỆU CỐT LÕI

> **Ngày tạo:** 2026-10-11  
> **Người thực hiện:** AI Agent  
> **Mã kế hoạch:** PLAN-STEP-01  
> **Giai đoạn:** Giai đoạn 1 (MVP) - Sprint 1.1: Khởi tạo Kiến trúc Lõi & Master Data  
> **Trạng thái:**  Hoàn thành (Completed)  

---

## 🎯 1. MỤC TIÊU CỐT LÕI
1. Chuyển đổi solution .NET 8 sang chuẩn **Clean Architecture 4 tầng**:
   - `src/ERPm.Domain`: Thực thể nghiệp vụ thuần túy, Enums, Value Objects, Domain Events.
   - `src/ERPm.Application`: Use cases, DTOs, Mappings, Interfaces, Validation.
   - `src/ERPm.Infrastructure`: EF Core DbContext, Npgsql PostgreSQL, Configurations, Seeders, Repositories.
   - `src/ERPm.API`: ASP.NET Core Web API, Controllers, Middleware, Swagger OpenAPI.
2. Tạo cấu hình môi trường **PostgreSQL 16** với file `docker-compose.yml`.
3. Xây dựng các Entity cốt lõi tuân thủ tuyệt đối [PROJECT_MASTER.md](../../PROJECT_MASTER.md):
   - **Audit & Base:** `BaseEntity`, `BaseAuditableEntity`, `ISoftDelete`, `ITenant`.
   - **Đa ngôn ngữ (i18n):** `AppLanguage`, `AppDictionary`, và `Translations` kiểu JSONB.
   - **Phân hệ ITEM:** `Item`, `Category`, `UnitOfMeasure` với `decimal(18, 4)`.
   - **Phân hệ Khách hàng / Đối tác:** `Partner` (Khách hàng & NCC, công nợ).
   - **Hạt nhân Kế toán mở rộng:** `Account`, `JournalEntry`, `JournalEntryLine`.
4. Cấu hình Fluent API EF Core 8:
   - Quy chuẩn `snake_case`.
   - Kiểu số tiền & số lượng `decimal(18, 4)`.
   - Mapping PostgreSQL `jsonb` cho translations.
   - Seed data: Ngôn ngữ mặc định (`vi`, `en`), ĐVT cơ bản, Danh mục tài khoản chuẩn (TT200/133 rút gọn).
5. Xây dựng tầng API ban đầu:
   - `LocalizationController` (`GET /api/v1/localization/{langCode}`).
   - `ItemsController` (Lấy danh sách hàng hóa, tạo hàng hóa mới với tên song ngữ).
6. Kiểm tra & Báo cáo:
   - `dotnet build` đạt 0 Errors.
   - Tạo file log `step-01-clean-architecture-and-core-database.md`.
   - Cập nhật `.ai/status.md`.

---

## 🛠️ 2. DANH SÁCH CÁC BƯỚC THỰC THI (WORK BREAKDOWN)

- [x] **Task 1.1:** Dọn dẹp template cũ và tạo cấu trúc thư mục `src/` với 4 projects .NET 8.
- [x] **Task 1.2:** Cài đặt các thư viện NuGet:
  - `ERPm.Domain`: Không phụ thuộc tầng ngoài.
  - `ERPm.Application`: `FluentValidation`, `MediatR` (nếu cần).
  - `ERPm.Infrastructure`: `Npgsql.EntityFrameworkCore.PostgreSQL`, `Microsoft.EntityFrameworkCore.Tools`, `Dapper`.
  - `ERPm.API`: `Swashbuckle.AspNetCore`, `Microsoft.EntityFrameworkCore.Design`.
- [x] **Task 1.3:** Tạo file `docker-compose.yml` cho PostgreSQL 16 và cấu hình `appsettings.json`.
- [x] **Task 1.4:** Viết các Base Entities và Core Domain Entities trong `ERPm.Domain`.
- [x] **Task 1.5:** Viết `ApplicationDbContext`, Fluent API Configurations và `DataSeeder` trong `ERPm.Infrastructure`.
- [x] **Task 1.6:** Viết DTOs, Services và Controllers cho Localization và ITEM trong `ERPm.Application` và `ERPm.API`.
- [x] **Task 1.7:** Tạo Migration đầu tiên `Initial_Core_Schema`.
- [x] **Task 1.8:** Build, kiểm tra verification, ghi nhận file log `.ai/steps/step-01-clean-architecture-and-core-database.md` và cập nhật `.ai/status.md`.
