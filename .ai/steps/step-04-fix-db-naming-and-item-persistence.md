# 📝 Step 04: Fix PostgreSQL Database Naming Convention & Item Creation Persistence

## 🎯 Mục tiêu
1. **Xác định và khắc phục nguyên nhân DB interaction không hoạt động**:
   - Database PostgreSQL dùng quy chuẩn `snake_case` (ví dụ `is_deleted`, `base_uom_id`, `item_type`), trong khi EF Core mặc định sinh câu lệnh query/insert với `PascalCase` (`"IsDeleted"`, `"BaseUomId"`). Kết quả là Npgsql ném lỗi: `42703: column i.IsDeleted does not exist`.
2. **Khắc phục hiện tượng Frontend hiển thị thành công ảo**:
   - `item.service.ts` trước đó có khối `catchError` tự động swallow lỗi và chèn object giả vào `MOCK_ITEMS` trong bộ nhớ rồi return `of(newItem)`. Do đó, người dùng tạo ITEM không thấy exception, form đóng và bảng hiển thị hàng mới nhưng thực tế DB không hề lưu.
3. **Sửa ID Đơn vị tính (Base UOM ID) mặc định**:
   - `items.component.ts` trước đó gán `baseUomId: '11111111-1111-1111-1111-111111111111'` (UUID giả không tồn tại trong bảng `units_of_measure`), dẫn đến vi phạm Foreign Key Constraint `items_base_uom_id_fkey`. Đã chuyển sang ID thực tế (`00000000-0000-0000-0000-000000000010` - Cái).
4. **Tuân thủ chỉ đạo của User**:
   - Tạm thời tắt auto-seed data (`DataSeeder.SeedAsync`) trong `Program.cs`.

---

## 📁 Danh sách File Đã Chỉnh Sửa / Tạo Mới

1. [ERPm.Infrastructure.csproj](../../ERPm-BE/src/ERPm.Infrastructure/ERPm.Infrastructure.csproj):
   - Cài đặt package `EFCore.NamingConventions` (version 8.0.3).
2. [DependencyInjection.cs](../../ERPm-BE/src/ERPm.Infrastructure/DependencyInjection.cs):
   - Thêm `.UseSnakeCaseNamingConvention()` vào DbContext options để tự động map toàn bộ entity sang chuẩn `snake_case` của PostgreSQL.
3. [Program.cs](../../ERPm-BE/src/ERPm.API/Program.cs):
   - Tạm comment out `await DataSeeder.SeedAsync(context);` theo yêu cầu.
4. [item.service.ts](../../ERPm-FE/src/app/core/services/item.service.ts):
   - Loại bỏ cơ chế fallback mock swallow lỗi; kết nối trực tiếp với backend API; khởi tạo signal `items` từ mảng rỗng và lan truyền error thật về component.
5. [items.component.ts](../../ERPm-FE/src/app/pages/catalog/items.component.ts):
   - Gán `baseUomId` hợp lệ trỏ tới ĐVT "Cái" trong DB.
   - Bổ sung callback `error` trong `submitCreate()` để thông báo lỗi cho người dùng nếu API thất bại thay vì âm thầm đóng modal.
6. [partner.service.ts](../../ERPm-FE/src/app/core/services/partner.service.ts), [stock.service.ts](../../ERPm-FE/src/app/core/services/stock.service.ts), [sales.service.ts](../../ERPm-FE/src/app/core/services/sales.service.ts):
   - Đồng bộ kết nối API trực tiếp, loại bỏ cơ chế swallow lỗi để các phân hệ đối tác, kho và bán hàng tương tác chuẩn xác với DB.

---

## ⚙️ Các Lệnh Đã Thực Hiện

```bash
# 1. Thêm package snake_case naming convention
dotnet add src/ERPm.Infrastructure package EFCore.NamingConventions -v 8.0.3

# 2. Xóa và khởi tạo lại bảng lịch sử migration theo snake_case
psql -U postgres -d erpm_db -c 'DROP TABLE IF EXISTS "__EFMigrationsHistory";'
psql -U postgres -d erpm_db -c 'CREATE TABLE "__EFMigrationsHistory" (migration_id character varying(150) NOT NULL PRIMARY KEY, product_version character varying(32) NOT NULL); INSERT INTO "__EFMigrationsHistory" (migration_id, product_version) VALUES ('20261011071959_Initial_Core_Schema', '8.0.8');'

# 3. Build & Run
dotnet build
dotnet run --project src/ERPm.API/ERPm.API.csproj --no-build
```

---

## 🔍 Kết Quả Kiểm Tra (Verification)

1. **Kiểm tra GET API `/api/v1/items`**:
   - Trả về HTTP 200 kèm theo danh sách sản phẩm thật từ bảng `items` trong PostgreSQL.
2. **Kiểm tra POST API `/api/v1/items`**:
   - Thực thi thành công `SP_DEMO_01` (HTTP 200).
   - Kiểm tra trực tiếp trong PostgreSQL: `SELECT id, code, name, sale_price FROM items WHERE code='SP_DEMO_01';` -> Bản ghi đã được INSERT thực sự vào DB với đầy đủ audit fields (`created_at_utc`).
3. **Frontend**:
   - `ItemService.items` phản ánh dữ liệu thật từ DB, không còn bị mock ảo che giấu.
   - Khi có lỗi từ server, UI hiển thị alert thông báo lỗi chi tiết.

---

## 🚀 Hướng Đi Tiếp Theo
- Xây dựng API và giao diện quản lý Đơn vị tính (UOM) và Ngành hàng (Category) động để người dùng có thể chọn dropdown khi tạo ITEM thay vì dùng giá trị mặc định.
- Tiếp tục hoàn thiện các luồng giao dịch kho (Stock Receipt/Issue) và Bán hàng POS kết nối dữ liệu thực tế.
