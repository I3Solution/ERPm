# Step 26 — Quản lý Dòng tiền (Treasury), Sổ quỹ, Phiếu Thu/Chi & Module Kế toán Tích hợp Động

> **Ngày lập:** 2026-11-16 · **Người yêu cầu:** Product Owner / Architect · **Kế hoạch & Hỗ trợ chung:** Phúc  
> **Trạng thái:** Sẵn sàng triển khai (Ready for Execution)  
> **Tài liệu đặc tả nghiệp vụ:** [TREASURY_AND_DYNAMIC_ACCOUNTING_ERP_SPEC.md](../../docs/TREASURY_AND_DYNAMIC_ACCOUNTING_ERP_SPEC.md)  
> **Phân công nòng cốt:** Lợi (Dev chính Backend) · Thiện (Dev chính Frontend) · Phúc (Hỗ trợ, Báo cáo & Verification)

---

## 1. MỤC TIÊU VÀ PHẠM VI

1. **Gỡ bỏ triệt để hardcode tài khoản (Dynamic Account Posting Engine):**
   - Thay thế toàn bộ mã tài khoản gán cứng (`"511"`, `"111"`, `"112"`, `"131"`, `"632"`, `"156"`) trong `SalesPostingService` bằng cơ chế ma trận định khoản tự động (`AccountPostingProfiles`).
   - Hỗ trợ đa chi nhánh độc lập, đa tài khoản ngân hàng và phân loại đối tác đa chiều.
2. **Quản trị Dòng tiền & Sổ quỹ (Treasury, Cash & Bank):**
   - Quản lý danh mục Sổ quỹ tiền mặt (`CashFunds`) và Tài khoản ngân hàng (`BankAccounts`) theo từng chi nhánh.
   - Phiếu Thu (`ReceiptVouchers`): Thu nợ bán hàng, thu tạm ứng, thu hoàn ứng, thu khác. Tích hợp động cơ cấn trừ hóa đơn (`Invoice Allocation`) linh hoạt.
   - Phiếu Chi (`PaymentVouchers`): Chi trả nợ NCC, chi tạm ứng, chi phí hoạt động, nộp thuế.
   - Chuyển tiền nội bộ (`Internal Cash Transfer`): Nộp tiền mặt vào ngân hàng và rút tiền gửi về nhập quỹ.
3. **Nguyên tắc Kế toán Kép & Tính Bất biến:**
   - Cân bằng bút toán sổ cái $\sum \text{Debit} = \sum \text{Credit}$.
   - Khóa sửa chứng từ đã ghi sổ (`Posted`); hỗ trợ hủy/đảo bút toán (`Reverse / Void`) bảo toàn vết kiểm toán.
4. **Báo cáo Tài chính & Đối chiếu Công nợ:**
   - Sổ quỹ tiền mặt, Sổ phụ ngân hàng, Báo cáo phân tích Tuổi nợ (AR Aging), Bảng đối chiếu công nợ đối tác, Sổ Nhật ký chung (General Journal).

---

## 2. PHÂN CHIA NHIỆM VỤ (TASK BREAKDOWN)

> **Cơ chế phân công:** Lợi đảm nhận toàn bộ tầng Backend (Database PostgreSQL, Migration, DynamicPostingEngine, Treasury Services); Thiện đảm nhận toàn bộ tầng Frontend (ACC Chart of Accounts, Treasury Sổ quỹ, Màn hình Phiếu Thu/Chi); Phúc hỗ trợ kiến trúc, xây dựng báo cáo phân tích công nợ và lead nghiệm thu.

