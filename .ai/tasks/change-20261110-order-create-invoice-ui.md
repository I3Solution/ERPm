# [add] Nút xuất hóa đơn từ đơn bán (BUG-20261108b)

> **Loại:** change · **Người làm:** Thiện (Dev 1) · **Người yêu cầu:** BA
> **Trạng thái:** Doing (chờ tester và merge)
> **Liên quan:** nhánh `thien/fe-order-create-invoice` (FE, root), `thien/fe-sd-order-create-invoice` (FE-SD), `thien/fe-order-invoice-dictionary` (BE, từ điển)

## Việc đã làm
- Trang chi tiết đơn bán có nút **Xuất hóa đơn** khi đơn `Confirmed` và người dùng có `sd:invoice:create`; mở hộp thoại nhỏ (`order-invoice-dialog`): chọn kho xuất, hình thức thanh toán (tiền mặt, chuyển khoản, ghi công nợ), số tiền nhận (mặc định bằng tổng đơn, ghi công nợ thì 0), ghi chú. Gọi `POST /sales/orders/{id}/create-invoice`; thành công thì đơn thành Hoàn tất, tải lại đơn và danh sách.
- Đơn có VAT: BE còn chặn (`error.sd.order_tax_not_supported`), nên bấm nút hiện thông báo rõ ngay bằng hộp thoại; lỗi khác của server (hết tồn, vượt hạn mức đơn chưa duyệt...) hiện ở banner lỗi và hộp thoại giữ nguyên để người dùng sửa, không nuốt lỗi.
- 10 khóa từ điển VI/EN (FE + BE giống từng byte).

## Kiểm tra
- `npm run build` 0 lỗi; Karma 199/199 (4 test mới cho hộp thoại: cần kho, ghi công nợ, body gửi lên, lỗi giữ hộp thoại mở).
- Chưa bấm giao diện trình duyệt (không có công cụ); tester thử: đơn Confirmed không VAT xuất tiền mặt/công nợ, đơn có VAT thấy thông báo, đơn không đủ tồn thấy banner lỗi.

## Còn lại
- Mở khóa VAT cho hóa đơn từ đơn (chờ Thiện/kế toán chốt hạch toán thuế).
