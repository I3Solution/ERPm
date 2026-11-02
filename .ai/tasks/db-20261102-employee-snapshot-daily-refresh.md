# [db] Job hằng ngày áp dụng dòng QTCT đến ngày hiệu lực lên hồ sơ nhân viên

> **Loại:** db
> **Ngày tạo:** 2026-11-02 · **Người làm:** Thiện (AI executor) · **Người yêu cầu:** BA (quyết N2 của tester)
> **Trạng thái:** Todo
> **Liên quan:** S20.4.5 ([step-20-work-history-ui](../steps/step-20-work-history-ui.md)), tester N2

## 1. Mô tả
Dòng QTCT đã duyệt có `DateEffective` trong tương lai (HR lên lịch điều chuyển trước) không được áp dụng khi đến ngày, vì `WorkHistoryService.RefreshEmployeeAsync` chỉ chạy khi có ghi. Hậu quả: `Employee.CompanyId/BranchId/DepartmentId/JobPositionId/IsActive` sai cho tới khi có người sửa tiếp, ảnh hưởng hiển thị và lọc nhân viên. IAM không bị ảnh hưởng (đọc thẳng dòng QTCT hiệu lực theo ngày).

## 2. Phân tích
- Mẫu có sẵn: `NotificationOutboxWorker` trong `ERPm.Infrastructure` (`BackgroundService`).
- Dòng hiệu lực = dòng đã duyệt mới nhất có `DateEffective <= hôm nay` (`ORDER BY date, created_at, id`), cùng logic `RefreshEmployeeAsync`.
- Không đổi schema; không cần migration.

## 3. Cách làm (dự kiến)
- `BackgroundService` chạy 1 lần/ngày (khoảng 00:05), quét nhân viên mà dòng hiệu lực khác snapshot hiện tại (`CompanyId/BranchId/DepartmentId/JobPositionId/IsActive`), gọi lại đúng logic refresh cho các nhân viên lệch rồi `iam.Invalidate()`.
- Tách logic refresh dùng chung với `WorkHistoryService`; không nhân đôi.
- Chạy được khi nhiều instance API: refresh idempotent nên chạy trùng không gây sai.

## 4. Kiểm tra
- Check Verification: tạo dòng ngày hôm qua nhưng ghi trực tiếp để bỏ qua refresh, chạy một vòng job, snapshot nhân viên khớp; chạy lần hai không đổi gì.

## 5. Việc còn lại
- Toàn bộ (Todo). Làm sau khi tester PASS lần 2 và S20.4.5 đã merge; không chặn S20.4.5.
