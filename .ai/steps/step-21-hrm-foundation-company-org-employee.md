# Step 21 — HRM nền: pháp nhân, cơ cấu tổ chức, hồ sơ, QTCT, ca, phân quyền dữ liệu

> **Ngày:** 2026-10-30
> **Người thực hiện:** Thiện (module HRM)
> **Trạng thái:** Hoàn thành trên nhánh `thien/hrm-foundation` (ERPm-BE và root), **chờ anh Phúc review** trước khi merge, vì có thêm bảng SYS dùng chung.

## Mục tiêu
- Dựng dữ liệu nền cho HRM theo đúng khuôn ERPm:
  - Clean Architecture
  - Dual-Key
  - BaseCrud
  - EF migration
  - Soft delete và audit
- Không làm thay đổi hành vi của các module bán hàng, kho, kế toán đang có.

## Quyết định thiết kế
| Câu hỏi | Lựa chọn | Lý do |
| :--- | :--- | :--- |
| Phòng ban có dùng `tbl_SYS_Branch` không? | **Không.** Thêm `tbl_SYS_OrgStructure` (cây riêng) | Branch là điểm kinh doanh: kho, hóa đơn, bút toán và phạm vi quyền bán hàng đều gắn vào nó. Nếu trộn phòng ban vào sẽ làm sai ô chọn chi nhánh và phạm vi quyền bán hàng. |
| Pháp nhân lưu ở đâu? | **`tbl_SYS_Company` trong SYS**, `tbl_SYS_Branch.company_id` cho phép null | Kế toán và thuế cũng cần pháp nhân, không riêng HRM. Thêm cột cho phép null nên không phải sửa dữ liệu cũ. Phân biệt 3 tầng: Tenant = khách thuê phần mềm, Company = pháp nhân, Branch = điểm kinh doanh. |
| Cơ cấu tổ chức lưu ở đâu? | **SYS** (`tbl_SYS_OrgStructure`, có `company_id` và `branch_id` tùy chọn) | Mua hàng (phòng đề xuất) và kế toán (trung tâm chi phí) sau này sẽ dùng chung. |
| Tài khoản nối với nhân viên thế nào? | **`tbl_HRM_Employee.user_id`**, unique khi chưa xóa | Phụ thuộc đi một chiều HRM → SYS, nên `AppUser` không phải sửa. |
| Phân quyền dữ liệu HRM | **`tbl_HRM_DataPermission`**: user + phòng ban và/hoặc pháp nhân, có check constraint bắt buộc ít nhất một chiều | Đúng luật `Sys_DataPermission` của HRM9 và `DataScope` ở Step 20. Tách khỏi `AppUser.BranchIds`. |

Mapping khi chuyển dữ liệu từ HRM9:

| HRM9 | ERPm |
| :--- | :--- |
| `Cat_Company` | `tbl_SYS_Company` |
| `Cat_OrgStructure` | `tbl_SYS_OrgStructure` |
| `Hre_Profile` | `tbl_HRM_Employee` |
| `Hre_WorkHistory` | `tbl_HRM_WorkHistory` |
| `Cat_Shift` | `tbl_HRM_Shift` |
| `Sys_DataPermission` | `tbl_HRM_DataPermission` |

## Thay đổi (ERPm-BE)

### Domain
- `Entities/System/`: thêm `Company`, `OrgStructure`. `Branch` thêm `CompanyId` cùng navigation.
- `Entities/HumanResource/`:
  - `Employee`
  - `WorkHistory`: có `ToTimelineEntry()`
  - `Shift`: có `ToSchedule()`
  - `HrmDataPermission`

### Application
- `DTOs/System/OrganizationDtos.cs`
- `DTOs/HumanResource/HrmDtos.cs`: có thêm `EmployeeTimelineDto`
- `Features/HumanResource/IHrmDataScopeService.cs`

### Infrastructure

**`ApplicationDbContext`** có 6 bảng mới, cấu hình theo `ConfigureDualKeyAuditable`:
- Index unique cho mã.
- Index `(employee_id, date_effective) INCLUDE (...)` cho việc đọc timeline.
- FK đều `Restrict`.
- Có query filter soft delete.

**Các service** kế thừa `BaseCrudService` và override hook:

| Service | Kiểm tra |
| :--- | :--- |
| `CompanyService` | Không cho xóa khi đang được dùng |
| `OrgStructureService` | Parent phải tồn tại, chống vòng lặp, kế thừa pháp nhân của cha, không cho xóa khi còn con hoặc còn QTCT |
| `EmployeeService` | Tài khoản phải tồn tại |
| `WorkHistoryService` | Dòng không phải nghỉ việc phải có phòng ban. Tự lấy pháp nhân theo phòng ban và báo lỗi nếu lệch |
| `ShiftService` | Giờ vào và giờ ra không trùng nhau, số phút không âm, thời lượng chuẩn > 0 |
| `HrmDataPermissionService` | Phải có ít nhất một chiều, các tham chiếu phải tồn tại |

