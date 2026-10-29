# 🎨 STEP 08: THIẾT LẬP HỆ THỐNG DESIGN SYSTEM ĐỘC BẢN & CUSTOMIZE TOÀN DIỆN IONIC + DATA TABLES CHO ERPM

> **Mã bước:** `step-08`  
> **Thời gian thực hiện:** 2026-10-22  
> **Trọng tâm:** Xây dựng CSS Design System hiện đại (Neo-Fintech/SaaS), cá nhân hóa trải nghiệm người dùng, định hình chuẩn mực Data Table chuyên nghiệp cho ERP và tùy biến toàn diện (override) các component của Ionic Framework để tạo "chất riêng" cho dự án ERPm.

---

## 🎯 1. MỤC TIÊU CỦA BƯỚC NÀY
1. **Thiết lập nền tảng Design Tokens & Typography tân tiến:**
   - Sử dụng phông chữ **Inter** kết hợp **Plus Jakarta Sans** (tiêu đề & brand) và **JetBrains Mono** (mã SKU, barcode, số tiền tabular-nums).
   - Bảng màu thương hiệu Electric Indigo (`#4f46e5`), Emerald Green (`#10b981`), Rose Coral (`#f43f5e`), Amber Alert (`#f59e0b`), Sky Ledger (`#0ea5e9`).
   - Hiệu ứng đổ bóng đa tầng mềm (multi-layered ambient shadows) và Glassmorphism frosted blur (`backdrop-filter: blur(12px)`).
2. **Tùy biến toàn diện Ionic Components ("Chất riêng"):**
   - Loại bỏ phong cách thô cứng mặc định của Material Design (bỏ box-shadow gồ ghề, bỏ chữ in hoa thô ráp trên nút).
   - Tùy biến `ion-button` thành nút SaaS bo góc mềm mại, gradient tỏa sáng, hiệu ứng hover & click mượt mà.
   - Tùy biến `ion-card`, `ion-searchbar`, `ion-item`, `ion-list`, `ion-badge`, `ion-chip`, `ion-segment`, `ion-modal`, `ion-toolbar`.
3. **Bộ Data Table ERP Chuyên nghiệp (`.erpm-table`):**
   - Container card bo tròn 14px với thanh cuộn mượt mà.
   - Table Toolbar tích hợp ô tìm kiếm, bộ lọc phân loại, đếm số bản ghi thời gian thực.
   - Header cố định (sticky), chữ in hoa thanh lịch, font-weight 700.
   - Hiệu ứng vạch màu hover highlight sang trọng (`box-shadow: inset 3px 0 0 #4f46e5`).
   - Căn chỉnh chuẩn công thái học: số tiền, số lượng căn phải định dạng tabular-nums; mã SKU, Barcode định dạng monospace.
   - Empty state minh họa trực quan khi không có dữ liệu kèm nút hành động nhanh.
4. **Đồng bộ hóa giao diện App Shell & toàn bộ Module:**
   - Nâng cấp Sidebar, Topbar với Brand Logo ERPm Pro và Bộ chọn Chi nhánh (Multi-Branch Indicator).
   - Cập nhật Dashboard (KPI Stat Cards, Quick Action Cards, System Architecture).
   - Cập nhật Catalog (Hàng hóa), Inventory (Tồn kho & Nhập kho), Partners (Khách hàng & NCC).

---

## 📂 2. DANH SÁCH FILE ĐÃ TẠO & CHỈNH SỬA

