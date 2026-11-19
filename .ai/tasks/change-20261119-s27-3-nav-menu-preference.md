# [change] S27.3 Nhớ nhóm menu mở hoặc thu theo tài khoản

> **Loại:** change
> **Ngày tạo:** 2026-11-19 · **Người làm:** Phạm Hữu Lợi · **Người yêu cầu:** Step 27 Plan (Phúc / ERPm)
> **Trạng thái:** Done
> **Progress aggregation:** v1
> **Liên quan:** Step 27 (`plan-step-27-sales-controls-and-preferences.md`), Trello [#125](https://trello.com/c/t0ChToZx), `ERPm-FE` PR #96 (merged `98bf18f`, commit `c03ece9`), nhánh `loipham/s27-3-nav-menu-preference`
> **Phạm vi:** `ERPm-FE` (`src/app/core/services/navigation-preference.service.ts`, `src/app/shared/components/module-navigation/*`, `FE_UI_GUIDE.md`)

## 1. Mô tả
- **Trước đây:** `ModuleNavigationComponent` lưu trạng thái mở/thu các nhóm menu (`sales`, `warehouse`, `accounting`, `hr`, `admin`) trong `linkedSignal` cục bộ của từng instance component. Khi tải lại trang, đóng/mở trình duyệt, đăng xuất/đăng nhập lại hoặc chuyển qua lại giữa sidebar desktop và trang Thêm (`/more`) trên mobile, trạng thái không được lưu và không đồng bộ; đồng thời việc tự mở nhóm theo route đang xem bị trộn chung vào trạng thái cục bộ.
- **Yêu cầu mới:** Tạo preference phiên bản hóa theo định danh tài khoản (`account.id`) trên `localStorage`, dùng chung cho sidebar desktop và trang Thêm (`/more`) trên mobile. Lưu ID nhóm ổn định, loại bỏ nhóm đã xóa và tôn trọng quyền hiện tại. Route truy cập trực tiếp mở tạm nhánh chứa trang hiện tại mà không ghi đè lựa chọn thủ công (Phương án A: bấm thu nhóm đang active sẽ thu ngay trong phiên hiện tại và gỡ khỏi preference nếu có; khi tải lại hoặc điều hướng rời khỏi nhóm rồi quay lại sẽ mở tạm lại). Xử lý an toàn dữ liệu cũ/hỏng hoặc `localStorage` bị chặn.

## 2. Phân tích
- `ModuleNavigationComponent` ([module-navigation.component.ts](../../ERPm-FE/src/app/shared/components/module-navigation/module-navigation.component.ts)) được dùng tại 2 vị trí:
  1. Sidebar desktop trong `AppComponent` (`ERPm-FE/src/app/app.component.html`).
  2. Trang Thêm (`/more`) trên mobile trong `ModuleMenuComponent` (`ERPm-FE/src/app/modules/SYS/module-menu/module-menu.component.html`).
- `AuthService.account()` cung cấp `Account.id` ổn định sau `GET /api/v1/auth/me` (và về `null` khi đăng xuất).
- Thiết kế `NavigationPreferenceService` (singleton `providedIn: 'root'`):
  - Key theo tài khoản: `erpm_nav_expanded:account:${accountId}` với payload phiên bản hóa `{ version: 1, expanded: string[] }`.
  - Dùng `linkedSignal` theo `accountId` để tự động nạp preference khi đăng nhập/tải lại/đổi tài khoản và reset state in-memory khi đăng xuất (không xóa dữ liệu đã lưu của tài khoản cũ).
  - Tách bạch trạng thái lưu thủ công (`persistedExpanded`) với trạng thái mở tạm theo route active và trạng thái thu tạm nhóm đang active (`suppressedActiveGroup`, chỉ giữ in-memory, reset khi đổi nhóm active, đổi tài khoản hoặc tải lại trang).
  - Bọc mọi thao tác `localStorage` bằng `try/catch`; bỏ qua JSON hỏng / version không khớp / phần tử không hợp lệ; lọc ID nhóm đã xóa và nhóm không có quyền.

## 3. Features / Milestones
- [x] Tạo `NavigationPreferenceService` lưu preference phiên bản hóa theo tài khoản (`account.id`), chịu lỗi storage bị chặn / dữ liệu cũ / hỏng và đồng bộ giữa các instance (sidebar desktop & trang Thêm mobile).
- [x] Cập nhật `ModuleNavigationComponent` đọc/ghi qua `NavigationPreferenceService`, tách mở tạm theo route trực tiếp với lựa chọn thủ công (Phương án A), loại nhóm đã xóa và tôn trọng quyền hiện tại.
- [x] Viết unit tests (`navigation-preference.service.spec.ts`, `module-navigation.component.spec.ts`) phủ 2 tài khoản trên cùng trình duyệt, reload/logout/login, desktop/mobile sync, mất quyền, dữ liệu cũ/hỏng và storage bị chặn.
- [x] Cập nhật `ERPm-FE/FE_UI_GUIDE.md` ghi rõ quy ước lưu preference và hành vi thu nhóm đang active / tải lại.
- [x] Kiểm thử đầy đủ: `npm run build` (PASS), `ng test` ChromeHeadless S27.3 (PASS 12/12), `node tools/check-ui-std.mjs` (PASS); đã merge `ERPm-FE` PR #96 (`98bf18f`) và cập nhật gitlink + `workspace-map.yaml`.

## 4. Cách làm
- Tạo mới (`ERPm-FE`):
  - `ERPm-FE/src/app/core/services/navigation-preference.service.ts`
  - `ERPm-FE/src/app/core/services/navigation-preference.service.spec.ts`
  - `ERPm-FE/src/app/shared/components/module-navigation/module-navigation.component.spec.ts`
- Cập nhật (`ERPm-FE`):
  - `ERPm-FE/src/app/shared/components/module-navigation/module-navigation.component.ts`
  - `ERPm-FE/src/app/shared/components/module-navigation/module-navigation.component.html`
  - `ERPm-FE/FE_UI_GUIDE.md`
- Cập nhật (umbrella `ERPm`):
  - Cập nhật gitlink `ERPm-FE` → `98bf18fa7c793ca091f750167c854a26de3a05cc`
  - `.ai/context/workspace-map.yaml`
  - `.ai/tasks/change-20261119-s27-3-nav-menu-preference.md`

## 5. Kiểm tra
- `node tools/check-ui-std.mjs` → **PASS** (`UI-STD check OK`).
- Angular unit tests (`ChromeHeadless`, `navigation-preference.service.spec.ts` + `module-navigation.component.spec.ts`) → **PASS** (`TOTAL: 12 SUCCESS`, `0.169s`):
  - `NavigationPreferenceService` (7/7): lưu/nạp phiên bản hóa theo `account.id` qua reload; tách 2 tài khoản & giữ storage khi logout; lọc ID nhóm đã xóa; chịu JSON hỏng/schema cũ/sai version; chịu `localStorage` bị chặn; tách `suppressedActive` in-memory; đồng bộ sự kiện `storage` giữa các tab.
  - `ModuleNavigationComponent` (5/5): đồng bộ 2 instance sidebar desktop & trang Thêm `/more`; mở tạm route trực tiếp không ghi đè lựa chọn thủ công; Phương án A khi thu nhóm đang active / chuyển nhánh con / rời đi quay lại / reload; lọc nhóm mất quyền và ID đã xóa; đổi 2 tài khoản trên cùng trình duyệt.
- `ng build` (production) → **PASS** (`Application bundle generation complete`, 0 lỗi, 0 cảnh báo trên các file sửa đổi).

## 6. Việc còn lại
- Không. (PR umbrella `ERPm` đồng bộ gitlink `ERPm-FE` `98bf18f` và task record này.)

## 7. Evidence và cập nhật
- Commit / PR đã merge: `I3Solution/ERPm-FE#96` (commit `c03ece9`, merge commit `98bf18fa7c793ca091f750167c854a26de3a05cc`).
- CI / workflow run và kết quả: Local verification PASS (`UI-STD check OK`, 12/12 `ChromeHeadless` unit tests PASS, `ng build` production PASS); `ERPm-FE` PR #96 đã merge vào `master`.
- Ngày cập nhật cuối: 2026-11-19
- Đã xác minh: `UI-STD check OK`, 12/12 unit tests `ChromeHeadless` PASS, `ng build` production PASS, `ERPm-FE` PR #96 đã merge và pin gitlink `98bf18f` tại repo gốc `ERPm`.
