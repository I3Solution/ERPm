# [change] S27.8 Dùng Branch Settings cho kho phục vụ SO

> **Pipeline:** stage=TEST · round=BA/TA:1, DEV/TEST:1 · gate=none
> **PR/SHA:** BE I3Solution/ERPm-BE#99 @a67c9df · WMS I3Solution/ERPm-FE-WMS#9 @87fc49c · FE I3Solution/ERPm-FE#106 @0a0b8c5 · root (PR này)
> **Env:** API http://localhost:5308 (DB Docker `erpm_s278` = template `erpm_uistd` + migrate), FE http://localhost:4308 (proxy → 5308), đăng nhập `admin`
> **Metrics:** BA=? · TA=? · DESIGN=?/5p · DEV=?/120p · TEST=? · REPORT=?

> **Loại:** change
> **Ngày tạo:** 2026-11-21 · **Người làm:** Võ Quốc Thiện (AI BA/TA) · **Người yêu cầu:** Phúc (giao qua Trello)
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** Trello https://trello.com/c/otwGGI11 · [plan Branch Settings](../plans/plan-step-27-branch-settings.md) · [API contract](../../docs/BRANCH_SETTINGS_API_CONTRACT.md) §4 · [planning](change-20261121-s27-branch-settings-planning.md) · [S27.1](change-20261119-s27-1-so-serving-warehouse.md) · phụ thuộc S27.6 (BE nền, `thien/s27-6-branch-settings`) và S27.7 (FE shell, Lợi, Todo)
> **Phạm vi:** ERPm-BE WMS/SD (ServingWarehouses, StockService, StockController, OrderStockReservations, SalesOrderService, SalesPostingService, migration), ERPm-FE WMS (editor kho phục vụ), SD (form SO, chỉ thông báo lỗi), dictionary VI/EN

## 1. Mô tả
- Cũ (S27.1): mỗi chi nhánh có danh sách kho phục vụ riêng trong `tbl_WMS_BranchServingWarehouse`. Không có dòng nghĩa là dùng kho của chính chi nhánh. Không kế thừa từ cấp cha.
- Mới: kho xuất SO thành key module `wms.so_warehouse_policy` của Branch Settings. Mỗi đơn vị chọn **Kế thừa**, **Danh sách chỉ định** (`fixed_list`) hoặc **Kho của đơn vị lập SO** (`own_warehouses`). Mọi caller dùng một resolver. Dữ liệu S27.1 giữ nguyên và API cũ chạy qua adapter.

## 2. Phân tích
Chi tiết ở `P-BA` và `P-TA`.

## 3. Features / Milestones
- [x] F1 BE: bảng `tbl_WMS_BranchWarehousePolicy` + migration backfill từ dữ liệu S27.1, không đổi kho hiệu lực của chi nhánh nào; Down an toàn.
- [x] F2 BE: resolver kế thừa (local → cha gần nhất trong cùng công ty → fallback `own_warehouses`), trả nguồn và trạng thái `invalid`; mọi caller SO/WMS dùng resolver này.
- [x] F3 BE: API WMS mới (`includePolicy`, `preview`, PUT có mode + `If-Match` + lý do) và adapter cho GET/PUT cũ; cùng quyền, scope IAM, lịch sử.
- [x] F4 BE: guard gỡ kho đang giữ tồn (preview + kiểm lại trong giao dịch, khóa thống nhất), chặn ghi ảnh hưởng đơn vị ngoài scope; SO đã chốt giữ kho khi xuất hóa đơn/hủy.
- [x] F5 BE: đăng ký định nghĩa key module + `editorKey`, tab Kho của SYS đọc giá trị hiệu lực qua WMS (sau S27.6).
- [x] F6 FE: component editor `wms.so_warehouse_policy` độc lập, dùng ngay trong modal "Kho phục vụ" ở trang Tồn kho; gắn vào shell S27.7 theo `editorKey` khi shell có.
- [x] F7 Dictionary VI/EN BE/FE trùng byte cho key mới; verification BE + FE spec PASS.
- [ ] F8 Tester PASS (kế thừa/ghi đè, xuất/hủy với kho đã chốt, IAM, desktop/mobile).

