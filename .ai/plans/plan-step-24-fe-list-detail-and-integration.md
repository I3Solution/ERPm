# Step 24 (đề xuất) - Tách List/Detail, tích hợp BE thật, tối ưu tải màn hình FE

Ngày: 2026-11-08. Người yêu cầu: Thiện. Soạn: BA. Trạng thái: đề xuất, chờ Phúc xác nhận số step và quy ước.
Đội: 2 dev (2 phiên executor: Dev A, Dev B) + 1 tester (erpm-44). Lợi (FE SD/CRM) và Phúc được báo trước để tránh xung đột.

## 1. Vì sao làm

1. Màn hình dồn lưới và chi tiết vào một chỗ thì tải nặng, khó quản lý. Hiện trạng đã đo trên master (root c73bdc5):
   - Lợi đã tách route list/detail cho SD (orders, quotations, returns, price-lists) và Khách hàng. Phần còn lại chưa tách: WMS `items`, HRM `employees`, WMS `inventory`, `pos`, SYS `users`.
   - Danh sách SD vẫn gọi `GET /sales/orders`, `/quotations`, `/returns` không truyền phân trang/lọc, và kiểu trả về là `...DetailDto` (kèm các dòng hàng). Danh sách nặng vì mang cả chi tiết.
2. FE SD vẫn chạy dữ liệu giả (`useMock = true` trong `sd.service.ts`); `partner.service.ts` nuốt lỗi BE bằng `catchError` giả. Xem card FE-INT.1.
3. Cấu trúc tham chiếu là ERP cũ `ART-ERP-FE/src/app/pages/<MODULE>/`: mỗi màn một thư mục (`sale-order` = danh sách, `sale-order-detail` = chi tiết, route `sale-order/:id`), thao tác phụ (tạo hóa đơn, gộp, tách, ghi chú) là modal nhỏ riêng, có `_template/{flat,flat-detail,tree}`, và bản mobile tách riêng.

## 2. Quy tắc chốt (Thiện, 2026-11-08)

| Loại màn | Cách làm |
| :--- | :--- |
| Ít trường, thao tác nhanh (danh mục đơn giản, đổi trạng thái, nhập lý do, ghi chú, chọn nhanh) | **Modal**, chặn backdrop dismiss (card S23.0.3), dùng `DialogService`/form dialog dùng chung |
| Nhiều trường hoặc nhiều khối (chứng từ, khách hàng, nhân viên, sản phẩm) | **Page detail riêng**, route `<màn>/new` và `<màn>/:id` |
| Danh sách và chi tiết | Luôn tách 2 route / 2 component, không dùng split pane hay drawer lớn |

Ngưỡng gợi ý: từ khoảng 8 trường trở lên, hoặc có từ 2 khối (header + dòng/tab) trở lên thì làm page.

## 3. Đề xuất bổ sung (BA)

1. **Danh sách nhẹ:** BE trả `SummaryDto` cho list (mã, ngày, đối tác, tổng tiền, trạng thái), chỉ detail mới trả đủ dòng. Phân trang, sắp xếp, lọc ở server (`page`, `pageSize`, `q`, `status`, `from`, `to`, `sort`).
2. **Chi tiết tải theo id**, lazy route; các tab nặng (dòng hàng, lịch sử, tài liệu) chỉ tải khi mở tab.
3. **Giữ trạng thái danh sách** (trang, bộ lọc, sắp xếp) trên query params để bấm Back quay lại đúng chỗ.
4. **Cảnh báo chưa lưu:** `canDeactivate` dùng `DialogService.confirm` khi rời page có thay đổi.
5. **Hiệu năng FE:** `ChangeDetectionStrategy.OnPush`, signals, `track` cho `@for`, virtual scroll cho bảng trên vài trăm dòng, skeleton khi tải, `@defer` cho khối nặng.
6. **Bố cục thích ứng:** desktop = bảng, mobile = thẻ (card); cùng một component, không nhân bản bản mobile như ERP cũ.
7. **Thành phần dùng chung:** khung `list-page` (toolbar, lọc, phân trang, trạng thái rỗng/lỗi) và `detail-page` (header, nút Back chuẩn `<app-back-button>`, thanh thao tác) để mọi màn giống nhau.
8. **Đo trước/sau:** số byte payload list, thời gian tải list, kích thước chunk lazy; ghi vào step log.
9. **Ghi quy ước** vào `PROJECT_MASTER.md` (cần Phúc đồng ý): bảng quy tắc mục 2 và cấm `window.confirm/alert` (card 14 chỗ).

