# [change] S27.1 Kho phục vụ SO

> **Loại:** change
> **Ngày tạo:** 2026-11-19 · **Người làm:** Dev 1 (AI, cho Võ Quốc Thiện) · **Người yêu cầu:** Võ Quốc Thiện (giao qua BA erpm-39)
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** plan `.ai/plans/plan-step-27-sales-controls-and-preferences.md` mục S27.1 · Trello https://trello.com/c/0SwFTBCA · nhánh `thien/s27-1-so-serving-warehouse` (root, BE, FE)
> **Phạm vi:** ERPm-BE WMS/SD/ACC (SalesOrder, OrderStockReservations, SalesOrderInvoicing, SalesPostingService, migration), ERPm-FE SD (form SO), WMS (cấu hình kho phục vụ)

## 1. Mô tả
- Cũ: SO giữ tồn ở mọi kho của chi nhánh bán (kho còn nhiều nhất trước); xuất hóa đơn chọn kho tự do nhưng phải cùng chi nhánh với SO (`error.inventory.branch_mismatch`); hóa đơn, PXK và bút toán đều ghi theo chi nhánh của kho.
- Mới: chi nhánh bán A có danh sách kho phục vụ (có kho mặc định, cùng công ty). Mỗi SO hàng hóa chốt một kho xuất khi còn nháp. Kho đó dùng cho xem khả dụng, giữ tồn, duyệt và xuất hóa đơn. SO vẫn thuộc A.

## 2. Phân tích
- Base: root `1d8025a` (master), BE `39cd255` (master), FE `756a7bc` (**main**, FE dùng main), SD `89690e6`, WMS `0554c37` (master).
- `OrderStockReservations.ReserveAsync` (src/ERPm.Infrastructure/Services/Common/OrderStockReservations.cs) giữ tồn trải ra mọi kho của `order.BranchId`; `ReleaseAsync` theo dòng `StockReservation` đang Active, nên trả đúng kho đã giữ.
- `SalesPostingService.PostInvoiceAsync` (dòng 95–229): `BranchId = warehouse.BranchId` cho hóa đơn, PXK, bút toán và mọi tra cứu tài khoản.
- **Quyết định ghi sổ (Thiện chốt 2026-11-19): tách A/B.** Hóa đơn, doanh thu, thanh toán/công nợ, VAT ghi ở chi nhánh bán A. PXK, giá vốn và giảm tồn ghi ở chi nhánh kho B. Khi A ≠ B thì tạo hai bút toán, mỗi bút toán tự cân, không cần tài khoản trung gian.
- Ngoài phạm vi: kho khác công ty, nhiều kho trên một SO, điều chuyển nội bộ.
- Hợp đồng với S27.4 (Dev 2, erpm-c5): giữ chữ ký `ReserveAsync(order)`/`ReleaseAsync(order)` và chỗ gọi. Trả về Draft không reset `WarehouseId`.
- Trường dùng chung với S27.2 (Lợi): S27.1 chỉ thêm `WarehouseId` (SalesOrder, DTO, request) và không đụng các trường giá/bảng giá.

## 3. Features / Milestones
- [x] BE: bảng `tbl_WMS_BranchServingWarehouse` (BranchId, WarehouseId, IsDefault) + API xem/cập nhật, kiểm cùng công ty, kho hoạt động, đúng 1 kho mặc định.
- [x] BE: `SalesOrder.WarehouseId` (null = đơn cũ), tạo/sửa nháp kiểm kho nằm trong danh sách phục vụ; khi duyệt thì lấy kho mặc định nếu đơn chưa chọn.
- [x] BE: giữ tồn chỉ ở kho đã chốt (transaction, khóa `stock:{wh}:{item}`, dòng reservation làm audit); xuất hóa đơn từ SO dùng đúng kho đó.
- [x] BE: ghi sổ tách A/B theo quyết định trên.
- [x] BE: verification checks cho các ca nghiệm thu (kho B phục vụ A, kho ngoài danh sách/khác công ty/thiếu hàng bị chặn, hai SO tranh tồn, hủy trả đúng kho, SO cũ).
- [x] FE: form SO chọn kho xuất + hiển thị khả dụng theo kho; màn cấu hình kho phục vụ của chi nhánh.
- [ ] Tester 1 PASS.

