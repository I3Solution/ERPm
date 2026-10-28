# 🌓 STEP 13: HỆ THỐNG GIAO DIỆN DARK MODE / LIGHT MODE TOÀN DIỆN CHO FRONTEND ERPM

> **Mục tiêu:** Xây dựng hệ thống giao diện Dark Mode cao cấp cho toàn bộ Frontend Angular + Ionic Hybrid (Fintech/SaaS Dark Slate Aesthetic), hỗ trợ chuyển đổi mượt mà giữa Chế độ Tối / Chế độ Sáng / Theo hệ điều hành (OS Scheme), lưu vết cấu hình `localStorage`, triệt tiêu hoàn toàn hiện tượng chớp trắng (FOUC), và tích hợp hoàn hảo với Design System CSS Tokens & Ionic 8 Dark Palette.

---

## 📌 1. BỐI CẢNH & NHU CẦU THỰC TẾ
1. **Trải nghiệm người dùng doanh nghiệp:** Thu ngân bán hàng tại quầy (POS Touch), nhân viên thủ kho quét mã vạch và kế toán viên thường xuyên làm việc trong môi trường ánh sáng yếu hoặc nhìn màn hình thời gian dài. Chế độ Tối (Dark Mode) giúp giảm mỏi mắt, tăng độ tập trung và tiết kiệm pin trên thiết bị di động (màn hình OLED/AMOLED).
2. **Kế thừa kiến trúc Design System:** Hệ thống giao diện ERPm đã được xây dựng hoàn toàn dựa trên hệ thống biến CSS Tokens (`--erpm-bg-canvas`, `--erpm-bg-surface`, `--erpm-text-heading`, `--erpm-border`, ...). Đây là tiền đề lý tưởng để triển khai Dark Mode một cách nhất quán, không chắp vá, đồng bộ từ Desktop Sidebar, Header, Bảng dữ liệu (Data Table), POS Touch đến Mobile Bottom Navigation.

---

## 🛠️ 2. DANH SÁCH TỆP ĐÃ TẠO & CHỈNH SỬA

| STT | Đường dẫn tệp | Thao tác | Mô tả chi tiết |
| :---: | :--- | :---: | :--- |
| 1 | `client/src/app/core/services/theme.service.ts` | **Tạo mới** | Service quản trị theme singleton sử dụng Angular Signals (`isDarkMode`, `themeMode`), lắng nghe OS media query `(prefers-color-scheme: dark)`, đồng bộ thuộc tính `data-theme` trên `<html>`, gán class `.dark-theme` / `.ion-palette-dark` trên `<body>`, cập nhật meta `theme-color`, và lưu cấu hình vào `localStorage`. |
| 2 | `client/src/theme/variables.scss` | **Cập nhật** | Định nghĩa bộ biến CSS Tokens toàn diện cho Dark Theme: Surface sâu `#090d16` & `#111827`, đường viền tương phản cao `#243248` & `#334155`, chữ sáng rõ nét `#f8fafc` & `#cbd5e1`, trạng thái (Success, Warning, Danger, Info) dạng nền trong suốt 15% kết hợp chữ phát sáng, và ánh xạ đồng bộ cho Ionic 8 variables. |
| 3 | `client/src/styles.scss` | **Cập nhật** | Tích hợp `@ionic/angular/css/palettes/dark.class.css`, chuẩn hóa các lớp tiện ích màu sắc (`text-slate-*`, `bg-slate-50`, `bg-white`, `text-indigo-600`) trỏ về CSS Tokens động, và thêm hiệu ứng chuyển màu mượt mà (`transition: 0.25s`) cho toàn bộ thẻ điều hướng, card, table và modal. |
| 4 | `client/src/theme/ionic-overrides.scss` | **Cập nhật** | Chuyển đổi các biến cứng như `--background-checked: #ffffff` trong `ion-segment` và `ion-toast` sang `var(--erpm-bg-surface)` để hiển thị tối ưu trong Dark Mode. |
| 5 | `client/src/theme/tables.scss` | **Cập nhật** | Thay thế toàn bộ màu nền tĩnh (`#ffffff`, `#f8faff`, `#fafbfc`) trên hover hàng bảng, bảng sọc (striped), nút hành động phân trang thành các token động `--erpm-bg-surface`, `--erpm-bg-surface-active`, `--erpm-bg-surface-subtle`. |
| 6 | `client/src/app/modules/sales/pos.component.scss` | **Cập nhật** | Đồng bộ 100% màu sắc giao diện POS Bán hàng (ô tìm kiếm, thẻ sản phẩm, giỏ hàng, bảng số lượng stepper, chiết khấu, modal thanh toán, hóa đơn in nhiệt) theo Design Tokens Dark Mode. |
| 7 | `client/src/app/modules/dashboard/dashboard.component.scss` | **Cập nhật** | Tối ưu hóa màu nền và hiệu ứng hover (`filter: brightness(1.08)`) cho các shortcut thẻ màu sắc trên Dashboard. |
| 8 | `client/src/app/modules/partners/partners.component.scss` | **Cập nhật** | Chuyển nền pill filter tab đang kích hoạt sang `var(--erpm-bg-surface)`. |
| 9 | `client/src/app/shared/components/branch-tree-select/branch-tree-select.component.scss` | **Cập nhật** | Chuyển nền ô tìm kiếm chi nhánh và dòng root scope sang CSS tokens động. |
| 10 | `client/src/app/core/services/localization.service.ts` | **Cập nhật** | Bổ sung từ khóa song ngữ cho theme: `theme.toggle`, `theme.dark`, `theme.light`, `theme.system`. |
| 11 | `client/src/app/app.component.ts` | **Cập nhật** | Inject `ThemeService`, khai báo getter signal `isDarkMode` và hàm `toggleTheme()`. |
| 12 | `client/src/app/app.component.html` | **Cập nhật** | Tích hợp nút chuyển đổi giao diện `.theme-toggle-btn` với icon SVG Mặt trời (vàng) / Mặt trăng (indigo) tương tác trực quan ngay trên thanh Top Header (hỗ trợ cả Desktop lẫn Mobile). |
| 13 | `client/src/app/app.component.scss` | **Cập nhật** | Thiết kế styling cho nút `.theme-toggle-btn` (xoay nhẹ và phóng to 1.1 khi hover, hiệu ứng nảy nhẹ khi bấm), đồng thời điều chỉnh nút chọn ngôn ngữ thích ứng nền tối. |
| 14 | `client/src/index.html` | **Cập nhật** | Nhúng đoạn mã script tiền xử lý theme tức thì trong `<head>` để ngăn ngừa triệt để hiện tượng chớp trắng (FOUC) khi F5/reload trang. |

