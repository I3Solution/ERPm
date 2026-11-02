# 📝 Step Log: Step 22 — Phân hệ Bán hàng & Phân phối Doanh nghiệp (Enterprise SD Frontend)

> **Người thực hiện:** Phạm Hữu Lợi (`loipham`)  
> **Thời gian:** 2026-11-02  
> **Nhánh thực hiện:** `loipham/s22-sd-frontend` (Áp dụng đồng bộ trên cả repo root, `ERPm-FE`, `ERPm-FE-SD` và `ERPm-BE`)  
> **Nhiệm vụ thực hiện:** Hoàn thành toàn diện mục 4.3 trong `.ai/plans/plan-step-22-enterprise-sales-distribution.md` (FE-22.1 đến FE-22.8).  

---

## 🎯 1. Mục tiêu Step

Triển khai trọn vẹn toàn bộ các màn hình, DTO Interfaces, Mock Services và mẫu in ấn chuẩn doanh nghiệp cho Phân hệ Bán hàng & Phân phối (Enterprise Sales & Distribution - SD) theo phương pháp **Contract-First**:
1. **FE-22.1 (TypeScript Interfaces & Mock Engine):** Dựng đầy đủ các Interface mô hình dữ liệu DTO bám sát 100% API Contract của Step 22 (`sd.models.ts`) và dịch vụ xử lý dữ liệu với Signal state reactive (`sd.service.ts`), có kho dữ liệu mẫu phong phú và cơ chế chuyển đổi transparent giữa Mock Service và Backend API thật (`useMock`).
2. **FE-22.2 (Quản lý Bảng giá & Chiết khấu - Price Lists):**
   - Màn hình Quản lý Bảng giá (`PriceListsComponent`) với thiết kế Adaptive Responsive: Bảng dữ liệu lớn đa tiêu chí trên Desktop và Card rút gọn trên Mobile.
   - Hộp thoại Tạo/Sửa Bảng giá (`PriceListFormDialogComponent`) sử dụng chuẩn `FormGroup` (`ReactiveFormsModule`) kết hợp `<app-form-control>`.
   - Lưới cấu hình Mặt hàng & Bậc thang Số lượng (`PriceListItemsComponent`): Bậc thang lũy tiến số lượng (Quantity Tiers: ≥1, ≥10, ≥50...), tính tỷ lệ chiết khấu và đơn giá tương ứng.
   - Công cụ Mô phỏng Tính giá Tự động (`PricingSimulatorDialogComponent`): Kiểm tra trực quan thuật toán tính giá tối ưu theo khách hàng, chi nhánh, mặt hàng và số lượng mua.
3. **FE-22.3 (Báo giá Khách hàng - Sales Quotations):**
   - Màn hình Quản lý Báo giá (`QuotationsComponent`) hỗ trợ lọc theo trạng thái (`Draft`, `Sent`, `Accepted`, `Rejected`, `Converted`, `Expired`).
   - Hộp thoại Lập Báo giá (`QuotationFormDialogComponent`) với `FormArray` linh hoạt, tự động tính tổng tiền, chiết khấu và điều khoản bảo hành.
   - Drawer Chi tiết Báo giá (`QuotationDetailDrawerComponent`) tích hợp: Gửi email cho khách, In ấn báo giá A4 chuyên nghiệp, và tính năng **1-Click Chuyển đổi Báo giá thành Đơn bán hàng (Convert to Order)**.
4. **FE-22.4 (Đơn bán hàng & Phê duyệt - Sales Orders):**
   - Màn hình Quản lý Đơn bán hàng (`OrdersComponent`) với Stepper hiển thị trạng thái trực quan: `Draft` ➔ `PendingApproval` ➔ `Confirmed` ➔ `Processing` ➔ `Completed`.
   - Cảnh báo Vượt Hạn mức Tín dụng (Credit Limit Check Warning Banner): Cảnh báo màu vàng nổi bật khi đơn làm vượt hạn mức nợ của khách hàng, tích hợp nút "Phê duyệt bảo lãnh" (`sd:order:approve_credit`).
   - Chỉ báo Giữ chỗ tồn kho khả dụng (Stock Reservation Indicator `🔒 Đã giữ tồn kho`).
   - Hộp thoại Tạo/Sửa đơn (`OrderFormDialogComponent`) và Drawer Chi tiết đơn (`OrderDetailDrawerComponent`).
