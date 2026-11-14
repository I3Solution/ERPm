# [bug] Modal đóng khi bấm nền, sort cột SD không chạy, giao diện Danh mục cấp phòng ban

> **Loại:** bug
> **Ngày tạo:** 2026-11-14 · **Người làm:** Dev 1 ERPm (Thiện) · **Người yêu cầu:** BA 1 ERPm
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** ERPm-FE #48, #49, #56; ERPm-FE-SD #12; ERPm-FE-HRM #17
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
- [ ] Giao diện Danh mục cấp phòng ban (HRM #17 + FE #56, chờ Tester)
- [ ] Hỏi "bỏ thay đổi?" khi đóng modal bằng nút (chưa làm, thẻ chỉ nêu chặn nền)

## 4. Cách làm
- app.component.ts; data-table.component.ts (input sort); orders/quotations/returns .component.html; department-levels.component.{html,ts,scss}.
- Mỗi thay đổi nằm trên nhánh riêng, build FE 0 lỗi.

## 5. Kiểm tra
- Tester 1: #48 PASS (7 màn modal, chưa kiểm work-histories, print-preview); #49 + SD #12 PASS (chưa kiểm sort kết hợp lọc/phân trang).
- Danh mục cấp phòng ban: build 0 lỗi, spec màn 4/4; chưa bấm tay, chưa chụp ảnh trước/sau.

## 6. Việc còn lại
- Tester kiểm HRM #17 (1366px, tối, mobile, ảnh trước/sau); merge các PR; nâng con trỏ root.

## 7. Evidence và cập nhật
- Commit / PR đã merge: chưa.
- CI / workflow run và kết quả: chưa kiểm.
- Ngày cập nhật cuối: 2026-11-14
