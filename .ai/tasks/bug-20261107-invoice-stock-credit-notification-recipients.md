# [fix](SD) BUG-20261107d: người nhận thông báo hóa đơn hủy, tồn kho thấp, chờ duyệt nợ

> **Loại:** bug (Step 23) · **Người làm:** Thiện (Dev 1) · **Trạng thái:** Doing (chờ tester và merge)
> **Liên quan:** BUG-20261107b (đơn bán/trả hàng, BE #31), B96FRnQ5 (báo giá, BE #30), cùng mẫu `PermissionRecipients` · nhánh `thien/fix-notice-recipients-2` (BE)

## Làm
- `SD_INVOICE_CANCELLED`: gửi cho tài khoản có `sd:invoice:view` và phạm vi dữ liệu chạm tới hóa đơn, bỏ người hủy, **gửi sau khi commit** (trước đây phát theo cây chi nhánh, trước commit).
- `WMS_LOW_STOCK`: gom thông báo trong lúc ghi hóa đơn, gửi sau commit cho tài khoản có `wms:stock:view` trong chi nhánh của kho (tồn kho không có chủ nên phạm vi chỉ-của-tôi không nhận), bỏ người bán.
- `SD_ORDER_CREDIT_PENDING`: chỉ gửi cho người có `sd:order:approve_credit` (người duyệt hạn mức), không còn gửi mọi người xem đơn.
- Verification: thêm quyền `sd:invoice:view`, `wms:stock:view`, người duyệt riêng; kiểm 3 sự kiện, kiểm hành động bị từ chối không gửi gì.

## Kiểm tra
- `dotnet build tests/ERPm.Verification` 0 warning/0 error; Verification chạy hết 395 PASS, không FAILED (DB local).
- Chưa qua tester bằng API thật.

## Còn lại
- Tester kiểm qua API thật; Thiện gõ merge. Sau đó làm BUG-20261107e (IAM).