## 4. Phân việc 2 dev, 1 tester (không đụng chung file)

| Luồng | Dev | Phạm vi file | Card |
| :--- | :--- | :--- | :--- |
| A | Dev A (phiên "Todo task 1 ERPm") | BE `PartnersController`; FE submodule SD, CRM | BE-INT.1, FE-INT.1, LD.5 (list nhẹ + phân trang SD) |
| B | Dev B (phiên mới) | FE submodule WMS, HRM, SYS; khung dùng chung trong `ERPm-FE/src/app/shared` | LD.1, LD.2, LD.3, LD.4 |
| Tester | erpm-44 | Kiểm từng PR sau khi dev tự kiểm; đo trước/sau | tất cả |

Điểm chạm chung cần phối hợp: `ERPm-FE/src/app/app.routes.ts` và hai file từ điển `system.json` / `system_dictionary.json`.
- Mỗi dev chỉ thêm dòng route của module mình, PR nhỏ, merge sớm, kéo master trước khi sửa.
- Khóa i18n mới thêm đồng thời ở cả hai file (CI root so từng byte; xem card BUG-20261107c).
- Dev B làm khung dùng chung (LD.1) xong và merge trước khi Dev A dùng cho LD.5; trong lúc chờ Dev A làm BE-INT.1 và FE-INT.1.

## 5. Danh sách việc và nghiệm thu

| Mã | Việc | Nghiệm thu |
| :--- | :--- | :--- |
| LD.1 | Khung `list-page` + `detail-page`, guard chưa lưu, giữ trạng thái list qua query params, skeleton | Dùng được ở 2 màn mẫu; Karma pass; build 0 lỗi |
| LD.2 | WMS `items`: tách danh sách + page chi tiết sản phẩm; modal chỉ cho thao tác nhỏ | `catalog` và `catalog/:id` riêng; tải lại trang vẫn đúng; không còn form inline trong lưới |
| LD.3 | HRM `employees`: tách danh sách + page chi tiết nhân viên (giữ dialog nhỏ cho QTCT) | `employees` và `employees/:id`; phân quyền giữ nguyên |
| LD.4 | Rà `inventory`, `pos`, SYS `users`: quyết định modal hay page theo quy tắc mục 2, ghi vào bảng rà soát | Bảng rà soát trong step log; chỉ làm các màn xếp loại "page" |
| LD.5 | SD list nhẹ: BE `SummaryDto` + phân trang/lọc/sắp xếp ở server cho orders, quotations, returns, price-lists; FE truyền tham số | Payload list giảm (ghi số đo trước/sau); detail vẫn đủ dòng; tester kiểm |

Mỗi card theo AGENTS.md: nhánh cá nhân, comment tiếng Anh, i18n VI/EN, build 0 lỗi, Karma pass, tự chạy thử trên trình duyệt (desktop + mobile), tester PASS rồi mới merge theo lệnh Thiện, comment SHA lên Trello khi đổi cột, tick checklist "Nghiem thu bat buoc".

## 6. Rủi ro

- Lợi đang sửa cùng các file SD/CRM: phải báo Lợi, nhánh nhỏ, merge sớm.
- Đổi DTO list là thay đổi hợp đồng: thêm trường mới và giữ tương thích cho tới khi FE chuyển xong, rồi mới bỏ trường cũ.
- Hai dev cùng sửa `app.routes.ts` và từ điển: lệch từ điển làm đỏ CI root.

## 7. Việc còn lại

Cập nhật bảng này khi có card hoàn thành (mã, trạng thái, SHA).

| Mã | Trạng thái | Ghi chú |
| :--- | :--- | :--- |
| BE-INT.1 | Todo | https://trello.com/c/PLSefcdu |
| FE-INT.1 | Todo | https://trello.com/c/yVyoUVZI |
| LD.1, LD.2 | Done (merge) | FE #22, #23, WMS #4, BE #35, #36 |
| LD.3 | Review | FE #31 f02584c, HRM #11 8e20ffb; chờ Tester |
| LD.4 | Done | bảng rà soát trong [step-24-list-detail-ld.md](../steps/step-24-list-detail-ld.md): không có màn xếp loại page |
| LD.5 | Todo | Dev 1 |
