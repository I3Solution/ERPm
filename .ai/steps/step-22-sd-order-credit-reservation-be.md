# Step 22 — BE: Đơn bán — kiểm tra công nợ, giữ tồn kho, duyệt nợ, hủy đơn (S22.3.1)

## Mục tiêu
Nâng cấp `SalesOrder` theo Contract mục 3.3 plan-step-22 (task BE-22.4): kiểm tra hạn mức công nợ khi xác nhận, giữ chỗ tồn kho, duyệt vượt hạn mức, hủy đơn nhả tồn, thông báo nghiệp vụ. Không đổi tên endpoint cũ nên màn FE hiện tại vẫn chạy.

## File đã tạo / chỉnh sửa (ERPm-BE, nhánh `thien/s22-sales-order`)
- `Domain/Entities/Sales/SalesOrder.cs`: hằng `SalesOrderStatus`, `CreditCheckStatus`, `OrderReservationStatus`; cột mới `CreditCheckStatus`, `ReservationStatus`, `CreditApprovalReason`, `CancelReason`, `ExpectedDeliveryDate`, `DeliveryAddress`, `QuotationId`, `SalespersonId`, `PriceListId`; dòng đơn thêm `InvoicedQuantity`.
- `Domain/Entities/Sales/StockReservation.cs` (mới) → bảng `tbl_SD_StockReservation`; `StockBalance.QuantityReserved` (CHECK >= 0).
- Migration `AddOrderCreditAndReservation`.
- `Infrastructure/Services/SalesOrderService.cs`: viết lại phần nghiệp vụ (Confirm kiểm nợ + giữ kho, `ApproveCreditAsync`, `CancelAsync`, lọc theo `status`/`salespersonId`, DTO đầy đủ tên chi nhánh/NVKD/báo giá).
- `Application/Common/Crud/IOrderApproval.cs` (mới), `SalesOrderDtos.cs` (trường mới, `ApproveCreditRequest`, `CancelOrderRequest`), `SalesOrdersController.cs` (2 endpoint mới), `DependencyInjection.cs`.
- `PermissionCatalog.cs`: `sd:order:approve_credit`, `sd:order:cancel`.
- `SalesPostingService.cs`: bán lẻ/hóa đơn trừ phần đã giữ (`OnHand - Reserved`).
- `SalesQuotationService.cs`: chuyển đơn chép thêm `QuotationId`, NVKD, bảng giá, địa chỉ giao.
- `NotificationTemplateSeeder.cs`: 3 mẫu `SD_ORDER_CREDIT_PENDING`, `SD_ORDER_CREDIT_APPROVED`, `SD_ORDER_CANCELLED` (VI/EN).
- `tests/ERPm.Verification/Program.cs`: 22 check mới. Từ điển lỗi không đổi (các khóa `error.sd.*` đã có sẵn), nên không có PR FE.

## Endpoint
| Endpoint | Quyền | Ghi chú |
| :--- | :--- | :--- |
| `POST /api/v1/sales/orders/{id}/confirm` | `sd:order:confirm` | Kiểm nợ rồi giữ kho; vượt hạn mức → `PendingApproval`, chưa giữ kho |
| `POST .../{id}/approve-credit` `{reason}` | `sd:order:approve_credit` | Chỉ từ `PendingApproval`; xác nhận + giữ kho; `creditCheckStatus=Overridden` |
| `POST .../{id}/cancel` `{reason}` | `sd:order:cancel` | Từ Draft/PendingApproval/Confirmed; chặn nếu đã xuất hóa đơn; nhả tồn |
| `GET /api/v1/sales/orders?status=&salespersonId=` | `sd:order:view` | Lọc mới |

## Quy tắc
- Công nợ = hóa đơn đã ghi sổ còn nợ + giá trị các đơn khác của khách đang Confirmed/Processing + đơn này. `> hạn mức` → chờ duyệt; `>= 80% hạn mức` → `Warning`; còn lại `Passed`. Khách lẻ (không khách hàng) không kiểm nợ. Hạn mức 0 = không cho nợ (giống ghi sổ hóa đơn).
- Giữ kho: chỉ mặt hàng `Goods`, trong các kho đang hoạt động của chi nhánh đơn, kho còn nhiều nhất trước; thiếu bất kỳ dòng nào → 409 `error.sd.insufficient_available_stock`, không giữ gì. Khóa `stock:{kho}:{hàng}` theo thứ tự cố định.
- `QuantityReserved` cập nhật cùng bảng ghi `StockReservation` (Active/Released) trong một giao dịch.
- Thông báo gửi sau khi giao dịch commit (không báo khi rollback).
- Số đơn giữ định dạng `SO0000000001` (chưa đổi sang `SO-YYYYMM-XXXX` của Contract để không phá dữ liệu và chứng từ cũ).

## Lệnh đã chạy
`dotnet ef migrations add AddOrderCreditAndReservation -p ERPm.Infrastructure -s ERPm.API -o Persistence/Migrations` · `dotnet build` · `dotnet run --project tests/ERPm.Verification --no-build` (DB Docker local).

## Kiểm tra
- `dotnet build`: 0 warning, 0 error.
- `ERPm.Verification`: 218 check đạt (196 cũ + 22 mới), gồm giữ/nhả kho, thiếu tồn rollback, bán lẻ không vượt phần đã giữ, duyệt nợ, cảnh báo, đơn đã có hóa đơn không hủy được, quyền qua HTTP.
- Chưa chạy trên DB Neon dùng chung. Migration thêm cột có giá trị mặc định nên đơn cũ giữ `CreditCheckStatus=Passed`, `ReservationStatus=None`.

## Chưa làm
- `POST .../{id}/create-invoice` (sinh hóa đơn từ đơn, cập nhật `invoicedQuantity`, tiêu thụ phần đã giữ): chưa nằm trong BE-22.4; cần chốt cách trừ phần giữ khi xuất hóa đơn.
- Trạng thái `Processing`/`Completed` chưa có luồng chuyển.
- Thông báo cho báo giá (chấp nhận/chuyển đơn) và `send-email` báo giá (S22.2.1).
- Phạm vi "cùng chi nhánh" khi giữ kho: chưa lấy kho của chi nhánh con.

## Bước tiếp theo
S22.4.1: trả hàng bán + bút toán đảo (nhánh `thien/s22-sales-return`).
