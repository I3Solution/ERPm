# Step 23 — Cải tiến UX/UI Phân hệ Khách hàng (CRM) & Đơn bán hàng (SD) trên Frontend

- **Ngày thực hiện:** 2026-11-07
- **Người thực hiện:** Phạm Hữu Lợi (`loipham`)
- **Phạm vi Task Trello:**
  - `S23.2.3`: `[refactor](CRM) S23.2.3 Man hinh Khach hang: Chuyen sang Trang rieng va Quan ly nhieu Dia chi giao hang`
  - `S23.2.4`: `[update](CRM) S23.2.4 Checkbox khong gioi han han muc no tren Form Khach hang`
  - `S23.3.2`: `[update](SD) S23.3.2 Cai tien Form Don ban: Nut nhay toi trang KH va Auto-load dia chi giao hang`
  - `S23.3.3`: `[update](SD) S23.3.3 Cai tien Chon san pham: Async Search, Cong don so luong khi SP trung`
  - `S23.3.4`: `[update](SD) S23.3.4 Hoan thien UI Don ban: Format tien, Icon xoa do, Thue VAT, Gio phut giao hang`

---

## 1. Mục tiêu của Step

1. **Chuyển Form Khách hàng sang trang riêng & Quản lý nhiều địa chỉ giao hàng (`S23.2.3`):**
   - Loại bỏ popup modal tạo/sửa khách hàng trên `PartnersComponent`.
   - Xây dựng trang độc lập `/crm/partners/new` và `/crm/partners/:id/edit` (`PartnerFormComponent`) có nút Back chuẩn.
   - Xây dựng sub-widget `<app-partner-delivery-addresses>` (`PartnerDeliveryAddressesComponent`) cho phép thêm, sửa, xóa và đặt địa chỉ giao hàng mặc định.
2. **Checkbox Không giới hạn hạn mức công nợ (`S23.2.4`):**
   - Bổ sung checkbox `'Không giới hạn hạn mức công nợ'` (`isUnlimitedCredit`) trên `PartnerFormComponent`.
   - Khi bật checkbox, tự động disable ô `creditLimit` và đưa giá trị về `0` qua Reactive Forms; đồng bộ API `PUT /api/v1/partners/{id}/unlimited-credit`.
3. **Cải tiến Form Đơn bán — Nút nhảy tới trang KH & Auto-load địa chỉ giao hàng (`S23.3.2`):**
   - Thêm nút icon 1-click cạnh bộ chọn Khách hàng để điều hướng sang `/crm/partners/:id/edit`.
   - Tự động gọi `PartnerService.getDeliveryAddresses(customerId)` khi chọn khách hàng, hiển thị danh sách địa chỉ giao hàng của khách và tự động điền địa chỉ mặc định (`isDefault = true`).
4. **Cải tiến Chọn sản phẩm — Async Search & Cộng dồn số lượng khi SP trùng (`S23.3.3`):**
   - Xây dựng `<app-async-select>` (`AsyncSelectComponent`) hỗ trợ tìm kiếm bất đồng bộ có debounce theo Mã SKU, Tên SP, Barcode.
   - Khi chọn hoặc quét sản phẩm đã tồn tại trong danh sách dòng hàng của đơn bán, tự động cộng dồn `Quantity` trên dòng hiện có thay vì tạo dòng trùng lặp, kèm thông báo trực quan.
5. **Hoàn thiện UI Đơn bán — Format tiền, Icon xóa đỏ, Thuế VAT, Giờ phút giao hàng (`S23.3.4`):**
   - Định dạng tiền tệ rõ ràng (`1,000,000 đ`) trên bảng chi tiết và khung tổng hợp.
   - Đổi nút xóa dòng sang màu đỏ cảnh báo (`danger`).
   - Hỗ trợ chọn Ngày & Giờ phút giao hàng dự kiến (`datetime-local`).
   - Bổ sung cột `Thuế VAT (%)` (`0%`, `5%`, `8%`, `10%`), tính thuế GTGT từng dòng và hiển thị dòng `Tổng tiền thuế GTGT (VAT)` trước khi cộng vào `Tổng thanh toán`.

---

## 2. Danh sách File đã Tạo / Chỉnh sửa

