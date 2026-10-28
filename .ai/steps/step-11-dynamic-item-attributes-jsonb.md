# 📋 BƯỚC 11: TRIỂN KHAI THUỘC TÍNH SẢN PHẨM MỞ RỘNG ĐỘNG (DYNAMIC ITEM ATTRIBUTES JSONB)

> **Mục tiêu:** Cho phép người dùng linh hoạt định nghĩa và mở rộng bất kỳ thông tin / thuộc tính nào cho hàng hóa (Màu sắc, kích cỡ, hạn bảo hành, xuất xứ...) mà không phải sửa schema database tĩnh. Kết hợp sức mạnh của **PostgreSQL JSONB** (hỗ trợ GIN index tìm kiếm cực nhanh) với **Schema-driven Validation** (`tbl_WMS_ItemAttribute`), đồng thời xây dựng giao diện động trên Angular 18 (Signals, Standalone Components, Custom Select và Badges).

---

## 🎯 1. KIẾN TRÚC THIẾT KẾ (ARCHITECTURE DESIGN)

```
+-----------------------------------------------------------------------------------+
|                        1. SCHEMA-DRIVEN ATTRIBUTE DEFINITION                      |
|                  tbl_WMS_ItemAttribute (Cấu hình thuộc tính động)                  |
| - code: 'color', 'size', 'warranty_months'                                        |
| - data_type: 1 (Text), 2 (Number), 3 (Select), 4 (Date), 5 (Boolean)              |
| - options: ["Xanh", "Đỏ", "Đen"] (JSONB list)                                     |
+-----------------------------------------------------------------------------------+
                                         │ (Định nghĩa form nhập liệu)
                                         ▼
+-----------------------------------------------------------------------------------+
|                     2. DYNAMIC ITEM ATTRIBUTES STORAGE (JSONB)                    |
|                        tbl_WMS_Item.attributes (JSONB Column)                      |
|                        CREATE INDEX idx_tbl_wms_item_attributes_gin               |
|                                ON "tbl_WMS_Item" USING gin (attributes);          |
|                                                                                   |
| Lưu trữ: {"color": "Xanh Dương", "size": "0.5mm", "warranty_months": 12}          |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                     3. FRONTEND DYNAMIC RENDERING (ANGULAR 18)                    |
| - Tự động render Input Type theo DataType (Select, Number, Text, Date, Boolean)   |
| - Tái sử dụng `CustomSelectComponent` (`app-custom-select`) cho type Select       |
| - Hiển thị Pills/Badges trên bảng Desktop và thẻ Mobile:                          |
|   [Màu sắc: Xanh Dương] [Kích cỡ: 0.5mm] [Bảo hành: 12]                           |
+-----------------------------------------------------------------------------------+
```

---

## 📂 2. DANH SÁCH FILE ĐÃ TẠO VÀ CHỈNH SỬA

### A. Backend (.NET 8 Clean Architecture):
1. **Domain Entities:**
   - [ItemAttribute.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Domain/Entities/Catalog/ItemAttribute.cs) *(MỚI)*: Định nghĩa metadata thuộc tính (`Code`, `Name`, `DataType`, `Options`, `Unit`, `IsRequired`, `IsFilterable`, `SortOrder`, `CategoryId`).
   - [Item.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Domain/Entities/Catalog/Item.cs): Bổ sung `public Dictionary<string, object> Attributes { get; set; } = new();`.

2. **Application Layer:**
   - [IApplicationDbContext.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Application/Common/Interfaces/IApplicationDbContext.cs): Bổ sung `DbSet<ItemAttribute> ItemAttributes { get; }`.
   - [CatalogDtos.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Application/DTOs/Catalog/CatalogDtos.cs): Bổ sung `Attributes` vào `ItemDto`, `CreateItemRequest`, `UpdateItemRequest`; tạo `ItemAttributeDto`, `CreateItemAttributeRequest`, `UpdateItemAttributeRequest`.