## 4. Cách làm
- Xem `P-DESIGN`, `P-DEV`.

## 5. Kiểm tra
- BE build 0 lỗi; `has-pending-model-changes` sạch; Verification `VERIFIED 769 checks` (36 check S27.8 + 1 check cấp quyền Q4). FE `ng build` OK, `check-ui-std` OK, `ng test` 328 SUCCESS. Chưa chạy TEST (F8).

## 6. Việc còn lại
- F8 tester. Shell S27.7 (Lợi): map `editorKey: 'wms.so_warehouse_policy'` → `ServingWarehousePolicyEditorComponent` (1 dòng registry), đổi nút "Kho phục vụ" ở Tồn kho thành link sang shell; lịch sử xem qua API SYS `.../settings/wms.so_warehouse_policy/history`.

## 7. Evidence và cập nhật
- Commit / PR: BE#99, WMS#9, FE#106, root PR (chưa merge).
- CI / workflow run và kết quả: chưa có.
- Ngày cập nhật cuối: 2026-11-21
- DEV xong, chờ TEST.

## P-BA
**Quy tắc nghiệp vụ**
1. Đơn vị tính cấu hình = `SO.BranchId` (lập SO) hoặc đơn vị chọn trên cây (quản trị). Đặt được ở Company và Branch.
2. `fixed_list`: 1–100 kho duy nhất, đang hoạt động, cùng công ty, đúng một mặc định. Danh sách và kho mặc định là **một nhóm**: kế thừa thì lấy cả hai, không trộn với cấp con.
3. `own_warehouses`: dùng các kho hoạt động **của đơn vị lập SO** (không phải của đơn vị đặt cấu hình); mặc định = kho `IsDefault` của đơn vị đó, không có thì kho ID nhỏ nhất (giữ hành vi S27.1).
4. Kế thừa: không có policy tại chỗ thì đi lên `ParentId` tới công ty sở hữu, chỉ qua đơn vị hoạt động cùng công ty. Cả đường không có thì fallback `own_warehouses` (nguồn `module_fallback`).
5. `fixed_list` hiệu lực có kho mất hiệu lực/khác công ty hoặc mất kho mặc định → `effective.status=invalid`, `error.sd.warehouse_not_serving`; SO mới cần kho bị chặn, quản trị vẫn mở được để sửa.
6. SO nháp chọn kho trong danh sách hiệu lực (mặc định chọn sẵn). Khi Confirm/duyệt tín dụng kiểm lại theo cấu hình lúc đó. SO đã giữ tồn giữ `WarehouseId`; xuất hóa đơn, hủy, trả tồn theo kho đã chốt, không tra lại cấu hình.
7. Lưu thay đổi ở cấp cha: tính lại kho hiệu lực của mọi đơn vị con đang kế thừa. Nếu SO đang giữ tồn (reservation Active) ở kho bị loại khỏi danh sách hiệu lực của đơn vị lập SO → chặn `409 error.branch_setting.active_reservations`. Chỉ đổi mặc định trong danh sách còn hợp lệ → cho lưu. Ảnh hưởng đơn vị ngoài scope chỉnh → `403`, không lộ dữ liệu.
8. Quyền: đọc `sys:branch-setting:view` + `wms:stock:view`; ghi `sys:branch-setting:edit` + `sys:branch:edit` trên đúng đơn vị. API cũ dùng cùng guard (quyền, scope, tồn, lịch sử). Luồng SO giữ quyền SD (`sd:order:view`).
9. Backfill: chi nhánh có dòng S27.1 → `fixed_list` giữ nguyên kho và cờ mặc định. Chứng từ cũ không đổi.
10. Adapter: GET cũ trả mảng như trước; PUT cũ mảng có dòng = `fixed_list`, mảng rỗng = `own_warehouses` (đúng nghĩa cũ "về kho của chính chi nhánh"); không bắt `If-Match`/lý do.