5. **FE-22.5 (Trả hàng bán & Giảm trừ công nợ - Sales Returns):**
   - Màn hình Quản lý Trả hàng bán (`ReturnsComponent`).
   - Hộp thoại Lập Phiếu Trả hàng (`ReturnFormDialogComponent`): Chọn hóa đơn gốc hoặc khách hàng, kho nhận hàng hoàn, hình thức hoàn tiền (Tiền mặt, Chuyển khoản, Giảm trừ công nợ).
   - Drawer Chi tiết Phiếu trả (`ReturnDetailDrawerComponent`): Hiển thị thông tin tự động sinh Phiếu nhập kho hoàn hàng và Bút toán đảo doanh thu/giảm nợ (Nợ 521 / Có 131/111).
6. **FE-22.6 (Mẫu In ấn Doanh nghiệp Chuẩn - Print Preview):**
   - Component xem trước và in chứng từ (`PrintPreviewDialogComponent`) hỗ trợ chuyển đổi linh hoạt 3 khuôn in:
     - **K80 (Thermal Receipt):** In bill POS bán lẻ 80mm.
     - **A4 (Invoice & Quotation):** Bản in Báo giá thương mại & Hóa đơn VAT chuẩn quy chuẩn có tiêu đề công ty, bảng chi tiết và 3 ô ký duyệt.
     - **A5 (Delivery Slip):** Phiếu xuất kho kiêm giao hàng / Biên bản trả hàng nhỏ gọn.
     - Tích hợp lệnh in trực tiếp qua `@media print` CSS chuẩn.
7. **FE-22.7 (Đa ngôn ngữ i18n):**
   - Đồng bộ 100% từ điển song ngữ VI/EN cho tất cả các nhãn, trạng thái, cảnh báo và mã lỗi SD trong cả `system.json` (FE) và `system_dictionary.json` (BE).
8. **FE-22.8 (Điều hướng & Routing):**
   - Bổ sung các Route chuẩn `/sales/price-lists`, `/sales/quotations`, `/sales/orders`, `/sales/returns` có bảo vệ bằng `permissionGuard()`.
   - Tích hợp menu điều hướng phân hệ Bán hàng vào Sidebar Navigation Desktop.

---

## 📁 2. Danh sách Files Tạo mới & Chỉnh sửa

### Repo con `ERPm-FE/src/app/modules/SD` (Submodule SD):
- **Tạo mới:**
  - `price-lists/price-lists.component.ts`
  - `price-lists/price-lists.component.html`
  - `price-lists/price-lists.component.scss`
  - `price-lists/price-lists.component.spec.ts`
  - `price-lists/components/price-list-form-dialog/price-list-form-dialog.component.ts`
  - `price-lists/components/price-list-form-dialog/price-list-form-dialog.component.html`
  - `price-lists/components/price-list-form-dialog/price-list-form-dialog.component.scss`
  - `price-lists/components/price-list-items/price-list-items.component.ts`
  - `price-lists/components/price-list-items/price-list-items.component.html`
  - `price-lists/components/price-list-items/price-list-items.component.scss`
  - `price-lists/components/pricing-simulator-dialog/pricing-simulator-dialog.component.ts`
  - `price-lists/components/pricing-simulator-dialog/pricing-simulator-dialog.component.html`
  - `price-lists/components/pricing-simulator-dialog/pricing-simulator-dialog.component.scss`
  - `quotations/quotations.component.ts`
  - `quotations/quotations.component.html`
  - `quotations/quotations.component.scss`
  - `quotations/quotations.component.spec.ts`
  - `quotations/components/quotation-form-dialog/quotation-form-dialog.component.ts`
  - `quotations/components/quotation-form-dialog/quotation-form-dialog.component.html`
  - `quotations/components/quotation-form-dialog/quotation-form-dialog.component.scss`
  - `quotations/components/quotation-detail-drawer/quotation-detail-drawer.component.ts`
  - `quotations/components/quotation-detail-drawer/quotation-detail-drawer.component.html`
  - `quotations/components/quotation-detail-drawer/quotation-detail-drawer.component.scss`
  - `orders/orders.component.ts`
  - `orders/orders.component.html`
  - `orders/orders.component.scss`
  - `orders/orders.component.spec.ts`
  - `orders/components/order-form-dialog/order-form-dialog.component.ts`
  - `orders/components/order-form-dialog/order-form-dialog.component.html`
  - `orders/components/order-form-dialog/order-form-dialog.component.scss`
  - `orders/components/order-detail-drawer/order-detail-drawer.component.ts`
  - `orders/components/order-detail-drawer/order-detail-drawer.component.html`
  - `orders/components/order-detail-drawer/order-detail-drawer.component.scss`
  - `returns/returns.component.ts`
  - `returns/returns.component.html`
  - `returns/returns.component.scss`
  - `returns/returns.component.spec.ts`
  - `returns/components/return-form-dialog/return-form-dialog.component.ts`
  - `returns/components/return-form-dialog/return-form-dialog.component.html`
  - `returns/components/return-form-dialog/return-form-dialog.component.scss`
  - `returns/components/return-detail-drawer/return-detail-drawer.component.ts`
  - `returns/components/return-detail-drawer/return-detail-drawer.component.html`
  - `returns/components/return-detail-drawer/return-detail-drawer.component.scss`
  - `print-preview/print-preview-dialog/print-preview-dialog.component.ts`
  - `print-preview/print-preview-dialog/print-preview-dialog.component.html`
  - `print-preview/print-preview-dialog/print-preview-dialog.component.scss`