| File | Hành động | Nội dung chính |
| :--- | :---: | :--- |
| [index.html](../../ERPm-FE/src/index.html) | Chỉnh sửa | Bổ sung Google Fonts: Plus Jakarta Sans, Inter, JetBrains Mono; thêm meta theme-color `#4f46e5` |
| [theme/variables.scss](../../ERPm-FE/src/theme/variables.scss) | **Tạo mới** | Master Design Tokens: Colors, Gradients, Shadows, Radius, Glassmorphism & Ionic theme bindings |
| [theme/ionic-overrides.scss](../../ERPm-FE/src/theme/ionic-overrides.scss) | **Tạo mới** | Tùy biến toàn bộ các component của Ionic (button, card, searchbar, item, badge, segment, modal, toast) |
| [theme/tables.scss](../../ERPm-FE/src/theme/tables.scss) | **Tạo mới** | Hệ thống Data Table ERP đỉnh cao: toolbar, scroll, sticky header, hover highlight, tabular-nums, empty state, pagination |
| [theme/components.scss](../../ERPm-FE/src/theme/components.scss) | **Tạo mới** | Bộ UI Components dùng chung: `.erpm-stat-card`, `.erpm-btn`, `.erpm-input`, `.erpm-badge`, `.erpm-modal`, status pulse dot |
| [styles.scss](../../ERPm-FE/src/styles.scss) | Chỉnh sửa | Master stylesheet import modular theme, tối ưu hóa CSS reset, loại bỏ các selector lỗi RTL của Ionic |
| [app.component.html](../../ERPm-FE/src/app/app.component.html) | Chỉnh sửa | Logo Pro mới, Branch indicator "Chi nhánh Trung tâm", đèn trạng thái kết nối API & DB nhấp nháy xanh |
| [app.component.scss](../../ERPm-FE/src/app/app.component.scss) | Chỉnh sửa | Nâng cấp styling sidebar, frosted glass header, language switcher pill, responsive mobile bottom bar |
| [items.component.html](../../ERPm-FE/src/app/modules/catalog/items.component.html) | Chỉnh sửa | Tích hợp `.erpm-table`, `.erpm-table-toolbar`, empty state và modal nhập liệu hiện đại |
| [items.component.scss](../../ERPm-FE/src/app/modules/catalog/items.component.scss) | Chỉnh sửa | Loại bỏ CSS lặp lại, kế thừa 100% từ hệ thống ERPm Design System |
| [dashboard.component.html](../../ERPm-FE/src/app/modules/dashboard/dashboard.component.html) | Chỉnh sửa | Áp dụng `.erpm-stat-card` với các dải màu gradient, shortcut cards thao tác nhanh |
| [dashboard.component.scss](../../ERPm-FE/src/app/modules/dashboard/dashboard.component.scss) | Chỉnh sửa | Styling các nút shortcut rực rỡ và responsive |
| [inventory.component.html](../../ERPm-FE/src/app/modules/inventory/inventory.component.html) | Chỉnh sửa | Áp dụng `.erpm-table` cho danh sách tồn kho, bộ lọc kho, modal nhập kho mới |
| [inventory.component.scss](../../ERPm-FE/src/app/modules/inventory/inventory.component.scss) | Chỉnh sửa | Kế thừa từ global styles, tinh gọn code |
| [partners.component.html](../../ERPm-FE/src/app/modules/partners/partners.component.html) | Chỉnh sửa | Áp dụng `.erpm-table` cho sổ khách hàng/NCC, type pill segments, modal thêm đối tác |
| [partners.component.scss](../../ERPm-FE/src/app/modules/partners/partners.component.scss) | Chỉnh sửa | Tinh gọn styling, bổ sung `.partner-type-pills` |

---

## ⚡ 3. CÁC LỆNH ĐÃ THỰC THI (COMMAND EXECUTION)

```bash
# 1. Build kiểm tra Frontend Angular + Ionic Client
cd client
npm run build
# Kết quả: Application bundle generation complete [12.5s], 0 Error, 0 Selector Error.

# 2. Build kiểm tra Backend .NET 8 Web API
cd ..
dotnet build
# Kết quả: Build succeeded: 0 Warning(s), 0 Error(s).
```

---

## 🔍 4. KẾT QUẢ KIỂM TRA (VERIFICATION)
1. **Kiểm tra biên dịch CSS & Bundle:**
   - Bundle CSS tổng thể (`styles.css`) chỉ nặng **50.40 kB** (gzipped: **8.26 kB**), tải cực nhanh.
   - Toàn bộ các cảnh báo selector lỗi `:host-context([dir=rtl])` trước đây từ Ionic đã được loại bỏ triệt để.
2. **Trải nghiệm thị giác & Tính nhất quán (Design Harmony):**
   - Đảm bảo chất riêng độc bản: Không bị "gốc Ionic" hay "gốc Material", mang phong cách Fintech / Enterprise SaaS cao cấp (tương tự Linear, Stripe, Notion).
   - Bảng biểu Data Table hiển thị mượt mà trên Desktop với hover highlight, sticky headers và format số tiền chuẩn xác.
   - Hỗ trợ Adaptive: Tự động chuyển đổi dạng thẻ (Card list) khi người dùng truy cập bằng thiết bị di động (Mobile).

---

## ⏭️ 5. HƯỚNG ĐI CHO BƯỚC TIẾP THEO (NEXT STEPS)
- Triển khai **Giai đoạn 2 của Lộ trình (Roadmap Phase 2)**:
  - Phân hệ **Mua hàng & Đơn đặt hàng NCC (Purchase Orders)**.
  - Phân hệ **Sổ quỹ & Thu chi tiền mặt / Ngân hàng (Cash & Bank Management)**: Lập phiếu thu, phiếu chi, theo dõi biến động dòng tiền và liên kết tự động hạch toán vào Sổ Cái Kế toán.
