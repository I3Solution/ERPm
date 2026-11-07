# Change: Định dạng Ngày giờ dd/MM/yyyy HH:mm & Mở rộng Chỉnh sửa Trực tiếp (Inline Edit) Col 6-6 cho toàn bộ Chứng từ SD

- **Ngày:** 2026-11-07
- **Người thực hiện:** Phạm Hữu Lợi (loipham)
- **Trạng thái:** Done
- **Phạm vi:** Frontend (`ERPm-FE/src/app/shared/components/input-control/`, `ERPm-FE/src/app/modules/SD/`)

---

## 1. Yêu cầu & Mục tiêu
- **Yêu cầu người dùng:**
  1. Các ô nhập định dạng ngày trong hệ thống phải được định dạng theo chuẩn đầy đủ ngày giờ: `dd/MM/yyyy HH:mm`.
  2. Nhân rộng mô hình Chỉnh sửa trực tiếp (Inline Editing) không qua popup modal và bố cục Header chia 2 cột cân đối `col 6 - col 6` từ trang Đơn bán hàng sang toàn bộ các trang chi tiết còn lại trong phân hệ Bán hàng & Phân phối (SD):
     - **Báo giá:** `sales/quotations/:id` (`QuotationDetailComponent`)
     - **Trả hàng bán:** `sales/returns/:id` (`ReturnDetailComponent`)
     - **Bảng giá:** `sales/price-lists/:id` (`PriceListDetailComponent`)
     - **Đơn bán hàng:** `sales/orders/:id` (`OrderDetailComponent`) - cập nhật định dạng hiển thị `expectedDeliveryDate | date:'dd/MM/yyyy HH:mm'`.

---

## 2. Các thay đổi đã thực hiện

1. **Chuẩn hóa Ô nhập Ngày giờ (`InputControlComponent` & `FormControlComponent`):**
   - Mở rộng `InputControlType` hỗ trợ thêm `'datetime'` và `'datetime-local'`.
   - Đối với các input loại `'date'`, `'datetime'`, `'datetime-local'`:
     - Render input native `datetime-local` kết hợp hàm `formattedDateTimeValue()` để chuyển đổi mượt mà giữa ISO string, Date object và định dạng DOM `YYYY-MM-DDTHH:mm`.
     - Trình duyệt tự động hiển thị và định dạng theo chuẩn `dd/MM/yyyy HH:mm` kèm bộ chọn lịch và giờ phút.
     - Đồng bộ 2 chiều dữ liệu thông qua `ControlValueAccessor` (`(input)="onDateTimeInputChange($event)"`).

2. **Cập nhật Trang Chi tiết Đơn bán hàng (`sales/orders/:id`):**
   - Định dạng `expectedDeliveryDate` ở cả View Mode và Edit Mode thành `dd/MM/yyyy HH:mm`.

3. **Mở rộng Chỉnh sửa trực tiếp (Inline Edit) & Header Col 6-6 cho Báo giá (`sales/quotations/:id`):**
   - Loại bỏ mở popup modal khi bấm nút `[✏️ Chỉnh sửa]`, chuyển sang chế độ inline edit trực tiếp trên trang chi tiết.
   - Header dạng 2 cột cân đối `col 6 - col 6`:
     - Cột trái: Khách hàng (`customerId`), Chi nhánh (`branchId`), Bảng giá áp dụng (`priceListId`).
     - Cột phải: Ngày lập báo giá (readonly `dd/MM/yyyy HH:mm`), Hiệu lực đến (`validUntil` định dạng `dd/MM/yyyy HH:mm`), Điều khoản thanh toán (`termsAndConditions`), Ghi chú (`notes`).
   - Bảng sản phẩm chuyển sang chế độ lưới nhập liệu linh hoạt: chọn sản phẩm từ catalog, chỉnh sửa số lượng, đơn giá (`erpmCurrencyInput`), chiết khấu (`erpmCurrencyInput`), tự động tính live tổng thanh toán, thêm/xóa dòng.
   - Nút hành động: `[💾 Lưu thay đổi]` (`sdService.saveQuotation`) và `[✕ Hủy chỉnh sửa]`.

4. **Mở rộng Chỉnh sửa trực tiếp (Inline Edit) & Header Col 6-6 cho Trả hàng bán (`sales/returns/:id`):**
   - Nút `[✏️ Chỉnh sửa]` kích hoạt inline edit trên trang chi tiết biên bản hoàn hàng.
   - Header dạng 2 cột `col 6 - col 6`:
     - Cột trái: Khách hàng (readonly), Chi nhánh (`branchId`), Kho nhận hàng hoàn (`warehouseId`), Phương thức hoàn tiền (`refundMethod`).
     - Cột phải: Ngày hoàn hàng (`returnDate` định dạng `dd/MM/yyyy HH:mm`), Lý do trả hàng (`reason`), Ghi chú kiểm tra tem (`notes`).
   - Lưới sản phẩm hoàn trả cho phép điều chỉnh số lượng và đơn giá hoàn lại, tự động tính tổng tiền hoàn cấn trừ công nợ.
   - Thêm phương thức `sdService.saveSalesReturn` để lưu trữ cập nhật vào state.

5. **Mở rộng Chỉnh sửa trực tiếp (Inline Edit) & Header Col 6-6 cho Bảng giá (`sales/price-lists/:id`):**
   - Nút `[✏️ Chỉnh sửa]` cho phép cập nhật thông tin bảng giá ngay trên Header.
   - Header dạng 2 cột `col 6 - col 6`:
     - Cột trái: Tên bảng giá (`name`), Mã bảng giá (`code`), Chi nhánh áp dụng (`branchId`), Tiền tệ áp dụng (`currency`).
     - Cột phải: Hiệu lực từ (`effectiveFrom` định dạng `dd/MM/yyyy HH:mm`), Hiệu lực đến (`effectiveTo` định dạng `dd/MM/yyyy HH:mm`), Trạng thái kích hoạt (`isActive`), Ghi chú (`notes`).
   - Lưu dữ liệu qua `sdService.savePriceList`.

6. **Đồng bộ Từ điển i18n (`system.json`):**
   - Bổ sung `sq.payment_terms`, `pl.simulate_pricing`, `pl.effective_dates` cho cả tiếng Việt và tiếng Anh.

---

## 3. Kết quả Kiểm thử
- **FE Build:** `npm run build` hoàn thành với **0 error**.
- **Unit Tests:** Karma unit tests đạt **151/151 tests PASS 100%**.
- **Dark Mode:** Tương thích 100% trên giao diện Dark Mode với độ tương phản cao, thẻ bo góc và form controls chuyên nghiệp.
