# [fix] SD audit fixes: credit exposure, POS VAT, lock order, VAT order invoicing

> **Pipeline:** stage=TEST · round=BA/TA:1, DEV/TEST:1 · gate=none
> **PR/SHA:** BE#94 @d9bfe29
> **Env:** API http://localhost:5297, DB local Docker :5433 `erpm_audit` (TEMPLATE erpm_uistd + `--migrate`); không FE
> **Metrics:** BA=?/? · TA=? · DESIGN=n/a · DEV=? · TEST=? · REPORT=?

> **Loại:** bug
> **Ngày tạo:** 2026-11-20 · **Người làm:** Thiện (AI) · **Người yêu cầu:** Thiện
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** audit master SD/ACC; BE#94
> **Phạm vi:** ERPm-BE: PostingTransaction, SalesPostingService, SalesOrderInvoicing, SalesCancellationService, SalesReturnService, StockReceiptPostingService, SalesInvoiceItem + migration

## P-BA
- F1: phiếu thu khách (CustomerPayment/AdvanceFromCustomer) đã Posted mà chưa phân bổ phải giảm dư nợ tín dụng; phiếu đã hủy không tính. Một quy tắc chung cho xác nhận đơn và ghi hóa đơn.
- F2: POS: VAT = TaxRate × (tạm tính − chiết khấu); client chỉ được gửi TaxAmount = 0 hoặc đúng số tính được, khác → 400 `error.validation.request`.
- F3: mọi luồng khóa `partner:` trước `stock:`; thông báo tồn thấp không nhân đôi khi transaction retry.
- F4: đơn có VAT lập được hóa đơn; tổng hóa đơn = tổng đơn; bút toán ghi Có VAT (rule SALES_VAT) = tổng VAT dòng.
- Ngoài phạm vi: bút toán trả hàng tách VAT (hiện ghi Nợ 521 toàn bộ, kể cả hóa đơn POS có VAT — hành vi cũ).

## P-TA
- BE origin/master @ccf0b4d. Callers `ReceivablesAsync`: SalesOrderService.CheckCreditAsync, SalesPostingService.PostInvoiceAsync, SalesReturnService (ReduceDebt).
- Hủy phiếu thu (`ReverseReceiptVoucherAsync`) đặt Status=Cancelled, trả lại phân bổ cho hóa đơn → chỉ cần lọc Status=Posted.
- Khóa: PostInvoiceAsync/CancelInvoice/StockReceiptPosting khóa stock trước partner; Returns, CheckCredit đã partner trước. CreateInvoiceFromOrder: ReleaseAsync khóa stock trước khi PostInvoiceAsync khóa partner.
- FE POS (`pos.component.ts`) không gửi TaxRate/TaxAmount → tương thích, không cần sửa FE. FE invoice DTO thêm field là additive.
- Hủy hóa đơn lập từ đơn bị chặn (`error.sd.invoice_from_order_locked`) → không ảnh hưởng VAT dòng.

## P-DESIGN
n/a (BE-only).

## P-DEV
- F1 `PostingTransaction.ReceivablesAsync`: trừ (Σ Amount − Σ AllocatedAmount) của phiếu thu khách Posted.
- F2 `SalesPostingService`: VAT tính từ TaxRate; TaxAmount client ≠ 0 và ≠ số tính → 400.
- F3 khóa partner trước item/stock ở PostInvoiceAsync, CancelInvoiceAsync, StockReceiptPostingService; CreateInvoiceFromOrder khóa khách trước ReleaseAsync; `lowStockNotices.Clear()` đầu PostInvoiceAsync (trong delegate retry).
- F4 bỏ `error.sd.order_tax_not_supported`; `SalesInvoiceItem.VatRate/TaxAmount` (migration `20261120011106_SalesInvoiceItemLineVat`), copy từ dòng đơn; header TaxAmount = Σ dòng, TaxRate = tỷ lệ chung nếu mọi dòng cùng tỷ lệ, không thì 0. Trả hàng: refund = (Amount × share + TaxAmount dòng) × SL trả / SL, share = (Total − Σ VAT dòng)/SubTotal (POS không đổi).

## 1. Mô tả
Audit master SD tìm 4 lỗi: dư nợ tín dụng bỏ qua phiếu thu chưa phân bổ; POS nhận TaxAmount tùy ý; thứ tự khóa không thống nhất gây deadlock + thông báo tồn thấp lặp; đơn có VAT không lập được hóa đơn.

