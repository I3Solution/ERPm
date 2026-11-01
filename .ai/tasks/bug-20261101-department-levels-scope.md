# [bug] Danh sách cấp phòng ban (department-levels) lộ dữ liệu công ty khác

> **Loại:** bug
> **Ngày tạo:** 2026-11-01 · **Người làm:** Todo task 1 ERPm · **Người yêu cầu:** BA (BUG-20261101)
> **Trạng thái:** Done (chờ review / merge)
> **Liên quan:** step-20 (20.6.x), cùng lỗi đã sửa cho chức danh ở `JobPositionService`; ERPm-BE nhánh `thien/bug-department-levels-scope`

## 1. Mô tả
`GET /hrm/department-levels` trả cả cấp phòng ban riêng của công ty khác cho người chỉ có quyền trong một công ty. Tái hiện: tạo cấp có `CompanyId` = công ty B, gọi danh sách bằng tài khoản phạm vi công ty A thì thấy cấp của B.

## 2. Phân tích
`DepartmentLevelService` (`HrmServices.cs`) có `HrmScope` nhưng không ghi đè `PrepareQuery`, nên danh sách và tra theo id không lọc theo phạm vi. Chức danh đã có bộ lọc này, cấp phòng ban thì chưa.

## 3. Cách làm
- `PrepareQuery`: cấp dùng chung (`CompanyId` null) luôn thấy; cấp của công ty chỉ thấy khi phạm vi người gọi bao gồm công ty đó; người có phạm vi toàn bộ không bị lọc.
- `FindEntityAsync` dùng cùng bộ lọc: tra / sửa / xoá theo id một cấp ngoài phạm vi trả về không tìm thấy.
- Tệp: `src/ERPm.Infrastructure/Services/HumanResource/HrmServices.cs`, `tests/ERPm.Verification/IamChecks.cs`.

## 4. Kiểm tra
`ERPm.Verification`: 122 check đạt (120 cũ + 2 mới: danh sách ẩn cấp của công ty ngoài phạm vi; tra theo id cũng tôn trọng phạm vi, còn người toàn quyền vẫn thấy).

## 5. Việc còn lại
Không.