### Submodule `ERPm-FE-CRM` (`ERPm-FE/src/app/modules/CRM`)
- `services/partner.service.ts`: Bổ sung `DeliveryAddressDto`, `SaveDeliveryAddressRequest`, `isUnlimitedCredit`, `getPartnerById`, `updatePartner`, `setUnlimitedCredit`, và bộ 5 hàm CRUD + `setDefaultDeliveryAddress`.
- `partners/partner-form/partner-form.component.ts` / `.html` / `.scss` / `.spec.ts`: Trang tạo mới / chỉnh sửa khách hàng độc lập, tích hợp checkbox `isUnlimitedCredit` và `<app-partner-delivery-addresses>`.
- `partners/partner-form/components/partner-delivery-addresses/partner-delivery-addresses.component.ts` / `.html` / `.scss` / `.spec.ts`: Component quản lý danh sách địa chỉ giao hàng của đối tác.
- `partners/partners.component.ts` / `.html`: Điều hướng sang `/crm/partners/new` và `/crm/partners/:id/edit`, hiển thị huy hiệu `∞ Không giới hạn nợ`.

### Submodule `ERPm-FE-SD` (`ERPm-FE/src/app/modules/SD`)
- `models/sd.models.ts` & `services/sd.service.ts`: Bổ sung `vatRate`, `taxAmount`, `deliveryAddressId`, `deliveryRecipientName`, `deliveryPhone`, `deliveryAddressText`.
- `orders/order-detail/order-detail.component.ts` / `.html` / `.scss` / `.spec.ts`: Tích hợp S23.3.2, S23.3.3, S23.3.4 trên màn hình chi tiết đơn bán hàng.
- `orders/components/order-form-dialog/order-form-dialog.component.ts` / `.html` / `.scss`: Đồng bộ S23.3.2, S23.3.3, S23.3.4 trên form lập đơn bán hàng.

### Repo `ERPm-FE`
- `src/app/shared/components/async-select/async-select.component.ts` / `.html` / `.scss`: Component tìm kiếm bất đồng bộ có debounce hỗ trợ `ControlValueAccessor` và `resetOnSelect`.
- `src/app/app.routes.ts`: Đăng ký các route `/crm/partners`, `/crm/partners/new`, `/crm/partners/:id/edit`, `/partners/new`, `/partners/:id/edit`.
- `src/assets/i18n/system.json`: Đồng bộ đầy đủ các khóa từ điển song ngữ Anh - Việt (`partners.*`, `so.*`, `table.line_total`).

---

## 3. Các lệnh đã chạy & Kết quả Kiểm tra (Verification)

1. **Frontend Production Build:**
   ```bash
   cd ERPm-FE && npm.cmd run build
   ```
   - Kết quả: **0 error**, bundle lazy chunks `partner-form-component` và `order-detail-component` khởi tạo thành công, không có cảnh báo vượt ngân sách SCSS component.
2. **Frontend Karma Unit Tests:**
   ```bash
   cd ERPm-FE && npx.cmd ng test --watch=false --browsers=ChromeHeadless --include="src/app/modules/CRM/partners/partner-form/**/*.spec.ts" --include="src/app/modules/SD/orders/order-detail/order-detail.component.spec.ts"
   ```
   - Kết quả: **11/11 specs SUCCESS** (kiểm tra tạo/sửa khách hàng, bật/tắt `isUnlimitedCredit` disable `creditLimit`, CRUD địa chỉ giao hàng, auto-load địa chỉ mặc định trên đơn bán, nhảy sang trang khách hàng, cộng dồn số lượng khi chọn SP trùng, tính thuế VAT theo dòng và tổng đơn).
3. **Backend Solution Build:**
   ```bash
   cd ERPm-BE && dotnet build ERPm.sln
   ```
   - Kết quả: **0 Warning(s), 0 Error(s)**.

---

## 4. Commits Liên Quan

- `ERPm-FE-CRM`: branch `c02c194` ➔ merge `master` `2f95335`
- `ERPm-FE-SD`: branch `e595dd6` ➔ merge `master` `591625a`
- `ERPm-FE`: branch `245668e` ➔ merge `master` `9e9eb7f`

---

## 5. Hướng đi tiếp theo

- Phối hợp kiểm thử tích hợp E2E toàn luồng CRM Partner (nhiều địa chỉ giao hàng, không giới hạn hạn mức nợ) ➔ SD Sales Order (auto-load địa chỉ, async search SP, tính thuế VAT) trên môi trường staging/local.
