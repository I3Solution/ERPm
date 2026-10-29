# 🛠️ STEP 16: NÂNG CẤP BACKEND LÊN .NET 10 (LTS) & EF CORE 10

> **Ngày thực hiện:** 2026-10-29  
> **Trạng thái:** Hoàn thành (100%)  
> **Mục tiêu:** Nâng cấp toàn bộ tầng Backend (`ERPm-BE`) từ `.NET 8` (`net8.0`) lên **`.NET 10 LTS` (`net10.0`)**, nâng cấp bộ thư viện `EF Core 10`, `Npgsql 10`, `OpenApi 10`, và tận dụng hàm sinh UUIDv7 gốc `Guid.CreateVersion7()` của .NET 10.

---

## 🎯 1. CÁC THAY ĐỔI KIẾN TRÚC & THƯ VIỆN

1. **Target Framework (`net10.0`):**
   - Nâng cấp toàn bộ 4 projects trong Clean Architecture (`ERPm.Domain`, `ERPm.Application`, `ERPm.Infrastructure`, `ERPm.API`) từ `<TargetFramework>net8.0</TargetFramework>` lên `<TargetFramework>net10.0</TargetFramework>`.
2. **Nâng cấp NuGet Packages tương thích .NET 10:**
   - `Microsoft.EntityFrameworkCore`: `8.0.8` -> `10.0.14`
   - `Microsoft.EntityFrameworkCore.Tools`: `8.0.8` -> `10.0.14`
   - `Microsoft.EntityFrameworkCore.Design`: `8.0.8` -> `10.0.14`
   - `Npgsql.EntityFrameworkCore.PostgreSQL`: `8.0.4` -> `10.0.3`
   - `EFCore.NamingConventions`: `8.0.3` -> `10.0.1`
   - `Microsoft.AspNetCore.OpenApi`: `8.0.8` -> `10.0.14`
   - `Swashbuckle.AspNetCore`: `6.4.0` -> `10.3.1` (cập nhật namespace `Microsoft.OpenApi` trong `Program.cs`)
3. **Tối ưu `Uuid7Generator` với Native .NET 10 API:**
   - Trong [BaseEntity.cs](../../ERPm-BE/src/ERPm.Domain/Common/BaseEntity.cs), chuyển `Uuid7Generator.NewUuid7()` sang gọi trực tiếp hàm chuẩn BCL của .NET 10: `Guid.CreateVersion7()` và `Guid.CreateVersion7(timestamp)`.

---

## 📂 2. DANH SÁCH FILE ĐÃ CHỈNH SỬA

- [ERPm.Domain.csproj](../../ERPm-BE/src/ERPm.Domain/ERPm.Domain.csproj)
- [ERPm.Application.csproj](../../ERPm-BE/src/ERPm.Application/ERPm.Application.csproj)
- [ERPm.Infrastructure.csproj](../../ERPm-BE/src/ERPm.Infrastructure/ERPm.Infrastructure.csproj)
- [ERPm.API.csproj](../../ERPm-BE/src/ERPm.API/ERPm.API.csproj)
- [Program.cs](../../ERPm-BE/src/ERPm.API/Program.cs)
- [BaseEntity.cs](../../ERPm-BE/src/ERPm.Domain/Common/BaseEntity.cs)
- [AGENTS.md](../../AGENTS.md) & [ERPm-BE/AGENTS.md](../../ERPm-BE/AGENTS.md)
- [PROJECT_MASTER.md](../../PROJECT_MASTER.md), [ERPm-BE/PROJECT_MASTER.md](../../ERPm-BE/PROJECT_MASTER.md), [ERPm-FE/PROJECT_MASTER.md](../../ERPm-FE/PROJECT_MASTER.md)

---

## ✅ 3. KẾT QUẢ KIỂM TRA (VERIFICATION)
- Cài đặt `.NET SDK 10.0.403` và chạy `dotnet build "ERPm-BE\ERPm.sln"`: **0 Warning(s), 0 Error(s)**.
