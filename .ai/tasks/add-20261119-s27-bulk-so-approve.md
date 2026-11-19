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

## P-TEST
- 2026-11-20, tester độc lập: **QA PASS** BE#93@37633e1, SD#28@dd3cc87, FE#100@bdc5620, root#102@d06ffd4.
- Môi trường: API build riêng :5293 + FE `ng serve` :4293 → DB Docker `erpm_bulk` (:5433). User QA (mật khẩu Erpm@Local2026): `qa_appr` (chỉ duyệt), `qa_rej` (chỉ từ chối), `qa_none` (chỉ xem), `qa_self` (duyệt + từ chối, phạm vi SELF).
- API, 33/33 PASS (sau khi sửa câu SQL của script test, không phải lỗi sản phẩm):
  - Lô lẫn (2 đơn chờ duyệt, 1 Draft, 1 Confirmed, id 999999): kết quả từng đơn đúng; đơn thành công được ghi, đơn khác giữ nguyên.
  - Giữ tồn đúng một lần (+8). Duyệt lại thì báo `invalid_status`, tồn không đổi.
  - Từ chối: đơn về Draft, không giữ tồn, mỗi đơn đúng 1 dòng lịch sử `REJECT_CREDIT` kèm lý do.
  - Trả 400: 101 id, trùng id, lý do trống, danh sách rỗng, lý do >500 ký tự (100 id thì được). Trả 403: qa_rej gọi duyệt, qa_appr gọi từ chối, qa_none gọi cả hai.
  - SELF: đơn của mình thì xong, đơn người khác báo `error.order.not_found`.
  - Duyệt hàng loạt chạy song song với từ chối đơn lẻ trên cùng đơn: 6/6 lần chỉ một bên thắng (4 lần duyệt thắng, 2 lần từ chối thắng; bên thua nhận 409 hoặc `invalid_status`). Tồn kho khớp với bên thắng.
  - Thông báo: mỗi đơn xử lý xong có 1 bộ `SD_ORDER_CREDIT_APPROVED`/`REJECTED`; đơn lỗi không có.
- UI (Playwright), 15/15 PASS:
  - 1366 (qa_appr): nút mờ khi chưa chọn, ẩn nút từ chối. Chọn 3 đơn (1 Confirmed) → hiện "2/3" + "SO0000000003: …"; bỏ chọn; tải lại.
  - qa_none: không có menu "⋯".
  - 390 (qa_rej): lý do trống không gửi được; ra 2/2; bỏ chọn.
  - Không có lỗi JS trên trang.
- `ERPm.Verification`: 664/664 PASS (gồm 4 check bulk + 1 check HTTP 403). `ng test orders.component.spec`: 7/7.
- `SalesAnalyticsComponent rejects an inverted date range` cũng FAIL trên base S27.4 (FE 4d37b65 / SD 0eb3e47), nên lỗi đã có từ trước, không do PR này. Test phụ thuộc ngày: fromDate = 2026-11-20 = hôm nay.
- CI: BE#93, FE#100, root#102 xanh; SD#28 không có check. Ghi chú nhỏ, không chặn: hộp lý do tone danger có tiêu đề "Lỗi" (do DialogService dùng chung).
- Bằng chứng: `C:\Users\222th\AppData\Local\Temp\claude\bd7a213182cf99bf\a723dcff-3b2a-44c9-b72b-ce9219e3f8a9\scratchpad\` (be_cases.txt, ui1.txt, ui2.txt, ui\*.png, verify.log).

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
