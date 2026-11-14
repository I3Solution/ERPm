# [update](HRM) B5: cây tổ chức tải phòng ban theo trang và cảnh báo khi công ty lớn

> **Loại:** change (Step 20 §6 ưu tiên #9) · **Người làm:** Thiện (Dev 1) · **Trạng thái:** Doing (chờ tester và merge)
> **Liên quan:** FE #41 · BE #51 (từ điển) · card Trello B5 · nhánh `thien/b5-org-tree-limit`

## Phát hiện
- BE `BaseCrudService` cắt `PageSize` ở **200**, nên cây xin `pageSize: 1000` vẫn chỉ nhận 200 phòng ban; công ty lớn hơn bị cắt âm thầm (card ghi 1000, thực tế 200).
- BE đã có sẵn lọc `CompanyId`, `UnderId`, phân trang và `TotalCount`; thiếu lọc theo `BranchId` cho phòng ban (cần nếu làm tải theo nhánh).

## Làm
- FE `org-tree`: tải từng trang 200 phòng ban đến tối đa 1000; nếu tổng lớn hơn thì hiện cảnh báo "đã tải / tổng" (khóa `org.truncated`, từ điển BE+FE cùng thay đổi). Tải của công ty cũ bị bỏ khi đổi công ty giữa chừng.

## Chưa làm
- Tải theo từng nhánh: cần thêm lọc `BranchId` ở BE và đổi ô chọn phòng ban cha (đang dùng mọi phòng ban của công ty; form còn cho đổi chi nhánh). Cần BA chốt thiết kế.

## Kiểm tra
- `npm run build` 0 lỗi; Karma 208/208 (thêm spec phân trang và cảnh báo).
- Chưa kiểm với dữ liệu thật hơn 200 phòng ban.
