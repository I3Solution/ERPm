# Step 22 — BE: Báo giá & chuyển đổi thành đơn bán (S22.2.1)

## Mục tiêu
Entity, migration, API báo giá khách hàng theo Contract mục 3.2 plan-step-22 (task BE-22.3): CRUD, đổi trạng thái và `convert-to-order`. Chưa làm `send-email` (cần Notification Step 21, xem "Chưa làm").

## File đã tạo / chỉnh sửa
ERPm-BE (nhánh `thien/s22-quotation`, commit 481e0eb):
- `Domain/Entities/Sales/SalesQuotation.cs` (mới): `SalesQuotation`, `SalesQuotationItem`, hằng `QuotationStatus`.
- `Application/DTOs/Sales/SalesQuotationDtos.cs`, `Application/Common/Crud/IQuotationWorkflow.cs` (mới).
- `Infrastructure/Services/SalesQuotationService.cs` (mới): CRUD kế thừa `BaseCrudService` + workflow; đăng ký DI.
- `API/Controllers/SD/SalesQuotationsController.cs` (mới).
- Migration `AddSalesQuotation`: `tbl_SD_SalesQuotation`, `tbl_SD_SalesQuotationItem`.
- `ApplicationDbContext.cs` + `IApplicationDbContext.cs`: DbSet, cấu hình, query filter theo chi nhánh/phòng ban/người tạo (giống SalesOrder).
- `PermissionCatalog.cs`: `sd:quotation` (view/create/edit/delete).
- `BaseFilterQuery.cs`: thêm `Status`, `SalespersonId` (dịch vụ nào có thì dùng); `BaseCrudService`: từ khóa tìm thêm theo `QuotationNumber`.
- `PostingTransaction.cs`: tách `NextValueAsync` (dùng cho mã BG-).
- `system_dictionary.json`: `error.sd.quotation_invalid_status` (VI/EN).
- `tests/ERPm.Verification/Program.cs`: 28 check mới.
ERPm-FE (nhánh `thien/s22-quotation`, commit 626a8a2): `system.json` đồng bộ từ điển.

## Endpoint
| Endpoint | Quyền | Ghi chú |
| :--- | :--- | :--- |
| `GET/POST /api/v1/sales/quotations`, `GET/PUT/DELETE .../{id}` | `sd:quotation:view/create/edit/delete` | Lọc `keyword`, `status`, `salespersonId`; danh sách trả `items` rỗng |
| `POST .../{id}/send` · `accept` · `reject` | `sd:quotation:edit` | Draft→Sent; Sent→Accepted; Sent/Accepted→Rejected |
| `POST .../{id}/convert-to-order` | `sd:order:create` | Trả `{ quotationId, salesOrderId, orderNumber }` |

## Quy tắc
- Số báo giá `BG-YYYYMM-XXXX` lấy từ sequence chung `erpm_document_number` (4 chữ số trở lên, không liền mạch theo tháng, duy nhất do index).
- `status` hiển thị `Expired` khi quá `validUntil` mà còn ở Draft/Sent/Accepted (không lưu; lọc `status=Expired` cũng suy ra từ hạn). Sửa lại `validUntil` ở Draft/Sent thì sống lại.
- Sửa chỉ khi Draft/Sent, xóa chỉ khi Draft; sửa thay toàn bộ dòng. Gửi/chấp nhận/chuyển đơn khi quá hạn → 409 `error.sd.quotation_expired`.
- Chuyển đơn: Draft/Sent/Accepted còn hạn → tạo `SalesOrder` Draft (dòng, khách, chi nhánh, phòng ban; chiết khấu dòng nằm trong thành tiền dòng, chiết khấu đầu đơn = 0; ghi chú = số báo giá), báo giá thành `Converted` + `convertedSalesOrderId` (chỉ mục duy nhất, một báo giá một đơn). Đã chuyển → 409 `error.sd.quotation_already_converted`; trạng thái khác → 409 `error.sd.quotation_invalid_status`.
- Thuế chưa có trong Contract nên `taxAmount` = 0. `SalesOrder` chưa có `SalespersonId`/`PriceListId` (S22.3.1) nên chưa chép sang đơn.

## Lệnh đã chạy
`dotnet ef migrations add AddSalesQuotation -p ERPm.Infrastructure -s ERPm.API -o Persistence/Migrations` · `dotnet build` · `dotnet run --project tests/ERPm.Verification --no-build` (DB Docker local).

## Kiểm tra
- `dotnet build`: 0 warning, 0 error.
- `ERPm.Verification`: 196 check đạt (168 cũ + 28 mới), gồm vòng đời, hết hạn, chuyển đơn, quyền và route qua HTTP.
- Chưa chạy trên DB Neon dùng chung.

## Chưa làm / đề xuất
- `POST .../{id}/send-email` (Outbox Step 21) và thông báo nghiệp vụ (báo giá được chấp nhận / chuyển thành đơn): cần mẫu thông báo mới theo `docs/NOTIFICATION_INTEGRATION_GUIDE.md`; đề xuất làm cùng S22.3.1 (BE-22.4 đã có hạng mục Notification).
- Chặn xóa bảng giá theo báo giá: hiện `PriceListId` trên báo giá chỉ để tham chiếu (SetNull khi xóa).

## Bước tiếp theo
S22.3.1: nâng cấp SalesOrder (giữ tồn kho, duyệt nợ), nhánh `thien/s22-sales-order`.
