# Step 22 — BE: Thông báo báo giá (và vì sao `send-email` chưa làm)

## Mục tiêu
Báo cho chi nhánh khi khách trả lời hoặc chuyển đổi báo giá, theo `docs/NOTIFICATION_INTEGRATION_GUIDE.md`. Phần `POST /quotations/{id}/send-email` của Contract mục 3.2.1 **chưa làm**, xem "Đang chờ quyết định".

## File đã tạo / chỉnh sửa (ERPm-BE, nhánh `thien/s22-quotation-email`, commit 108eb2e)
- `SalesQuotationService.cs`: nhận `INotificationEngine` (tùy chọn); gửi sự kiện sau khi giao dịch commit (không báo khi rollback).
- `NotificationTemplateSeeder.cs`: 3 mẫu VI/EN `SD_QUOTATION_ACCEPTED` (INFO), `SD_QUOTATION_REJECTED` (WARNING), `SD_QUOTATION_CONVERTED` (INFO, kèm số đơn). Mẫu được seed khi API khởi động.
- `tests/ERPm.Verification/Program.cs`: 5 check mới với engine giả ghi lại sự kiện. Không đổi từ điển, không migration, không PR FE.

## Sự kiện
| Thao tác | Sự kiện | Đích |
| :--- | :--- | :--- |
| `send` | không có (người gửi tự biết) | — |
| `accept` | `SD_QUOTATION_ACCEPTED` | Cây chi nhánh của báo giá |
| `reject` | `SD_QUOTATION_REJECTED` | như trên |
| `convert-to-order` | `SD_QUOTATION_CONVERTED` | như trên, kèm `order_code` |

## Lệnh đã chạy
`dotnet build` · `dotnet run --project tests/ERPm.Verification --no-build` (DB Docker local; build/test trong git worktree riêng vì một API chạy sẵn trên cổng 5143 khóa các DLL của thư mục chính).

## Kiểm tra
- `dotnet build`: 0 warning, 0 error; `ERPm.Verification`: 284 check đạt (279 + 5 mới).
- Chưa chạy trên DB Neon dùng chung (mẫu thông báo cần khởi động API một lần để seed).

## Đang chờ quyết định: `send-email` báo giá
Hạ tầng Step 21 chưa gửi được email thật:
- `EmailChannelProvider` chỉ ghi log, không có SMTP/nhà cung cấp email và không có cấu hình/bí mật.
- Hàng đợi `NotificationOutbox` gắn với tài khoản hệ thống (`UserId` bắt buộc); khách hàng là đối tác, không phải người dùng, nên chưa có chỗ đặt địa chỉ email bên ngoài.
- Contract nói "đính kèm bản xem trước" (PDF/HTML) cũng chưa có bộ dựng.
Cần chốt: (1) nhà cung cấp/SMTP và nơi giữ bí mật; (2) cho phép outbox gửi tới địa chỉ ngoài (thay đổi bảng `tbl_SYS_NotificationOutbox`); (3) định dạng nội dung (HTML trong thân thư hay PDF đính kèm). Không làm giả endpoint chỉ đổi trạng thái vì sẽ báo "đã gửi" mà khách không nhận được gì.

## Bước tiếp theo
BE-22.6 đợt test tổng Step 22; `send-email` khi có quyết định trên.
