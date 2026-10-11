# 📊 DỰ ÁN ERPM - BẢNG TRẠNG THÁI HIỆN TẠI (CURRENT STATUS)

> **Cập nhật lần cuối:** 2026-10-11  
> **Giai đoạn hiện tại:** Giai đoạn 1 (MVP Hoàn chỉnh) - Đã hoàn thành toàn bộ các phân hệ lõi  
> **Trạng thái:** Sản phẩm hoàn chỉnh sẵn sàng chạy FE + BE + DB (Có file Schema SQL độc lập).

---

## 📌 1. TIẾN ĐỘ TỔNG QUAN

| Hạng mục / Phân hệ | Tiến độ | Trạng thái | Ghi chú |
| :--- | :---: | :---: | :--- |
| **Quy chuẩn & Kế hoạch Master** | 100% |  Hoàn thành | Đã tạo `PROJECT_MASTER.md`, `AGENTS.md`, `.ai/` |
| **Backend Clean Architecture (.NET 8)** | 100% |  Hoàn thành | Đã tách 4 tầng, build 0 errors ([step-01.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-01-clean-architecture-and-core-database.md)) |
| **PostgreSQL & Schema Script** | 100% |  Hoàn thành | Đã có [erpm_schema.sql](file:///d:/WORKING%20PLACE/ERPm/database/erpm_schema.sql) 403 dòng + Docker compose |
| **Phân hệ ITEM & Danh mục** | 100% |  Hoàn thành | Backend CRUD + Frontend Adaptive UI hoàn chỉnh ([step-02.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-02-frontend-angular-ionic-setup.md)) |
| **Phân hệ Đa ngôn ngữ (i18n)** | 100% |  Hoàn thành | Backend Bundle API + Frontend TranslatePipe & Signal (VI/EN) |
| **Frontend Angular + Ionic Hybrid** | 100% |  Hoàn thành | Hoàn thiện tất cả 5 màn hình, build 0 errors ([step-03.md](file:///d:/WORKING%20PLACE/ERPm/.ai/steps/step-03-full-mvp-sales-inventory-pos.md)) |
| **Phân hệ Bán hàng & POS Touch** | 100% |  Hoàn thành | Giao diện thu ngân POS, giỏ hàng, thanh toán, in hóa đơn nhiệt |
| **Phân hệ Tồn kho (Inventory)** | 100% |  Hoàn thành | Xem tồn tức thời, cảnh báo hết hàng, lập phiếu nhập kho nhanh |
| **Phân hệ Khách hàng (Partner)** | 100% |  Hoàn thành | Danh bạ KH/NCC, phân loại, hạn mức nợ và theo dõi công nợ |
| **Hạt nhân Kế toán (Double-Entry)** | 100% |  Hoàn thành | Tự động sinh bút toán Nợ/Có (111/131/511/632/156) khi bán hàng |
| **Dashboard & Báo cáo KPI** | 100% |  Hoàn thành | Chỉ số doanh thu, tồn kho, công nợ và phím tắt điều hướng nhanh |

---

## 🛠️ 2. CÔNG VIỆC VỪA HOÀN THÀNH (COMPLETED IN STEP 03)
- [x] Tạo đầy đủ các Frontend Services: `StockService`, `SalesService`, `PartnerService`, `DashboardService`.
- [x] Mở rộng từ điển Anh - Việt trong `LocalizationService` bao phủ toàn diện Bán hàng, Tồn kho, Đối tác.
- [x] Xây dựng màn hình **Bán hàng POS (`/sales` -> `PosComponent`)** với Touch Catalog, Barcode Search, Giỏ hàng tính chiết khấu, Modal thanh toán (Tiền mặt, Chuyển khoản, Ghi nợ) và Modal in hóa đơn `window.print()`.
- [x] Xây dựng màn hình **Quản lý Tồn kho (`/inventory` -> `InventoryComponent`)** với bảng số lượng tồn, giá vốn bình quân, tổng giá trị tồn kho, cảnh báo sắp hết hàng và Modal Nhập kho hàng tức thời.
- [x] Xây dựng màn hình **Khách hàng & Đối tác (`/partners` -> `PartnersComponent`)** với danh bạ KH/NCC, theo dõi công nợ, phân loại và Modal tạo mới đối tác.
- [x] Nâng cấp **Dashboard (`/dashboard` -> `DashboardComponent`)** kết nối động tới API KPI, hỗ trợ làm mới trực tiếp.
- [x] Cập nhật định tuyến `app.routes.ts` và kích hoạt toàn bộ menu trên Desktop Sidebar và Mobile Bottom Navigation.
- [x] Xác thực kiểm tra: Cả Backend (`dotnet build ERPm.sln`) và Frontend (`npm run build`) đều biên dịch thành công với **`0 Errors`**.

---

## 🚀 3. SẢN PHẨM HOÀN CHỈNH & HƯỚNG DẪN KHỞI CHẠY
1. **Cơ sở dữ liệu:** File độc lập [database/erpm_schema.sql](file:///d:/WORKING%20PLACE/ERPm/database/erpm_schema.sql) hoặc chạy `docker compose up -d`.
2. **Backend .NET 8 Web API:** Chạy `dotnet run --project src/ERPm.API` (Swagger: `http://localhost:5000/swagger`).
3. **Frontend Angular + Ionic:** Chạy `npm start` trong thư mục `client/` (Web: `http://localhost:4200`).
