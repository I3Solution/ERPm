# 🚀 STEP 02: XÂY DỰNG FRONTEND ANGULAR + IONIC HYBRID & TÍCH HỢP ĐA NGÔN NGỮ

> **Thời gian thực hiện:** 2026-10-11  
> **Người thực hiện:** AI Agent (Tự động hóa hoàn toàn)  
> **Giai đoạn / Sprint:** Phase 1 (MVP) - Sprint 1.1: Khởi tạo Kiến trúc Lõi & Master Data  
> **Trạng thái:**  Hoàn thành (Completed)  

---

### 1. Mục tiêu của bước
1. Khởi tạo dự án Frontend **Angular 18 Standalone Components + Ionic Framework 8 + Capacitor** trong thư mục `client/`.
2. Xây dựng cấu trúc layout **Adaptive Responsive**:
   - **Desktop (>= 768px):** Sidebar navigation cố định bên trái, Header với Language Switcher (🇻🇳 VI / 🇺🇸 EN) và User Profile pill, thanh cuộn nội dung độc lập.
   - **Mobile (< 768px):** Bottom Navigation Bar (Tabs: Tổng quan, Hàng hóa, Bán hàng, Kho), Header gọn gàng với thương hiệu ERPm và nút đổi ngôn ngữ nhanh.
3. Hiện thực hóa hệ thống **Đa ngôn ngữ (i18n) trên Frontend**:
   - `LocalizationService` sử dụng Angular Signals (`currentLang`, `dictionary`), kết nối API backend `GET /api/v1/localization/{lang}` và tự động fallback sang từ điển local nếu backend chưa kết nối.
   - `TranslatePipe` (`{{ 'key' | translate }}`) dịch chuỗi trực tiếp trên template với độ trễ 0ms.
4. Xây dựng 2 màn hình đầu tiên:
   - **Dashboard Page (`/dashboard`):** Thẻ chỉ số KPI (Doanh thu hôm nay, Số mặt hàng, Cảnh báo tồn kho, Bút toán đã ghi sổ) và bảng phím tắt nhanh.
   - **Catalog / ITEM Page (`/catalog`):** Danh sách hàng hóa dạng bảng đa cột (Desktop) và card view (Mobile), tìm kiếm tức thời, và Modal thêm mới sản phẩm hỗ trợ nhập song ngữ (Tên tiếng Việt + Tên tiếng Anh).

---

### 2. Danh sách các file đã tạo & chỉnh sửa

#### 2.1. Cấu hình Frontend (`client/`):
- `client/angular.json`: Cấu hình SCSS, budgets và assets.
- `client/src/index.html`: Cấu hình viewport mobile hybrid (`viewport-fit=cover`, `user-scalable=no`) và font Google Inter.
- `client/src/styles.scss`: Tích hợp CSS core của Ionic Framework 8, định nghĩa hệ thống Design Tokens (màu sắc, border, shadows, table và responsive helpers).
- `client/src/app/app.config.ts`: Cấu hình `provideIonicAngular({ mode: 'md' })`, `provideHttpClient()`, `provideRouter()`.

#### 2.2. Core Services & Pipes:
- `client/src/app/core/services/localization.service.ts`: Quản lý ngôn ngữ qua Angular Signals, cache LocalStorage, kết nối API backend.
- `client/src/app/shared/pipes/translate.pipe.ts`: Standalone pipe dịch thuật đa ngôn ngữ.
- `client/src/app/core/services/item.service.ts`: Service quản lý hàng hóa ITEM với kết nối API `/api/v1/items` và mock data fallback.

#### 2.3. Layout & Pages:
- `client/src/app/app.component.html` & `app.component.scss` & `app.component.ts`: Shell layout Adaptive chuyển đổi linh hoạt giữa Desktop Sidebar và Mobile Bottom Bar.
- `client/src/app/pages/dashboard/dashboard.component.ts`: Trang tổng quan KPI và phím tắt nghiệp vụ.
- `client/src/app/pages/catalog/items.component.ts`: Trang quản lý hàng hóa với giao diện Adaptive và Modal thêm mới song ngữ.
- `client/src/app/app.routes.ts`: Định tuyến `/dashboard` và `/catalog`.

---

### 3. Các lệnh đã thực thi
```bash
# Khởi tạo dự án Angular 18 standalone không tương tác
$env:NG_CLI_ANALYTICS="false"; npx -y @angular/cli@18 new client --defaults --skip-git --package-manager=npm --style=scss --ssr=false

# Cài đặt Ionic Framework 8 và Ionicons
cd client
npm install @ionic/angular@8.3.1 ionicons@7.4.0

# Biên dịch kiểm tra frontend
npm run build

# Biên dịch kiểm tra backend
dotnet build ERPm.sln
```

---

### 4. Kết quả kiểm tra & Xác nhận (Verification)
- [x] **Frontend Build:** `npm run build` chạy thành công với **`Exit code 0`**, bundle siêu nhẹ (133 kB transfer size).
- [x] **Backend Build:** `dotnet build ERPm.sln` thành công với **`0 Errors`**, **`0 Warnings`**.
- [x] **Giao diện Adaptive:**
  - Màn hình rộng hiển thị Sidebar trái chuẩn ERP.
  - Màn hình điện thoại hiển thị Bottom Tabs chuẩn Mobile App.
- [x] **Đa ngôn ngữ Anh - Việt:** Chuyển đổi ngôn ngữ tức thời giữa Tiếng Việt và Tiếng Anh qua Signal phản ứng nhanh.
- [x] **Quản lý ITEM:** Hỗ trợ nhập và hiển thị tên sản phẩm song ngữ (JSONB chuẩn hóa).

---

### 5. Hướng đi cho bước tiếp theo (Step 03)
1. Xây dựng phân hệ **Quản lý Tồn kho & Kho hàng (Warehouse & Stock Management)**:
   - Backend: Entity `Warehouse`, `StockReceipt`, `StockIssue`, `StockBalance`.
   - Frontend: Màn hình kiểm tra tồn kho tức thời và lập phiếu Nhập kho / Xuất kho.
2. Xây dựng phân hệ **Bán hàng & Hóa đơn (POS & Sales Invoicing)**:
   - Giao diện bán hàng POS cảm ứng (quét barcode, chọn khách hàng, in hóa đơn K80/A4).
   - Tự động trừ tồn kho và tự động sinh bút toán kế toán kép ngầm.