### Repo `ERPm-FE`:
- **Tạo mới:**
  - `src/app/core/models/sd.models.ts`: Interface hợp đồng API Contract Step 22.
  - `src/app/core/services/sd.service.ts`: Service Signal state reactive + Mock Engine.
- **Chỉnh sửa:**
  - `src/app/app.routes.ts`: Bổ sung route phân hệ Bán hàng & Phân phối.
  - `src/app/app.component.html`: Bổ sung điều hướng sidebar menu.
  - `src/assets/i18n/system.json`: Cập nhật bộ từ điển VI/EN cho phân hệ SD.

### Repo `ERPm-BE`:
- **Chỉnh sửa:**
  - `src/ERPm.Infrastructure/Persistence/Seeders/system_dictionary.json`: Đồng bộ các khóa từ điển VI/EN.

### Repo root `ERPm`:
- **Tạo mới:**
  - `.ai/steps/step-22-enterprise-sales-distribution-fe.md`
- **Chỉnh sửa:**
  - `.ai/plans/plan-step-22-enterprise-sales-distribution.md`: Đánh dấu hoàn thành các task mục 4.3 (FE-22.1 đến FE-22.8).
  - `.ai/status.md`: Cập nhật trạng thái mục Completed.

---

## ⚡ 3. Các Lệnh Đã Thực Thi & Kết quả Kiểm thử (Verification)

1. **Frontend Production Build:**
   ```bash
   cd ERPm-FE
   npm.cmd run build
   ```
   *Kết quả:* Build thành công **0 lỗi** (`Application bundle generation complete`, xuất xưởng đầy đủ các lazy chunks: `price-lists-component`, `quotations-component`, `orders-component`, `returns-component`).

2. **Frontend Karma Unit Tests:**
   ```bash
   cd ERPm-FE
   npm.cmd test -- --watch=false --browsers=ChromeHeadless
   ```
   *Kết quả:* **132/132 tests PASS 100%** (tăng từ 116 lên 132 tests, bao gồm test cho toàn bộ component Bảng giá, Báo giá, Đơn bán hàng và Trả hàng).

3. **Backend Solution Build:**
   ```bash
   dotnet build ERPm-BE/ERPm.sln
   ```
   *Kết quả:* Build thành công **0 Warning / 0 Error** trên toàn bộ các project `.Domain`, `.Application`, `.Infrastructure`, `.API`, `.Verification` và `.Hrm.Verification`.

---

## 🚀 4. Hướng đi cho Step tiếp theo

1. Thiện (BE) triển khai các DB Migrations và Controller/Service cho Phase 22.1 -> 22.5 theo đúng Contract đã cam kết.
2. Khi Backend hoàn thành, chỉ cần đổi cờ `useMock` sang `false` trong `SdService` để kết nối trực tiếp với API thật.
