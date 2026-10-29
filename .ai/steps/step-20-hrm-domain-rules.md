# Step 20 — HRM: lõi nghiệp vụ thuần (QTCT, phạm vi dữ liệu, tính công)

> **Ngày:** 2026-10-30 · **Người thực hiện:** Thiện (module HRM) · **Trạng thái:** Hoàn thành

## Mục tiêu
Đây là bước đầu chuyển nghiệp vụ HRM (Thaco / HRM9, đã kiểm chứng ở bản demo Tian-v1) vào ERPm. Bước này chỉ chuyển **lõi nghiệp vụ thuần**:
- không có DB, entity, API hay màn hình;
- không đụng tới module khác;
- được kiểm chứng tự động bằng bộ kiểm tra riêng.

## Thay đổi

### ERPm-BE

**Code lõi.** Thư mục `src/ERPm.Domain/Services/HumanResource/`, namespace `ERPm.Domain.Services.HumanResource`, gồm 4 file:

| File | Nội dung |
| :--- | :--- |
| `WorkTimeline.cs` | Luật quá trình công tác (QTCT) |
| `DataScope.cs` | Phạm vi dữ liệu của người dùng |
| `TimesheetCalculator.cs` | Tính công theo ngày và tổng hợp bảng công |
| `ShiftSchedule.cs` | Record mô tả ca làm việc |

- **`WorkTimeline.cs`** xử lý:
  - mốc người dùng thấy được hồ sơ (`VisibleBefore`);
  - quyền xem và quyền sửa theo ngày neo của bản ghi (`CanSee`, `CanWrite`);
  - cửa sổ N ngày sau khi điều chuyển (`IsWithinSelectorWindow`);
  - tách kỳ theo pháp nhân (`CompanySegments`, `EmploymentSegments`, `FirstCompanyBoundary`).
- **`DataScope.cs`** xử lý phạm vi theo cặp (phòng ban + pháp nhân):
  - nếu có dòng ghép cặp thì bỏ các dòng chỉ có một chiều (luật HRM9);
  - mở rộng phạm vi phòng ban xuống cây con;
  - luôn thấy hồ sơ được cấp riêng và hồ sơ của chính mình.
- **`TimesheetCalculator.cs`**:
  - Tính theo ngày: ghép quẹt thẻ theo khung ca, kể cả ca qua đêm. Ra trạng thái đi muộn, về sớm, thiếu quẹt, vắng, nghỉ phép có lương / không lương. Công làm tròn đến nửa ngày.
  - Tổng hợp thành bảng công.
- **`ShiftSchedule.cs`** là record thuần (giờ vào/ra, nghỉ giữa ca, số phút đi muộn cho phép, ngày làm). Bộ tính công dùng record này nên không phụ thuộc entity danh mục ca, sẽ làm ở bước sau.
- **Khác bản Tian-v1:**
  - Id đổi từ `Guid` sang `int`, theo Dual-Key của ERPm.
  - Toàn bộ comment bằng tiếng Anh.

**Kiểm tra và tích hợp**
- `tests/ERPm.Hrm.Verification/`: project console theo kiểu `Check()` giống `ERPm.Verification`. Chỉ tham chiếu `ERPm.Domain`, **không cần PostgreSQL**. Gồm 28 kiểm tra, chuyển toàn bộ test case của Tian-v1 và thêm 2 case mới:
  - phạm vi cây phòng ban;
  - ngày không thuộc thời gian làm việc / ca chưa kết thúc.
- `ERPm.sln`: thêm project vào solution folder `tests`.
- `.github/workflows/verify.yml`: chạy `ERPm.Hrm.Verification` trước `ERPm.Verification`.

### Root
- `.github/workflows/verify.yml`: thêm bước `ERPm-BE/tests/ERPm.Hrm.Verification`.
- `.ai/status.md`, và step log này.

## Lệnh đã chạy
```
dotnet sln ERPm.sln add tests/ERPm.Hrm.Verification/ERPm.Hrm.Verification.csproj --solution-folder tests
dotnet build ERPm.sln
dotnet run --project tests/ERPm.Hrm.Verification --no-build
dotnet run --project tests/ERPm.Verification --no-build      # ERPM_TEST_CONNECTION -> PostgreSQL 16 local
```

## Verification
- `ERPm.Hrm.Verification`: **28/28 PASS**.
- `ERPm.Verification` (44 kiểm tra Step 19) chạy lại trên PostgreSQL 16 sau thay đổi: **44/44 PASS**, không ảnh hưởng nghiệp vụ hiện có.
- `dotnet build ERPm.sln`: **0 warning, 0 error** (SDK 10.0.403).

## Việc cần chốt trước bước tiếp theo
1. **Ánh xạ tổ chức:** HRM cần *pháp nhân* (`CompanyId`) và *cơ cấu tổ chức / phòng ban* (`OrgStructureId`). ERPm hiện mới có `tbl_SYS_Branch` dạng cây và `TenantId`. Cần chốt một trong hai:
   - (a) Branch = phòng ban, thêm bảng pháp nhân;
   - (b) thêm `tbl_SYS_Company` + `tbl_HRM_OrgStructure`.
2. **Liên kết tài khoản với hồ sơ:** `AppUser` ↔ hồ sơ nhân viên (`OwnProfileId`), và nơi lưu các dòng phân quyền dữ liệu HRM.

## Hướng tiếp theo (Step HRM-2)
- Entity và bảng `tbl_HRM_*` kế thừa `BaseAuditableEntity`, tạo bằng EF migration: hồ sơ (`Profile`), QTCT (`WorkHistory`), hợp đồng, danh mục, ca (`Shift`, ánh xạ sang `ShiftSchedule`).
- Danh mục dùng `BaseCrudController` trong `Controllers/HRM/`, route `api/v1/hrm/...`.
- FE: màn danh mục và hồ sơ trong submodule `ERPm-FE-HRM`, dùng `<app-form-control>`.
- Sau đó: chuyển bộ công thức lương (Formula engine) của Tian-v1, cũng là lõi thuần, cùng bộ kiểm tra.