| Mã Task | Phân hệ / Tầng | Người phụ trách chính | Hỗ trợ | Tên công việc & Nội dung cốt lõi |
| :--- | :--- | :--- | :--- | :--- |
| **S26.1** | BE (Domain / DB) | **Lợi** (Dev chính BE) | Phúc | **Schema Database PostgreSQL: Hệ thống Tài khoản (COA), Sổ quỹ, Ngân hàng & Phiếu Thu/Chi**: Mở rộng bảng `Accounts` (`Nature`, `IsPostable`, `TrackPartner`), tạo các bảng `CashFunds`, `BankAccounts`, `ReceiptVouchers`, `ReceiptVoucherAllocations`, `PaymentVouchers`, `AccountPostingProfiles`. Migration PostgreSQL an toàn dữ liệu. |
| **S26.2** | BE (Service / Core) | **Lợi** (Dev chính BE) | Phúc | **Động cơ Định khoản Động (DynamicPostingEngine) & Ma trận Cấu hình**: Xây dựng service tra cứu cặp tài khoản Nợ/Có theo ma trận điều kiện, tái cấu trúc `SalesPostingService` loại bỏ hoàn toàn hardcode tài khoản, bảo đảm tính cân đối kép $\sum \text{Debit} = \sum \text{Credit}$. |
| **S26.3** | BE (Treasury Service)| **Lợi** (Dev chính BE) | Phúc | **Dịch vụ Dòng tiền: Sổ quỹ, Phiếu Thu/Chi & Động cơ Cấn trừ Hóa đơn**: Nghiệp vụ lập và ghi sổ Phiếu Thu/Chi, cơ chế cấn trừ hóa đơn FIFO / chỉ định đích danh, cập nhật `DebtBalance` và `RemainingDebt`, tính năng Hủy/Đảo bút toán (Reverse Voucher). |
| **S26.4** | FE (ACC Module) | **Thiện** (Dev chính FE) | Phúc | **Giao diện Kế toán: Cây Hệ thống Tài khoản (COA) & Ma trận Định khoản Động**: Màn hình quản lý danh mục tài khoản dạng cây phân cấp (Cấp 1 ➔ Cấp 2 ➔ Cấp lá), giao diện thiết lập ma trận định khoản tự động cho các phân hệ SD, PUR, Kho, Dòng tiền. |
| **S26.5** | FE (Treasury Module) | **Thiện** (Dev chính FE) | Phúc | **Giao diện Dòng tiền: Bảng điều khiển Sổ quỹ Tiền mặt & Tài khoản Ngân hàng**: Dashboard hiển thị danh sách các quỹ tiền mặt, tài khoản ngân hàng, số dư tức thời, lịch sử giao dịch thu chi trong kỳ, chức năng chuyển tiền nội bộ. |
| **S26.6** | FE (Treasury Vouchers)| **Thiện** (Dev chính FE) | Phúc | **Màn hình Lập Phiếu Thu / Phiếu Chi & Cấn trừ Hóa đơn**: Form lập phiếu thu tiền mặt/chuyển khoản, lưới chọn hóa đơn bán hàng để phân bổ cấn trừ công nợ, xem chi tiết bút toán hạch toán Nợ/Có, in phiếu thu/chi chuẩn A4/A5. |
| **S26.7** | QA / Verification | **Phúc** (Lead nghiệm thu) | Thiện, Lợi | **Báo cáo Phân tích Tuổi nợ (AR Aging), Sổ Nhật ký chung & Kiểm thử E2E Toàn diện**: Báo cáo tuổi nợ đa tầng (0-30, 31-60, 90+ ngày), Sổ quỹ, Đối chiếu công nợ; bộ test tự động kiểm tra cân đối sổ cái và bảo toàn tính bất biến của chứng từ. |

---

## 3. HỢP ĐỒNG API CHI TIẾT (API CONTRACT)