**`HrmDataScopeService`** đọc phân quyền và cây phòng ban, rồi dựng `DataScope`:
- Admin và lệnh hệ thống: không giới hạn.
- Kết quả cache theo request.
- Timeline chỉ lấy các dòng QTCT đã duyệt.

**Migration và DI**
- Migration `AddHrmFoundation` chỉ thêm (6 bảng + `tbl_SYS_Branch.company_id`), không sửa hay xóa gì.
- `database/current_model.sql` sinh lại bằng `tools/ERPm.Schema`. Thứ tự bảng thay đổi vì `Branch` giờ trỏ tới `Company`.
- `DependencyInjection.cs`: đăng ký closed generic, ghi đè open generic của BaseCrud.

### API

| Controller | Route | Phân quyền |
| :--- | :--- | :--- |
| `SYS/CompaniesController` | `api/v1/sys/companies` | Ghi: Admin |
| `SYS/OrgStructuresController` | `api/v1/sys/org-structures` | Ghi: Admin |
| `HRM/ShiftsController` | `api/v1/hrm/shifts` | Đọc: mọi tài khoản. Ghi: Admin |
| `HRM/EmployeesController` | `api/v1/hrm/employees` + `GET {id}/timeline?from&to` | **Admin cho cả đọc** |
| `HRM/WorkHistoriesController` | `api/v1/hrm/work-histories` | **Admin cho cả đọc** |
| `HRM/DataPermissionsController` | `api/v1/hrm/data-permissions` | **Admin cho cả đọc** |

Employees, WorkHistories và DataPermissions là dữ liệu cá nhân, nên chỉ Admin được đọc cho đến khi có bước đọc lọc theo `DataScope`.

### Kiểm tra
- `tests/ERPm.Hrm.Verification` thêm `DatabaseChecks.cs`: 23 kiểm tra trên một DB PostgreSQL mới `erpm_hrm_verify_*`.
  - Nguồn kết nối giống `ERPm.Verification`: `ERPM_TEST_CONNECTION` hoặc `appsettings.local.json`.
  - Nếu không có kết nối thì tự bỏ qua phần DB.
- CI đã chạy project này từ Step 20 với `ERPM_TEST_CONNECTION`.

### Tài liệu
- `PROJECT_MASTER.md` (root + BE): thêm module HRM vào bảng thư mục, và thêm các bảng SYS/HRM mới.

## Lệnh đã chạy
```
dotnet tool install --global dotnet-ef --version 10.0.14
dotnet build ERPm.sln
dotnet ef migrations add AddHrmFoundation -p src/ERPm.Infrastructure -s src/ERPm.API -o Persistence/Migrations --no-build
dotnet run --project tools/ERPm.Schema --no-build -- database/current_model.sql
dotnet run --project tests/ERPm.Hrm.Verification --no-build     # ERPM_TEST_CONNECTION -> PostgreSQL 16
dotnet run --project tests/ERPm.Verification --no-build
dotnet run --project src/ERPm.API --launch-profile http --no-build -- --migrate   # DB local
```

## Verification
- `dotnet build ERPm.sln`: **0 warning, 0 error**.
- `ERPm.Hrm.Verification`: **51/51 PASS** (28 kiểm tra thuần + 23 kiểm tra trên DB):
  - migration khớp model;
  - Branch cũ không có `company_id` vẫn chạy;
  - mã trùng bị unique index chặn;
  - kế thừa pháp nhân, chống vòng lặp, chặn xóa khi đang dùng;
  - một tài khoản chỉ gắn một nhân viên;
  - timeline chỉ lấy dòng đã duyệt và tách theo pháp nhân;
  - scope mở rộng xuống cây con, chủ cũ chỉ sửa được kỳ của mình;
  - Admin không giới hạn;
  - ca lưu vào DB đem tính công cho ra 1 công;
  - xóa mềm vẫn giữ lại dữ liệu.
- `ERPm.Verification` (Step 19): **44/44 PASS**, không ảnh hưởng nghiệp vụ hiện có.
- Kiểm qua HTTP trên API local:
  - Admin tạo được pháp nhân, phòng ban, ca, nhân viên, QTCT. QTCT tự nhận pháp nhân của phòng ban. API timeline trả đúng đoạn.
  - Ca không hợp lệ trả **400** `error.validation.request`.
  - Viewer: `GET /hrm/employees` → **403**; `GET /hrm/shifts` → 200; `POST /sys/companies` → **403**.
  - Không đăng nhập → **401**.

## Hướng tiếp theo
1. Đọc nhân viên và QTCT có lọc theo `DataScope` (dịch `WorkTimeline.VisibleBefore` sang một câu SQL `EXISTS`), kèm cờ được sửa/xóa theo từng dòng. Sau đó mở quyền đọc cho Operator.
2. FE (`ERPm-FE-HRM`): danh mục pháp nhân, cơ cấu tổ chức, ca; hồ sơ nhân viên và QTCT, dùng `<app-form-control>`. Thêm key i18n vào `system.json` (FE) và `system_dictionary.json` (BE), vì CI so sánh 2 file này.
3. Chấm công: quẹt thẻ, nghỉ phép, kỳ công khóa theo pháp nhân, bảng công dùng `TimesheetCalculator`.