**Acceptance criteria**
- Sau migration, `GET serving-warehouses` của mọi chi nhánh trả đúng tập kho và mặc định như trước migration (so sánh snapshot).
- Cây Công ty A (fixed_list {K1*,K2}) → HN (kế thừa) → Điểm bán (kế thừa): Điểm bán thấy {K1*,K2}, nguồn `ancestor` A. HN đặt `own_warehouses` → Điểm bán dùng kho của chính Điểm bán. Về kế thừa ở HN → quay lại {K1*,K2}. Công ty B độc lập.
- Gỡ K2 ở A khi SO của Điểm bán đang giữ ở K2 → preview có blocker, PUT 409; đổi mặc định K1→K2 vẫn lưu được.
- Lưu đồng thời với Confirm SO: một bên thắng, không có reservation ở kho ngoài danh sách.
- SO đã Confirmed xuất hóa đơn/hủy đúng kho đã chốt; SO cũ `WarehouseId=null` lấy mặc định hiệu lực.
- Thiếu quyền/ngoài scope bị chặn ở cả API mới và cũ; `If-Match` cũ → 412, thiếu → 428 (client mới).

**Trong phạm vi:** F1–F8. **Ngoài phạm vi:** kho khác công ty, nhiều kho/SO, điều chuyển nội bộ, trả hàng chéo chi nhánh (`SalesReturnService`), cảnh báo SO nháp có kho bị loại (nháp chỉ bị chặn khi Confirm), cây quản trị/shell (S27.7), resolver scalar (S27.6).

**Câu hỏi mở cho chủ card (đề xuất kèm)**
- Q1 Chi nhánh chưa có dòng S27.1 nhưng có cha đã có dòng (vd Company có danh sách): theo plan sẽ chuyển sang kế thừa danh sách cha → đổi hành vi. **Đề xuất:** backfill thêm `own_warehouses` cho các chi nhánh này để giữ đúng hành vi cũ; admin bấm "Về kế thừa" khi muốn.
- Q2 Danh sách có kho mặc định đã bị vô hiệu: S27.1 lặng lẽ lọc và lấy kho ID nhỏ nhất; contract nói `invalid`. **Đề xuất:** theo contract cho runtime; backfill sửa sẵn mặc định sang kho hoạt động nhỏ nhất để không có chi nhánh nào thành `invalid` ngay sau deploy.
- Q3 Xuất hóa đơn SO đã giữ tồn hiện vẫn kiểm lại cấu hình (`SalesPostingService.cs:102`). **Đề xuất:** bỏ kiểm cấu hình khi SO có reservation Active ở đúng kho đó (giữ kiểm cùng công ty + kho hoạt động); đóng rủi ro (2) của S27.1.
- Q4 Quyền mới `sys:branch-setting:edit` áp cả API cũ. **Đề xuất:** migration cấp quyền này cho các vai trò đang có `sys:branch:edit` (cùng scope) để không khóa người đang dùng.
- Q5 Plan ghi `branch_id` là PK của bảng policy. **Đề xuất:** theo mẫu nhà (`ConfigureDualKeyAuditable` + unique `branch_id` lọc `is_deleted=false`); "Về kế thừa" = soft-delete dòng policy.

## P-TA
**Repo + SHA đã đọc:** root `a4fb5ec` (origin/master; gitlink BE `371856a`, FE `35d3430`), BE origin/master `2cb021a`, FE origin/main `bb06ec4` với WMS `8b3e3c7`, SD `d270b67` (gitlink). Worktree S27.6 (`D:\Tian\wiki\_wt-s276-be`, `thien/s27-6-branch-settings`) đang ở `2cb021a`, chưa có thay đổi → chưa có interface resolver/ETag/history để dựa vào.

