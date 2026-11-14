# [update](HRM) B5: cây tổ chức tải phòng ban theo trang và cảnh báo khi công ty lớn

> **Loại:** change (Step 20 §6 ưu tiên #9) · **Người làm:** Thiện (Dev 1) · **Trạng thái:** Doing (chờ tester và merge)
> **Liên quan:** FE #41, #44 · BE #51 (từ điển), #54 · HRM #15, #16 · card Trello B5 · nhánh `thien/b5-org-tree-limit`

## Phát hiện
- BE `BaseCrudService` cắt `PageSize` ở **200**, nên cây xin `pageSize: 1000` vẫn chỉ nhận 200 phòng ban; công ty lớn hơn bị cắt âm thầm (card ghi 1000, thực tế 200).
- BE đã có sẵn lọc `CompanyId`, `UnderId`, phân trang và `TotalCount`; thiếu lọc theo `BranchId` cho phòng ban (đã thêm ở B5.2, BE #54).

## Làm
- FE `org-tree`: tải từng trang 200 phòng ban đến tối đa 1000; nếu tổng lớn hơn thì hiện cảnh báo "đã tải / tổng" (khóa `org.truncated`, từ điển BE+FE cùng thay đổi). Tải của công ty cũ bị bỏ khi đổi công ty giữa chừng.

## B5.2: tải theo từng nhánh (cùng task, cùng nhánh task record)
- BE #54: `DepartmentFilterQuery.BranchId` lọc đúng phòng ban của chi nhánh đó (không gồm chi nhánh con); Verification 418 PASS.
- HRM #16 + FE #44: cây chỉ tải phòng ban của node công ty/chi nhánh đang mở, mỗi node từng trang 200 đến 1000, không tải lại khi đóng rồi mở. Form phòng ban tải chi nhánh đang chọn nên ô phòng ban cha đủ lựa chọn.
- Giới hạn: BE chỉ bắt phòng ban cha cùng công ty, nên cha thuộc chi nhánh khác chỉ hiện khi chi nhánh đó đã mở.

## Kiểm tra
- B5: `npm run build` 0 lỗi; Karma 208/208. B5.2: Karma 210/210. Tester 1 chạy dữ liệu thật hơn 200 phòng ban.
