# [add] SD UI-STD: duyệt hoặc từ chối công nợ nhiều đơn bán hàng

> **Pipeline:** stage=TEST · round=BA/TA:1, DEV/TEST:1 · gate=none
> **PR/SHA:** BE#93 @37633e1 · FE-SD#28 @dd3cc87 · FE#100 @bdc5620
> **Env:** erpm_bulk (Docker PG :5433, tạo từ template erpm_uistd) · API http://localhost:5275 · FE http://localhost:4275
> **Metrics:** BA=?/? · TA=?/? · DESIGN=?/? · DEV=?/? · TEST=? · REPORT=?

> **Loại:** change
> **Ngày tạo:** 2026-11-19 · **Người làm:** Thiện (AI) · **Người yêu cầu:** Trello uhjNtPC1
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** S27.4 (BE#92, FE-SD#27, FE#99, ERPm#101) — PR này xếp chồng lên nhánh `thien/s27-4-so-status-permissions`
> **Phạm vi:** ERPm-BE (SalesOrdersController, IOrderApproval, SalesOrderService, DTO, dictionary, Verification); ERPm-FE-SD (orders list, sd.service, models); ERPm-FE (dictionary, gitlink SD)

## 1. Mô tả
Màn danh sách Đơn bán hàng đã có chọn nhiều dòng (UI-STD) nhưng chưa có hành động. Thêm "Duyệt công nợ" và "Từ chối duyệt nợ" cho các đơn đã chọn, một lý do chung, kết quả từng đơn.

## 2. Phân tích
Xem P-TA.

## 3. Features / Milestones
- [x] F1 — API `POST /api/v1/sales/orders/bulk/approve-credit|reject-credit` {ids, reason} → kết quả từng đơn {id, success, errorCode}.
- [x] F2 — Mỗi đơn chạy đúng hàm đơn lẻ S27.4 trong transaction riêng; một đơn lỗi không làm hỏng đơn khác; tối đa 100 đơn; lý do bắt buộc.
- [x] F3 — FE: 2 hành động trên action-bar của list-page, cần chọn dòng, ẩn theo quyền; hỏi lý do; báo số thành công và lỗi từng đơn; xoá chọn và tải lại.
- [x] F4 — Verification + ng test cho trộn thành công/lỗi, sai trạng thái, không có quyền.

## P-BA
- Ai: người có `sd:order:approve_credit` / `sd:order:reject_credit` (quyền S27.4).
- AC1: chọn ≥1 đơn trên trang → menu "⋯" có "Duyệt công nợ đơn đã chọn" / "Từ chối duyệt nợ đơn đã chọn"; không chọn thì nút mờ; không quyền thì ẩn.
- AC2: bấm → hỏi lý do (bắt buộc, ≤500 ký tự) → gửi một lần.
- AC3: đơn `PendingApproval` trong phạm vi dữ liệu được duyệt/từ chối như thao tác đơn lẻ (lịch sử trạng thái, thông báo, giữ tồn khi duyệt).
- AC4: đơn sai trạng thái / ngoài phạm vi / hết tồn báo lỗi riêng theo số đơn, đơn khác vẫn xong.
- AC5: không quyền → 403 cả yêu cầu. Danh sách rỗng, trùng ID, >100 ID, lý do trống → 400.
- Ngoài phạm vi: duyệt nhiều trang cùng lúc (chọn chỉ trong trang hiện tại theo FE_UI_GUIDE), hủy hàng loạt, xác nhận hàng loạt.

## P-TA
- Repo/SHA gốc: BE `thien/s27-4-so-status-permissions`@cb132a6; FE @4d37b65; FE-SD @0eb3e47; root @7b62dbf.
- BE: `IOrderApproval.DecideCreditManyAsync` (Application) → `SalesOrderService` lặp gọi `ApproveCreditAsync`/`RejectCreditAsync`; mỗi lần là `PostingTransaction.RunAsync` riêng (clear tracker + transaction + advisory lock theo đơn). Bắt `BusinessException` → errorCode; lỗi hệ thống khác vẫn ném (đơn đã xong trước đó giữ nguyên).
- Quyền: `[RequirePermission(":approve_credit"|":reject_credit")]` trên endpoint (cùng quyền endpoint đơn lẻ); phạm vi dữ liệu kiểm từng đơn qua `FindEntityAsync` (ngoài phạm vi = `error.order.not_found`).
- Không đổi schema/migration. Không đổi contract cũ.
- FE: `orders.component` đã có `createListSelection` + `app-list-page` `[selectedCount]`; `PageAction.requiresSelection` có sẵn trong `app-action-bar`.
- Test: BE build, `tests/ERPm.Verification` (service + HTTP 403), FE `ng build`, `ng test`.

## P-DESIGN
- Dùng `app-action-bar` qua `headerActions` của `app-list-page`: 2 hành động phụ (vào menu "⋯"), `requiresSelection`, `permission`, từ chối có `danger`.
- Hộp lý do: `DialogService.prompt` (tone warning cho duyệt, danger cho từ chối), giống màn chi tiết S27.4.
- Kết quả: `dialogs.success` khi tất cả xong; `dialogs.warning` liệt kê `Số đơn: lỗi` (message `white-space: pre-line`).
- i18n mới: `so.bulk_approve_credit`, `so.bulk_reject_credit`, `so.bulk_approve_credit_confirm`, `so.bulk_reject_credit_confirm`, `so.bulk_done` (vi/en), BE = FE byte-identical. Không thêm CSS.

## P-DEV
- BE: `SalesOrderDtos.cs` (+BulkOrderActionRequest, BulkOrderActionResultDto), `IOrderApproval.cs`, `SalesOrderService.cs` (`BulkLimit=100`, `DecideCreditManyAsync`), `SalesOrdersController.cs` (2 endpoint), `system_dictionary.json`, `tests/ERPm.Verification/Program.cs` (+4 check bulk + 1 HTTP 403).
- FE-SD: `orders.component.ts` (`decideCredit`), `sd.service.ts` (`decideCreditMany`), `sd.models.ts`, `orders.component.spec.ts` (+2 test).
- FE: `src/assets/i18n/system.json` copy từ BE, gitlink SD.
- Kiểm tra: xem §5.

## 4. Cách làm
- DB test: `CREATE DATABASE erpm_bulk TEMPLATE erpm_uistd` trên Docker :5433, API `-- --migrate`.

## 5. Kiểm tra
- BE build: 0 error, 0 warning.
- ERPm.Verification: VERIFIED 664 checks (gồm 3 check bulk service + 1 check HTTP 403).
- FE: ng build OK; UI-STD check OK; ng test 314/315 (1 lỗi có sẵn, phụ thuộc ngày: SalesAnalyticsComponent inverted date range, file không đụng); orders spec 7/7.

## 6. Việc còn lại
- TEST độc lập bởi tester; chờ S27.4 merge trước rồi rebase/đổi base PR về master/main.

## 7. Evidence và cập nhật
- PR: ERPm-BE#93, ERPm-FE-SD#28, ERPm-FE#100 (stacked trên S27.4 BE#92/FE-SD#27/FE#99/ERPm#101)
- BE đã nhận commit S27.4 d91101a (migration 20261119130655, chỉ dữ liệu); không có migration riêng. Verification chạy lại: VERIFIED 664 checks; erpm_bulk đã migrate tới 20261119130655.
- Ngày cập nhật cuối: 2026-11-20
- Đã triển khai + tự kiểm; chưa qua TEST độc lập.
