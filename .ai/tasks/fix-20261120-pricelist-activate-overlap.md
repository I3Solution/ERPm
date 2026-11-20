# [fix] Bảng giá: Xử lý kích hoạt phiên bản khi đã có phiên bản Active trùng hiệu lực

> **Loại:** bug
> **Ngày tạo:** 2026-11-20 · **Người làm:** Phạm Hữu Lợi · **Người yêu cầu:** QA / Report người dùng
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** S27.5 (`change-20261119-s27-5-pricelist-permissions.md`), nhánh `loipham/fix-pricelist-activate-overlap`
> **Phạm vi:** `ERPm-FE-SD`, `ERPm-FE`, `ERPm-BE` (`system_dictionary.json`), `ERPm`

## 1. Mô tả
- Khi bảng giá có 1 phiên bản đang `Active` (có nút `Đóng`) và 1 phiên bản mới ở trạng thái `Approved` (có nút `Kích hoạt`) trùng khoảng thời gian hiệu lực, bấm `Kích hoạt` ở phiên bản mới bị BE trả lỗi `409` (`error.sd.pricelist_version_overlap`) yêu cầu đóng phiên bản cũ trước.

## 2. Phân tích
- `ERPm-FE/src/app/modules/SD/price-lists/components/price-list-versions/price-list-versions.component.html`: nút `Kích hoạt` ở dòng `Approved` chưa kiểm tra xem có phiên bản `Active` nào đang trùng khoảng hiệu lực và user có quyền `close` hay không.
- BE (`PriceListService.CloseVersionAsync`) yêu cầu `reason` không rỗng khi đóng phiên bản.

## 3. Features / Milestones
- [x] FE SD: Kiểm tra phiên bản `Active` trùng khoảng hiệu lực; nếu có:
  - User có quyền `close`: hiện hộp thoại xác nhận Yes/No, khi đồng ý sẽ tự động đóng phiên bản `Active` cũ (kèm lý do tự động i18n) rồi kích hoạt phiên bản mới.
  - User không có quyền `close`: giữ nút `Kích hoạt` ở trạng thái `disabled` kèm tooltip giải thích.
- [x] i18n VI/EN: Đồng bộ 3 khóa mới (`pl.version_activate_requires_close`, `pl.version_activate_replace_confirm`, `pl.version_auto_close_reason`) giữa `ERPm-FE/src/assets/i18n/system.json` và `ERPm-BE/src/ERPm.Infrastructure/Persistence/Seeders/system_dictionary.json`.
- [x] Unit test & Build: Bổ sung 2 unit test cho 2 nhánh quyền (disable khi thiếu `close`, Yes/No auto-close + activate khi có `close`) và xác minh `ng test`, `check-ui-std.mjs`, `npm run build`.

## 4. Cách làm
- `ERPm-FE/src/app/modules/SD/price-lists/components/price-list-versions/price-list-versions.component.ts`
- `ERPm-FE/src/app/modules/SD/price-lists/components/price-list-versions/price-list-versions.component.html`
- `ERPm-FE/src/app/modules/SD/price-lists/components/price-list-versions/price-list-versions.component.spec.ts`
- `ERPm-FE/src/assets/i18n/system.json`
- `ERPm-BE/src/ERPm.Infrastructure/Persistence/Seeders/system_dictionary.json`

## 5. Kiểm tra
- `npx ng test --watch=false --browsers=ChromeHeadless --include="**/price-list-versions.component.spec.ts"` → **PASS** (`TOTAL: 11 SUCCESS`).
- `node tools/check-ui-std.mjs` → **PASS** (`UI-STD check OK`).
- `npm run build` (`ERPm-FE`) → **PASS** (`Application bundle generation complete`, 0 lỗi).

## 6. Việc còn lại
- Commit, push nhánh `loipham/fix-pricelist-activate-overlap` và mở PR theo thứ tự submodule (`ERPm-BE`, `ERPm-FE-SD` → `ERPm-FE` → `ERPm`), sau đó cập nhật trạng thái `Done`.

## 7. Evidence và cập nhật
- Ngày cập nhật cuối: 2026-11-20
- Đã xác minh: `price-list-versions.component.spec.ts` 11/11 PASS, `UI-STD` PASS.