**Điểm code (BE, origin/master 2cb021a)**
- Entity `Domain/Entities/Inventory/BranchServingWarehouse.cs:10`; cấu hình `Persistence/ApplicationDbContext.cs:551-560` (unique branch+warehouse, `ux_branch_serving_warehouse_default`); migration `20261119120148_AddBranchServingWarehouseAndOrderWarehouse.cs:21-86`. Giữ nguyên, thêm entity `BranchWarehousePolicy` (BranchId, Mode enum `FixedList=1|OwnWarehouses=2`, Revision) cạnh nó, `tbl_WMS_BranchWarehousePolicy`.
- Resolver duy nhất: `Infrastructure/Services/Common/ServingWarehouses.cs:15-42` (`ForBranchAsync`, `RequireAsync`, `ResolveAsync`). Viết lại `ForBranchAsync` để đi chuỗi cha + trả nguồn/trạng thái; giữ chữ ký để caller không đổi. Caller: `SalesOrderService.cs:471` (nháp), `OrderStockReservations.cs:24` (Confirm/duyệt, gọi từ `SalesOrderService.cs:132,155`), `SalesPostingService.cs:102` (hóa đơn chéo chi nhánh, đổi theo Q3), `StockService.cs:99,136` (GET, availability), `SalesOrdersController.cs:32-40` (SD list/availability, giữ nguyên).
- Ghi: `StockService.cs:101-131` (`UpdateServingWarehousesAsync`, khóa `serving:{branchId}` dòng 110) → thành adapter gọi service policy mới. `StockController.cs:35-44` thêm `includePolicy`, `POST .../preview`, PUT nhận mode. DTO `Application/DTOs/Inventory/InventoryDtos.cs:54-76` (thêm `Mode`, `Reason` nullable vào request; `IsConfigured` = hiệu lực là `fixed_list`), interface `Features/Inventory/IStockService.cs:10-11`.
- Lỗ hổng hiện có cần đóng: GET/PUT kho phục vụ đọc `Branches.IgnoreQueryFilters()` (`StockService.cs:111`, `ServingWarehouses.cs:18`) → không kiểm scope IAM. Ghi phải kiểm `AllowedBranchIds` (`ApplicationDbContext.cs:24,1414`) cho đơn vị đích và mọi đơn vị con bị ảnh hưởng.
- Quyền AND hai mã: `RequirePermissionAttribute` (`API/Security/Permissions.cs:13`) chỉ OR và không `AllowMultiple` → kiểm mã thứ hai trong service hoặc dùng cơ chế S27.6 đưa ra.
- Khóa: `PostingTransaction.LockAsync/LockSharedAsync` (`PostingTransaction.cs:25,30`, advisory xact). Thứ tự chuẩn **order → `serving:company:{companyId}` → `stock:{wh}:{item}`**: Reserve lấy shared lock công ty trước khóa stock (`OrderStockReservations.cs:27-28`); ghi policy lấy exclusive lock công ty (thay `serving:{branchId}`), rồi đọc reservation Active — không lấy khóa order nên không tạo vòng.
- Guard tồn: `StockReservations` Active (`OrderStockReservations.cs:52`) join SO theo `BranchId ∈ đơn vị bị ảnh hưởng` và `WarehouseId ∉ tập hiệu lực mới của đơn vị đó`.

**Migration/backfill + rollback** (một migration EF + SQL `Persistence/Migrations/Sql`)
1. Tạo bảng policy (FK branch Restrict, unique branch lọc is_deleted).
2. INSERT `fixed_list` rev 1 cho mỗi `branch_id` có dòng S27.1 active. Nếu không có mặc định trên kho hoạt động → đặt mặc định kho hoạt động ID nhỏ nhất (Q2).
3. (Q1) CTE đệ quy: chi nhánh không có dòng mà tổ tiên cùng công ty có `fixed_list` → INSERT `own_warehouses`.
4. Kiểm sau migrate: snapshot `ForBranchAsync` mọi chi nhánh trước/sau bằng nhau (verification check).
- Down: drop bảng policy. Dòng S27.1 không bị sửa (chỉ đổi cờ mặc định ở bước 2, cùng kết quả runtime cũ) → code S27.1 chạy lại được. Mất: kế thừa mới và các override `own_warehouses`/`fixed_list` tạo sau deploy ở cấp cha (con về kho riêng). Ghi trong PR.

