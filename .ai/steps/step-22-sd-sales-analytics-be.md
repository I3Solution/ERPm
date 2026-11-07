# Step 22 — BE: Báo cáo doanh số & KPI (S22.5.1 phần BE) + chi tiết hóa đơn (F4)

## Mục tiêu
API báo cáo bán hàng theo Contract mục 3.5 plan-step-22, viết bằng SQL tập hợp (Dapper); kèm sửa góp ý F4 của tester: hóa đơn cần `id` dòng và `GET` chi tiết để FE làm màn trả hàng.

## File đã tạo / chỉnh sửa (ERPm-BE, nhánh `thien/s22-sales-analytics`, commit d340a54)
- `Application/DTOs/Sales/SalesAnalyticsDtos.cs`, `Application/Common/Crud/ISalesAnalyticsService.cs` (mới).
- `Infrastructure/Services/SalesAnalyticsService.cs` (mới, Dapper), đăng ký DI.
- `API/Controllers/SD/SalesAnalyticsController.cs` (mới); `PermissionCatalog.cs`: `sd:report:view`.
- F4: `SalesInvoiceItemDto.Id`, `ISalesInvoiceService.GetInvoiceAsync`, `GET /api/v1/sales/invoices/{id}` (quyền `sd:invoice:view`, 404 nếu không có).
- `tests/ERPm.Verification/Program.cs`: 15 check mới. Không đổi từ điển nên không có PR FE.

## Endpoint
| Endpoint | Quyền | Trả về |
| :--- | :--- | :--- |
| `GET /api/v1/sales/analytics/summary` | `sd:report:view` | `SalesSummaryDto` |
| `GET /api/v1/sales/analytics/salesperson-kpi` | `sd:report:view` | `SalespersonKpiDto[]`, doanh số giảm dần |
| `GET /api/v1/sales/analytics/funnel` | `sd:report:view` | `SalesFunnelDto` |
| `GET /api/v1/sales/invoices/{id}` | `sd:invoice:view` | Hóa đơn kèm dòng (có `id` dòng) |
Tham số chung (tùy chọn): `from`, `to` (UTC, khoảng nửa mở `[from, to)`, mặc định từ đầu tháng hiện tại đến nay, tối đa 3660 ngày; sai khoảng → 400 `error.validation.request`), `branchId` (gồm chi nhánh con).

## Định nghĩa số liệu
- Doanh số = hóa đơn đã ghi sổ − tiền hoàn của phiếu trả đã ghi sổ; giá vốn = giá vốn dòng hóa đơn − giá vốn nhập lại của phiếu trả; lợi nhuận gộp = doanh số − giá vốn; biên = lợi nhuận / doanh số × 100 (làm tròn 2 số).
- Số đơn: đơn tạo trong kỳ (mọi trạng thái); `completedOrders` đếm trạng thái `Completed` (hiện chưa có luồng chuyển sang trạng thái này), `cancelledOrders` đếm `Cancelled`.
- KPI theo nhân viên: đơn `Confirmed/Processing/Completed` có `salespersonId`; `targetRevenue` và `completionRatePercent` rỗng vì chưa lưu chỉ tiêu.
- Phễu: báo giá theo ngày báo giá; đơn `Confirmed/Processing/Completed`; hóa đơn đã ghi sổ; tỷ lệ chuyển đổi = báo giá `Converted` / số báo giá × 100.

## Phân quyền dữ liệu
Dapper bỏ qua bộ lọc truy vấn của EF nên mọi câu SQL tự lặp lại phạm vi: chưa xóa, đúng chi nhánh yêu cầu, và quyền của người gọi (toàn quyền, hoặc chi nhánh / phòng ban / bản ghi của mình). Có check chứng minh người ngoài phạm vi thấy toàn số 0. Mảng id truyền bằng tham số mảng PostgreSQL (Dapper không mở rộng mảng đúng).

## Lệnh đã chạy
`dotnet build` · `dotnet run --project tests/ERPm.Verification --no-build` (DB Docker local).

## Kiểm tra
- `dotnet build`: 0 warning, 0 error.
- `ERPm.Verification`: 260 check đạt (245 trước đó + 15 mới): doanh số khớp truy vấn EF độc lập (trừ hoàn trả), biên, đếm đơn, phễu, tỷ lệ chuyển đổi, KPI, lọc chi nhánh, kỳ trống, kỳ sai, phạm vi dữ liệu, HTTP.
- Chưa chạy trên DB Neon dùng chung.

## Chưa làm
- Chỉ tiêu doanh số theo nhân viên (cần bảng và API riêng).
- Trả về số lượng còn trả được của từng dòng hóa đơn (FE hiện tự tính từ phiếu trả).
- Chỉ mục riêng cho truy vấn báo cáo; chỉ cần khi dữ liệu lớn (đã có chỉ mục theo ngày hóa đơn và chi nhánh).

## Bước tiếp theo
BE-22.6 (đợt kiểm thử tổng cho Step 22) và tích hợp FE (Lợi) đổi mock sang API thật; phần còn lại của Step 22 BE: `create-invoice` từ đơn, `send-email` báo giá.