> **Quy ước:** Base URL `/api/v1`, Bearer JWT Authentication, chuẩn Response bọc `ApiResponse<T>`.  
> Chi tiết toàn bộ request/response payload xem tại [TREASURY_AND_DYNAMIC_ACCOUNTING_ERP_SPEC.md#6-hợp-đồng-api-chi-tiết-api-contract](../../docs/TREASURY_AND_DYNAMIC_ACCOUNTING_ERP_SPEC.md#6-hợp-đồng-api-chi-tiết-api-contract).

### 3.1. Bảng phân định Endpoints cho các Task

| Mã Task | Method | Endpoint URL | Quyền (Permission) | Mô tả tóm tắt | DTO Request / Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S26.1 & S26.4** | `GET` | `/accounting/accounts` | `acc:account:view` | Lấy cây danh mục tài khoản kế toán | `AccountDto[]` |
| **S26.1 & S26.4** | `POST`| `/accounting/accounts` | `acc:account:manage` | Tạo tài khoản kế toán mới | `CreateAccountRequest` ➔ `AccountDto` |
| **S26.2 & S26.4** | `GET` | `/accounting/posting-profiles` | `acc:profile:view` | Danh sách ma trận định khoản tự động | `PostingProfileDto[]` |
| **S26.2 & S26.4** | `POST`| `/accounting/posting-profiles` | `acc:profile:manage` | Cấu hình cặp TK Nợ/Có cho giao dịch | `SavePostingProfileRequest` |
| **S26.1 & S26.5** | `GET` | `/treasury/cash-funds` | `treasury:fund:view` | Danh sách sổ quỹ tiền mặt và số dư | `CashFundDto[]` |
| **S26.1 & S26.5** | `POST`| `/treasury/cash-funds` | `treasury:fund:manage` | Tạo sổ quỹ tiền mặt cho chi nhánh | `CreateCashFundRequest` |
| **S26.1 & S26.5** | `GET` | `/treasury/bank-accounts` | `treasury:bank:view` | Danh sách tài khoản ngân hàng và số dư | `BankAccountDto[]` |
| **S26.1 & S26.5** | `POST`| `/treasury/bank-accounts` | `treasury:bank:manage` | Thêm tài khoản ngân hàng | `CreateBankAccountRequest` |
| **S26.3 & S26.6** | `GET` | `/treasury/receipt-vouchers` | `treasury:receipt:view` | Danh sách phiếu thu (phân trang, lọc) | `PagedResult<ReceiptVoucherDto>` |
| **S26.3 & S26.6** | `GET` | `/treasury/receipt-vouchers/{id}` | `treasury:receipt:view`| Chi tiết phiếu thu (kèm cấn trừ & sổ cái)| `ReceiptVoucherDetailDto` |
| **S26.3 & S26.6** | `POST`| `/treasury/receipt-vouchers` | `treasury:receipt:create`| Lập và ghi sổ phiếu thu | `CreateReceiptVoucherRequest` |
| **S26.3 & S26.6** | `POST`| `/treasury/receipt-vouchers/{id}/reverse`| `treasury:receipt:reverse`| Hủy / Đảo phiếu thu (phục hồi công nợ) | `ReverseVoucherRequest` |
| **S26.3 & S26.6** | `GET` | `/treasury/payment-vouchers` | `treasury:payment:view` | Danh sách phiếu chi | `PagedResult<PaymentVoucherDto>` |
| **S26.3 & S26.6** | `GET` | `/treasury/payment-vouchers/{id}` | `treasury:payment:view`| Chi tiết phiếu chi | `PaymentVoucherDetailDto` |
| **S26.3 & S26.6** | `POST`| `/treasury/payment-vouchers` | `treasury:payment:create`| Lập và ghi sổ phiếu chi | `CreatePaymentVoucherRequest` |
| **S26.3 & S26.6** | `POST`| `/treasury/payment-vouchers/{id}/reverse`| `treasury:payment:reverse`| Hủy / Đảo phiếu chi | `ReverseVoucherRequest` |
| **S26.7** | `GET` | `/accounting/reports/cash-book` | `acc:report:view` | Sổ quỹ chi tiết Thu/Chi/Tồn | `CashBookReportDto` |
| **S26.7** | `GET` | `/accounting/reports/ar-aging` | `acc:report:view` | Báo cáo tuổi nợ khách hàng | `ArAgingReportDto[]` |
| **S26.7** | `GET` | `/accounting/reports/partner-statement` | `acc:report:view` | Đối chiếu công nợ chi tiết đối tác | `PartnerStatementDto` |
| **S26.7** | `GET` | `/accounting/reports/general-journal` | `acc:report:view` | Sổ Nhật ký chung toàn hệ thống | `PagedResult<JournalEntryDto>` |

---

## 4. TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

1. **Động cơ Kế toán Động:**
   - Tuyệt đối không còn hardcode mã tài khoản trong `SalesPostingService` và các service khác.
   - Thêm tài khoản ngân hàng mới hoặc chi nhánh mới tự động nhận đúng tài khoản kế toán mà không cần sửa code.
   - Toàn bộ bút toán sinh ra đảm bảo $\sum \text{Debit} = \sum \text{Credit}$.
2. **Dòng tiền & Công nợ:**
   - Lập Phiếu Thu tiền mặt hoặc chuyển khoản cấn trừ chính xác công nợ từng hóa đơn (`RemainingDebt`) và tổng nợ khách hàng (`DebtBalance`).
   - Hủy/đảo phiếu thu tự động phục hồi lại đúng công nợ cũ và đảo ngược dòng tiền trên sổ quỹ.
   - Báo cáo tuổi nợ (AR Aging) phân loại chính xác các mốc hạn nợ.
3. **Kỹ thuật & CI/CD:**
   - `dotnet test` và `npm test` đạt 100% SUCCESS.
   - Tuân thủ quy tắc Git: branch cá nhân `loipham/*`, `thien/*`, `phuc/*`.

---

## 5. TIẾN ĐỘ THEO DÕI & TRELLO CARDS

| Mã Task | Trạng thái | Phụ trách chính | Hỗ trợ / Phối hợp | Trello Card |
| :--- | :--- | :--- | :--- | :--- |
| **S26.1** | Todo | **Lợi** (Dev chính BE) | Phúc | https://trello.com/c/l3r11ivY |
| **S26.2** | Todo | **Lợi** (Dev chính BE) | Phúc | https://trello.com/c/WBSKAWis |
| **S26.3** | Todo | **Lợi** (Dev chính BE) | Phúc | https://trello.com/c/DgV7H4DC |
| **S26.4** | Todo | **Thiện** (Dev chính FE) | Phúc | https://trello.com/c/WFs9vMPB |
| **S26.5** | Todo | **Thiện** (Dev chính FE) | Phúc | https://trello.com/c/ekyrxBv5 |
| **S26.6** | Todo | **Thiện** (Dev chính FE) | Phúc | https://trello.com/c/9v0e3570 |
| **S26.7** | Todo | **Phúc** (Lead nghiệm thu) | Thiện, Lợi | https://trello.com/c/wN5cx4jk |