## 4. Cách làm
- BE `11f2f05` (thien/s27-1-so-serving-warehouse):
  - entity `BranchServingWarehouse` + bảng `tbl_WMS_BranchServingWarehouse` (unique branch+warehouse, một default/branch), cột `tbl_SALE_Order.warehouse_id`; migration `20261119120148_AddBranchServingWarehouseAndOrderWarehouse`.
  - `Services/Common/ServingWarehouses.cs`: danh sách kho phục vụ (chưa cấu hình = kho của chính chi nhánh), kiểm cùng công ty + kho hoạt động, lấy kho mặc định.
  - `OrderStockReservations.ReserveAsync`: chỉ giữ ở `order.WarehouseId` (null → kho mặc định, ghi lại vào đơn). Chữ ký giữ nguyên.
  - `SalesOrderInvoicing`: dùng kho của đơn, khác kho thì từ chối. `SalesPostingService`: hóa đơn/doanh thu/thanh toán/công nợ/VAT ở chi nhánh bán; PXK + giá vốn ở chi nhánh kho, bút toán `STOCK_ISSUE` riêng khi khác chi nhánh. Bán lẻ trực tiếp vẫn phải cùng chi nhánh.
  - API: `GET/PUT /api/v1/stock/branches/{id}/serving-warehouses` (xem `wms:stock:view`, sửa `sys:branch:edit`); `GET /api/v1/sales/orders/serving-warehouses?branchId=`, `GET /api/v1/sales/orders/availability?branchId&warehouseId&itemIds` (`sd:order:view`).
  - Dictionary: `error.sd.warehouse_not_serving`, `so.available_qty`, `so.warehouse_branch_default`, `inventory.serving_*`.
- FE `b7d92d8` (nền main) + SD `cb993c4` + WMS `8b3e3c7`: form SO chọn kho xuất (chọn sẵn mặc định), cột Khả dụng khi sửa, xem đơn hiện kho; dialog xuất hóa đơn khóa kho của đơn; trang Tồn kho có nút "Kho phục vụ" (quyền `sys:branch:edit`). `system.json` chép đúng từng byte từ BE.

## 5. Kiểm tra
- BE verification (Postgres Docker local :5433, không dùng Neon): **657/657 PASS**, gồm 17 check S27.1: A bán kho B; kho ngoài danh sách/khác công ty/thiếu hàng bị chặn; hai SO tranh tồn song song (2 DbContext) chỉ một thắng; hủy trả đúng kho; đơn không chọn kho lấy mặc định; bút toán A/B cân riêng.
- BE unit tests 23/23 PASS. FE `ng build` OK, `ng test` 312/312 PASS (cập nhật spec order-detail theo hợp đồng mới).
- Chưa chạy: kiểm tra giao diện bằng mắt và E2E (giao Tester 1).

## 6. Việc còn lại
- Tester 1 kiểm (chờ).
- Rủi ro báo Thiện: (1) trả hàng (`SalesReturnService`) của hóa đơn xuất chéo vẫn bắt kho cùng chi nhánh bán và ghi hết ở A; (2) bỏ kho B khỏi danh sách khi đơn đã giữ ở B thì không xuất hóa đơn được tới khi thêm lại; (3) chưa có màn quản trị chi nhánh nên cấu hình đặt ở trang Tồn kho.
- Rebase sau S27.4 (Dev 2) vì cùng đụng model snapshot EF.
- Root PR (task record + gitlink) mở sau khi BE/FE merge.

## 7. Evidence và cập nhật
- Commit / PR đã merge: chưa có.
- CI / workflow run và kết quả: chưa có.
- Ngày cập nhật cuối: 2026-11-19
