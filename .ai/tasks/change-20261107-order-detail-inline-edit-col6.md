# Change: Chỉnh sửa trực tiếp trên trang Chi tiết Đơn bán hàng & Chia Header col 6-6

- **Ngày:** 2026-11-07
- **Người thực hiện:** Phạm Hữu Lợi (loipham)
- **Trạng thái:** Done
- **Phạm vi:** Frontend (`ERPm-FE/src/app/modules/SD/orders/order-detail/`)

---

## 1. Yêu cầu & Mục tiêu
- **Yêu cầu người dùng:**
  1. Khi ở trang chi tiết `/sales/orders/:id`, nút "Chỉnh sửa" không mở modal popup nữa mà cho phép chỉnh sửa trực tiếp (inline edit) trên chính trang chi tiết.
  2. Bố cục thông tin Header chia theo định dạng `col 6 - col 6` (2 cột cân đối) để các trường thông tin có độ rộng thoải mái, dễ nhìn và dễ thao tác.
  3. Áp dụng trước cho `sales/orders/:id` để kiểm tra độ ổn định và trải nghiệm người dùng trước khi nhân rộng sang các trang chứng từ khác.
  4. Sửa các nhãn i18n bị hiển thị dạng key thô (`SO.ORDER_DATE`, `SO.EXPECTED_DELIVERY`, `TABLE.SKU`, `TABLE.PRODUCT_NAME`...).

---

## 2. Các thay đổi đã thực hiện
1. **Chế độ Chỉnh sửa Trực tiếp (Inline Edit Mode):**
   - Bổ sung cờ reactive `isEditing = signal<boolean>(false)`.
   - **Chế độ Xem (View Mode):**
     - Nút thao tác: `[✏️ Chỉnh sửa]`, `[🖨️ In hóa đơn]`, `[🛡️ Phê duyệt bảo lãnh]`, `[✓ Xác nhận đơn]`, `[✕ Hủy đơn]`.
     - Header dạng thẻ hiển thị giá trị rõ ràng với badge trạng thái.
     - Bảng Danh mục sản phẩm (Line items) toàn chiều ngang kèm tổng thanh toán.
   - **Chế độ Chỉnh sửa (Edit Mode):**
     - Thanh nút chuyển thành: `[💾 Lưu thay đổi]` (`erpm-btn-primary`) và `[✕ Hủy chỉnh sửa]` (`erpm-btn-secondary`).
     - Có dải banner cảnh báo đang ở chế độ chỉnh sửa.
     - Các trường Header chuyển thành form controls (`<app-form-control>`).
     - Danh mục sản phẩm chuyển thành bảng chỉnh sửa: chọn sản phẩm từ catalog, nhập số lượng, đơn giá, chiết khấu có format tiền tệ (`erpmCurrencyInput`), nút thêm dòng `[➕ Thêm sản phẩm]` và nút xóa dòng `[🗑️]`.
     - Tự động tính toán lại live tổng tiền hàng, chiết khấu và tổng thanh toán.
     - Bấm `[💾 Lưu thay đổi]` gọi `sdService.saveOrder(...)`, cập nhật state và chuyển về Chế độ Xem.
2. **Bố cục Header col 6 - col 6:**
   - Dùng CSS Grid `1fr 1fr` trên tablet/desktop:
     - **Cột trái (col-6):** Khách hàng, Chi nhánh, Kho xuất hàng, Địa chỉ giao hàng.
     - **Cột phải (col-6):** Ngày đặt hàng, Ngày hẹn giao hàng, Nhân viên kinh doanh, Bảng giá áp dụng (và ghi chú).
3. **Từ điển Song ngữ (i18n):**
   - Bổ sung và đồng bộ đầy đủ các key: `so.order_date`, `so.expected_delivery`, `so.branch`, `so.warehouse`, `so.salesperson`, `so.customer`, `so.save_changes`, `so.cancel_edit`, `so.add_line`, `table.sku`, `table.product_name`, `table.quantity`, `table.unit_price`, `so.subtotal`.

---

## 3. Kết quả Kiểm thử
- **FE Build:** `npm run build` đạt 0 error.
- **Unit Tests:** Karma unit tests **151/151 pass 100%**.
- **Dark Mode:** Tương thích hoàn toàn với nền tối, thẻ form controls và bảng dữ liệu.
- **Commit:**
  - SD Submodule: `f6d622c`
  - FE Submodule: `c044667`
