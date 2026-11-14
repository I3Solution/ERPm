# Step 24 - Luồng B: tách List/Detail (LD.1 - LD.4)

Người làm: Dev 2 ERPm (Thiện). Plan: [plan-step-24-fe-list-detail-and-integration.md](../plans/plan-step-24-fe-list-detail-and-integration.md).

## Mục tiêu
Tách danh sách và chi tiết thành 2 route riêng, dùng khung chung, giữ trạng thái list trên URL, cảnh báo chưa lưu.

## Kết quả theo card

| Card | Nội dung | PR / SHA | Kiểm tra |
| :--- | :--- | :--- | :--- |
| LD.1 | `app-list-page`, `app-detail-page`, `app-skeleton`, `unsavedChangesGuard`, `createListQueryState`; dùng `app-back-button` của master | FE #22 (merge), BE #35 | build 0 lỗi, Karma pass, Tester PASS |
| LD.2 | WMS `catalog`, `catalog/new`, `catalog/:id`; list dùng `app-data-table` | FE #23 (merge), WMS #4, BE #36 | build 0 lỗi, Karma 195/195, Tester PASS (trình duyệt desktop + mobile) |
| LD.3 | HRM `employees`, `employees/new`, `employees/:id`; giữ dialog cấp tài khoản | FE #31 (f02584c), HRM #11 (8e20ffb) | build 0 lỗi, Karma 202/202; chờ Tester |
| BUG-20261110a | Sửa 5 test đỏ trên master | FE #25 (merge), HRM #10 | Karma 170/170 |
| LD.4 | Bảng rà soát bên dưới | - | không có màn xếp loại "page" |

## Bảng rà soát LD.4 (quy tắc: ít trường = modal, nhiều trường/nhiều khối = page)

| Màn | Hiện trạng | Số trường / khối | Xếp loại | Quyết định |
| :--- | :--- | :--- | :--- | :--- |
| WMS `inventory` | Danh sách tồn kho + modal "Nhập kho nhanh" | 6 trường (kho, nhà cung cấp, sản phẩm, số lượng, đơn giá, ghi chú), 1 khối | Modal | Giữ modal, không đổi |
| SD `pos` | Màn bán hàng tại quầy: lưới sản phẩm + giỏ hàng | Không phải CRUD list/detail | Ngoài phạm vi | Giữ nguyên |
| SYS `users` | Danh sách + `user-form-dialog` dùng chung (cũng mở từ Nhân viên) | 7 trường + 1 nhóm chi nhánh (checkbox), 1 khối | Modal | Giữ dialog dùng chung, không đổi |

Kết luận: không có màn nào đạt ngưỡng "page" (từ ~8 trường hoặc từ 2 khối), nên LD.4 không phát sinh code.
Lưu ý đã thấy: modal nhập kho vẫn tự đóng khi bấm nền (card S23.0.3 chặn backdrop dismiss chưa áp dụng ở đây); chưa sửa vì ngoài phạm vi LD.4.

## Lệnh đã chạy
`ng build`, `ng test --watch=false --browsers=ChromeHeadless`, `cmp` từ điển FE/BE.

## Việc tiếp theo
Tester kiểm LD.3; sau đó merge theo lệnh Thiện. Chưa đo trước/sau payload (thuộc LD.5, Dev 1).
