# 📱 Step Log: B1 - Mục "Quản trị" trên thanh menu dưới (Mobile Bottom Navigation & Admin Hub)

- **Ngày thực hiện:** 2026-11-02
- **Người thực hiện:** Thiện (Developer)
- **Mã Task / Trello:** [B1](https://trello.com/c/raopDQNF/24-addfe-b1-m%E1%BB%A5c-qu%E1%BA%A3n-tr%E1%BB%8B-tr%C3%AAn-thanh-menu-d%C6%B0%E1%BB%9Bi-mobile) — Plan Step 20 §6 ưu tiên #5.
- **Trạng thái:** Hoàn thành (100% build & verification passed).

---

## 🎯 1. Mục tiêu
1. Bổ sung tab **"Thêm"** (`menu.more`) ở cuối thanh menu dưới (`.mobile-bottom-bar`) trên giao diện mobile (< 768px).
2. Xây dựng màn hình **Trung tâm Quản trị (`AdminHubComponent`)** tại `/admin` (với alias `/more` chuyển hướng) hiển thị danh sách trực quan các phân hệ quản trị theo nhóm:
   - **Tổ chức & Nhân sự:** Cơ cấu tổ chức (`/org`), Chức danh (`/job-positions`), Nhân viên (`/employees`).
   - **Hệ thống & Bảo mật:** Tài khoản (`/users`), Vai trò & phân quyền (`/roles`), Mẫu thông báo (`/notifications/templates`).
3. Đảm bảo toàn bộ 6 card quản trị kiểm tra quyền động qua `auth.can(...)`:
   - Ẩn/hiện card tức thì theo quyền hạn của tài khoản đăng nhập.
   - Hiển thị thông báo trạng thái rỗng thân thiện (`admin_hub.empty`) khi tài khoản không có quyền quản trị nào.
4. Tab "Thêm" trên mobile tự động highlight active khi người dùng đang ở `/admin` hoặc bất kỳ màn hình quản trị con nào (`/org`, `/job-positions`, `/employees`, `/users`, `/roles`).
5. Thiết kế Responsive Adaptive, chuẩn Dark Mode Design System tokens (`--erpm-*`, `--surface-*`), vùng chạm tối thiểu 44px theo hướng dẫn mobile accessibility (a11y).
6. Đồng bộ 100% từ điển song ngữ VI/EN trên cả `ERPm-FE` (`system.json`) và `ERPm-BE` (`system_dictionary.json`).

---

## 📁 2. Danh sách file thay đổi & tạo mới

### Frontend (`ERPm-FE`):
- `src/app/modules/SYS/admin-hub/admin-hub.component.ts`: Logic component trung tâm quản trị, định nghĩa danh mục module và kiểm tra `auth.can()`.
- `src/app/modules/SYS/admin-hub/admin-hub.component.html`: Template responsive grid với card điều hướng, icon và mô tả.
- `src/app/modules/SYS/admin-hub/admin-hub.component.scss`: Styles adaptive grid (1 cột mobile, 2-3 cột desktop/tablet), card hover/tap active, dark mode tokens.
- `src/app/modules/SYS/admin-hub/admin-hub.component.spec.ts`: Unit test kiểm tra render đầy đủ 6 màn, lọc theo `auth.can()` và fallback rỗng.
- `src/app/app.routes.ts`: Thêm route `/admin` (load `AdminHubComponent` với `authGuard`) và route redirect `/more` -> `/admin`.
- `src/app/app.component.html`: Bổ sung tab "Thêm" vào `.mobile-bottom-bar` với điều kiện `auth.canAny(...)`, đồng thời đồng bộ `sys:role:view` vào sidebar desktop.
- `src/app/app.component.ts`: Bổ sung hàm `isAdminRouteActive()` để highlight tab khi mở các trang quản trị.
- `src/app/app.component.scss`: Tối ưu CSS `.bottom-tab` (flex-grow, padding, text-overflow) thích ứng 6 tab không tràn ngang trên màn hình siêu hẹp.
- `src/app/app.component.spec.ts`: Unit test cho logic `isAdminRouteActive()`.
- `src/assets/i18n/system.json`: Bổ sung các nhãn `menu.more`, `admin_hub.*` (VI/EN).

### Backend (`ERPm-BE`):
- `src/ERPm.Infrastructure/Persistence/Seeders/system_dictionary.json`: Đồng bộ các khóa `menu.more`, `admin_hub.*` (VI/EN).

---

## 🧪 3. Kết quả kiểm tra (Verification)
1. **Frontend Unit Tests (Karma):**
   - Lệnh: `npm.cmd test -- --watch=false --browsers=ChromeHeadless`
   - Kết quả: **101/101 tests SUCCESS (100% PASS)**.
2. **Frontend Production Build:**
   - Lệnh: `npm.cmd run build`
   - Kết quả: **0 error, build thành công** (`chunk-SEALJTVV.js | admin-hub-component | 7.87 kB`).
3. **Backend Solution Build:**
   - Lệnh: `dotnet build`
   - Kết quả: **0 warning, 0 error**.
4. **Backend Verification:**
   - Lệnh: `dotnet run --project tests/ERPm.Hrm.Verification/ERPm.Hrm.Verification.csproj`
   - Kết quả: **28/28 HRM checks PASS**.

---

## 🚀 4. Hướng đi tiếp theo
- Tick checklist nghiệm thu và chuyển card Trello sang Done.
- Merge nhánh vào master của `ERPm-FE`, `ERPm-BE` và `ERPm`.
- Tiếp tục thực hiện các task tiếp theo trong Sprint Step 20 (§6 ưu tiên #6: E2E Playwright hoặc #7: DepartmentId chứng từ).
