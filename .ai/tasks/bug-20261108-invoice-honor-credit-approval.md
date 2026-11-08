# [bug] Đơn đã duyệt nợ vẫn bị xuất hóa đơn chặn hạn mức 409 (BUG-20261108a)

> **Loại:** bug
> **Ngày tạo:** 2026-11-08 · **Người làm:** Thiện (Dev 1) · **Người yêu cầu:** BA (phát hiện khi kiểm tích hợp FE-INT.1)
> **Trạng thái:** Doing (chờ tester và Thiện gõ merge)
> **Liên quan:** nhánh `thien/fix-invoice-honor-credit-approval` (BE, root)

## Hiện tượng
Đơn vượt hạn mức được duyệt nợ (`approve-credit`, trạng thái `Overridden`) nhưng `create-invoice` thanh toán nợ trả 409 `error.sales.credit_limit`, vì `PostInvoiceAsync` kiểm lại hạn mức như một lần bán mới.

## Nguyên nhân gốc
Việc duyệt chỉ ảnh hưởng bước xác nhận đơn; bước ghi hóa đơn kiểm hạn mức độc lập, không biết đơn đã được duyệt.

## Cách sửa
- `PostInvoiceAsync` bỏ qua kiểm hạn mức khi hóa đơn lập từ đơn có `CreditCheckStatus = Overridden`. Công nợ vẫn ghi sổ. Đơn chưa duyệt, bán trực tiếp và POS vẫn bị chặn 409; `IsUnlimitedCredit` giữ nguyên.
- Đơn lưu **người duyệt và thời điểm duyệt**: cột mới `credit_approved_by`, `credit_approved_at_utc` (migration `AddOrderCreditApprovalAudit`); DTO đơn trả `creditApprovalReason`, `creditApprovedBy`, `creditApprovedAtUtc`. Đơn đã duyệt trước bản này có hai cột trống (lý do vẫn có).
- Phạm vi duyệt: không giới hạn số tiền ghi trên đơn, nhưng hóa đơn lập từ đơn bằng đúng giá và số lượng của đơn (tổng bằng tổng đơn) nên không vượt phần đã duyệt.

## Kiểm tra
- `dotnet build`: 0 warning, 0 error; `ERPm.Verification` 361 check đạt (thêm 6): đơn vượt hạn mức phải chờ duyệt và chưa xuất hóa đơn được; người duyệt, thời điểm, lý do được lưu; đơn đã duyệt xuất hóa đơn nợ vượt hạn mức thành công và công nợ được ghi; đơn trong hạn mức xác nhận không cần duyệt; đơn chưa duyệt mà công nợ đã tăng sau đó vẫn bị 409.

## Việc còn lại
- Tester kiểm; Thiện gõ merge. Migration trên Neon chỉ khi Thiện yêu cầu.
