# [update] FE LD.5: danh sách SD phân trang và tìm ở server

> **Loại:** change (Step 24, luồng A) · **Người làm:** Thiện (Dev 1) · **Trạng thái:** Doing (chờ tester và merge)
> **Liên quan:** BE LD.5 ([task](change-20261110-ld5-sd-light-lists.md), BE #40/#41 đã merge) · nhánh `thien/fe-sd-ld5-lists` (FE-SD, FE, root)

## Làm
- `sd.service.ts`: `loadOrders/loadQuotations/loadReturns(query?)` xin **một trang dòng tóm tắt** (`summary=true`, `pageIndex`, `pageSize`, `q`, `status`, `from`, `to`, `sort`), nhớ truy vấn cuối để tải lại sau thao tác, có `ordersTotal/quotationsTotal/returnsTotal` và `listError`. Thay cho việc tải 200 dòng đầy đủ.
- Màn **Đơn bán, Báo giá, Trả hàng** dùng khung `app-list-page` của LD.1: trang, từ khóa (chờ 300 ms) và trạng thái nằm trên query params (Back về đúng chỗ), skeleton khi tải, hộp lỗi có nút thử lại, trạng thái rỗng, phân trang. Trả hàng không có bộ lọc trạng thái.
- Dòng tóm tắt không có dòng hàng, nên nút **In** trong danh sách đọc đầy đủ chứng từ trước khi in; bỏ số điện thoại, địa chỉ và ghi chú giả còn sót trong bản in của đơn và báo giá.
- **Bảng giá giữ nguyên** cách tải cũ: danh sách nhỏ và còn là nguồn cho các ô chọn bảng giá ở form đơn, báo giá.

## Đo (BE, 13 đơn trong đó 1 đơn 40 dòng): 22.530 → 9.631 byte; trang đầu nay chỉ 20 dòng thay vì tối đa 200.

## Kiểm tra
- `npm run build` 0 lỗi; Karma 202/202 (thêm 3 test cho `SdService` về tham số trang, nhớ truy vấn, báo lỗi; các spec danh sách viết lại cho trang phía server). Chưa bấm giao diện trình duyệt.

## Còn lại
- Bộ lọc ngày (`from`/`to`) đã có trong service nhưng chưa có ô chọn ngày trên giao diện; sắp xếp theo cột (`sort`) chưa nối với tiêu đề bảng.
- Tester kiểm và Thiện gõ merge.
