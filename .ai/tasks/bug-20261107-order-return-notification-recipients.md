# [bug] Thông báo đơn bán và trả hàng phát sai người nhận (BUG-20261107b)

> **Loại:** bug
> **Ngày tạo:** 2026-11-07 · **Người làm:** Thiện (BE) · **Người yêu cầu:** BA
> **Trạng thái:** Doing (đã báo tester; Thiện cho merge ngay)
> **Liên quan:** Trello https://trello.com/c/SdKFDykL · nhánh `thien/fix-order-return-notification-recipients` (BE, root) · cùng kiểu với [bug quotation](bug-20261107-quotation-notification-recipients.md)

## Hiện tượng
`SD_ORDER_NEW/CREDIT_PENDING/CREDIT_APPROVED/CANCELLED/INVOICED` và `SD_RETURN_POSTED` được phát theo đích cây chi nhánh: người không có quyền xem đơn hay trả hàng vẫn nhận, người thao tác tự nhận thông báo về hành động của mình.

## Cách sửa
- `PermissionRecipients.PublishAsync` (dùng chung, đã dùng cho báo giá): tìm tài khoản đang hoạt động có quyền xem tương ứng và phạm vi dữ liệu chạm tới chứng từ (không giới hạn, chi nhánh, phòng ban, hoặc SELF với chứng từ do mình tạo), loại người thao tác, gửi từng người (đích USER) sau khi giao dịch commit.
- Quyền xem: đơn dùng `sd:order:view` (kể cả `SD_ORDER_INVOICED`), trả hàng dùng `sd:return:view`.
- `SalesOrderService`, `SalesReturnService`, `SalesInvoiceService` (hóa đơn từ đơn) nhận thêm `IIamService` (và người thao tác). Báo giá chuyển sang cùng bộ gửi.

## Bằng chứng
- `dotnet build`: 0 warning, 0 error; `ERPm.Verification` 355 check đạt (thêm 8): người xem trong chi nhánh, không giới hạn, SELF chủ đơn nhận; loại người thao tác, chi nhánh khác, SELF của bản ghi khác, người không có quyền; áp dụng cho tạo/xác nhận, chờ duyệt nợ, duyệt nợ, hủy, xuất hóa đơn từ đơn, trả hàng; lưu nháp không thông báo.

## Việc còn lại
- Chưa sửa (ngoài card): `SD_INVOICE_CANCELLED` (SalesCancellationService) và `WMS_LOW_STOCK` (SalesPostingService) vẫn phát theo cây chi nhánh và phát trước khi commit; cùng kiểu lỗi, cần task riêng.
- `SD_ORDER_CREDIT_PENDING` hiện gửi theo quyền xem đơn như BA chọn; người thực sự cần xử lý là người có `sd:order:approve_credit`. BA cân nhắc đổi quyền nhận cho sự kiện này.
