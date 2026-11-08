# [update] Tích hợp FE SD và CRM với BE thật, bỏ dữ liệu giả (FE-INT.1)

> **Loại:** change (Step 24, luồng A)
> **Ngày tạo:** 2026-11-08 · **Người làm:** Thiện (Dev 1) · **Người yêu cầu:** BA
> **Trạng thái:** Doing (chờ tester và Thiện gõ merge)
> **Liên quan:** Trello https://trello.com/c/yVyoUVZI · nhánh `thien/fe-int` (root, FE), `thien/fe-int-sd` (FE-SD), `thien/fe-int-crm` (FE-CRM), `thien/fe-int-dictionary` (BE, chỉ từ điển) · phụ thuộc BE-INT.1 (BE #34) cho sửa đối tác

## 1. Việc đã làm
**CRM** (`partner.service.ts`): bỏ toàn bộ `catchError` giả, danh sách khách và địa chỉ giả trong bộ nhớ. `getPartnerById` gọi `GET /partners/{id}`; `updatePartner` gọi `GET` rồi `PUT /partners/{id}` (gửi đủ trường, giữ `isActive`), chỉ gọi `PUT /{id}/unlimited-credit` khi cờ đổi; địa chỉ gọi thẳng 6 endpoint. Lỗi BE giữ nguyên để banner lỗi (interceptor) hiện mã `error.*`. Form khách không còn ghi `creditLimit = 0` khi bật không giới hạn nợ (hạn mức cũ được giữ).

**SD** (`sd.service.ts`, viết lại, 999 → ~250 dòng): bỏ `useMock` và toàn bộ dữ liệu mẫu; mọi phương thức là HTTP thật: bảng giá (CRUD, tính giá), báo giá (CRUD, `send/accept/reject`, chuyển thành đơn rồi đọc đơn), đơn bán (CRUD, `confirm`, `approve-credit`, `cancel`, `create-invoice`), trả hàng (đọc, tạo). Danh sách gọi `pageIndex=1&pageSize=200` (tối đa của server) cho tới khi LD.5 làm phân trang.
- **Mô hình khớp BE:** trạng thái nợ `Passed/Warning/PendingApproval/Overridden`, `reservationStatus` (cờ `stockReserved` và `reservedQuantity` tính từ đó), đơn không còn `warehouseId`, ngày gửi lên ở dạng UTC (`toUtcIso`: ngày `YYYY-MM-DD` hay giờ địa phương đều thành ISO UTC vì BE từ chối giờ không phải UTC).
- **Màn dùng hộp thoại chung** (thay `window.confirm`/`alert`): duyệt nợ và hủy đơn hỏi **lý do** (BE bắt buộc), chuyển báo giá thành đơn hỏi xác nhận, gửi báo giá báo "đã đánh dấu đã gửi, hệ thống chưa gửi email".
- Chi tiết trả hàng: bỏ nút Sửa (phiếu trả đã ghi sổ là bất biến ở BE).
- Bảng "tín dụng" của đơn lấy hạn mức/công nợ từ `GET /partners/{id}` (bỏ qua nếu người xem thiếu quyền).
- 6 khóa từ điển mới (VI/EN) ở cả FE `system.json` và BE `system_dictionary.json` (giống từng byte).

## 2. Kiểm tra
- `npm run build`: 0 lỗi. Karma: 176/176 (thêm `partner.service.spec.ts` 9 test hợp đồng; 5 spec cũ phụ thuộc dữ liệu giả chuyển sang `HttpTestingController`).
- **Kiểm hợp đồng trên API thật** (API chạy trên DB local tạm, kịch bản gửi đúng các body mà service FE tạo): 47 bước PASS gồm tạo/sửa/đọc lại khách, 2 địa chỉ + đặt mặc định + lỗi `error.crm.delivery_address_recipient_required`, bảng giá tạo/sửa/tính giá, báo giá tạo/sửa/gửi/chấp nhận/chuyển đơn, đơn VAT 8% + giờ giao + địa chỉ (thuế 24, tổng 324), xác nhận/hủy kèm lý do, chờ duyệt nợ, từ chối duyệt thiếu lý do, duyệt có lý do, xuất hóa đơn, trả hàng, các danh sách phân trang.
- **Chưa làm:** thao tác bằng giao diện trên trình duyệt (phiên này không có công cụ điều khiển trình duyệt). Tester nên bấm thử các màn Khách hàng, Báo giá, Đơn bán, Trả hàng, Bảng giá trên API thật.

## 3. Phát hiện cần quyết định
1. **Hóa đơn từ đơn đã duyệt nợ vẫn bị chặn hạn mức.** Đơn vượt hạn mức được duyệt (`Overridden`), nhưng `create-invoice` với thanh toán nợ trả 409 `error.sales.credit_limit` vì `PostInvoiceAsync` kiểm lại hạn mức. Cần BA quyết định: đơn đã duyệt có được bỏ qua kiểm hạn mức khi xuất hóa đơn không (lỗi BE từ Step 22).
2. **Chưa có màn xuất hóa đơn từ đơn** trong FE: `createInvoiceFromOrder` đã có trong service, nhưng chưa có nút (cần thiết kế: chọn kho, hình thức thanh toán).
3. Còn dữ liệu mẫu cứng ở `order-detail.component.ts` (danh mục sản phẩm mặc định khi API trống) và màn tạo đơn dùng VAT mặc định 10%; Item chưa có `vatRate` (card S23.1.2 của Phúc).
4. Chi tiết trả hàng và đơn còn mã chỉnh sửa cũ của chế độ sửa (không còn vào được); nên dọn khi tách List/Detail (Dev 2).
5. Gửi email báo giá thật vẫn chưa có (chờ quyết định hạ tầng email).

## 4. Việc còn lại
- Tester kiểm; sau BE #34 (BE-INT.1) vào master thì sửa đối tác mới chạy thật. Merge theo thứ tự: BE #34, CRM, SD, BE từ điển, FE, root.
