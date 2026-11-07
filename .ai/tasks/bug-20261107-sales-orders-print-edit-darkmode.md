# [fix] Sửa lỗi in trắng trang, thiếu nút Edit và tương phản Dark Mode trên Sales Orders

> **Loại:** bug
> **Ngày tạo:** 2026-11-07 · **Người làm:** Lợi Phạm · **Người yêu cầu:** User
> **Trạng thái:** Done
> **Liên quan:** Step 22 (SD), Commit SD: b01fdcd, FE: 480b570

## 1. Mô tả
- **In trắng trang:** Khi bấm "In chứng từ" -> "In ngay" trên màn hình `sales/orders`, hộp thoại in của trình duyệt (Chrome/Edge) chỉ hiển thị 1 trang giấy trắng tinh, không có bảng sản phẩm hay thông tin đơn hàng.
- **Không có chỗ Edit đơn hàng:** Đơn hàng khi tạo xong không tìm thấy nút Edit/Chỉnh sửa ở đâu; trạng thái nhảy thẳng sang `Confirmed` thay vì `Draft`.
- **Lỗi Dark Mode:** Khi chuyển giao diện tối, dòng được chọn bị nền trắng chói làm chữ biến mất (white-on-white text), các card chi tiết đơn không đổi màu nền theo theme do thiếu khai báo biến bề mặt, các stepper/badge/dropdown thiếu tương phản.

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

## 3. Cách làm
- **Submodule SD (`ERPm-FE-SD`):**
  - `print-preview-dialog.component.ts`: Triển khai Isolated Iframe Printing cho `triggerPrint()`, đưa nội dung hóa đơn vào iframe độc lập kèm CSS in ấn chuyên dụng cho A4/A5/K80.
  - `print-preview-dialog.component.html`: Bỏ `.no-print` trên backdrop, gắn `#paperContent`.
  - `order-detail-drawer.component.html`: Bổ sung nút ✏️ Chỉnh sửa cho trạng thái `Draft`, `PendingApproval`, `Confirmed`.
  - `orders.component.html` & `orders.component.ts`: Thêm cột Thao tác và nút tắt nhanh Sửa/In ở danh sách desktop và thẻ mobile; hỗ trợ `openEdit` và `openPrint` có stopPropagation.
  - `sd.service.ts`: Khởi tạo đơn mới ở trạng thái `Draft` (nếu vượt hạn mức: `PendingApproval`); map đúng tên sản phẩm và khách hàng khi cập nhật.
  - Cập nhật SCSS của `orders`, `order-detail-drawer`, `order-form-dialog`, `print-preview-dialog` dùng toàn bộ design tokens cho dark mode.
- **Frontend App (`ERPm-FE`):**
  - `theme/variables.scss`: Khai báo alias `--erpm-surface-card`, `--erpm-surface-subtle`, `--erpm-surface-elevated` cho cả Light và Dark mode.
  - `theme.service.ts`: Thêm `classList.toggle('dark', isDark)` trên `documentElement` và `body`.
  - `styles.scss`: Thêm CSS reset print media (`height: auto !important; overflow: visible !important`) và các class tiện ích tương phản Dark Mode.

## 4. Kiểm tra
- `npm run build` trên `ERPm-FE`: 0 error, build thành công 100%.
- Kiểm tra isolated print: Khung in của trình duyệt nhận đúng bảng dữ liệu A4/A5/K80, không còn trang trắng.
- Kiểm tra Edit: Nút Chỉnh sửa hiển thị đầy đủ, bấm mở dialog cho phép sửa số lượng, giá và lưu thành công.
- Kiểm tra Dark Mode: Dòng chọn, stepper, badge và select dropdown đều có độ tương phản chuẩn.

## 5. Việc còn lại
- Không.