**Thứ tự giao**
- Làm ngay (không chờ ai): F1, F2, guard + khóa + scope của F4, adapter F3, verification; FE component editor + service (F6) với SettingView theo contract §4.
- Cần S27.6 merge: bảng `tbl_SYS_BranchSettingHistory` (ghi lịch sử cùng giao dịch), helper ETag/`If-Match` (412/428), mã quyền `sys:branch-setting:*` + seed, `SettingView`/source DTO dùng chung, đăng ký định nghĩa `storageKind=module` + `editorKey`, scalar API trả `409 module_managed`, tab SYS đọc giá trị hiệu lực qua WMS (F5). Nên chốt sớm với S27.6 một helper `AncestorChain(branchId)` dùng chung thay vì WMS tự đi cây. BE PR S27.8 rebase lên S27.6, không merge trước.
- Cần shell S27.7: chỉ phần gắn editor vào **Quản trị → Cấu hình chi nhánh**. Không cần stub: editor là standalone component `ServingWarehousePolicyEditorComponent` (input `branchId`, output `saved`) trong `modules/WMS`, host tạm là modal hiện có (`inventory.component.ts:56-107`, `inventory.component.html:254-290`). Shell sau này map `editorKey: 'wms.so_warehouse_policy'` → component (một dòng trong registry của shell), nút "Kho phục vụ" ở Tồn kho đổi thành link sang shell.
- FE service: `WMS/services/stock.service.ts:122-128` thêm `getServingPolicy` (`includePolicy=true`, đọc header `ETag`), `previewServingPolicy`, `saveServingPolicy` (header `If-Match`, body mode/warehouses/reason). SD `order-detail.component.ts:592-601` giữ API, chỉ hiện thông báo khi BE trả `warehouse_not_serving` thay vì im lặng làm rỗng.

**Rủi ro**
- Đổi kho hiệu lực âm thầm sau deploy nếu Q1/Q2 không chốt như đề xuất.
- Deadlock nếu ai lấy khóa ngược thứ tự trên; review mọi chỗ gọi `ReserveAsync`.
- Hiệu năng: guard đọc reservation theo cả cây công ty khi lưu ở cấp Company; lọc theo kho bị loại để dùng index `ix_tbl_sd_stock_reservation_warehouse_id_item_id_status` (snapshot dòng 4934).
- Dictionary baseline lệch: BE `system_dictionary.json` md5 `53df31c…` ≠ FE `system.json` `3b0235c…` (origin/master/main) → CI dictionary đỏ sẵn; ghi baseline trong PR.
- Model snapshot EF đụng chung với S27.6 → rebase/regenerate migration sau khi S27.6 merge.

**Test cần thêm**
- BE `tests/ERPm.Verification/Program.cs` (cạnh khối S27.1 dòng 1172-1193): backfill giữ snapshot; kế thừa A→HN→Điểm bán theo từng mode; Công ty B độc lập; về kế thừa; `own_warehouses` ở cha dùng kho của đơn vị lập SO; invalid khi kho mặc định bị vô hiệu; adapter GET/PUT mảng/PUT `[]`; 428/412/thiếu lý do; gỡ kho có reservation → 409 + preview blocker; đổi mặc định được; ngoài scope → 403 (cả API cũ); ghi đồng thời với Confirm (2 DbContext) một bên thắng; hóa đơn/hủy SO đã chốt sau khi đổi cấu hình; lịch sử có dòng sau mỗi lần lưu.
- FE spec: editor (tải SettingView, đổi mode, đúng một mặc định, gửi `If-Match` + lý do, 412 giữ form, 409 hiện blocker), `stock.service.spec`, cập nhật `order-detail.component.spec.ts` (lỗi warehouse_not_serving), inventory modal dùng editor. `ng build`, `ng test`, dictionary `cmp`.
- E2E/tester: kế thừa/ghi đè, xuất/hủy với kho đã chốt, IAM, 1366 + 390.

