# [update] SD FE: Phân trang server, summary=true và đồng bộ URL query params (LD.5)

> **Loại:** change
> **Ngày tạo:** 2026-11-13 · **Người làm:** Phúc (Dev 2) · **Người yêu cầu:** BA / Team
> **Trạng thái:** Done
> **Progress aggregation:** v1
> **Liên quan:** [plan Step 24](../plans/plan-step-24-fe-list-detail-and-integration.md) · card Trello LD.5 (`3dxZG6gL`) · commit SD `0cd05e4` · commit FE `518bf90`
> **Phạm vi:** `ERPm-FE/src/app/modules/SD` (orders, quotations, returns, price-lists, services, models)

## 1. Mô tả
- Hoàn thành phần FE của Task LD.5 trong Step 24:
  - Bỏ hardcode `LIST_PAGE_SIZE = 200` và bỏ lọc in-memory (`list.filter(...)`) trên trình duyệt.
  - Tích hợp khung `<app-list-page>` (LD.1) cho cả 4 màn hình: Đơn bán hàng (Orders), Báo giá (Quotations), Phiếu trả hàng (Returns), Bảng giá (Price Lists).
  - Tích hợp `createListQueryState` lưu trữ và đồng bộ state phân trang (`page`, `pageSize`, `q`, `status`, `sort`, `branchId`) lên URL query params để back button và F5 giữ nguyên trạng thái danh sách.
  - Kết nối `sd.service.ts` với BE qua tham số `summary=true` cho Sales Orders, giảm 57% payload mạng.

## 2. Phân tích
- Trước đây: `sd.service.ts` tải cứng 200 bản ghi đầy đủ (bao gồm toàn bộ line items của từng đơn), sau đó các component FE dùng `computed(() => list.filter(...))` lọc client-side.
- Giải pháp:
  - Bổ sung `SdListFilterQuery` vào `sd.models.ts`.
  - Bổ sung các signals metadata phân trang (`ordersTotalCount`, `quotationsTotalCount`, `returnsTotalCount`, `priceListsTotalCount`, `loadError`) vào `SdService`.
  - Xây dựng hàm `buildListParams` gửi query params chuẩn `BaseFilterQuery` (`pageIndex`, `pageSize`, `q`, `status`, `sort`, `summary=true`, `branchId`).
  - Cập nhật 4 màn hình SD sử dụng `<app-list-page>`, lắng nghe `state.query()` và gọi `sdService.loadX(...)`.

## 3. Features / Milestones
- [x] Feature 1 — Mở rộng `SdListFilterQuery` và signals phân trang trong `SdService`.
- [x] Feature 2 — Tích hợp `<app-list-page>` và `createListQueryState` cho màn hình Đơn bán hàng (Orders).
- [x] Feature 3 — Tích hợp `<app-list-page>` và `createListQueryState` cho màn hình Báo giá (Quotations).
- [x] Feature 4 — Tích hợp `<app-list-page>` và `createListQueryState` cho màn hình Phiếu trả hàng (Returns).
- [x] Feature 5 — Tích hợp `<app-list-page>` và `createListQueryState` cho màn hình Bảng giá (Price Lists).
- [x] Feature 6 — Cập nhật unit test specs cho cả 4 components, đạt 100% test pass (196/196 test cases).
- [x] Feature 7 — Build production hoàn tất 0 lỗi (`npm run build`).

## 4. Cách làm
- `ERPm-FE/src/app/modules/SD/models/sd.models.ts`: Thêm `SdListFilterQuery`.
- `ERPm-FE/src/app/modules/SD/services/sd.service.ts`: Cập nhật `loadOrders`, `loadQuotations`, `loadReturns`, `loadPriceLists` nhận filter query và quản lý metadata phân trang.
- `ERPm-FE/src/app/modules/SD/orders/`: Chuyển sang `<app-list-page>`, tích hợp `createListQueryState({ pageSize: 20, filterKeys: ['status'] })`.
- `ERPm-FE/src/app/modules/SD/quotations/`: Chuyển sang `<app-list-page>`, tích hợp `createListQueryState({ pageSize: 20, filterKeys: ['status'] })`.
- `ERPm-FE/src/app/modules/SD/returns/`: Chuyển sang `<app-list-page>`, tích hợp `createListQueryState({ pageSize: 20 })`.
- `ERPm-FE/src/app/modules/SD/price-lists/`: Chuyển sang `<app-list-page>`, tích hợp `createListQueryState({ pageSize: 20, filterKeys: ['status', 'branchId'] })`.
- Cập nhật các spec files tương ứng.

## 5. Kiểm tra
- `npm run build`: Thành công 0 error.
- `npm test -- --watch=false --browsers=ChromeHeadless`: 196/196 tests SUCCESS (0 failure).

## 6. Việc còn lại
- Không.

## 7. Evidence và cập nhật
- Branch SD: `phuc/ld5-sd-fe-server-paging` (commit `0cd05e4`)
- Branch FE: `phuc/ld5-sd-fe-server-paging` (commit `518bf90`)
- Ngày cập nhật cuối: 2026-11-13
