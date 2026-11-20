# [fix] SD: tiêu đề hộp nhập lý do hủy đơn / duyệt nợ hiện "Lỗi"; spec analytics phụ thuộc ngày

> **Pipeline:** stage=TEST · round=BA/TA:1, DEV/TEST:1 · gate=none
> **PR/SHA:** FE-SD#29 @25a0cf9 · FE#101 @d7c0779 · root#104
> **Env:** erpm_d2s274 (Docker PG :5433) · API http://localhost:5296 (ERPm-BE master build, BE không đổi) · FE http://localhost:4296 · admin / Erpm@Local2026
> **Metrics:** BA=?/? · TA=?/? · DESIGN=?/? · DEV=?/? · TEST=? · REPORT=?

> **Loại:** bug
> **Ngày tạo:** 2026-11-20 · **Người làm:** Thiện (AI) · **Người yêu cầu:** Thiện
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** FE-SD#29, FE#101, root#104
> **Phạm vi:** ERPm-FE / module SD (orders, sales-analytics spec)

## 1. Mô tả
- Hộp nhập lý do khi Hủy đơn bán, Từ chối duyệt nợ (1 đơn và nhiều đơn) có tiêu đề "Lỗi".
- Spec `SalesAnalyticsComponent rejects an inverted date range without calling the API` FAIL vào ngày 2026-11-20 vì ngày cứng trùng hôm nay.

## 2. Phân tích
- `DialogService.open` (src/app/core/services/dialog.service.ts) lấy tiêu đề mặc định `dialog.title.<tone>`; tone `danger` = "Lỗi", `warning` = "Cảnh báo". Các lời gọi `dialogs.prompt` ở SD không truyền `title`.
- Spec: set `fromDate=2026-11-20` trước khi set `toDate` → khoảng tạm thời 11-01..11-20 (this_month) hợp lệ → component gọi API đúng hành vi → `expectNone` FAIL. Component đúng, chỉ spec sai.

## 3. Features / Milestones
- [x] Prompt hủy đơn, duyệt/từ chối nợ (1 đơn + nhiều đơn) có tiêu đề đúng hành động.
- [x] Spec khoảng ngày ngược không phụ thuộc ngày hiện tại.
- [ ] Tester xác nhận trên UI.

## 4. Cách làm
- SD: `orders/orders.component.ts`, `orders/order-detail/order-detail.component.ts`, `orders/components/order-detail-drawer/order-detail-drawer.component.ts` thêm `title`; spec orders + order-detail kiểm tra title; `sales-analytics.component.spec.ts` set toDate (2000-01-10) trước fromDate.
- FE: bump pointer SD. Root: bump pointer ERPm-FE + task record.

## 5. Kiểm tra
- `npx ng build`: OK (chỉ warning có sẵn). `npx ng test --watch=false`: 315/315 SUCCESS.

## 6. Việc còn lại
- Chờ tester (TEST) rồi Thiện merge.

## 7. Evidence và cập nhật
- Commit / PR: FE-SD#29 @25a0cf9, FE#101 @d7c0779.
- CI: chờ.
- Ngày cập nhật cuối: 2026-11-20
- Đã xác minh: build + unit test local. Chờ xác minh: UI bởi tester.

## P-BA
- AC1: Hủy đơn (chi tiết + drawer) → tiêu đề "Hủy đơn". AC2: Từ chối duyệt nợ 1 đơn → "Từ chối duyệt nợ"; nhiều đơn → "Từ chối duyệt nợ đơn đã chọn". AC3: Duyệt nợ (1/nhiều) cũng có tiêu đề hành động thay vì "Cảnh báo".
- AC4: spec analytics PASS bất kể ngày chạy. Ngoài phạm vi: đổi tiêu đề mặc định của DialogService, các `confirmDanger` khác.

## P-TA
- Repo: ERPm-FE main @d01f64f, SD master @6dbc9cc (pin cũ 7f3e631 là tổ tiên). BE không đổi.
- Callers `dialogs.prompt`: SD orders (3 file, 7 lời gọi) + ACC voucher-detail (đã có title) → không đổi DialogService, chỉ truyền title tại SD.
- Dùng lại key có sẵn: `so.cancel_order`, `so.reject_credit_btn`, `so.bulk_reject_credit`, `so.approve_credit_btn`, `so.bulk_approve_credit` → không thêm i18n, không cần PR BE dictionary.

## P-DESIGN
- Tiêu đề = nhãn nút hành động (đã có ở vi/en). Không đổi layout.

## P-DEV
- Nhánh `thien/so-reason-dialog-title` ở SD, FE, root. Build OK, ng test 315/315.
- Tester: mở đơn ở trạng thái chờ duyệt nợ → Từ chối duyệt nợ; danh sách chọn nhiều đơn → Từ chối; đơn Draft/Confirmed → Hủy đơn; kiểm tiêu đề vi/en.

## P-TEST
- Kết quả: **QA PASS** @SD 25a0cf9 / FE d7c0779 / root d68fe2d (Tester độc lập, 2026-11-20). Env FE :4296, API :5296, DB erpm_d2s274.
- Playwright 1366 (vi) + 390 (en), script `tests/e2e/_qa104.mjs`, `_qa104r.mjs`: tiêu đề đúng cho Phê duyệt bảo lãnh/Approve Credit, Từ chối duyệt nợ/Reject Credit, Hủy đơn/Cancel Order, Duyệt công nợ đơn đã chọn, Từ chối duyệt nợ đơn đã chọn (+ bản en).
- Lý do bỏ trống → báo lỗi, dialog giữ nguyên (10/10). Hành động chạy: approve → Confirmed/Overridden, reject → Draft, cancel → Cancelled, bulk theo đúng đơn chọn.
- ACC voucher-detail "Hủy/Đảo phiếu"/"Reverse voucher" vẫn đúng tiêu đề (1366, 390).
- `order-detail-drawer` (2/7 lời gọi) không được template nào dùng → chỉ kiểm qua diff, không có đường UI.
- `npx ng test --watch=false`: 315/315 SUCCESS. Spec SalesAnalytics chạy với Date giả lập 2026-11-05, 11-20, 12-31 23:30, 2027-01-01 00:30, 2030-06-15: 5/5 PASS mỗi lần.
- CI: root#104 5/5 pass, FE#101 verify pass, SD#29 không có check.
- Ghi chú môi trường: approve lần đầu lỗi `error.sd.insufficient_available_stock` do kho trống (không phải lỗi PR); đã nhập tồn đầu kỳ rồi kiểm lại.