## P-DESIGN
- Editor standalone `app-serving-warehouse-policy-editor` (WMS), host tạm modal "Kho phục vụ" ở Tồn kho: ô chọn đơn vị giữ nguyên, thân modal = editor, footer chỉ nút Hủy (nút Lưu/Xem ảnh hưởng nằm trong editor để shell S27.7 dùng lại).
- Khối "Đang áp dụng": nguồn (Tự cấu hình / Kế thừa từ X / Kế thừa từ đơn vị cấp trên khi không được xem / Mặc định: kho của chính đơn vị) + danh sách kho, kho mặc định in đậm; trạng thái lỗi viền + nền `--erpm-danger-*`.
- `app-form-control` select cho cách chọn kho (Kế thừa / Danh sách chỉ định / Kho của đơn vị lập đơn bán), bảng tick kho + radio mặc định chỉ hiện khi chọn danh sách; textarea lý do bắt buộc.
- Xem ảnh hưởng: đơn vị đổi kho (trước → sau) + blocker "N đơn bán" màu lỗi; 412 → thông báo + nút "Tải lại cấu hình", giữ dữ liệu đang nhập. Không tự đặt cỡ chữ/chiều cao (UI-STD OK); bố cục flex-wrap cho 390.
- i18n mới: `inventory.serving_policy_*` (18 key), `error.branch_setting.active_reservations`, `error.branch_setting.reason_required`; VI/EN BE = FE trùng byte.

## P-DEV
- BE (ERPm-BE#99, nhánh `thien/s27-8-serving-warehouse-settings`, đã merge master có S27.6): entity `BranchWarehousePolicy` + migration `20261121070924_AddBranchWarehousePolicy` (sau `20261121062222_AddBranchSettings`): backfill Q1/Q2 (SQL `AddBranchWarehousePolicy.BackfillSql`, chạy lại được), đăng ký định nghĩa module (`group=warehouse`, `value_type=object`, editorKey), cấp `sys:branch-setting:edit` cho statement Allow có `sys:branch:edit` ở role + inline user (Q4). Down: xóa bảng + định nghĩa; dòng S27.1 giữ.
- Resolver `ServingWarehouses` (giữ chữ ký `ForBranchAsync/RequireAsync/ResolveAsync`): local → tổ tiên hoạt động cùng công ty → kho của chính đơn vị; danh sách lỗi → rỗng/`warehouse_not_serving` (Q2). `OrderStockReservations.ReserveAsync` lấy shared lock `serving:company:{id}` trước khóa stock; ghi policy lấy exclusive cùng key.
- `StockService`: GET cũ (scope 404, invalid 409), `includePolicy` → `SettingViewDto` dùng chung + header ETag; preview/PUT có mode cần lý do + If-Match (428/412) → `SettingImpactDto`; PUT cũ = adapter (mảng có dòng = fixed_list, rỗng = own_warehouses), cùng quyền/scope/guard/lịch sử, không If-Match. Quyền: `sys:branch:edit` (attribute) AND `sys:branch-setting:edit` qua `ICurrentUser.CanAt` trên đơn vị đích và mọi đơn vị bị đổi (403); đọc policy cần `sys:branch-setting:view` (404); tên nguồn chỉ khi xem được. Guard: reservation Active ở kho bị mất → 409 `active_reservations`; đổi mặc định trong cùng danh sách được lưu. Lịch sử ghi `tbl_SYS_BranchSettingHistory` (revision tăng qua cả "kế thừa").
- Q3: `SalesOrderInvoicing` báo `warehouseHeld` khi SO đang Reserved ở đúng kho → bỏ kiểm cấu hình, chỉ kiểm cùng công ty.
- `ServingWarehousePolicyProvider : IBranchSettingModuleProvider` → SYS liệt kê key; API scalar ghi key này vẫn 409 `module_managed`.
- Đơn vị gốc Group (cài đặt một công ty) vẫn ghi được qua API (giữ hành vi S27.1), dù contract nói Company/Branch.
- FE: WMS#9 (`serving-warehouse-policy-editor/*`, `stock.service.ts`, modal Tồn kho) + FE#106 (con trỏ WMS, `system.json`). SD không đổi: banner lỗi toàn cục đã hiện `error.sd.warehouse_not_serving` từ BE.
- Kiểm: BE build 0 lỗi, model sạch, Verification 769 PASS (DB verify đã DROP); FE build OK, UI-STD OK, ng test 328/328. Smoke HTTP trên env tester: GET includePolicy 200 + ETag, PUT thiếu If-Match 428, If-Match cũ 412, preview 200, SYS GET key module 200.
- Ngoài phạm vi / chưa làm: lịch sử chưa có màn FE riêng (shell S27.7), warning SO nháp có kho bị loại (ngoài phạm vi BA).

