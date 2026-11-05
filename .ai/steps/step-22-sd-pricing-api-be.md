# Step 22 — BE: API Bảng giá & Pricing Engine (S22.1.2)

## Mục tiêu
Làm API thật cho bảng giá theo Contract mục 3.1 của plan-step-22 (task BE-22.2) để FE (Lợi) thay mock: CRUD `/api/v1/sales/price-lists` và `POST .../calculate-price`.

## File đã tạo / chỉnh sửa
ERPm-BE (nhánh `thien/s22-pricing-api`, commit 2716782):
- `Domain/Services/Sales/PricingEngine.cs` (mới): hàm thuần chọn giá cho 1 dòng hàng.
- `Application/DTOs/Sales/PriceListDtos.cs`, `Application/Common/Crud/IPricingService.cs` (mới).
- `Infrastructure/Services/PriceListService.cs` (mới): CRUD kế thừa `BaseCrudService` + `CalculateAsync`; đăng ký DI trong `DependencyInjection.cs`.
- `API/Controllers/SD/PriceListsController.cs` (mới).
- `Domain/Services/Iam/PermissionCatalog.cs`: thêm `sd:pricelist` (view/create/edit/delete).
- `PartnerDtos.cs`, `PartnerService.cs`: thêm `PriceListId` (tạo + trả về) để gán bảng giá mặc định cho khách.
- `system_dictionary.json`: `error.sd.pricelist_in_use` (VI/EN).
- `tests/ERPm.Verification/Program.cs`: 24 check mới.
ERPm-FE (nhánh `thien/s22-pricing-api`, commit 07f5954): `src/assets/i18n/system.json` đồng bộ từ điển (giống hệt bản BE).

## Quy tắc tính giá (PricingEngine)
1. Trong một bảng giá: lấy bậc có `MinQuantity` cao nhất không vượt số lượng.
2. Bảng giá gán cho khách (nếu áp dụng được và có giá mặt hàng) được ưu tiên.
3. Không có: bảng giá có giá ròng thấp nhất (đơn giá sau chiết khấu); hòa thì ưu tiên bảng của chi nhánh, rồi bảng hiệu lực gần nhất, rồi id nhỏ nhất.
4. Không bảng nào khớp: dùng `Item.SalePrice`, `appliedPriceListId` rỗng.
- Bảng áp dụng được = đang kích hoạt, trong khoảng hiệu lực, `BranchId` rỗng hoặc đúng chi nhánh yêu cầu. Chỉ tính dòng giá theo đơn vị gốc (`UomId` rỗng).
- `unitPrice` là giá sau bảng giá/bậc thang; `discountAmount = unitPrice × số lượng × discountPercent / 100`; `lineTotal = unitPrice × số lượng − discountAmount`.

## Quyết định
- Danh sách phân trang chỉ trả phần đầu (`items` rỗng); chi tiết `GET {id}` trả kèm dòng giá.
- Sửa bảng giá đồng bộ dòng theo (mặt hàng, bậc số lượng): giữ id dòng cũ, thêm bậc mới, xóa bậc bị bỏ.
- Xóa mềm; chặn xóa khi còn khách hàng đang gán (`error.sd.pricelist_in_use`, 409). Chưa chặn theo đơn bán vì `SalesOrder.PriceListId` thuộc S22.3.1.
- `calculate-price` dùng quyền `sd:order:view` đúng Contract.
- Mã bảng giá chuẩn hóa chữ hoa, trùng mã → 409 `error.sd.pricelist_duplicate_code`. Ngày bắt buộc UTC.

## Lệnh đã chạy
`dotnet build` · `dotnet run --project tests/ERPm.Verification --no-build` (DB Docker local).

## Kiểm tra
- `dotnet build`: 0 warning, 0 error.
- `ERPm.Verification`: 168 check đạt (144 cũ + 24 mới): quy tắc engine, CRUD, validate, tính giá, quyền, route `calculate-price` qua HTTP.
- Chưa chạy trên DB Neon dùng chung.

## Bước tiếp theo
S22.2.1: entity Báo giá + API `convert-to-order` (nhánh `thien/s22-quotation`).
