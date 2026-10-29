# Mốc hiện hành — Step 19, 2026-10-29

| Giai đoạn | Trạng thái có bằng chứng |
| --- | --- |
| 1: MVP bán hàng, kho, đối tác, dashboard | Đã ổn định source, 44 kiểm tra PostgreSQL/API và build đạt; chờ nghiệm thu thủ công |
| 1.5 (Step 20): Tổ chức đa cấp, Chức danh & Phân quyền động AWS IAM JSON | Đã có bản kế hoạch chi tiết tại [plan-step-20-iam-dynamic-role-and-organization.md](plans/plan-step-20-iam-dynamic-role-and-organization.md) (Tập đoàn → Công ty → Chi nhánh → Phòng ban → Chức danh → Nhân viên & JSON Policy + DataScope) |
| 2: Mua hàng và sổ quỹ | Có API đơn Draft/Confirmed và nhập mua hạch toán 156/331; chưa có luồng PO–nhận hàng–hóa đơn/thu chi đầy đủ |
| 3: Kế toán tài chính | Có ledger nền tảng; chưa có bộ sổ/báo cáo đầy đủ |
| 4: Native/offline, phân hệ mở rộng | Chưa triển khai |

Ưu tiên tiếp theo: Triển khai **Step 20: Tổ chức đa cấp, Chức danh & Phân quyền động AWS IAM JSON** ([xem kế hoạch chi tiết](plans/plan-step-20-iam-dynamic-role-and-organization.md)) → nghiệm thu MVP/E2E/CI → PUR và thu chi → sổ cái → native/offline. Checklist thiết kế cũ bên dưới thể hiện kế hoạch/lịch sử, không thay thế kết quả nghiệm thu hiện hành.


---

## Tài liệu trước Step 19 — lưu để truy vết

# 🗺️ LỘ TRÌNH PHÁT TRIỂN DỰ ÁN ERPM (MASTER ROADMAP)

Dự án được chia thành các giai đoạn (Phases) theo phương pháp **Lean & Incremental**, bắt đầu từ phiên bản Mini hữu dụng ngay lập tức, tiến dần tới Hệ thống Kế toán - ERP hoàn chỉnh.

---

## 🚀 GIAI ĐOẠN 1: BÁN HÀNG, TỒN KHO, ITEM & KHÁCH HÀNG (MVP - TRỌNG TÂM HIỆN TẠI)
*Mục tiêu: Đưa vào sử dụng thực tế ngay cho cửa hàng / doanh nghiệp vừa & nhỏ để bán hàng, quản lý kho hàng hóa, quản lý khách hàng và xem báo cáo dòng tiền.*

### 📦 Sprint 1.1: Khởi tạo Kiến trúc Lõi & Master Data (ITEM & Partners)
- [ ] Thiết lập Solution .NET 10 Clean Architecture (`Domain`, `Application`, `Infrastructure`, `API`).
- [ ] Cấu hình PostgreSQL với EF Core 8 (Code-First Migrations, Npgsql).
- [ ] Xây dựng Base Entities: `BaseAuditableEntity`, `ISoftDelete`, `ITenant`.
- [ ] **Phân hệ ITEM (Sản phẩm & Dịch vụ):**
  - Entity `Item`: Mã hàng (SKU/Barcode), Tên, Loại (Hàng hóa / Dịch vụ / Combo), Đơn vị tính cơ sở (`UnitOfMeasure`), Đơn vị quy đổi, Giá bán, Giá vốn định mức, Tồn kho tối thiểu/tối đa, Hình ảnh.
  - Phân loại danh mục (`Category` dạng cây phân cấp).
- [ ] **Phân hệ Khách hàng & Đối tác (Partners):**
  - Entity `Partner`: Khách hàng, Nhà cung cấp (hoặc cả hai), Mã, Tên, Số điện thoại, Email, Địa chỉ, Mã số thuế, Hạn mức công nợ.
- [ ] **Phân hệ Đa ngôn ngữ (i18n Localization Engine):**
  - Bảng `app_languages` (`vi`, `en`) và bảng từ điển tập trung `app_dictionaries` (Key-Value theo category).
  - Tích hợp thuộc tính song ngữ `Translations` (JSONB) trên các Entity Master Data (`Item`, `Category`, `UnitOfMeasure`).
  - API `GET /api/v1/localization/{langCode}` phục vụ cache từ điển cho Client.
- [ ] Khởi tạo dự án Frontend Angular + Ionic Framework (Standalone components, Theme, Capacitor ready, tích hợp Translation Service).

