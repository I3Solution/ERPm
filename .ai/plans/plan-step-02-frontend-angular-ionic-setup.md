# 📋 KẾ HOẠCH TRIỂN KHAI STEP 02: FRONTEND ANGULAR + IONIC HYBRID & TÍCH HỢP ĐA NGÔN NGỮ

> **Ngày tạo:** 2026-10-11  
> **Người thực hiện:** AI Agent (Tự động hóa)  
> **Mã kế hoạch:** PLAN-STEP-02  
> **Giai đoạn:** Phase 1 (MVP) - Sprint 1.1: Khởi tạo Kiến trúc Lõi & Master Data  
> **Trạng thái:**  Hoàn thành (Completed)  

---

## 🎯 1. MỤC TIÊU CỐT LÕI
1. Thiết lập dự án Frontend **Angular 18/19 Standalone Components + Ionic Framework 8 + Capacitor** trong thư mục `client/`:
   - Single Codebase: Hoạt động hoàn hảo trên Web Browser và sẵn sàng đóng gói Mobile APK/IPA.
2. Xây dựng **Kiến trúc Giao diện Adaptive (Responsive)**:
   - **Desktop (>= 768px):** Sử dụng `ion-split-pane`, Sidebar Navigation cố định bên trái, Header với chuyển đổi ngôn ngữ Anh - Việt, phím tắt nhanh.
   - **Mobile (< 768px):** Tự động chuyển thành Bottom Navigation Bar (Tabs), Header gọn gàng, Floating Action Button (FAB) và cử chỉ vuốt chạm.
3. Hiện thực hóa **Hệ thống Đa ngôn ngữ (i18n) trên Frontend**:
   - `LocalizationService` sử dụng Angular Signals (`currentLang`, `translations`).
   - Tự động tải từ điển từ Backend API `GET /api/v1/localization/{lang}` và lưu cache vào `localStorage`.
   - Cung cấp `TranslatePipe` (`{{ 'key' | translate }}`) và Language Switcher (cờ VN 🇻🇳 / US 🇺🇸).
4. Xây dựng phân hệ **Giao diện ITEM (Hàng hóa & Dịch vụ)**:
   - Màn hình Danh sách sản phẩm:
     - Desktop: Bảng dữ liệu đa cột (SKU, Mã vạch, Tên hàng, ĐVT, Giá bán, Giá vốn, Trạng thái).
     - Mobile: Danh sách dạng Card, thanh tìm kiếm nhanh, pull-to-refresh.
   - Modal thêm mới sản phẩm hỗ trợ nhập song ngữ (Tên tiếng Việt + Tên tiếng Anh), ĐVT và giá bán.
5. Xây dựng **Dashboard Page ban đầu**: Các thẻ chỉ số thống kê (Doanh số, Tồn kho cảnh báo, Sản phẩm).
6. Kiểm tra CSDL PostgreSQL (Docker) và chạy Migration tạo bảng nếu Docker sẵn sàng.
7. Đảm bảo toàn bộ mã nguồn Frontend biên dịch thành công (`npm run build`).

---

## 🛠️ 2. DANH SÁCH CÁC BƯỚC THỰC THI (WORK BREAKDOWN)

- [x] **Task 2.1:** Khởi tạo dự án Angular Standalone trong thư mục `client/`.
- [x] **Task 2.2:** Cài đặt các gói Ionic Framework (`@ionic/angular` / `@ionic/core`) và cấu hình theme Ionic, Ionicons.
- [x] **Task 2.3:** Xây dựng Shell Layout Adaptive: Navigation Sidebar cho Desktop và Bottom Tabs cho Mobile.
- [x] **Task 2.4:** Xây dựng `LocalizationService`, `TranslatePipe` và Component chuyển đổi ngôn ngữ.
- [x] **Task 2.5:** Xây dựng Dashboard Page với các chỉ số KPI cơ bản.
- [x] **Task 2.6:** Xây dựng Catalog/Items Page (danh sách + modal tạo mới sản phẩm song ngữ).
- [x] **Task 2.7:** Kiểm tra trạng thái Docker PostgreSQL và chuẩn bị sẵn sàng môi trường migration.
- [x] **Task 2.8:** Build kiểm tra toàn bộ Frontend, lưu log `step-02-frontend-angular-ionic-setup.md` và cập nhật `status.md`.
