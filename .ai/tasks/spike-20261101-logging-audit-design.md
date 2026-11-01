# [spike] Thiết kế Logging & Audit Trail cho ERPm

> **Loại:** spike
> **Ngày tạo:** 2026-11-01 · **Người làm:** BA & Giao việc ERPm · **Người yêu cầu:** Thiện
> **Trạng thái:** Todo
> **Liên quan:** `PROJECT_MASTER.md` (Middlewares/LoggingMiddleware mới chỉ là đặt tên trong sơ đồ, chưa code), `ERPm.Domain/Common/BaseEntity.cs`, `ERPm.API/Startup.cs`, `ERPm.API/Middlewares/ApiExceptionMiddleware.cs`

## 1. Mô tả
Câu hỏi: ERPm hiện có gì cho "Logging", còn thiếu gì so với một hệ ERP/HRM thật đã chạy (HRM9), và nên thiết kế theo hướng nào để vừa đủ dùng vừa không lặp lại độ phức tạp thừa của HRM9.

## 2. Hiện trạng ERPm (đã đọc code, không suy đoán)
- `BaseAuditableEntity` (`ERPm.Domain/Common/BaseEntity.cs:58`) chỉ lưu **giá trị cuối**: `CreatedBy/CreatedAtUtc/LastModifiedBy/LastModifiedAtUtc` + soft-delete. Không có lịch sử thay đổi (ai sửa field nào, giá trị cũ/mới), không có IP, không có log theo từng lần sửa.
- `Startup.cs:16-17`: chỉ `builder.Logging.AddConsole()` — log ra console, **không lưu trữ, không tra cứu lại được** sau khi restart.
- `ApiExceptionMiddleware.cs`: chỉ bắt exception để trả lỗi chuẩn hoá cho FE, có `ILogger` nhưng không ghi log có cấu trúc (structured) hay log truy cập bình thường (request thành công).
- Không có bảng nào ghi: đăng nhập/đăng xuất, đổi quyền, truy cập dữ liệu nhạy cảm, hay nhật ký request/response.

## 3. HRM9 làm gì (đọc source `HRM10-Git`, không đoán)
Tách rõ 2 tầng, không gộp chung:

| HRM9 (file) | Mục đích | Ghi gì |
| --- | --- | --- |
| `Sys_DataLogEntity` (`HRM.Business.HrmSystem.Models`) | Audit **theo dòng dữ liệu** mỗi bảng nghiệp vụ | `TableName`, `ObjectID`, `UserCreate/UserUpdate`, `IPCreate/IPUpdate`, `DateCreate/DateUpdate`, `IsDelete`, `Count` — vẫn chỉ là giá trị cuối + IP, **không lưu diff field cũ/mới** |
| `Sys_RequestLogEntity` / `RequestLog` (`Sys_LogRequestAnalyticServices.cs`) | Log request/lỗi hệ thống kiểu structured logging | `Level`, `LoggerName`, `Title`, `Message`, `Exception`, `DurationMilliseconds`, `MachineName`, `Headers`, `UserLog` — lưu vào **SQLite riêng** (`GetSqlLiteDataBaseLog`), đọc lại để vẽ biểu đồ dùng theo màn hình, theo người dùng, theo thời gian (scatter chart, timeline) |
| `Sys_APIHistoryEntity` | Thống kê tình trạng API theo ngày (`Status`, `Method`) | Dùng cho màn sức khoẻ hệ thống, không phải audit nghiệp vụ |
| `Sys_AuditConfigEntity` | Tên gọi "Audit" nhưng thực chất là cấu hình nhãn cơ cấu tổ chức (Company/Branch/Department...) dùng khi xuất báo cáo | Không liên quan ghi log |

**Bài học rút ra:**
1. **Tách bạch 2 loại log** — audit dữ liệu nghiệp vụ (ai/khi nào đổi bản ghi nào) và log vận hành/lỗi hệ thống (request, exception, performance) — đừng gộp vào 1 bảng như cách đặt tên "Audit" nhầm lẫn của HRM9 (`Sys_AuditConfigEntity`).
2. **Cái HRM9 làm thiếu mà ERPm nên làm tốt hơn:** `Sys_DataLogEntity` không lưu được giá trị field cũ/mới (chỉ biết "có sửa", không biết sửa gì) — với nghiệp vụ kế toán/tồn kho đã `Posted`, ERPm nên lưu **diff dạng JSONB** (before/after) cho các bảng nhạy cảm (chứng từ đã ghi sổ, user, role, permission) thay vì chỉ đếm lượt sửa.
3. **Cái HRM9 làm thừa, đừng copy:** tự xây kho log riêng bằng SQLite + code phân tích thủ công (1197 dòng `Sys_LogRequestAnalyticServices.cs` để vẽ scatter chart/timeline theo màn hình) — ERPm nên dùng **Serilog** ghi log có cấu trúc thẳng vào PostgreSQL (hoặc file JSON) và nếu cần biểu đồ thì dùng công cụ có sẵn (Grafana/Seq) thay vì tự viết lại bộ phân tích.
4. Theo đúng rule "Không hard-delete chứng từ đã Posted" (`AGENTS.md` mục 4) — audit trail là điều kiện cần để chứng minh tính toàn vẹn sổ sách, nên **ưu tiên làm cho module Accounting/IAM trước**, không cần làm hết mọi bảng cùng lúc.

## 4. Đề xuất thiết kế cho ERPm (2 tầng, độc lập nhau)

**Tầng A — Audit Trail nghiệp vụ** (ai sửa gì, phục vụ truy vết/kiểm toán):
- Bảng `tbl_SYS_AuditLog` (JSONB `OldValues`/`NewValues`, `TableName`, `RecordId`, `Action` Create/Update/Delete/Posted, `UserId`, `IPAddress`, `AtUtc`).
- Ghi tự động qua EF Core `SaveChangesAsync` override (interceptor đọc `ChangeTracker`), áp dụng cho entity có `[Auditable]` hoặc implement interface đánh dấu — ưu tiên: `AppUser`, `IamRole`, chứng từ Sales/Purchase/Accounting đã `Posted`.
- Màn hình xem log: lưới đọc theo `TableName`/`RecordId`/khoảng ngày, phân quyền riêng `sys:auditlog:view` (chỉ Admin/Operator theo scope chi nhánh).

**Tầng B — Log vận hành/lỗi hệ thống:**
- Thay `AddConsole()` bằng Serilog, sink ghi file JSON cuộn theo ngày (và tuỳ chọn sink PostgreSQL bảng riêng `tbl_SYS_RequestLog` nếu cần tra cứu qua UI) — có `RequestId`, `UserId`, `Path`, `Method`, `StatusCode`, `DurationMs`, `Exception`.
- Không làm dashboard phân tích tự chế như HRM9; nếu Thiện cần xem nhanh thì làm 1 màn "Nhật ký hệ thống" lọc theo thời gian/level/user là đủ cho giai đoạn này.

## 5. Việc còn lại
- Đây là tài liệu khảo sát, **chưa code**. Cần Thiện quyết định mức ưu tiên (so với Role designer S20.4.3 đang làm) rồi mới raise thành task `[add]` thật (BE: AuditLog interceptor + bảng; FE: màn xem log) và giao việc.
- Đề xuất: không gấp bằng S20.4.3/S20.4.5 đang Doing — để ở Backlog, ưu tiên sau khi xong Step 20.4, trước khi Step 22 (SD) đi vào Posted chứng từ nhiều hơn.
