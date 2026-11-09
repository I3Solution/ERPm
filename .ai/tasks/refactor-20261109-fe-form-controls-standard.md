# Nhiệm vụ: Chuẩn hóa Form Controls & Async Item Search trên Frontend ERPm-FE

- **Mã:** REF-20261109
- **Loại:** refactor
- **Trạng thái:** Done
- **Phạm vi:** `ERPm-FE` (SD, CRM, WMS, SYS)
- **Người thực hiện:** loipham
- **Nhánh:** `loipham/refactor-app-data-table`

---

## 1. Lý do & Mục tiêu
- Loại bỏ toàn bộ các thẻ HTML thuần (`<input>`, `<select>`, `<textarea>`) đang viết rời rạc trong các màn hình và dialog.
- Bắt buộc dùng component chuẩn hóa `<app-form-control>` (kết hợp `[compact]="true"` trong table cells) và `<app-input-control>`.
- Chuyển toàn bộ các trường tìm kiếm / chọn Item/Sản phẩm sang component bất đồng bộ `<app-async-select>` (`AsyncSelectComponent`), hỗ trợ tìm kiếm remote theo SKU/Tên/Barcode kèm debounce.

---

## 2. Danh sách file đã refactor

### Phân hệ Bán hàng (SD)
- `SD/quotations/quotation-detail/quotation-detail.component.html`, `.ts`: Thay thế `<select>` sản phẩm bằng `<app-async-select>`, chuyển các input số lượng, đơn giá, chiết khấu sang `<app-form-control>`.
- `SD/quotations/components/quotation-form-dialog/quotation-form-dialog.component.html`, `.ts`: Chuyển bảng line items sang `<app-async-select>` và `<app-form-control>`.
- `SD/orders/components/order-form-dialog/order-form-dialog.component.html`, `.ts`: Chuẩn hóa thời gian giao hàng (`datetime-local`), dropdown địa chỉ giao hàng, số lượng, đơn giá, chiết khấu và thuế suất VAT sang `<app-form-control>`.
- `SD/returns/components/return-form-dialog/return-form-dialog.component.html`, `.ts`: Thay thế `<select>` sản phẩm bằng `<app-async-select>`, các input số lượng, giá, lý do sang `<app-form-control>`.
- `SD/returns/return-detail/return-detail.component.html`, `.ts`: Chuyển input số lượng hoàn, đơn giá, lý do sang `<app-form-control>`.
- `SD/price-lists/components/price-list-items/price-list-items.component.html`, `.ts`: Chuyển modal chọn sản phẩm sang `<app-async-select>`, các cell số lượng tối thiểu, đơn giá, % chiết khấu sang `<app-form-control>`.
- `SD/pos/pos.component.html`: Chuyển thanh tìm kiếm sản phẩm POS sang `<app-form-control>` chuẩn hóa.

### Phân hệ Khách hàng (CRM)
- `CRM/partners/partners.component.html`, `.ts`: Chuyển ô tìm kiếm đối tác sang `<app-form-control>`.

### Phân hệ Kho (WMS)
- `WMS/items/items.component.html`: Chuyển ô tìm kiếm danh mục vật tư (Desktop & Mobile) sang `<app-form-control>`.
- `WMS/inventory/inventory.component.html`: Chuyển ô tìm kiếm tồn kho sang `<app-form-control>`.

### Phân hệ Hệ thống (SYS)
- `SYS/notifications/notification-center/notification-center.component.html`, `.ts`: Chuyển các bộ lọc phân hệ, mức độ, trạng thái sang `<app-form-control type="select">`.
- `SYS/notifications/notification-templates/notification-templates.component.html`, `.ts`: Chuyển toàn bộ form nhập mã mẫu, tên, phân hệ, mức độ, URL, tiêu đề đa ngôn ngữ và nội dung chi tiết sang `<app-form-control>`.

---

## 3. Bằng chứng kiểm thử & Nghiệm thu
- **Angular Build:** `ng build` (Angular CLI v20.3) sinh toàn bộ bundles thành công (`Application bundle generation complete`), **0 error, 0 compile failure**.
- **Kiểm tra rà soát HTML:** Không còn bất kỳ thẻ `<select>` hay `<textarea>` thuần nào trong toàn bộ thư mục `src/app/modules`. Toàn bộ dropdown chọn sản phẩm/vật tư đều đã tích hợp qua `<app-async-select>`.
