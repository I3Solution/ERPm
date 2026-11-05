# Step 22 — BE: Bảng giá (S22.1.1)

## Mục tiêu
Tạo nền dữ liệu cho bảng giá bán (plan-step-22, task BE-22.1): bảng `tbl_SD_PriceList`, `tbl_SD_PriceListItem` và bảng giá mặc định của khách hàng (`tbl_CRM_Partner.price_list_id`). Chưa có service/API (thuộc S22.1.2).

## File đã tạo / chỉnh sửa (ERPm-BE, nhánh `thien/s22-pricelist`, commit 5280b66)
- `src/ERPm.Domain/Entities/Sales/PriceList.cs` (mới): `PriceList` (auditable, soft-delete), `PriceListItem` (bậc thang theo `MinQuantity`, `UomId` null = đơn vị gốc).
- `src/ERPm.Domain/Entities/Partner/Partner.cs`: thêm `PriceListId`.
- `ApplicationDbContext.cs`, `IApplicationDbContext.cs`: DbSet, cấu hình bảng, query filter.
- Migration `20261105150120_AddSalesPriceList` + snapshot.
- `tests/ERPm.Verification/Program.cs`: 8 check mới.

## Quyết định
- Mã bảng giá duy nhất trong các bảng chưa xóa (index lọc `is_deleted = false`), dùng lại được mã đã xóa.
- Một dòng giá duy nhất theo (bảng giá, mặt hàng, đơn vị, bậc số lượng), kể cả khi đơn vị null (`NULLS NOT DISTINCT`).
- Ràng buộc DB: giá và số lượng tối thiểu >= 0, chiết khấu 0..100. Tiền/số lượng `decimal(18, 4)`.
- Bảng giá không lọc theo DataScope chi nhánh: `BranchId` là phạm vi áp dụng, không phải chủ sở hữu dữ liệu; null = mọi chi nhánh.
- Tên bảng theo plan (`tbl_SD_*`), khác tiền tố `tbl_SALE_*` của các bảng bán hàng cũ.

## Lệnh đã chạy
- `dotnet ef migrations add AddSalesPriceList -p ERPm.Infrastructure -s ERPm.API -o Persistence/Migrations`
- `dotnet build` · `dotnet run --project tests/ERPm.Verification --no-build` (DB Docker local)

## Kiểm tra
- `dotnet build`: 0 warning, 0 error.
- `ERPm.Verification`: 144 check đạt (136 cũ + 8 mới); gồm "migration matches current model".
- Chưa chạy migration trên DB Neon dùng chung (chờ lệnh trực tiếp của Thiện).

## Bước tiếp theo
S22.1.2: Pricing Engine + API CRUD `/api/v1/sales/price-lists` + `calculate-price`, quyền `sd:pricelist:*` trong `PermissionCatalog`, từ điển lỗi `error.sd.pricelist_duplicate_code`.
