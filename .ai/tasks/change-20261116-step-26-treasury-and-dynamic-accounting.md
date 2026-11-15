# [change] Step 26: Quản lý Dòng tiền (Treasury), Sổ quỹ, Phiếu Thu/Chi & Module Kế toán Tích hợp Động

> **Loại:** change
> **Ngày tạo:** 2026-11-16 · **Người làm:** Lợi (BE), Thiện (FE), Phúc (Lead/Hỗ trợ) · **Người yêu cầu:** Product Owner / Architect
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** [Plan Step 26](../plans/plan-step-26-treasury-and-dynamic-accounting.md) · [Spec nghiệp vụ](../../docs/TREASURY_AND_DYNAMIC_ACCOUNTING_ERP_SPEC.md) · Trello Board `sul5ncJg`
> **Phạm vi:** `ERPm-BE` (Accounting, Treasury, Sales, DB), `ERPm-FE` (ACC, Treasury, SD)

## 1. Mô tả
- Chuẩn hóa phân hệ Quản trị Dòng tiền (Treasury) và Kế toán Tài chính lõi (Financial Accounting):
  - Gỡ bỏ hoàn toàn việc hardcode mã tài khoản kế toán trong `SalesPostingService` (`"511"`, `"111"`, `"112"`, `"131"`, `"632"`, `"156"`).
  - Xây dựng Động cơ Định khoản Động (`DynamicPostingEngine`) theo ma trận cấu hình tài khoản linh hoạt (`AccountPostingProfiles`).
  - Quản lý danh mục Sổ quỹ tiền mặt (`CashFunds`) và Tài khoản ngân hàng (`BankAccounts`).
  - Nghiệp vụ lập và ghi sổ Phiếu Thu tiền (`ReceiptVouchers`), cấn trừ công nợ hóa đơn bán hàng (`Invoice Allocations`), phiếu chi tiền (`PaymentVouchers`), và chuyển tiền nội bộ.
  - Báo cáo phân tích Tuổi nợ (AR Aging), Sổ quỹ chi tiết, Đối chiếu công nợ khách hàng và Sổ Nhật ký chung.

## 2. Phân tích
- Hiện tại `SalesPostingService` tự động sinh `JournalEntry` nhưng số tài khoản bị gán cứng trong code, không thể phân định theo chi nhánh, sổ quỹ hay tài khoản ngân hàng thực tế.
- Bán hàng chỉ ghi nhận nợ trên giấy tờ, chưa có cơ chế thu tiền thực tế để giảm trừ công nợ hóa đơn (`SalesInvoice.RemainingDebt` và `Partner.DebtBalance`).
- Cần mở rộng bảng `Accounts` và tạo các bảng dòng tiền, xây dựng service cấn trừ hóa đơn nguyên tử (Atomic Transaction) bảo đảm bất biến chứng từ đã ghi sổ.

## 3. Features / Milestones
- [x] Feature 1 — Nghiên cứu & lập Đặc tả Nghiệp vụ Dòng tiền & Kế toán động (`docs/TREASURY_AND_DYNAMIC_ACCOUNTING_ERP_SPEC.md`).
- [x] Feature 2 — Lập Kế hoạch triển khai Master Plan Step 26 (`.ai/plans/plan-step-26-treasury-and-dynamic-accounting.md`).
- [x] Feature 3 — Tạo và phân công 7 cards chi tiết tiếng Việt có dấu lên Trello Board (`S26.1` đến `S26.7`).
- [ ] Feature 4 — [S26.1][BE] Schema Database PostgreSQL: Accounts, CashFunds, BankAccounts, Vouchers, PostingProfiles.
- [ ] Feature 5 — [S26.2][BE] Động cơ Định khoản Động (DynamicPostingEngine) & Loại bỏ hardcode tài khoản.
- [ ] Feature 6 — [S26.3][BE] Dịch vụ Dòng tiền: Sổ quỹ, Phiếu Thu/Chi & Động cơ Cấn trừ Hóa đơn (Allocations).
- [ ] Feature 7 — [S26.4][FE] Giao diện Kế toán: Cây Hệ thống Tài khoản (COA) & Ma trận Định khoản Động (ACC).
- [ ] Feature 8 — [S26.5][FE] Giao diện Dòng tiền: Bảng điều khiển Sổ quỹ Tiền mặt & Tài khoản Ngân hàng (Treasury).
- [ ] Feature 9 — [S26.6][FE] Màn hình Lập Phiếu Thu / Phiếu Chi & Lưới cấn trừ Hóa đơn bán hàng.
- [ ] Feature 10 — [S26.7][QA] Báo cáo Phân tích Tuổi nợ (AR Aging), Sổ Nhật ký chung & Kiểm thử E2E Toàn diện.

## 4. Cách làm
- Tạo file đặc tả: `docs/TREASURY_AND_DYNAMIC_ACCOUNTING_ERP_SPEC.md`.
- Tạo file plan: `.ai/plans/plan-step-26-treasury-and-dynamic-accounting.md`.
- Tạo và liên kết 7 cards Trello chi tiết đầy đủ tiếng Việt vào cột `Todo`: S26.1 (`l3r11ivY`), S26.2 (`WBSKAWis`), S26.3 (`DgV7H4DC`), S26.4 (`WFs9vMPB`), S26.5 (`ekyrxBv5`), S26.6 (`9v0e3570`), S26.7 (`wN5cx4jk`).

## 5. Kiểm tra
- Xác nhận cấu trúc schema PostgreSQL, tính toàn vẹn khóa ngoại và quy tắc cân đối Nợ = Có.
- Xác nhận Hợp đồng API đáp ứng đầy đủ nghiệp vụ cho cả BE và FE.
- Xác nhận cả 7 cards đã nằm ở cột `Todo` trên Trello, gán đúng thành viên (Lợi: BE, Thiện: FE, Phúc: Lead/QA).

## 6. Việc còn lại
- Lợi triển khai S26.1, S26.2, S26.3.
- Thiện triển khai S26.4, S26.5, S26.6.
- Phúc lead nghiệm thu S26.7.

## 7. Evidence và cập nhật
- Branch kế hoạch: `master`
- Trello cards:
  - S26.1: https://trello.com/c/l3r11ivY
  - S26.2: https://trello.com/c/WBSKAWis
  - S26.3: https://trello.com/c/DgV7H4DC
  - S26.4: https://trello.com/c/WFs9vMPB
  - S26.5: https://trello.com/c/ekyrxBv5
  - S26.6: https://trello.com/c/9v0e3570
  - S26.7: https://trello.com/c/wN5cx4jk
- Ngày cập nhật: 2026-11-16
