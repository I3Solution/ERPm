# Bug: Step 22 BE — 3 lỗi từ tester (S22.1.1–S22.3.1)

- **Trạng thái:** Done (merge cùng S22.4.1: BE 27435e0, FE 16fa9a8, root b416294; tester erpm-ce kiểm lại PASS trên BE 27435e0)
- **Loại / tag:** bug / `[fix]`
- **Người báo:** tester `erpm-ce` (báo cáo `notes/ai-team/test-reports/S22-BE-20261106.md`), master 416ba70
- **Nhánh:** `thien/s22-sales-return` (BE 40ebc92, FE 8ac1645), gộp vào PR S22.4.1 để tránh xung đột cùng tệp kiểm thử và từ điển

## F1 — `calculate-price` trả 400 cho tài khoản phạm vi SELF
- **Hiện tượng:** `POST /api/v1/sales/price-lists/calculate-price` trả 400 `error.validation.request` với mọi chi nhánh cho tài khoản chỉ có quyền `sd:order:*` phạm vi SELF (không có chi nhánh nào).
- **Nguyên nhân gốc:** `PriceListService.CalculateAsync` kiểm chi nhánh qua `Context.Branches` nên bị bộ lọc DataScope; người bán phạm vi SELF không "thấy" chi nhánh nào.
- **Cách sửa:** kiểm chi nhánh tồn tại/đang hoạt động bằng `IgnoreQueryFilters` (tính giá chỉ đọc giá, không đọc dữ liệu chi nhánh). Cùng cách cho kiểm chi nhánh áp dụng khi lưu bảng giá.
- **Chống tái phát:** check "a seller outside every branch scope can still calculate prices".
- **Chưa đổi:** kiểm chi nhánh khi tạo báo giá/đơn bán vẫn theo DataScope (tạo chứng từ ngoài phạm vi vẫn bị chặn); nếu người bán SELF cần tạo đơn cần chốt riêng.

## F2 — xóa được bảng giá đã nằm trong đơn bán
- **Nguyên nhân gốc:** `BeforeDeleteAsync` chỉ kiểm khách hàng đang gán bảng giá.
- **Cách sửa:** chặn xóa cả khi có `SalesOrder` (chưa xóa) tham chiếu `PriceListId` → 409 `error.sd.pricelist_in_use`; sửa câu thông báo VI/EN.
- **Chống tái phát:** check đơn chuyển từ báo giá giữ `priceListId` và xóa bảng giá đó bị 409.

## F3 — sai trạng thái đơn dùng khóa lỗi cũ
- **Nguyên nhân gốc:** xác nhận lại, sửa, xóa đơn không ở Draft vẫn trả `error.order.state` (khóa cũ dùng chung với đơn mua).
- **Cách sửa:** `SalesOrderService` dùng `error.sd.order_invalid_status_for_action` (409) cho 3 chỗ; đơn mua giữ nguyên khóa cũ.
- **Chống tái phát:** 3 check Confirm/Update/Delete đơn đã xác nhận.

## Ghi chú nhẹ của tester
- `GET /stock/balances` nay trả thêm `quantityReserved` và `quantityAvailable` (tồn trừ phần giữ) cho FE.
- Số đơn vẫn `SO0000000001`, chưa đổi sang `SO-YYYYMM-XXXX` của Contract; đổi sẽ ảnh hưởng chứng từ cũ nên cần BA/Phúc chốt.

## Kiểm tra
- `dotnet build`: 0 warning, 0 error; `ERPm.Verification`: 245 check đạt (gồm S22.4.1).
- Việc còn lại: tester kiểm lại sau khi merge; ghi `Done` và commit merge khi xong.

## F4 (tester, lần 2) — hóa đơn thiếu id dòng và GET chi tiết
- Trả hàng theo hóa đơn bắt buộc `invoiceItemId` nhưng `SalesInvoiceItemDto` không có `id` và chưa có `GET /sales/invoices/{id}`.
- Đã thêm `id` dòng và `GET /api/v1/sales/invoices/{id}` (BE d340a54, nhánh `thien/s22-sales-analytics`, chờ merge; xem `.ai/steps/step-22-sd-sales-analytics-be.md`). Yêu cầu trả theo hóa đơn bỏ qua `unitPrice` là chủ ý (giá hoàn lấy từ dòng hóa đơn).