## 2. Phân tích
Xem P-TA.

## 3. Features / Milestones
- [x] F1 — phiếu thu chưa phân bổ giảm dư nợ tín dụng (đơn + hóa đơn).
- [x] F2 — POS TaxAmount lệch → 400.
- [x] F3 — thứ tự khóa partner → stock; không nhân đôi thông báo tồn thấp khi retry.
- [x] F4 — lập hóa đơn từ đơn có VAT dòng, tổng = tổng đơn, bút toán có dòng VAT.

## 4. Cách làm
- File: xem P-DEV. Lệnh: `dotnet ef migrations add SalesInvoiceItemLineVat`.

## 5. Kiểm tra
- `dotnet build` 0 lỗi; `dotnet ef migrations has-pending-model-changes` sạch.
- ERPm.Verification (Docker :5433): VERIFIED 689 checks, 0 fail. Check mới: exposure trừ phiếu thu chưa phân bổ/ứng trước và hết trừ khi hủy; hóa đơn từ đơn VAT (tổng 204, VAT 19, bút toán cân + dòng VAT 19); trả nửa dòng VAT refund 102; POS TaxAmount lệch → `error.validation.request`.
- F3 (deadlock/retry) không có check tự động: khó dựng tranh chấp trong Verification; đã soát code tất cả chỗ khóa `partner:`/`stock:`.

## 6. Việc còn lại
- TEST độc lập (tester). Chưa merge.
- Câu hỏi nghiệp vụ: bút toán trả hàng có tách VAT (Nợ 3331) thay vì Nợ 521 toàn bộ không — hành vi cũ, chưa đổi.

## 7. Evidence và cập nhật
- Commit / PR: BE#94 @d9bfe29 (I3Solution/ERPm-BE#94), root PR này
- CI: chờ
- Ngày cập nhật cuối: 2026-11-20

## P-TEST
- Tester độc lập 2026-11-20, BE#94 @d9bfe29, root #105 @4822f21; API :5297, DB `erpm_audit` (Docker :5433). Evidence local: `.ai/work/qa-be94/` (script + log + ảnh).
- F1 PASS 14/14: nợ 100k + phiếu thu 100k chưa phân bổ → đơn 100k Confirmed (Warning); hủy phiếu → PendingApproval; ứng trước như nhau; phân bổ 60k → chỉ 40k còn lại được trừ (đơn 110k Pending, 100k Confirmed); trả hàng ReduceDebt trừ đúng 1 lần.
- F2 PASS 5/5: POS TaxRate 10, net 1.000.000: TaxAmount 1 → 400 `error.validation.request`; 0 và 100.000 → OK, bút toán Có 3331 100.000, cân. POS qua UI (FE :4297) ghi hóa đơn 200.
- F3 PASS: 45 và 113 thao tác song song (confirm, hóa đơn từ đơn, POS, hủy hóa đơn, nhập kho) cùng khách/mặt hàng/kho: 0 lỗi 5xx, Postgres log 0 `deadlock|40P01` (log API không truy cập được); tồn kho/giữ hàng khớp kỳ vọng; DebtBalance = Σ RemainingDebt; thông báo tồn thấp = số hóa đơn (20/20, 50/50).
- F4 PASS 9/9: đơn VAT 8%+10% + CK dòng + CK đầu phiếu → hóa đơn tổng 295.200 = đơn, VAT dòng lưu đúng (15.200/10.000), bút toán cân Có 3331 25.200; trả nửa dòng 8% refund 97.600, công nợ 295.200→197.600, tồn +1, bút toán trả cân. UI 1366/390: chi tiết đơn + hộp thoại trả hàng hiện dòng hóa đơn, 0 lỗi JS/5xx, không tràn ngang.
- ERPm.Verification (bản archive HEAD): VERIFIED 689 checks, 0 FAIL; đã DROP `erpm_verify_d3112840…`.
- CI: BE#94 verify xanh. Root #105 frontend đỏ do spec SalesAnalytics phụ thuộc ngày ở SD 7f3e631 (không thuộc PR; sửa ở SD 25a0cf9, nhánh thien/so-reason-dialog-title) → cần sync master sau khi fix đó merge.
- Kết luận: BE#94 QA PASS; root #105 QA FAIL chỉ vì CI ngoài phạm vi.
