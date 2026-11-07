# [fix] Sửa lỗi in trắng trang, thiếu nút Edit, tương phản Dark Mode và định dạng tiền tệ trên Sales

> **Loại:** bug
> **Ngày tạo:** 2026-11-07 · **Người làm:** Lợi Phạm · **Người yêu cầu:** User
> **Trạng thái:** Done
> **Liên quan:** Step 22 (SD), Commit SD: b01fdcd, 908550b · FE: 480b570, 57b837e

## 1. Mô tả
- **In trắng trang:** Khi bấm "In chứng từ" -> "In ngay" trên màn hình `sales/orders`, hộp thoại in của trình duyệt (Chrome/Edge) chỉ hiển thị 1 trang giấy trắng tinh, không có bảng sản phẩm hay thông tin đơn hàng.
- **Không có chỗ Edit đơn hàng:** Đơn hàng khi tạo xong không tìm thấy nút Edit/Chỉnh sửa ở đâu; trạng thái nhảy thẳng sang `Confirmed` thay vì `Draft`.
- **Lỗi Dark Mode:** Khi chuyển giao diện tối, dòng được chọn bị nền trắng chói làm chữ biến mất (white-on-white text), các card chi tiết đơn không đổi màu nền theo theme do thiếu khai báo biến bề mặt, các stepper/badge/dropdown thiếu tương phản.
- **Ô nhập tiền chưa format:** Các ô đơn giá, chiết khấu, thành tiền trong popup tạo/sửa đơn hàng, báo giá và trả hàng hiển thị chuỗi số thô (ví dụ `30500000`) kèm 2 nút mũi tên tăng giảm số (spinner) gây khó nhìn và khó nhập liệu.

## 2. Phân tích nguyên nhân
- **In trắng trang:**
  - Layout ứng dụng (`.app-layout`, `.main-wrapper`, `.page-content`) bị khoá `height: 100vh; overflow: hidden;`. Engine in Chrome quét cây DOM thấy toàn bộ container cha bị overflow hidden và 100vh nên tính chiều cao tài liệu in = 0.
  - `@media print` trong `styles.scss` và modal bị ràng buộc bởi `body * { visibility: hidden }` và `display: none` trên backdrop.
- **Thiếu nút Edit:**
  - `order-detail-drawer.component.html` bị sót nút phát sự kiện `edit.emit(order)`.
  - `sd.service.ts` khi lưu đơn hàng mới tạo gán trạng thái `Confirmed` ngay lập tức, bỏ qua bước khởi tạo `Draft`.
- **Lỗi Dark Mode:**
  - `.selected-row` trong `orders.component.scss` bị hardcode `background-color: #f0fdf4 !important`.
  - `theme/variables.scss` thiếu định nghĩa `--erpm-surface-card` và `--erpm-surface-subtle`.
  - `theme.service.ts` chưa đồng bộ class `dark` trên `<html>` và `<body>`.
- **Ô nhập tiền chưa format:**
  - Form đang dùng `<input type="number">` thuần; trình duyệt không cho phép chèn dấu phân cách hàng nghìn (dấu phẩy/chấm) vào input type number (trình duyệt tự xóa về NaN) và mặc định hiển thị stepper arrows.

## 3. Cách làm
- **Submodule SD (`ERPm-FE-SD`):**
  - `print-preview-dialog.component.ts`: Triển khai Isolated Iframe Printing cho `triggerPrint()`, đưa nội dung hóa đơn vào iframe độc lập kèm CSS in ấn chuyên dụng cho A4/A5/K80.
  - `print-preview-dialog.component.html`: Bỏ `.no-print` trên backdrop, gắn `#paperContent`.
  - `order-detail-drawer.component.html`: Bổ sung nút ✏️ Chỉnh sửa cho trạng thái `Draft`, `PendingApproval`, `Confirmed`.
  - `orders.component.html` & `orders.component.ts`: Thêm cột Thao tác và nút tắt nhanh Sửa/In ở danh sách desktop và thẻ mobile; hỗ trợ `openEdit` và `openPrint` có stopPropagation.
  - `sd.service.ts`: Khởi tạo đơn mới ở trạng thái `Draft` (nếu vượt hạn mức: `PendingApproval`); map đúng tên sản phẩm và khách hàng khi cập nhật.
  - Cập nhật SCSS của `orders`, `order-detail-drawer`, `order-form-dialog`, `print-preview-dialog` dùng toàn bộ design tokens cho dark mode.
  - Chuyển toàn bộ các ô nhập đơn giá, chiết khấu trong `order-form-dialog`, `quotation-form-dialog`, `return-form-dialog` sang `<input type="text" inputmode="numeric" erpmCurrencyInput>` để tự động hiển thị phân cách hàng nghìn.
- **Frontend App (`ERPm-FE`):**
  - `theme/variables.scss`: Khai báo alias `--erpm-surface-card`, `--erpm-surface-subtle`, `--erpm-surface-elevated` cho cả Light và Dark mode.
  - `theme.service.ts`: Thêm `classList.toggle('dark', isDark)` trên `documentElement` và `body`.
  - `styles.scss`: Thêm CSS reset print media (`height: auto !important; overflow: visible !important`), class tiện ích dark mode, và CSS ẩn mũi tên tăng giảm (stepper spinners) trên toàn bộ input number.
  - `CurrencyInputDirective` (`ERPm-FE/src/app/shared/directives/currency-input.directive.ts`): Xây dựng directive chuẩn định dạng tiền tệ (phân cách hàng nghìn `100,000,000`), lắng nghe gõ phím/paste/focus/blur và giữ nguyên giá trị `number` cho `FormControl`.
  - Tích hợp `CurrencyInputDirective` vào component dùng chung `input-control.component` cho `type="currency"`.

## 4. Kiểm tra
- `npm run build` trên `ERPm-FE`: 0 error, build thành công 100%.
- Kiểm tra isolated print: Khung in của trình duyệt nhận đúng bảng dữ liệu A4/A5/K80, không còn trang trắng.
- Kiểm tra Edit: Nút Chỉnh sửa hiển thị đầy đủ, bấm mở dialog cho phép sửa số lượng, giá và lưu thành công.
- Kiểm tra Dark Mode: Dòng chọn, stepper, badge và select dropdown đều có độ tương phản chuẩn.
- Kiểm tra định dạng tiền tệ: Đơn giá và chiết khấu hiển thị dạng `30,500,000`, tự động format khi gõ, không còn mũi tên stepper, dữ liệu submit form giữ nguyên chuẩn `number`.

## 5. Việc còn lại
- Không.