3. **Infrastructure Layer:**
   - [ApplicationDbContext.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Infrastructure/Persistence/ApplicationDbContext.cs): Cấu hình EF Core Npgsql mapping `Item.Attributes` kiểu `jsonb` với `ValueComparer<Dictionary<string, object>>` và `ItemAttribute.Options` kiểu `jsonb`.
   - [ItemService.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Infrastructure/Services/ItemService.cs): Mapping `Attributes` hai chiều trong `GetItemsAsync`, `GetItemByIdAsync`, `CreateItemAsync`, `UpdateItemAsync`.
   - [DataSeeder.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Infrastructure/Persistence/Seeders/DataSeeder.cs): Bổ sung seed thuộc tính mở rộng (`color`, `size`, `origin`, `warranty_months`) và gán mẫu cho các mặt hàng ban đầu.

4. **API Controllers:**
   - [ItemAttributesController.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.API/Controllers/WMS/ItemAttributesController.cs) *(MỚI)*: API RESTful CRUD cho cấu hình thuộc tính động (`/api/v1/wms/item-attributes/by-category/{categoryId?}`).

5. **Database Script:**
   - [erpm_schema.sql](file:///d:/WORKING%20PLACE/ERPm/database/erpm_schema.sql): Bổ sung cột `attributes jsonb DEFAULT '{}'::jsonb`, GIN index `idx_tbl_wms_item_attributes_gin`, và bảng `tbl_WMS_ItemAttribute`.

### B. Frontend (Angular 18 Standalone + Ionic):
1. **Services & Localization:**
   - [item.service.ts](file:///d:/WORKING%20PLACE/ERPm/client/src/app/core/services/item.service.ts): Bổ sung enum `AttributeDataType`, interface `ItemAttributeDto`, signal `attributes`, và hàm `loadAttributes(categoryId?)`.
   - [localization.service.ts](file:///d:/WORKING%20PLACE/ERPm/client/src/app/core/services/localization.service.ts): Bổ sung translation keys cho `catalog.attributes`, `catalog.attributes_desc`, `catalog.attributes_custom` (VI & EN).

2. **Components & Styles:**
   - [components.scss](file:///d:/WORKING%20PLACE/ERPm/client/src/theme/components.scss): Thêm class `.erpm-badge-outline` phục vụ hiển thị tags/chips thuộc tính mở rộng.
   - [items.component.ts](file:///d:/WORKING%20PLACE/ERPm/client/src/app/modules/catalog/items.component.ts): Quản lý state `customAttributes`, convert options cho custom select, lấy entries hiển thị badges, và gán attributes khi tạo mới.
   - [items.component.html](file:///d:/WORKING%20PLACE/ERPm/client/src/app/modules/catalog/items.component.html):
     - Hiển thị badges thuộc tính trên bảng dữ liệu Desktop dưới tên sản phẩm.
     - Hiển thị badges thuộc tính trên danh sách thẻ Mobile.
     - Khối "Thuộc tính mở rộng (PostgreSQL JSONB)" động trong modal tạo mới sản phẩm với các loại điều khiển: Dropdown Select, Number, Text, Date, Checkbox.

3. **Coding Convention:**
   - Cập nhật quy tắc bắt buộc: **100% comment trong source code bằng Tiếng Anh (English only)**.

---

## 🛠️ 3. CÁC LỆNH ĐÃ CHẠY & KẾT QUẢ XÁC MINH (VERIFICATION)

### 1. Backend Build (.NET 8):
```bash
dotnet build
```
- **Kết quả:** `Build succeeded. 0 Warning(s), 0 Error(s). Time Elapsed 00:00:06.90`.

### 2. Frontend Build (Angular 18):
```bash
npm run build
```
- **Kết quả:** `Application bundle generation complete. Code exited with 0`. Hoàn toàn không có lỗi TypeScript hay cú pháp template nào.

---

## 🚀 4. HƯỚNG ĐI TIẾP THEO (NEXT STEPS)
1. **Màn hình quản lý Cấu hình Thuộc tính (`ItemAttributesManagement`):** Tạo giao diện CRUD trực quan cho người dùng tự tạo thêm bất kỳ thuộc tính mới nào và phân bổ theo danh mục hàng hóa (`CategoryId`).
2. **Bộ lọc Sản phẩm theo JSONB (Dynamic Filter):** Tận dụng GIN index của PostgreSQL (`attributes @> '{"color": "Xanh"}'`) để tạo bộ lọc đa tiêu chí phía ngoài bảng hàng hóa.
3. **Phân hệ Mua hàng (Purchasing) & Sổ quỹ (Cash & Bank):** Chuyển giao sang Giai đoạn 2 theo đúng Lộ trình Master.