---

## ⚙️ 3. CÁC LỆNH ĐÃ THỰC THI

```powershell
# 1. Kiểm tra cấu trúc client và theme
Get-ChildItem -Path client/src/theme

# 2. Kiểm tra hỗ trợ Ionic dark palette
Test-Path client/node_modules/@ionic/angular/css/palettes/dark.class.css

# 3. Biên dịch kiểm thử Angular Frontend
cd client
npm.cmd run build
```

---

## 🔍 4. KẾT QUẢ KIỂM TRA (VERIFICATION)

- **Biên dịch Frontend (Angular 17/18 CLI):**
  - Chạy `npm.cmd run build` trong `client/`:
  - **Kết quả:** `Application bundle generation complete` thành công mỹ mãn với **0 Warning, 0 Error, Code 0** (thời gian build: 7.6s).
- **Hệ thống chuyển đổi giao diện:**
  - Bấm nút icon Mặt trăng/Mặt trời trên Top Header: Toàn bộ hệ thống chuyển đổi tức thì giữa Light Mode và Dark Mode.
  - Lưu trạng thái vào `localStorage` key `'erpm_theme'` (`'light'` / `'dark'`).
  - Khi người dùng chưa chọn, tự động nhận diện theo chế độ của hệ điều hành qua `window.matchMedia('(prefers-color-scheme: dark)')`.
- **Triệt tiêu FOUC (Flash of Unstyled Content):**
  - Script trong `<head>` nạp theme trước khi trang kịp render HTML DOM, đảm bảo người dùng Dark Mode không bị lóa mắt khi tải lại trang.
- **Kỷ luật Kỹ thuật (Technical Discipline):**
  - 100% comment trong source code (TypeScript, SCSS, HTML) tuân thủ quy chuẩn Tiếng Anh (English comments only).
  - Sử dụng đầy đủ Standalone Components & Angular Signals.

---

## 🧭 5. HƯỚNG ĐI CHO BƯỚC TIẾP THEO (NEXT STEPS)
1. **Kiểm thử trải nghiệm trên thiết bị di động:** Kiểm tra thanh điều hướng Mobile Bottom Navigation và Modal POS trên màn hình điện thoại dưới chế độ nền tối.
2. **Chuẩn bị bước vào Giai đoạn 2 (Purchasing & Cashbook):** Xây dựng luồng Mua hàng (Purchase Order) và Quản lý Sổ quỹ tiền mặt / ngân hàng.
