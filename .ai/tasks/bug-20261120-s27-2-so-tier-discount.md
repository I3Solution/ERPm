# [bug] S27.2 Auto-apply quantity-tier discounts on SO

> **Loại:** bug
> **Ngày tạo:** 2026-11-20 · **Người làm:** loipham · **Người yêu cầu:** Trello S27.2
> **Trạng thái:** Done
> **Progress aggregation:** v1
> **Liên quan:** Branch `loipham/s27-2-so-tier-discount` (root `7954014a`, BE `ccf0b4d9`, FE `d01f64f0`, SD submodule `7f3e631c`)
> **Phạm vi:** `ERPm-FE/src/assets/i18n/system.json`, `ERPm-FE/src/app/modules/SD` (`models/sd.models.ts`, `services/sd.service.ts`, `price-lists/`, `orders/order-detail/`)

## 1. Mô tả
- Khi tạo/sửa Đơn bán hàng (SO) ở trạng thái nháp (`Draft`), FE trước đây không tự động gọi API `calculate-price` để áp dụng chiết khấu bậc thang theo số lượng (theo `%` hoặc số tiền cố định `discountAmount`) và chưa truyền `priceListId` khi lưu SO.
- Màn hình Bảng giá (`PriceList`) mới chỉ hỗ trợ cột `% Chiết khấu` (`discountPercent`), chưa có cột/ô nhập riêng cho `Chiết khấu cố định` (`discountAmount`).

## 2. Phân tích
- `ERPm-FE/src/app/modules/SD/services/sd.service.ts`: `saveOrder` chưa truyền `priceListId`, `applyPriceList`, `orderDate` và metadata giá dòng; `calculatePrice` chưa gửi `priceListId`, `documentDate`, `uomId`; `savePriceList` chưa gửi `discountAmount`.
- `ERPm-FE/src/app/modules/SD/price-lists/`: cả `PriceListItemsComponent` và `PriceListVersionLinesComponent` chưa có trường `discountAmount`.
- `ERPm-FE/src/app/modules/SD/orders/order-detail/order-detail.component.ts`: chưa có luồng reactive gọi `calculatePrice` khi chọn sản phẩm, quét/gộp dòng, đổi số lượng, khách hàng, chi nhánh, bảng giá hoặc ngày hiệu lực (`orderDate`), và chưa bảo vệ chống race condition / giữ snapshot cho đơn đã xác nhận / kiểm tra quyền sửa giá.

## 3. Features / Milestones
- [x] Tạo/checkout nhánh `loipham/s27-2-so-tier-discount` trên `ERPm-FE` và submodule `ERPm-FE/src/app/modules/SD`.
- [x] Màn hình Bảng giá: bổ sung cột và input riêng cho Chiết khấu cố định (`discountAmount`) song song với `% Chiết khấu` (`discountPercent`) trên `PriceListItemsComponent`, `PriceListVersionLinesComponent`, và `PriceListDetailComponent`.
- [x] `sd.models.ts` & `sd.service.ts`: đồng bộ DTO với BE (`PriceListDtos.cs`, `SalesOrderDtos.cs`), truyền `priceListId` và metadata giá trong `saveOrder`, `CalculatePriceRequest` (`priceListId`, `uomId`, `documentDate`), và `PriceListVersionLineRequest` (`discountAmount`).
- [x] `OrderDetailComponent`: tự động gọi `calculatePrice` cho SO `Draft` khi chọn sản phẩm, quét/gộp dòng, đổi số lượng, khách hàng, chi nhánh, bảng giá hoặc ngày hiệu lực; chống race condition bằng `switchMap` + sequence counter; giữ nguyên snapshot cho đơn đã `Confirmed`/không phải `Draft`; phân quyền sửa giá (`canEditPrice()`); đồng bộ key i18n VI/EN.
- [x] Cập nhật unit test `order-detail.component.spec.ts` (bao gồm biên `99 -> 100 -> 101 -> 99` cho cả `%` và số tiền cố định, chống race condition, giữ snapshot đơn `Confirmed`, kiểm tra quyền sửa giá), chạy test và FE build đạt PASS.

## 4. Cách làm
- File đã sửa:
  - `ERPm-FE/src/app/modules/SD/models/sd.models.ts`
  - `ERPm-FE/src/app/modules/SD/services/sd.service.ts`
  - `ERPm-FE/src/app/modules/SD/price-lists/components/price-list-items/price-list-items.component.ts`
  - `ERPm-FE/src/app/modules/SD/price-lists/components/price-list-items/price-list-items.component.html`
  - `ERPm-FE/src/app/modules/SD/price-lists/components/price-list-version-lines/price-list-version-lines.component.ts`
  - `ERPm-FE/src/app/modules/SD/price-lists/components/price-list-version-lines/price-list-version-lines.component.html`
  - `ERPm-FE/src/app/modules/SD/price-lists/price-list-detail/price-list-detail.component.ts`
  - `ERPm-FE/src/app/modules/SD/orders/order-detail/order-detail.component.ts`
  - `ERPm-FE/src/app/modules/SD/orders/order-detail/order-detail.component.html`
  - `ERPm-FE/src/app/modules/SD/orders/order-detail/order-detail.component.spec.ts`
  - `ERPm-FE/src/assets/i18n/system.json`
- Lệnh đã chạy (với Node `v22.23.5`):
  - `npx ng test --watch=false --browsers=ChromeHeadless --include="src/app/modules/SD/orders/order-detail/order-detail.component.spec.ts"`
  - `npm run build`

## 5. Kiểm tra
- Unit test `order-detail.component.spec.ts`: **PASS 15/15** (bao gồm 5 test mới cho S27.2: biên `99/100/101/99` theo `%`, biên `99/100/101/99` theo số tiền cố định + gộp dòng + lưu `priceListId`, hủy request cũ chống race condition, giữ nguyên snapshot trên đơn `Confirmed`, và kiểm tra quyền `canEditPrice()`).
- Build `ERPm-FE` (`npm run build`): **PASS** (0 lỗi biên dịch, không có warning mới ở module SD).

## 6. Việc còn lại
- Chưa commit/push (chờ review và đồng bộ commit submodule `SD` -> `ERPm-FE` -> `ERPm-BE` -> root repo).

## 7. Evidence và cập nhật
- Commit / PR đã merge: Chưa commit (working tree đã sẵn sàng trên nhánh `loipham/s27-2-so-tier-discount`).
- CI / workflow run và kết quả: Local `ng test` (15/15 SUCCESS), local `npm run build` (Application bundle generation complete).
- Ngày cập nhật cuối: 2026-11-20
- Phần FE đã hoàn tất triển khai và xác minh đầy đủ qua unit test + production build.
