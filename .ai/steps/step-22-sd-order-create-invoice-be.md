# Step 22 — BE: Xuất hóa đơn từ đơn bán (create-invoice)

## Mục tiêu
`POST /api/v1/sales/orders/{id}/create-invoice` theo Contract mục 3.3 plan-step-22: đơn đã xác nhận nay lập được hóa đơn xuất kho, tiêu thụ phần tồn đã giữ.

## File đã tạo / chỉnh sửa (ERPm-BE, nhánh `thien/s22-order-create-invoice`, commit b63c248)
- `Infrastructure/Services/SalesOrderInvoicing.cs` (mới): `SalesInvoiceService.CreateInvoiceFromOrderAsync`.
- `Infrastructure/Services/SalesPostingService.cs`: tách lõi ghi sổ thành `PostInvoiceAsync` (chạy trong giao dịch của nơi gọi); đơn giá thỏa thuận trên đơn không bị kiểm "đổi giá bán"; hóa đơn lưu `SalesOrderId`.
- `Infrastructure/Services/Common/OrderStockReservations.cs` (mới): logic giữ/nhả tồn đã tách khỏi `SalesOrderService` để hai nơi cùng dùng.
- `SalesCancellationService.cs`: hóa đơn lập từ đơn không hủy được.
- `SalesInvoice.SalesOrderId` + chỉ mục duy nhất (một đơn xuất hóa đơn một lần) → migration `AddInvoiceSalesOrderLink`.
- `SalesOrdersController.cs` (endpoint), DTO `CreateInvoiceFromOrderRequest`, `SalesInvoiceDto.SalesOrderId`, mẫu thông báo `SD_ORDER_INVOICED`, 2 khóa lỗi VI/EN.
- `tests/ERPm.Verification/Program.cs`: 16 check mới. ERPm-FE (nhánh cùng tên, commit 16c3756): `system.json` đồng bộ từ điển.

## Endpoint
`POST /api/v1/sales/orders/{id}/create-invoice` (quyền `sd:invoice:create`), body `{ warehouseId, paymentMethod (1 Cash, 2 BankTransfer, 3 Debt), tenderedAmount, notes? }` → `SalesInvoiceDto` (có `salesOrderId`).

## Quy tắc
- Chỉ đơn `Confirmed`/`Processing` chưa xuất hóa đơn; xuất toàn bộ đơn một lần (Contract không có số lượng từng dòng). Sau đó đơn thành `Completed`, `invoicedQuantity` = số lượng, đặt chỗ nhả.
- Trong cùng giao dịch: nhả tồn giữ của đơn → ghi sổ hóa đơn (xuất kho theo giá vốn bình quân, bút toán 511/111-112-131/632/156, kiểm hạn mức nợ nếu ghi nợ). Lỗi bất kỳ thì hoàn tác cả, đơn giữ nguyên `Confirmed` và vẫn giữ tồn.
- Giá theo đơn (bảng giá/báo giá), chiết khấu dòng + chiết khấu đầu đơn gộp thành chiết khấu hóa đơn để tổng hóa đơn đúng bằng tổng đơn.
- Đơn có thuế (`taxAmount` > 0) chưa xuất được (409 `error.sd.order_tax_not_supported`) vì ghi sổ hóa đơn chưa có thuế.
- Hóa đơn lập từ đơn không hủy được (409 `error.sd.invoice_from_order_locked`); hàng trả lại bằng phiếu trả hàng.

## Lệnh đã chạy
`dotnet ef migrations add AddInvoiceSalesOrderLink -p ERPm.Infrastructure -s ERPm.API -o Persistence/Migrations` · `dotnet build` · `dotnet run --project tests/ERPm.Verification --no-build` (DB Docker local).

## Kiểm tra
- `dotnet build`: 0 warning, 0 error.
- `ERPm.Verification`: 279 check đạt (263 + 16 mới): giá thỏa thuận qua người dùng không phải quản trị, tổng hóa đơn, tiêu thụ tồn giữ, đơn Completed, chặn xuất hai lần/hủy hóa đơn/hủy đơn, thuế, hoàn tác khi lỗi, bút toán cân, quyền HTTP.
- Chưa chạy trên DB Neon dùng chung. Cột mới null nên hóa đơn cũ không đổi.

## Chưa làm
- Xuất hóa đơn từng phần; thuế trên hóa đơn; `Processing` vẫn chưa có luồng chuyển.
- `send-email` báo giá và thông báo báo giá; BE-22.6 đợt test tổng.

## Bước tiếp theo
`send-email` + thông báo báo giá (Step 21), rồi BE-22.6.
