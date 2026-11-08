# [update] Đơn bán: VAT theo dòng, giờ giao hàng, bản chụp địa chỉ giao (S23.3.1)

> **Loại:** change (Step 23 nhóm 2, đặc tả BA mục 3 của spec S23.2.2)
> **Ngày tạo:** 2026-11-07 · **Người làm:** Thiện (BE) · **Người yêu cầu:** BA
> **Trạng thái:** Done (đã merge master; lỗi địa chỉ đã xóa mềm sửa ở nhánh `thien/s23-order-keep-address-copy`)
> **Liên quan:** Trello https://trello.com/c/5tO1Kk3a · nhánh `thien/s23-sales-order-vat-time` (BE, FE, root) · dựa trên S23.2.1 và S23.2.2 (merge sau BE #25, #26)

## 1. Mô tả
- Mỗi dòng đơn lưu `VatRate` (%) và `TaxAmount`; `TaxAmount` đầu đơn = tổng thuế các dòng; `TotalAmount = SubTotal - DiscountAmount + TaxAmount`.
- Giờ giao: `ExpectedDeliveryDate` là thời điểm UTC (ISO 8601), giữ giờ phút; không phải UTC thì từ chối.
- `DeliveryAddressId` chọn từ danh sách địa chỉ của khách; đơn lưu bản chụp `DeliveryRecipientName`, `DeliveryPhone`, `DeliveryAddressText` (theo spec S23.2.2 mục 3).

## 2. Quyết định và chỗ cần chú ý
- **Item chưa có VatRate** (S23.1.2 của Phúc chưa merge): thuế suất nhập trên từng dòng của yêu cầu (`items[].vatRate`, 0 đến 100, tối đa 2 chữ số thập phân). Khi Item có thuế suất, FE chỉ cần điền sẵn giá trị đó.
- Thuế dòng = `Round(LineTotal x VatRate / 100, 4)`, `LineTotal` đã trừ giảm giá dòng. Giảm giá đầu đơn không làm đổi thuế (đúng công thức của card).
- **Đổi hợp đồng:** `taxAmount` ở đầu yêu cầu không còn là đầu vào. Gửi 0 hoặc đúng tổng thuế các dòng thì được, giá trị khác bị từ chối `error.validation.request`. FE đang gửi thuế đầu đơn tự do cần chuyển sang thuế theo dòng.
- `deliveryAddress` (chuỗi) giữ nguyên để tương thích: khi chọn `deliveryAddressId` thì bằng `deliveryAddressText`; bỏ chọn thì xóa bản chụp và dùng chuỗi nhập tay hoặc địa chỉ đối tác như trước.
- Địa chỉ phải thuộc đúng khách hàng của đơn và còn sống, sai thì `error.sd.order_delivery_address_invalid` (400). Đơn không có khách (khách lẻ) không chọn được địa chỉ.
- **Xuất hóa đơn từ đơn có thuế vẫn bị chặn** (`error.sd.order_tax_not_supported`, từ Step 22). Nay đơn có VAT sẽ gặp chặn này nhiều hơn; cần task riêng cho hóa đơn có thuế.
- Đơn cũ: hai cột mới của dòng mặc định 0, thuế đầu đơn cũ giữ nguyên (không có thuế theo dòng); báo giá chuyển đơn tạo dòng VAT 0.

## 3. Cách làm
- Domain: `SalesOrder` (+4 cột địa chỉ), `SalesOrderItem` (+`VatRate`, `TaxAmount`). Migration `AddOrderVatAndDeliveryAddressCopy`.
- `SalesOrderService`: tính thuế theo dòng, kiểm thuế suất, chụp địa chỉ (`ApplyDeliveryAddressAsync`). DTO thêm trường tương ứng.
- Từ điển VI/EN: `error.sd.order_vat_rate_invalid`, `error.sd.order_delivery_address_invalid` (BE và FE, FE chỉ thêm 4 dòng).

## 4. Kiểm tra
- `dotnet build ERPm.sln`: 0 warning, 0 error.
- `ERPm.Verification` (Docker cục bộ): 337 check đạt (321 + 16 mới): thuế từng dòng và làm tròn, tổng không lệch, thuế đầu đơn tự suy ra, từ chối thuế suất sai và thuế đầu đơn lệch, sửa đơn tính lại, giờ phút UTC khi lưu và đọc lại, từ chối giờ không phải UTC, bản chụp địa chỉ, sửa hoặc xóa địa chỉ gốc không đổi đơn, địa chỉ của khách khác bị từ chối, bỏ chọn xóa bản chụp. Hai test cũ (đơn có thuế) được chuyển sang thuế theo dòng.

## 5. Việc còn lại
- BA/Lợi: FE chuyển sang `vatRate` theo dòng và `deliveryAddressId`; BA quyết định có cần task cho hóa đơn từ đơn có VAT không.
- Tester kiểm; Thiện gõ merge sau BE #25, #26 (FE #19 trước FE của task này). Migration trên Neon chờ Thiện ra lệnh trực tiếp.

## 6. Sau khi tester kiểm (2026-11-07)
- **Lỗi đã sửa:** lưu lại (PUT) đơn có địa chỉ giao đã bị xóa mềm, khi client gửi lại đúng `deliveryAddressId` đang lưu trên đơn, trả 400. Nay id trùng id đang lưu và cùng khách hàng thì giữ nguyên bản chụp, không tra lại bảng địa chỉ; đổi sang id khác hoặc đổi khách hàng thì vẫn kiểm. Thêm 2 check (Verification 346).
- **Đã chấp nhận, FE cần biết:** đơn nháp cũ có thuế đầu đơn tự do chỉ có `TaxAmount` đầu đơn, dòng không có VAT. Khi PUT: gửi lại thuế đầu đơn khác tổng thuế dòng thì 400; không gửi `taxAmount` thì thuế về 0 (tổng giảm). Màn sửa đơn cũ phải gửi `vatRate` từng dòng.
