# [bug] Modal đóng khi bấm nền, sort cột SD không chạy, giao diện Danh mục cấp phòng ban

> **Loại:** bug
> **Ngày tạo:** 2026-11-14 · **Người làm:** Dev 1 ERPm (Thiện) · **Người yêu cầu:** BA 1 ERPm
> **Trạng thái:** Doing (còn mục sort server Nhân viên và hỏi "bỏ thay đổi?")
> **Progress aggregation:** v1
> **Liên quan:** ERPm-FE #48, #49, #56, #57, #59, #61, #62; ERPm-FE-SD #12; ERPm-FE-HRM #17; ERPm-BE #61; root #84, #85
> **Phạm vi:** ERPm-FE (app.component, data-table), submodule SD (orders, quotations, returns), submodule HRM (department-levels)

## 1. Mô tả
- Modal nhập liệu đóng khi bấm/kéo chuột ra nền, mất dữ liệu đang gõ.
- Bấm tiêu đề cột ở Đơn bán, Báo giá, Trả hàng không đổi thứ tự: data-table phát sortChange nhưng không màn nào nối vào URL state.
- Màn Danh mục cấp phòng ban: bảng tràn khung, hai lớp viền, ô rỗng, biểu tượng sắp xếp không có tác dụng.

## 2. Phân tích
- Modal: mỗi modal (SD, HRM, WMS, shared) tự gắn (click) vào erpm-modal-backdrop. Sửa một chỗ: listener pha bắt ở app.component.ts, trừ app-dialog-backdrop và print-dialog-backdrop.
- Sort: BE BaseFilterQuery.Sort nhận field hoặc -field; FE loadOrders đã gửi sort. Thiếu nối (sortChange) và input sort để hiện mũi tên.
- HRM: bảng tự dựng trong khung erpm-table-container, min-width 1000px; đổi sang app-list-page.

## 3. Features / Milestones
- [x] Modal nhập liệu không đóng khi bấm nền (FE #48, Tester 1 PASS)
- [x] Sort cột Đơn bán/Báo giá/Trả hàng (SD #12 + FE #49, Tester 1 PASS)
- [x] Giao diện Danh mục cấp phòng ban (HRM #17 + FE #56, Tester 1 PASS)
- [x] UI-STD GĐ1: `app-data-table` bọc Angular Material (sửa tại chỗ, Ionic shell, thẻ trên điện thoại, độ rộng cột theo loại, sort rỗng xuống cuối, `sortValue`); 4 màn danh sách đồng nhất (FE #59 + HRM #17, Tester 1 PASS)
- [x] Sửa mất dòng khi sửa tại chỗ không dùng formArray (FE #62, Tester 2 PASS)
- [x] Docs ngoại lệ Material (PROJECT_MASTER §4.2, ERPm-FE AGENTS; FE #57, root #84)
- [ ] Sort server màn Nhân viên: BE #61 (chờ review), sau đó nối FE (sortChange + ánh xạ departmentLabel→departmentName, positionLabel→jobPositionName)
- [ ] Hỏi "bỏ thay đổi?" khi đóng modal bằng nút (chưa làm, thẻ chỉ nêu chặn nền)

## 3b. app-data-table (UI-STD GĐ1)
- Quyết định (Thiện, 2026-11-14): sửa tại chỗ `app-data-table`, không tạo component mới; Material chỉ nằm trong component này.
- Desktop: `mat-table` + `matSort`, cột Hành động ghim phải, độ rộng cố định theo loại cột (mã 9rem; ngày/số/trạng thái 8rem; hành động 11rem), luôn lấp khung. Điện thoại (<768px): thẻ `ion-card`, nút ≥44px. Loading, rỗng, sửa tại chỗ giữ markup cũ.
- Sort: màn có `(sortChange)` thì sort máy chủ; màn khác bảng tự sort, ô rỗng luôn cuối cả hai chiều. Cột nhãn dùng `sortValue`.
- Tách thư mục components/directives/interfaces. Spec cần stub BreakpointObserver (cửa sổ Karma hẹp = điện thoại).

## 4. Cách làm
- app.component.ts; data-table.component.ts (input sort); orders/quotations/returns .component.html; department-levels.component.{html,ts,scss}.
- Mỗi thay đổi nằm trên nhánh riêng, build FE 0 lỗi.
- Bảng: data-table.component.{ts,html,scss}, data-table.material.spec.ts; 4 màn HRM/SYS bỏ width riêng. BE: HrmServices.cs (EmployeeService.ApplySorting), ERPm.Verification.

## 5. Kiểm tra
- Tester 1: #48 PASS (7 màn modal, chưa kiểm work-histories, print-preview); #49 + SD #12 PASS (chưa kiểm sort kết hợp lọc/phân trang).
- Danh mục cấp phòng ban: Tester 1 PASS.
- FE #59: Karma 240/240; Tester 1 PASS 4 màn ở 1366/1440/390 (không cuộn ngang, độ rộng nhất quán, sort Users theo nhãn, mũi tên chỉ ở cột sort được).
- FE #62: Tester 2 PASS Báo giá/Bảng giá sửa tại chỗ, smoke 9 màn. Trả hàng không vào được chế độ sửa (return-detail chưa nối startEdit, có từ trước). `selectable` chưa màn nào dùng, chỉ Karma.
- BE #61: ERPm.Verification 498 đạt; chưa có review.

## 6. Việc còn lại
- BE #61 review + merge, rồi nối FE sort Nhân viên.
- Hỏi "bỏ thay đổi?" khi đóng modal bằng nút.
- Chưa làm: ion-searchbar, mat-paginator, sort lên URL cho 4 màn.

## 7. Evidence và cập nhật
- PR đã merge: FE #48, #49, #56, #57, #59, #61, #62; SD #12; HRM #17; root #79, #80, #83, #84, #85. Đang mở: BE #61.
- CI / workflow run và kết quả: chưa kiểm.
- Ngày cập nhật cuối: 2026-11-15
