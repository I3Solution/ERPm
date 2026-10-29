# 📝 STEP 10: CUSTOM SELECT DROPDOWN, GLOBAL POINTER & CARET DISCIPLINE, VÀ TOÀN DIỆN SONG NGỮ (I18N)

> **Mục tiêu:** 
> 1. Xóa bỏ thẻ `<select>` & `<option>` thô mặc định của hệ điều hành (với nền xanh OS thô cứng trong kho bãi và các màn hình), thay thế bằng component enterprise `app-custom-select` hiện đại, đồng bộ Design System neo-fintech của ERPm.
> 2. Khắc phục triệt để lỗi con trỏ chuột nhấp nháy (caret / text I-beam) khi click vào thẻ `<span>` / text không phải input bằng kỷ luật `caret-color: transparent !important;` và `user-select: none !important;`.
> 3. Chuẩn hóa `cursor: pointer !important;` trên tất cả các vùng tương tác (buttons, select triggers, tree nodes, table headers, pills, chips, icons) và toàn bộ các phần tử con (`*`).
> 4. Phủ sóng đa ngôn ngữ Anh - Việt (i18n) 100% trên toàn bộ các màn hình (Inventory, Catalog, Partners, Dashboard, Sales POS, Branch Tree Select).

---

## 📂 1. DANH SÁCH FILE ĐÃ TẠO VÀ CHỈNH SỬA

### A. Component Mới:
- [`client/src/app/shared/components/custom-select/custom-select.component.ts`](../../ERPm-FE/src/app/shared/components/custom-select/custom-select.component.ts): Component dropdown tùy chỉnh standalone, tích hợp `ControlValueAccessor` (tương thích `[(ngModel)]` và two-way binding), hỗ trợ tìm kiếm tức thời bên trong dropdown, clear button, checkmark `✓`, badge, icon và đóng mở khi click ra ngoài (`HostListener`).
- [`client/src/app/shared/components/custom-select/custom-select.component.html`](../../ERPm-FE/src/app/shared/components/custom-select/custom-select.component.html): Template giao diện trigger box và flyout menu với hiệu ứng đổ bóng mờ, không sử dụng thẻ `<option>` OS.
- [`client/src/app/shared/components/custom-select/custom-select.component.scss`](../../ERPm-FE/src/app/shared/components/custom-select/custom-select.component.scss): Phong cách thiết kế neo-fintech cao cấp, bo góc mượt mà, hover tinh tế, triệt tiêu text caret và đảm bảo `cursor: pointer`.

### B. Global CSS & Theme Tokens:
- [`client/src/styles.scss`](../../ERPm-FE/src/styles.scss):
  - Khắc phục lỗi con trỏ chuột nhấp nháy: `body *:not(input):not(textarea):not([contenteditable="true"]) { caret-color: transparent !important; }`.
  - Ép buộc `cursor: pointer !important;` và `user-select: none !important;` cho tất cả các phần tử tương tác và con cháu của chúng (`*`).
- [`client/src/theme/components.scss`](../../ERPm-FE/src/theme/components.scss):
  - Nâng cấp `.erpm-select` fallback: `appearance: none; -webkit-appearance: none;`, custom SVG chevron arrow, `cursor: pointer !important;`.

### C. Màn hình & Phân hệ được nâng cấp:
- [`client/src/app/modules/inventory/inventory.component.ts`](../../ERPm-FE/src/app/modules/inventory/inventory.component.ts) & [`inventory.component.html`](../../ERPm-FE/src/app/modules/inventory/inventory.component.html):
  - Thay thế toàn bộ `<select>` native (bộ lọc kho hàng ở toolbar và 3 select trong modal nhập kho) bằng `<app-custom-select>`.
  - Phủ pipe `translate` cho tất cả table headers, search input placeholder, thống kê KPI, empty state, modal labels.
- [`client/src/app/shared/components/branch-tree-select/branch-tree-select.component.ts`](../../ERPm-FE/src/app/shared/components/branch-tree-select/branch-tree-select.component.ts), [`branch-tree-select.component.html`](../../ERPm-FE/src/app/shared/components/branch-tree-select/branch-tree-select.component.html) & [`branch-tree-select.component.scss`](../../ERPm-FE/src/app/shared/components/branch-tree-select/branch-tree-select.component.scss):
  - Bổ sung `TranslatePipe`.
  - Song ngữ hóa các nhãn chi nhánh, gợi ý phân cấp, tooltip và tìm kiếm.
  - Ép buộc pointer và chặn bôi đen/caret nhấp nháy khi click vào tên chi nhánh hay icon.
- [`client/src/app/modules/catalog/items.component.html`](../../ERPm-FE/src/app/modules/catalog/items.component.html):
  - Song ngữ hóa toàn bộ tiêu đề bảng, tổng số lượng mặt hàng, giá bán lẻ, empty state, mobile card view.
- [`client/src/app/modules/partners/partners.component.ts`](../../ERPm-FE/src/app/modules/partners/partners.component.ts) & [`partners.component.html`](../../ERPm-FE/src/app/modules/partners/partners.component.html):
  - Dùng `app-custom-select` cho loại đối tác (Khách hàng / Nhà cung cấp / Cả hai).
  - Phủ song ngữ cho metrics, toolbar, table headers, classification badges.
- [`client/src/app/modules/dashboard/dashboard.component.html`](../../ERPm-FE/src/app/modules/dashboard/dashboard.component.html):
  - Dùng `translate` pipe cho 4 stat cards, 6 quick actions, và khối kiến trúc hệ thống.
- [`client/src/app/modules/sales/pos.component.ts`](../../ERPm-FE/src/app/modules/sales/pos.component.ts) & [`pos.component.html`](../../ERPm-FE/src/app/modules/sales/pos.component.html):
  - Dùng `app-custom-select` có ô tìm kiếm cho danh sách khách hàng POS (Khách lẻ / Khách hàng).
  - Song ngữ hóa giỏ hàng rỗng, nút thanh toán, modal xác nhận đơn hàng và in hóa đơn.
- [`client/src/app/core/services/localization.service.ts`](../../ERPm-FE/src/app/core/services/localization.service.ts):
  - Từ điển fallback đa ngôn ngữ đồ sộ với hơn 80+ keys cho cả tiếng Việt (`vi`) và tiếng Anh (`en`).

---

## 🧪 2. KẾT QUẢ KIỂM TRA (VERIFICATION)

- **Lệnh thực thi:** `npm run build` tại thư mục `client/`.
- **Kết quả:** **BUILD SUCCESS (Code 0)** trong 12.7 giây.
  - `Initial total`: 649.32 kB
  - Toàn bộ template binding và kiểu TypeScript đồng bộ tuyệt đối.
  - Trình duyệt live-reload hiển thị mượt mà.

---

## 🎯 3. HƯỚNG ĐI CHO BƯỚC TIẾP THEO

- Bắt đầu triển khai phân hệ Mua hàng (Purchase Orders) và Quản lý Nhà cung ứng chuyên sâu theo lộ trình Sprint tiếp theo.
- Xây dựng phân hệ Sổ quỹ & Thu chi tiền mặt / ngân hàng gắn liền với Double-Entry Ledger.