### 🏷️ Sprint 1.2: Phân hệ Quản lý Tồn kho (Inventory Core)
- [ ] Entity `Warehouse` (Kho hàng - hỗ trợ nhiều kho).
- [ ] Entity `StockReceipt` (Phiếu nhập kho: Nhập mua NCC, Nhập điều chuyển, Nhập cân bằng kho).
- [ ] Entity `StockIssue` (Phiếu xuất kho: Xuất bán, Xuất trả NCC, Xuất hao hụt).
- [ ] Logic tính tồn kho tức thời (`StockBalance`) và cảnh báo dưới mức an toàn.
- [ ] Nghiệp vụ Kiểm kê kho (`StockInventoryAudit` - kiểm đếm thực tế và xử lý chênh lệch thừa/thiếu).
- [ ] Giao diện Web Desktop & Mobile:
  - Danh sách hàng tồn kho với bộ lọc nhanh.
  - Mobile: Hỗ trợ quét mã vạch bằng camera kiểm tra tồn kho.

### 💰 Sprint 1.3: Phân hệ Bán hàng & Xuất hóa đơn (Sales & Invoicing)
- [ ] Entity `SalesOrder` (Đơn đặt hàng) & `SalesInvoice` (Hóa đơn bán hàng kiêm phiếu xuất).
- [ ] Giao diện POS bán hàng nhanh (Hỗ trợ màn hình cảm ứng & Mobile):
  - Tìm sản phẩm theo tên / quét barcode.
  - Chọn khách hàng, tự động điền giá theo bảng giá / chiết khấu.
  - Tính tiền, chiết khấu hóa đơn, tiền khách đưa, tiền thừa.
  - In hóa đơn (Hỗ trợ khổ in K80 / A4 / A5).
- [ ] Cơ chế tự động trừ tồn kho khi Hóa đơn chuyển sang trạng thái `Posted`.
- [ ] Cơ chế tự động ghi nhận công nợ khách hàng nếu bán nợ.

### 📊 Sprint 1.4: Dashboard & Báo cáo Phân tích (Analytics & Reporting)
- [ ] Dashboard tương tác thời gian thực:
  - Doanh thu hôm nay / tuần này / tháng này.
  - Lợi nhuận gộp ước tính (Doanh thu - Giá vốn).
  - Cảnh báo hàng sắp hết tồn kho.
  - Top 10 sản phẩm bán chạy nhất.
  - Top khách hàng mua nhiều nhất / dư nợ cao nhất.
- [ ] Dapper Query tối ưu hóa hiệu năng biểu đồ (Chart.js / ngx-charts).
- [ ] Xuất báo cáo ra định dạng Excel (ClosedXML / EPPlus).

---

## 📈 GIAI ĐOẠN 2: MUA HÀNG, SỔ QUỸ & CÔNG NỢ CHI TIẾT
*Mục tiêu: Hoàn thiện vòng tròn luân chuyển dòng tiền Bán hàng - Mua hàng - Thu chi.*

- [ ] Phân hệ Mua hàng: Đơn mua hàng (Purchase Order), Nhập mua từ Nhà cung cấp.
- [ ] Phân hệ Sổ quỹ & Ngân hàng:
  - Phiếu thu (Receipt Voucher): Thu tiền bán hàng, thu công nợ, thu khác.
  - Phiếu chi (Payment Voucher): Trả nợ NCC, chi phí vận hành, chi khác.
  - Sổ quỹ tiền mặt (Tiền mặt tại quỹ) và Sổ tiền gửi ngân hàng.
- [ ] Báo cáo Đối chiếu công nợ chi tiết (Tuổi nợ: 0-30 ngày, 31-60 ngày, quá hạn).

---

## 🏛️ GIAI ĐOẠN 3: KẾ TOÁN TÀI CHÍNH MỞ RỘNG (GENERAL LEDGER & FISCAL REPORTING)
*Mục tiêu: Đạt chuẩn Kế toán Việt Nam (Thông tư 200/133) và Quản trị Tài chính chuyên sâu.*

- [ ] Kích hoạt Hệ thống Tài khoản Kế toán (`Chart of Accounts`): 111, 112, 131, 156, 331, 511, 632, 642, 911...
- [ ] Công cụ tự động hạch toán (Auto-Posting Rules) liên kết từ các chứng từ Bán hàng, Mua hàng, Nhập/Xuất kho, Thu/Chi.
- [ ] Sổ Cái (General Ledger), Sổ Nhật ký chung (General Journal).
- [ ] Bảng cân đối phát sinh tài khoản (Trial Balance).
- [ ] Báo cáo Kết quả hoạt động kinh doanh (P&L), Bảng Cân đối kế toán (Balance Sheet).
- [ ] Khóa sổ kế toán theo kỳ (Closing Fiscal Period).

---

## 📱 GIAI ĐOẠN 4: BUILD HYBRID MOBILE APP & OFFLINE SYNC
*Mục tiêu: Đóng gói ứng dụng di động chạy mượt mà trên Android và iOS.*

- [ ] Cấu hình Capacitor (Android Studio, Xcode).
- [ ] Tích hợp Plugin Native: In nhiệt Bluetooth/Wifi (Máy in bill di động), Camera Barcode Scanner, Push Notification.
- [ ] Tối ưu hóa cơ chế Offline Mode (IndexedDB / SQLite local) cho nhân viên bán hàng di động khi mất mạng, tự động đồng bộ khi có Internet.
