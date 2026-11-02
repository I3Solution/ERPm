# Step 20 – S20.4.5 Màn QTCT (work history) + danh mục cấp phòng ban

Trạng thái: **chờ tester** (chưa merge). Nhánh `thien/step20-work-history` ở root, ERPm-BE, ERPm-FE và ERPm-FE-HRM.

## Mục tiêu
Điều chuyển nhân viên và cho nghỉ việc bằng giao diện (trước đây sửa nhân viên khóa các trường tổ chức và chưa có đường nào khác), và cho mỗi công ty tự quản các cấp phòng ban. Theo thẻ Trello S20.4.5 và bài học HRM9 (`notes/hrm9-ho-so/loi-van-hanh-phan-quyen-qtct.md`).

## File chính
| Tầng | File |
| :--- | :--- |
| BE | `WorkHistoriesController.cs` (`GET ?employeeId=`), `HrmDtos.cs` (`WorkHistoryFilterQuery`), `HrmServices.cs` (`WorkHistoryService.ApplyFilters`), `IamChecks.cs` (+1 check) |
| FE | `modules/HRM/work-histories/` (màn timeline + `components/work-history-form-dialog/`), `modules/HRM/department-levels/` (màn + `components/department-level-form-dialog/`), `org.models.ts`, `org-admin.service.ts`, `app.routes.ts`, `app.component.html` (menu), `employees.component.*` (nút QTCT) |
| Từ điển | nhãn `dl.*`, `wh.*`, `emp.work_history`, `menu.department_levels` ở `system_dictionary.json` và `system.json` (giống hệt nhau) |

## Quyết định thiết kế
- Mỗi màn một thư mục riêng, widget con vào `components/` (quy tắc mới của Thiện, theo ART-ERP-FE).
- Timeline lưu và gửi **id**, tên chỉ giải ra khi hiển thị, nên đổi tên sau này không viết lại lịch sử (bài học HRM9).
- Hai dòng duyệt cùng ngày: dòng sau thắng, đúng cách BE chọn dòng hiện tại (`ORDER BY date, created, id`); có test FE.
- Nghỉ việc giữ nguyên nơi công tác cuối, chỉ đặt `isTermination`; nhân viên đã nghỉ thì ẩn nút điều chuyển/nghỉ việc.
- Điều chuyển bắt đầu từ nơi công tác hiện tại; đổi công ty xóa chi nhánh/phòng ban/chức danh, đổi chi nhánh xóa phòng ban.
- Việc tính nơi công tác hiện tại và đồng bộ hồ sơ nhân viên do BE làm (`RefreshEmployeeAsync`), FE không tự suy ra.

## Lệnh và kết quả kiểm tra
- BE: `dotnet build` 0 warning / 0 error; `ERPm.Verification` 131/131.
- FE: `ng build` 0 lỗi (cảnh báo budget bundle có sẵn); Karma 109/109.
- **Chưa test**: thao tác trên trình duyệt; giao tester.

## Việc còn lại
| Việc | Trạng thái | Ghi chú |
| :--- | :--- | :--- |
| Kiểm tay QTCT và cấp phòng ban | Todo | Chờ tester |
| Dọn cấu trúc thư mục các màn cũ | Todo | [refactor-20261102-fe-per-screen-folders](../tasks/refactor-20261102-fe-per-screen-folders.md), sau khi xong S20.4.5 |
| Màn danh mục cấp phòng ban chưa có kiểm tra "mỗi công ty chỉ thấy cấp của mình" bằng UI | Todo | BE đã giới hạn theo phạm vi dữ liệu (BUG-20261101) |
