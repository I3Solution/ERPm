# [change] FE S22.5.1: Dashboard Doanh số & KPI Bán hàng (ERPm-FE / SD)

> **Loại:** change (Step 22 — Phase 22.5)
> **Ngày tạo:** 2026-11-14 · **Người làm:** Lợi Phạm · **Người yêu cầu:** Phúc / Kế hoạch Step 22
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** Trello [S22.5.1](https://trello.com/c/ZZzkMOCp) · Plan `.ai/plans/plan-step-22-enterprise-sales-distribution.md` (§3.5) · BE log `.ai/steps/step-22-sd-sales-analytics-be.md` · Nhánh `loipham/s22-sales-analytics` (SD, ERPm-FE, ERPm root) & `loipham/s22-sales-analytics-dict` (ERPm-BE)
> **Phạm vi:** `ERPm-FE/src/app/modules/SD` (submodule), `ERPm-FE` (route, menu, `system.json`), `ERPm-BE` (`system_dictionary.json` giữ parity 100%)

## 1. Mô tả
- Hoàn thiện phần Frontend của task S22.5.1 (`Báo cáo Doanh số & KPI Bán hàng`) nối với 3 endpoint Dapper đã merge ở Backend:
  - `GET /api/v1/sales/analytics/summary` (`sd:report:view`)
  - `GET /api/v1/sales/analytics/salesperson-kpi` (`sd:report:view`)
  - `GET /api/v1/sales/analytics/funnel` (`sd:report:view`)

## 2. Phân tích
- BE `SalesAnalyticsService.cs` yêu cầu `from` và `to` có `DateTimeKind.Utc`, khoảng nửa mở `[from, to)`, tối đa `3660` ngày (`error.validation.request` nếu sai). FE đổi ngày local `yyyy-MM-dd` từ `[fromDate, toDate]` sang `[startOfFromDay, startOfNextDay)` theo UTC ISO 8601 (`toISOString()`).
- BE lọc tự động theo `DataScope` và nhận `branchId` (lọc chi nhánh + chi nhánh con). FE liên kết trực tiếp với `BranchService.getActiveBranchIdForQuery()` để đổi chi nhánh ở header là tải lại dashboard ngay.
- `targetRevenue` và `completionRatePercent` hiện có thể `null` từ BE do chưa có bảng chỉ tiêu; FE hiển thị `—` và chú thích phù hợp.
- CI của `ERPm-FE` (`verify.yml`) và root (`verify.yml`) so khớp từng byte giữa `ERPm-FE/src/assets/i18n/system.json` và `ERPm-BE/src/ERPm.Infrastructure/Persistence/Seeders/system_dictionary.json`, nên 47 khóa `menu.sales_analytics` + `sd_analytics.*` (VI/EN) được cập nhật đồng bộ ở cả 2 repo.

## 3. Features / Milestones
- [x] FE DTOs (`SalesAnalyticsQuery`, `SalesSummaryDto`, `SalespersonKpiDto`, `SalesFunnelDto`) và `SalesAnalyticsService` kết nối 3 API thật kèm chuyển đổi khoảng `[from, to)` UTC và hủy request cũ.
- [x] Màn hình `SalesAnalyticsComponent` (`/sales/analytics`, guard `sd:report:view`): bộ lọc kỳ báo cáo (`FormGroup` + `<app-form-control>`), 4 thẻ KPI, biểu đồ phễu chuyển đổi (Báo giá → Đơn bán → Hóa đơn), biểu đồ cơ cấu Doanh thu/Giá vốn/Lợi nhuận, phân bổ trạng thái đơn hàng, xếp hạng & bảng KPI nhân viên (`<app-data-table>` + Mobile cards).
- [x] Sidebar menu (`menu.sales_analytics`) và từ điển VI/EN đồng bộ FE/BE byte-for-byte.
- [ ] Review PR, kiểm thử thực tế với BE + `DataScope` trên môi trường chạy thật và merge vào `master` (merge BE dictionary trước FE).

## 4. Cách làm
- `ERPm-FE/src/app/modules/SD/models/sd.models.ts`
- `ERPm-FE/src/app/modules/SD/services/sales-analytics.service.ts` + `sales-analytics.service.spec.ts`
- `ERPm-FE/src/app/modules/SD/sales-analytics/sales-analytics.component.{ts,html,scss,spec.ts}`
- `ERPm-FE/src/app/modules/SD/.ai/steps/step-22-sales-analytics-fe.md`
- `ERPm-FE/src/app/app.routes.ts`, `ERPm-FE/src/app/app.component.html`
- `ERPm-FE/src/assets/i18n/system.json`, `ERPm-BE/src/ERPm.Infrastructure/Persistence/Seeders/system_dictionary.json`

## 5. Kiểm tra
- Dictionary parity (`ERPm-FE/src/assets/i18n/system.json` vs `ERPm-BE/src/ERPm.Infrastructure/Persistence/Seeders/system_dictionary.json`): byte-for-byte identical, 0 missing VI/EN keys.
- `tsc.cmd --noEmit -p ERPm-FE/tsconfig.spec.json`: 0 error.
- `npm.cmd --prefix ERPm-FE run build`: 0 error.
- `npm.cmd --prefix ERPm-FE test -- --watch=false --browsers=ChromeHeadless`: 232/232 PASS.

## 6. Việc còn lại
- Push các nhánh và tạo PR (`ERPm-BE` dictionary trước, sau đó `ERPm-FE-SD`, `ERPm-FE`, `ERPm` root) khi người dùng yêu cầu.
- Kiểm thử tích hợp với BE live và kiểm tra hiển thị thực tế Light/Dark, Desktop/Mobile trước khi chuyển Trello S22.5.1 sang Done.

## 7. Evidence và cập nhật
- Commit / PR đã merge: Chưa push/merge (đang ở nhánh local).
- CI / workflow run và kết quả: Chưa chạy trên GitHub Actions.
- Ngày cập nhật cuối: 2026-11-14
- Đã xác minh: build FE, TypeScript spec typecheck, Karma/ChromeHeadless unit tests, byte-for-byte dictionary parity. Chưa xác minh: E2E trình duyệt với BE live.
