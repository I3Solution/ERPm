# 🛠️ STEP 17: CHUẨN HÓA REACTIVE FORMS (`FORMGROUP`) & BỘ COMPONENT `INPUT-CONTROL` / `FORM-CONTROL`

> **Ngày thực hiện:** 2026-10-29  
> **Trạng thái:** Hoàn thành (100%)  
> **Mục tiêu:** Chuyển đổi toàn bộ các biểu mẫu nhập liệu lưu dữ liệu (Stock Receipt, Item + Dynamic Attributes, Partner, POS Checkout) từ `[(ngModel)]` sang **`FormGroup` (`ReactiveFormsModule`)**, đồng thời xây dựng bộ đôi Component chuẩn hóa **`InputControlComponent` (`<app-input-control>`)** và **`FormControlComponent` (`<app-form-control>`)** xử lý tập trung mọi kiểu dữ liệu (`type`) và nguồn dữ liệu (`dataSource`).

---

## 🎯 1. KIẾN TRÚC COMPONENT CHUẨN HÓA

### 1.1. `InputControlComponent` (`<app-input-control>`)
- **Đường dẫn:** [input-control.component.ts](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/src/app/shared/components/input-control/input-control.component.ts) (Triad 3 files `.ts`, `.html`, `.scss`).
- **Cơ chế:** Implement `ControlValueAccessor` với `@Optional() @Self() public ngControl: NgControl | null`, tương thích cả `formControlName`, `[formControl]` và `[(ngModel)]`.
- **Xử lý đa kiểu (`@Input() type: InputControlType`):**
  - `'select'`: Tự động render `<app-custom-select>` với `@Input() dataSource: SelectOption[]` (hoặc `options`), hỗ trợ `searchable`, `allowClear`, `size`, `minWidth`.
  - `'number'` & `'currency'`: Tự động ép kiểu số (`Number`), hỗ trợ `min`, `max`, `step`, hiển thị hậu tố tiền tệ (`đ`) hoặc đơn vị tính (`suffix`/`prefix`).
  - `'textarea'`: Render `<textarea>` nhiều dòng (`rows`).
  - `'checkbox'` / `'boolean'`: Render checkbox chuẩn hóa kèm nhãn inline.
  - `'text' | 'date' | 'email' | 'tel' | 'password'`: Render thẻ `<input>` chuẩn của Design System.

### 1.2. `FormControlComponent` (`<app-form-control>`)
- **Đường dẫn:** [form-control.component.ts](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/src/app/shared/components/form-control/form-control.component.ts) (Triad 3 files `.ts`, `.html`, `.scss`).
- **Cơ chế:** Bọc `<app-input-control>`, nhận trực tiếp `formControlName` từ `FormGroup` cha:
  - Tự động vẽ nhãn `label`, đơn vị `(unit)`, và dấu sao bắt buộc `*` (tự động phát hiện `Validators.required` từ `FormControl` hoặc qua `@Input() required`).
  - Tự động kiểm tra trạng thái `control.invalid && (control.dirty || control.touched)` để tô viền đỏ và hiển thị thông báo lỗi validation (`required`, `min`, `max`, `email`, `maxlength`).

---

## 📂 2. CÁC MÀN HÌNH ĐÃ NÂNG CẤP SANG `FORMGROUP` + `<APP-FORM-CONTROL>`

1. **Phân hệ Kho (`WMS` - `InventoryComponent`):**
   - [inventory.component.ts](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/src/app/modules/WMS/inventory.component.ts) & [inventory.component.html](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/src/app/modules/WMS/inventory.component.html)
   - Chuyển Modal Nhập kho nhanh sang `receiptForm: FormGroup` (`warehouseId`, `supplierId`, `itemId`, `quantity`, `unitCost`, `notes`).
2. **Phân hệ Sản phẩm & Thuộc tính động (`WMS` - `ItemsComponent`):**
   - [items.component.ts](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/src/app/modules/WMS/items.component.ts) & [items.component.html](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/src/app/modules/WMS/items.component.html)
   - Chuyển Modal Tạo sản phẩm sang `itemForm: FormGroup` kết hợp nested `attributes: FormGroup` sinh tự động từ metadata `ItemAttributeDto`.
   - Rút gọn toàn bộ 5 khối `<ng-container *ngIf="attr.dataType === ...">` của thuộc tính động JSONB thành **1 thẻ `<app-form-control>` duy nhất** truyền `[type]="getAttributeControlType(attr.dataType)"` và `[dataSource]="getAttributeOptions(attr)"`.
3. **Phân hệ Đối tác (`CRM` - `PartnersComponent`):**
   - [partners.component.ts](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/src/app/modules/CRM/partners.component.ts) & [partners.component.html](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/src/app/modules/CRM/partners.component.html)
   - Chuyển Modal Thêm mới KH/NCC sang `partnerForm: FormGroup` (`code`, `partnerType`, `name`, `phone`, `email`, `taxCode`, `creditLimit`, `address`).
4. **Phân hệ Bán hàng POS (`SD` - `PosComponent`):**
   - [pos.component.ts](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/src/app/modules/SD/pos.component.ts) & [pos.component.html](file:///d:/WORKING%20PLACE/ERPm/ERPm-FE/src/app/modules/SD/pos.component.html)
   - Chuyển Modal Xác nhận Thanh toán sang `checkoutForm: FormGroup` (`paymentMethod`, `amountPaid`, `orderNotes`).

---

## ✅ 3. KẾT QUẢ KIỂM TRA (VERIFICATION)
- Chạy `npm run build` trong `ERPm-FE`: **Build succeeded (0 Error)**.

