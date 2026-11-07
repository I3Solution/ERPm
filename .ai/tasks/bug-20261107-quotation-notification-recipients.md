# [bug] Thông báo báo giá phát sai người nhận

> **Loại:** bug
> **Ngày tạo:** 2026-11-07 · **Người làm:** Thiện (BE) · **Người yêu cầu:** BA (quyết định của Thiện)
> **Trạng thái:** Doing (chờ tester và Thiện gõ merge)
> **Liên quan:** Trello https://trello.com/c/B96FRnQ5 · nhánh `thien/fix-quotation-notification-recipients` (BE, root)

## Hiện tượng
`SD_QUOTATION_ACCEPTED/REJECTED/CONVERTED` được phát tới mọi tài khoản thuộc cây chi nhánh của báo giá: người không có quyền xem báo giá vẫn nhận, và người vừa thao tác tự nhận thông báo về hành động của mình.

## Nguyên nhân gốc
`SalesQuotationService` dựng một sự kiện đích `BranchTree`; bộ định tuyến chọn người theo nơi làm việc, không xét quyền hay người thao tác.

## Cách sửa
- `PermissionRecipients.ForDocumentAsync` (mới, dùng lại được): người nhận là tài khoản đang hoạt động có `sd:quotation:view` và phạm vi dữ liệu chạm tới báo giá (không giới hạn, đúng chi nhánh, đúng phòng ban, hoặc phạm vi SELF khi báo giá do chính họ tạo), loại người thao tác.
- `SalesQuotationService`: ghi lại nội dung cần báo trong giao dịch, tìm người nhận sau khi giao dịch đã commit, gửi từng người (đích `USER`). Không có `IIamService` (chỉ trong test cũ) thì không gửi ai.

## Bằng chứng
- `dotnet build`: 0 warning, 0 error; `ERPm.Verification` 347 check đạt (346 + 1 mới, thay 3 check cũ bằng các check theo người nhận): chỉ người xem trong chi nhánh, người không giới hạn và người bán sở hữu báo giá nhận; loại người thao tác, người ở chi nhánh khác, người SELF của bản ghi khác và người không có quyền. Áp dụng cho chấp nhận, từ chối, chuyển đơn.

## Việc còn lại
- Thông báo của đơn bán (`SD_ORDER_*`), trả hàng và vai trò (`SYS_ROLE_CHANGED` đã đúng người) còn dùng đích cây chi nhánh và người thao tác vẫn nhận; cùng lỗi, chưa sửa vì ngoài phạm vi card. Hỏi BA có muốn task tiếp.
- Mỗi lần phát duyệt toàn bộ tài khoản đang hoạt động (có cache quyền); ổn với quy mô hiện tại, cần chỉ mục theo chi nhánh nếu số tài khoản lên hàng nghìn.
- Tester kiểm; Thiện gõ merge.
