# Step 22 — BE: Trả hàng bán & bút toán đảo (S22.4.1)

## Mục tiêu
Phiếu trả hàng bán theo Contract mục 3.4 plan-step-22 (task BE-22.5): nhập lại kho hàng trả, đảo doanh thu và giá vốn, hoàn tiền cho khách.

## File đã tạo / chỉnh sửa
ERPm-BE (nhánh `thien/s22-sales-return`, commit bc01b96):
- `Domain/Entities/Sales/SalesReturn.cs` (mới): `SalesReturn`, `SalesReturnItem`, enum `RefundMethod` (1 Cash, 2 BankTransfer, 3 ReduceDebt) → `tbl_SD_SalesReturn`, `tbl_SD_SalesReturnItem`; migration `AddSalesReturn`.
- `Application/DTOs/Sales/SalesReturnDtos.cs` (mới), `Infrastructure/Services/SalesReturnService.cs` (mới), `API/Controllers/SD/SalesReturnsController.cs` (mới, chỉ GET/GET {id}/POST; không có PUT/DELETE).
- `ApplicationDbContext.cs`: cấu hình, query filter; phiếu và dòng trả hàng đã ghi sổ bất biến như hóa đơn.
- `PostingTransaction.cs`: `ReceivablesAsync` (công nợ phải thu = nợ hóa đơn đã ghi sổ − hoàn tiền trừ nợ), dùng cho ghi sổ hóa đơn và kiểm công nợ đơn bán.
- `SalesCancellationService.cs`: chặn hủy hóa đơn đã có phiếu trả (`error.sd.invoice_has_returns`).
- `EssentialDataSeeder.cs`: thêm tài khoản 521; `NotificationTemplateSeeder.cs`: mẫu `SD_RETURN_POSTED`.
- `PermissionCatalog.cs`: `sd:return` (view/create). `system_dictionary.json`: `error.sd.return_refund_exceeds_debt`, `error.sd.invoice_has_returns`.
- `tests/ERPm.Verification/Program.cs`: 21 check mới.
ERPm-FE (nhánh `thien/s22-sales-return`, commit a26e817): `system.json` đồng bộ từ điển.

## Endpoint
| Endpoint | Quyền | Ghi chú |
| :--- | :--- | :--- |
| `GET /api/v1/sales/returns` | `sd:return:view` | Lọc `keyword` (số phiếu/khách), `status`; `items` rỗng |
| `GET /api/v1/sales/returns/{id}` | `sd:return:view` | Kèm dòng |
| `POST /api/v1/sales/returns` | `sd:return:create` | Ghi sổ ngay khi tạo |

## Quy tắc ghi sổ
- Có hóa đơn gốc (`invoiceId`): mỗi dòng phải có `invoiceItemId`; số lượng trả cộng dồn không vượt số lượng đã mua (409 `error.sd.return_quantity_exceeds_invoiced`). Giá hoàn lấy theo dòng hóa đơn (chiết khấu đầu hóa đơn chia theo tỷ lệ), `unitPrice` trong yêu cầu bị bỏ qua. Giá vốn nhập lại = giá vốn dòng hóa đơn theo tỷ lệ.
- Không hóa đơn: giá theo yêu cầu, giá vốn = giá vốn bình quân của kho (hoặc giá vốn danh mục nếu chưa có tồn); bắt buộc có khách hàng khi hoàn bằng trừ nợ.
- Kho: phiếu nhập kho `PNK` cho hàng hóa (`Goods`); tồn và giá trị tồn tăng, giá bình quân tính lại.
- Bút toán `SALES_RETURN`: Nợ 521 / Có 111, 112 hoặc 131 theo `refundMethod`; Nợ 156 / Có 632 khi có giá vốn.
- Hoàn trừ nợ (`ReduceDebt`): không vượt công nợ phải thu của khách (409 `error.sd.return_refund_exceeds_debt`), giảm `DebtBalance`.
- Phiếu trả đã ghi sổ không sửa, không xóa (`error.accounting.posted_immutable`); hóa đơn đã có phiếu trả không hủy được.
- Số phiếu `SR-YYYYMM-XXXX` lấy từ sequence chung (4 chữ số trở lên, duy nhất). Thông báo `SD_RETURN_POSTED` gửi sau commit.

## Lệnh đã chạy
`dotnet ef migrations add AddSalesReturn -p ERPm.Infrastructure -s ERPm.API -o Persistence/Migrations` · `dotnet build --no-incremental` · `dotnet run --project tests/ERPm.Verification --no-build` (DB Docker local).

## Kiểm tra
- `dotnet build`: 0 warning, 0 error.
- `ERPm.Verification`: 239 check đạt (218 cũ + 21 mới): trả theo hóa đơn, trả không hóa đơn, nhập lại kho đúng giá vốn, bút toán, trừ nợ, hoàn tiền mặt, vượt số lượng/vượt nợ, chặn hủy hóa đơn, bất biến, chiết khấu chia tỷ lệ, quyền qua HTTP.
- Chưa chạy trên DB Neon dùng chung. Tài khoản 521 được thêm khi API khởi động (seeder chạy mỗi lần); DB đã có sẽ có 521 sau lần khởi động đầu với bản mới, trước đó trả hàng sẽ báo `error.accounting.accounts_missing`.

## Lưu ý / chưa làm
- Trả hàng cho hóa đơn có tồn kho bị bán lẻ ngược chiều khác (đa kho) nhập vào kho chọn trong yêu cầu, không bắt buộc trùng kho xuất.
- Hoàn trừ nợ kiểm theo tổng công nợ của khách, chưa theo từng hóa đơn.
- Hàng trả về chưa có bước kiểm định chất lượng/hàng lỗi; nhập thẳng kho bán được.

## Bước tiếp theo
S22.5.1 phần BE: truy vấn Dapper doanh số/KPI (`/api/v1/sales/analytics/*`, quyền `sd:report:view`), nhánh `thien/s22-sales-analytics`.
