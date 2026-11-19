# [add] S27.4 · Ma trận quyền chuyển trạng thái SO

> **Loại:** change
> **Ngày tạo:** 2026-11-19 · **Người làm:** Võ Quốc Thiện (Dev 2 ERPm) · **Người yêu cầu:** Võ Quốc Thiện
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** [plan Step 27 · S27.4](../plans/plan-step-27-sales-controls-and-preferences.md), Trello https://trello.com/c/clYox5Xy; sau S27.4: thẻ uhjNtPC1 (duyệt/từ chối hàng loạt)
> **Phạm vi:** ERPm-BE (SD/IAM: SalesOrdersController, SalesOrderService, SalesOrderInvoicing, PermissionCatalog, SystemRoles, dictionary), submodule SD FE (màn chi tiết SO), ERPm-FE dictionary

## 1. Mô tả
Thao tác đổi trạng thái SO (confirm, approve_credit, từ chối tín dụng, cancel, create-invoice) phải được server kiểm cùng lúc: quyền hiệu lực + phạm vi dữ liệu + trạng thái. UI hiện lý do khi bị chặn. Lý do bắt buộc khi duyệt/từ chối/hủy. Audit ai/khi nào/lý do. Thông báo theo `docs/NOTIFICATION_INTEGRATION_GUIDE.md`.

## 2. Phân tích (BE origin/master @39cd255, root @1d8025a)
Đã có:
- Catalogue `sd:order` = view, create, edit, delete, confirm, approve_credit, cancel; `sd:invoice` = view, create, cancel (`PermissionCatalog.cs:51-52`).
- Endpoint `POST /api/v1/sales/orders/{id}/confirm | approve-credit | cancel | create-invoice` có `RequirePermission`; scope của đúng quyền đó được gắn vào HttpContext cho query filter (`Permissions.cs` PermissionFilter).
- Trạng thái: Draft → Confirmed | PendingApproval (vượt hạn mức) → Confirmed; Draft/PendingApproval/Confirmed → Cancelled (chưa lập HĐ, giải phóng giữ tồn); Confirmed → Completed qua create-invoice (lập HĐ toàn bộ, `SalesOrderInvoicing.cs:26,45`). `Processing` khai báo nhưng chưa có luồng nào đặt.
- Khóa `order:Sales:{id}` trong transaction cho mọi thao tác → hai người thao tác cùng lúc: người sau nhận 409 sai trạng thái.
- Lý do bắt buộc ≤500 ký tự ở approve-credit, cancel. Thông báo SD_ORDER_NEW / CREDIT_PENDING / CREDIT_APPROVED / CANCELLED / INVOICED.

Thiếu:
1. Không có **từ chối tín dụng** (đơn PendingApproval chỉ có thể duyệt hoặc hủy).
2. Không có **lịch sử chuyển trạng thái** (chỉ CreditApprovedBy/At; hủy không lưu ai/khi nào; confirm không lưu ai).
3. Chưa chứng minh scope ở thao tác chuyển trạng thái (ngoài scope phải 404, không 403 lộ tồn tại) → cần test.
4. UI chưa có lý do bị chặn; quyền mặc định chưa tách người tạo/xác nhận/duyệt.

## 2b. Ma trận đề xuất (chờ Thiện duyệt)

### Hành động × trạng thái
| Hành động | Mã quyền | Từ trạng thái | Kết quả | Lý do | Thông báo |
| --- | --- | --- | --- | --- | --- |
| Sửa / xóa nháp | `sd:order:edit` / `sd:order:delete` (có sẵn) | Draft | giữ Draft / soft-delete | – | – |
| Xác nhận | `sd:order:confirm` (có sẵn) | Draft | Confirmed + giữ tồn; vượt hạn mức → PendingApproval | – | SD_ORDER_NEW / SD_ORDER_CREDIT_PENDING |
| Duyệt tín dụng | `sd:order:approve_credit` (có sẵn) | PendingApproval | Confirmed + giữ tồn | bắt buộc | SD_ORDER_CREDIT_APPROVED |
| Từ chối tín dụng | **`sd:order:reject_credit` (mới)** | PendingApproval | theo điểm chốt (b) | bắt buộc | **SD_ORDER_CREDIT_REJECTED (mới)** → người tạo |
| Hủy | `sd:order:cancel` (có sẵn) | Draft / PendingApproval / Confirmed, chưa lập HĐ | Cancelled + giải phóng giữ tồn | bắt buộc | SD_ORDER_CANCELLED |
| Lập hóa đơn | `sd:invoice:create` (có sẵn) | Confirmed | Completed | – | SD_ORDER_INVOICED |
| Xem / lịch sử | `sd:order:view` | mọi trạng thái | – | – | – |

Mọi hành động: tìm đơn trong scope của chính quyền đó (ngoài scope → 404), sai trạng thái → 409 `error.sd.order_invalid_status_for_action`, thiếu quyền → 403. Không dùng quyền xem bảng giá làm điều kiện tính giá (thuộc S27.2).

### Vai trò × quyền mặc định (SystemRoles)
| Vai trò | Hiện tại | Đề xuất | Scope |
| --- | --- | --- | --- |
| ADMIN | `*` | giữ | Group |
| OPERATOR (legacy) | view + `sd:order:confirm`, `sd:invoice:create` | giữ | theo chi nhánh legacy |
| VIEWER | `sd:*:view` | giữ | – |
| SALES_STAFF (người tạo) | view/create/edit | + `sd:order:confirm`, `sd:order:cancel` (chỉ đơn của mình) | Self |
| SALES_ACCOUNTANT | view/edit, `sd:invoice:create`; deny invoice:cancel, order:delete | giữ | theo vị trí |
| BRANCH_DIRECTOR (người duyệt) | `sd:*` | giữ (đã gồm approve_credit, reject_credit, cancel) | BranchTree |

