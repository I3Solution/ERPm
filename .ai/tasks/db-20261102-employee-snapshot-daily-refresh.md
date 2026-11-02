# [db] Job hằng ngày áp dụng dòng QTCT đến ngày hiệu lực lên hồ sơ nhân viên

> **Loại:** db
> **Ngày tạo:** 2026-11-02 · **Người làm:** Thiện (AI executor) · **Người yêu cầu:** BA (quyết N2 của tester)
> **Trạng thái:** Done (tester PASS 2026-11-02; BE `3099951`, root `607e832`)
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

## 4b. Đã làm (2026-11-02)
- `EmployeeSnapshot.ApplyAsync` (logic dùng chung, `ERPm.Infrastructure/Services/HumanResource/EmployeeSnapshot.cs`): `WorkHistoryService.RefreshEmployeeAsync` gọi lại hàm này, không nhân đôi.
- `EmployeeSnapshotRefresher.RefreshStaleAsync(today)`: tìm nhân viên có cache lệch dòng QTCT đã duyệt hiệu lực mới nhất (thứ tự ngày, giờ tạo, id) rồi áp lại; trả số nhân viên đã sửa; idempotent nên nhiều instance chạy trùng không sai.
- `EmployeeSnapshotWorker` (BackgroundService, đăng ký trong `DependencyInjection`): chạy một lần khi khởi động (bù thời gian tắt máy) rồi mỗi ngày 00:05 UTC; lỗi một lần chỉ ghi log, ngày sau chạy tiếp.
- Verification: 136/136 (+3 check: áp dòng đã đến ngày và bỏ qua dòng tương lai, idempotent và nhận dòng tương lai khi đến ngày, thời điểm chạy kế tiếp).

## 5. Việc còn lại
- Tester đã kiểm bằng API thật (dòng hôm qua áp, dòng +30 ngày không áp, nghỉ việc, chưa duyệt, xóa mềm, cùng ngày, idempotent).
- Gợi ý của tester, chưa làm: `RefreshStaleAsync` nạp toàn bộ dòng QTCT đã duyệt vào bộ nhớ mỗi lần chạy (lo khi dữ liệu lớn); job chưa ghi audit từng nhân viên.
- Đã chạy tại UTC (cùng cách các chỗ khác lấy "hôm nay"); nếu cần theo múi giờ công ty thì tách task.
