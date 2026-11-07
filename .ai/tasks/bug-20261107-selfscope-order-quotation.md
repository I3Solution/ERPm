# Bug: người bán phạm vi SELF không tạo được đơn bán / báo giá (F5)

- **Trạng thái:** Doing (đã sửa và push, chờ merge và tester kiểm lại)
- **Loại / tag:** bug / `[fix]`
- **Người báo:** tester `erpm-ce` (báo cáo `notes/ai-team/test-reports/S22-BE-20261106.md`, lần 3); Trello https://trello.com/c/VNyo1ftY
- **Nhánh:** `thien/fix-selfscope-order-quotation` (BE 2a1a38d)

## Hiện tượng
Tài khoản chỉ có `sd:order:create` phạm vi SELF (vd `banhang`, không có chi nhánh nào trong phạm vi) tạo đơn bán hoặc báo giá đều bị 400 `error.validation.request`.

## Nguyên nhân gốc
1. `SalesOrderService.PrepareAsync` và `SalesQuotationService.PrepareAsync` kiểm chi nhánh qua `Context.Branches`, bị bộ lọc DataScope (cùng gốc F1).
2. Phát hiện thêm khi viết test: từ S22.3.1/S22.2.1, truy vấn đơn và báo giá `Include(Branch)`. Chi nhánh là quan hệ bắt buộc có bộ lọc phạm vi nên EF nối trong (inner join) và **ẩn mọi đơn/báo giá của người bán SELF**, kể cả của chính họ. Nghĩa là dù tạo được cũng không đọc lại được.

## Cách sửa
- Kiểm chi nhánh tồn tại/đang hoạt động bằng `IgnoreQueryFilters` ở 2 chỗ (như F1). Chứng từ vẫn lưu `CreatedBy` nên người bán SELF chỉ thấy chứng từ của mình.
- Bỏ `Include(Branch)`; tên chi nhánh tra riêng qua `BranchNames` (bỏ qua bộ lọc) cho danh sách, chi tiết và các thao tác đổi trạng thái.
- Chưa sửa: các luồng cũ khác còn `Include(Branch)` (danh sách hóa đơn); bộ lọc `branchId` ngoài phạm vi vẫn cho 0 dòng (nhẹ, ghi chú của tester).

## Chống tái phát
Test mới với người dùng SELF: tạo được báo giá và đơn; đơn lưu `CreatedBy`; danh sách chỉ gồm đúng chứng từ của họ; tên chi nhánh hiển thị.

## Kiểm tra
- `dotnet build`: 0 warning, 0 error; `ERPm.Verification`: 263 check đạt.
- Việc còn lại: tester kiểm lại sau khi merge; ghi `Done` và commit merge khi xong.