Lưu ý: SALES_STAFF thêm confirm/cancel là đề xuất — Thiện chọn giữ nguyên nếu muốn chỉ cấp trên xác nhận.

### Audit
Bảng mới `tbl_SALE_OrderStatusAudit` (theo mẫu `PriceListVersionAudit` của S27.5): order_id, action, from_status, to_status, reason, actor, at_utc. Ghi trong cùng transaction với thao tác. Detail SO trả thêm danh sách lịch sử. Giữ các cột CreditApprovedBy/At hiện có.

### UI
Nút trên chi tiết SO hiện theo trạng thái; thiếu quyền thì nút bị vô hiệu kèm chú thích "Bạn không có quyền …"; sai trạng thái thì ẩn. Lỗi 403/404/409 từ server hiện đúng thông báo i18n. Duyệt/từ chối/hủy mở hộp nhập lý do bắt buộc.

### Điểm Thiện cần chốt
- (a) Duyệt nghiệp vụ riêng (gửi duyệt / duyệt / từ chối, trạng thái chờ riêng): **đề xuất KHÔNG bật đợt này**, để thẻ sau; S27.4 chỉ làm tín dụng.
- (b) Từ chối tín dụng: **đề xuất trả về Draft** (người tạo sửa số tiền/khách rồi xác nhận lại); phương án khác: đóng thành Cancelled.

### Đã chốt (Thiện, 2026-11-19)
- (a) Không bật duyệt nghiệp vụ riêng đợt này.
- (b) Từ chối tín dụng → trả về **Draft**, lý do lưu vào lịch sử.
- SALES_STAFF thêm `sd:order:confirm` + `sd:order:cancel` (scope Self).
- Hợp đồng giữ tồn S27.1 (Dev 1): `ReserveAsync(order)`/`ReleaseAsync(order)` giữ nguyên chữ ký và chỗ gọi; trả về Draft không reset `WarehouseId`. S27.4 merge trước, S27.1 rebase theo; không sửa `OrderStockReservations`.

## 3. Features / Milestones
- [x] F0 — Thiện duyệt ma trận, chốt (a), (b), quyền mặc định.
- [x] F1 — BE: `reject_credit` (catalogue, endpoint, service, thông báo), audit trạng thái, quyền mặc định, dictionary VI/EN.
- [x] F2 — BE Verification: người tạo/xác nhận/duyệt/hủy/chỉ xem/ngoài scope, API trực tiếp, sai trạng thái, đồng thời, hủy giải phóng giữ tồn.
- [x] F3 — FE SD: nút theo quyền + trạng thái, lý do bị chặn, hộp lý do, lịch sử; dictionary FE.
- [ ] F4 — Tester 2 PASS.

## 4. Cách làm
- BE#92 (thien/s27-4-so-status-permissions @cb132a6): PermissionCatalog/SystemRoles, SalesOrderStatusAudit + migration `20261119120703_AddSalesOrderStatusAudit`, SalesOrderService (RejectCreditAsync, GetStatusHistoryAsync, RecordStatus), SalesOrderInvoicing (audit INVOICE), SalesOrdersController (reject-credit, status-history), NotificationTemplateSeeder (SD_ORDER_CREDIT_REJECTED), dictionary 12 khóa.
- SD#27 (@0eb3e47): order-detail nút từ chối + gợi ý khi không có quyền duyệt + lịch sử; sd.service, sd.models, spec.
- FE#99 (@4d37b65, base `main`): dictionary + con trỏ SD.
- Nhánh `thien/s27-4-so-status-permissions` (root, BE, SD FE), worktree riêng, DB local Docker :5433.
- Phụ thuộc S27.1 (Dev 1): hủy/duyệt gọi `OrderStockReservations.ReserveAsync/ReleaseAsync`; hỏi hợp đồng giữ tồn/kho trước khi sửa luồng hủy. Ghép PR SD/BE tuần tự với S27.1/S27.2.

## 5. Kiểm tra
- BE Verification (PostgreSQL :5433): 656 PASS / 0 FAIL; mới: từ chối → Draft không giữ tồn, lịch sử, ngoài scope 404, sai trạng thái 409, duyệt + từ chối đồng thời chỉ một thắng, SALES_STAFF mặc định.
- HTTP thử (:5174, DB erpm_d2s274): reject-credit/approve-credit/cancel đơn không có → 404, không token → 401; template SD_ORDER_CREDIT_REJECTED đã seed.
- FE: tsc OK, ng build dev OK, check-ui-std OK, order-detail spec 10/10.
- Chưa: E2E trình duyệt theo vai trò (Tester 2).

## 6. Việc còn lại
- Tester 2 kiểm theo vai trò (tạo/xác nhận/duyệt/hủy/chỉ xem/ngoài scope), desktop + mobile.
- ERPm-FE tích hợp vào `main` (Thiện chốt 2026-11-19); FE#99 base `main`.

## 7. Evidence và cập nhật
- PR mở: ERPm-BE#92, ERPm-FE-SD#27, ERPm-FE#99 (chưa merge, chờ Thiện)
- CI / workflow run và kết quả: chưa
- Ngày cập nhật cuối: 2026-11-19
