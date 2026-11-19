# [change] S27.5 Tách quyền duyệt, kích hoạt và đóng phiên bản bảng giá

> **Loại:** change
> **Ngày tạo:** 2026-11-19 · **Người làm:** Phạm Hữu Lợi · **Người yêu cầu:** Step 27 Plan (Phúc / ERPm)
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** Step 27 (`plan-step-27-sales-controls-and-preferences.md`), Trello [#128](https://trello.com/c/5H2uSHMO), nhánh `loipham/s27-5-pricelist-permissions`
> **Phạm vi:** `ERPm-BE`, `ERPm-FE-SD`, `ERPm-FE`, `ERPm`

## 1. Mô tả
- **Trước đây:** `PriceListVersionStatus` chỉ có `Draft (1)`, `Active (2)`, `Expired (3)`, `Archived (4)`. `ActivateVersion`, `CloseVersion` và toàn bộ thao tác phiên bản dùng chung quyền `sd:pricelist:edit` cho cả bảng giá bán (`Sales`) và mua (`Purchase`). Không có Data Scope chi nhánh, không có advisory lock chống kích hoạt đồng thời, không có audit lý do/lịch sử và thông báo. Ngoài ra `POST /price-lists` tự tạo `V1` ở trạng thái `Active` và `PUT /price-lists/{id}` sửa thẳng dòng giá của phiên bản `Active`.
- **Yêu cầu mới (đã chốt với chủ trì):**
  1. Tách quyền bảng giá Bán (`sd:pricelist:*`) và Mua (`pur:pricelist:*`) với 11 verb: `view`, `create`, `edit`, `delete`, `submit`, `withdraw`, `approve`, `reject`, `activate`, `close`, `archive`.
  2. Giữ nguyên enum cũ (`Draft=1, Active=2, Expired=3, Archived=4`), bổ sung `PendingApproval=5`, `Approved=6`. Luồng tuyến tính `Draft -> PendingApproval -> Approved -> Active -> Expired -> Archived`, kèm rút lại (`withdraw`) từ `PendingApproval`/`Approved` về `Draft` và xóa mềm phiên bản `Draft`.
  3. Không chặn cứng tự duyệt: kiểm soát bằng phân quyền IAM (người được phân cả 2 quyền vẫn có thể tự lên phiếu và tự duyệt; doanh nghiệp muốn tách người sửa/duyệt thì gán vào 2 vai trò khác nhau).
  4. Khóa lỗ hổng CRUD header: `POST /price-lists` tạo `V1` ở trạng thái `Draft`; `PUT /price-lists/{id}` chỉ cập nhật header, không sửa dòng giá phiên bản `Active`; FE khối mặt hàng hiện hành chuyển chỉ đọc và mở xem chỉ đọc dòng giá phiên bản cho mọi trạng thái.
  5. Khi `activate`: trong transaction + `pg_advisory_xact_lock`, kiểm tra `PriceList.IsActive`, chi nhánh, không được kích hoạt khi vượt quá `EffectiveTo` (của bảng giá hoặc đã quá hạn so với `UtcNow`), không trùng khoảng hiệu lực với bản `Active` khác. Khi `close` sớm: bắt buộc lý do, giữ nguyên `EffectiveTo` gốc và ghi `ClosedAtUtc`/`ClosedBy`/`CloseReason`.
  6. Migration nâng cấp các custom role / inline policy hiện có trong DB chứa tường minh `sd:pricelist:edit` bổ sung thêm `sd:pricelist:submit`, `sd:pricelist:approve`, `sd:pricelist:activate`, `sd:pricelist:close`.

## 2. Phân tích
- `PermissionFilter` nâng cấp `[RequirePermission(string action, params string[] alternatives)]` để cùng endpoint chấp nhận cả `sd:pricelist:*` và `pur:pricelist:*`, sau đó `PriceListService` kiểm tra chính xác quyền + Data Scope chi nhánh theo `PriceList.Type` và `PriceList.BranchId` (đọc cho phép `BranchId == null`, ghi/chuyển trạng thái cho `BranchId == null` bắt buộc `Unrestricted`).
- `ApplicationDbContext` giữ query filter `!IsDeleted` cho `PriceList`/`PriceListVersion` để `CalculateAsync` (`sd:order:view`) không bị ảnh hưởng.
- Audit 2 lớp: các cột snapshot trạng thái trên `tbl_SD_PriceListVersion` + bảng lịch sử bất biến `tbl_SD_PriceListVersionAudit`.
- Thông báo 5 sự kiện (`SD_PRICELIST_SUBMITTED`, `SD_PRICELIST_APPROVED`, `SD_PRICELIST_REJECTED`, `SD_PRICELIST_ACTIVATED`, `SD_PRICELIST_CLOSED`) gửi bất đồng bộ qua `PermissionRecipients.PublishAsync` sau khi commit transaction (đã mở rộng `DocumentNotice.BranchId` sang `int?` để tránh FK error với bảng giá toàn hệ thống).

## 3. Features / Milestones
- [x] BE Domain & IAM: bổ sung trạng thái `PendingApproval (5)` / `Approved (6)`, cột workflow audit + entity `PriceListVersionAudit`, tách 11 quyền cho `sd:pricelist` và `pur:pricelist`, hỗ trợ multi-action `[RequirePermission]`.
- [x] BE Service, API & Concurrency: triển khai đầy đủ luồng `submit`, `withdraw`, `approve`, `reject`, `activate`, `close`, `archive`, `delete` phiên bản nháp, lịch sử audit; kiểm tra quyền Mua/Bán + Data Scope chi nhánh; khóa advisory lock chống kích hoạt cạnh tranh; chặn kích hoạt vượt quá `EffectiveTo`; khóa lỗ hổng `POST`/`PUT` header; tích hợp thông báo & i18n VI/EN.
- [ ] BE Migration & PostgreSQL Verification: đã tạo EF Migration (`20261119081838_AddPriceListVersionWorkflowAndAudit`, `has-pending-model-changes` PASS), chạy `ERPm.UnitTests` PASS 23/23, và cập nhật đầy đủ `ERPm.Verification/Program.cs` — **chờ chạy `ERPm.Verification` trên PostgreSQL 16 (CI `verify.yml` hoặc DB local hợp lệ)** do `appsettings.local.json` hiện báo lỗi xác thực `neondb_owner` và máy không có PostgreSQL/Docker cục bộ.
- [x] FE SD & Shell i18n: cập nhật model/service/UI màn bảng giá theo đúng quyền Mua/Bán và 6 trạng thái (rút lại, duyệt/từ chối/đóng có lý do, lưu trữ, xóa nháp, xem chỉ đọc dòng giá mọi trạng thái, lịch sử audit, khối mặt hàng hiện hành chỉ đọc), đồng bộ 1302/1302 khóa từ điển VI/EN gồm `role.verb.*`, cập nhật quyền menu/route/action-bar cho `pur:pricelist:*`.
- [x] FE Verification: `node tools/check-ui-std.mjs` PASS, `ng test` ChromeHeadless PASS 21/21, `npm run build` production PASS.

## 4. Cách làm
- **ERPm-BE (`loipham/s27-5-pricelist-permissions`):**
  - `src/ERPm.Domain/Entities/Sales/PriceList.cs`
  - `src/ERPm.Domain/Services/Iam/PermissionCatalog.cs`
  - `src/ERPm.API/Security/Permissions.cs`
  - `src/ERPm.API/Controllers/SD/PriceListsController.cs`
  - `src/ERPm.Application/DTOs/Sales/PriceListDtos.cs`
  - `src/ERPm.Application/Common/Crud/IPricingService.cs`
  - `src/ERPm.Application/Common/Interfaces/IApplicationDbContext.cs`
  - `src/ERPm.Infrastructure/Persistence/ApplicationDbContext.cs`
  - `src/ERPm.Infrastructure/Persistence/Migrations/20261119081838_AddPriceListVersionWorkflowAndAudit.cs` (+ `.Designer.cs`, `ApplicationDbContextModelSnapshot.cs`)
  - `src/ERPm.Infrastructure/Persistence/Seeders/NotificationTemplateSeeder.cs`
  - `src/ERPm.Infrastructure/Persistence/Seeders/system_dictionary.json`
  - `src/ERPm.Infrastructure/Services/Common/PermissionRecipients.cs`
  - `src/ERPm.Infrastructure/Services/PriceListService.cs`
  - `tests/ERPm.UnitTests/Sales/PriceListWorkflowTests.cs`
  - `tests/ERPm.Verification/Program.cs`
- **ERPm-FE-SD (`loipham/s27-5-pricelist-permissions`):**
  - `models/sd.models.ts`, `services/sd.service.ts`
  - `price-lists/price-lists.component.{ts,html}`
  - `price-lists/components/price-list-form-dialog/price-list-form-dialog.component.ts`
  - `price-lists/price-list-detail/price-list-detail.component.{ts,html}`
  - `price-lists/components/price-list-version-lines/price-list-version-lines.component.{ts,html}`
  - `price-lists/components/price-list-versions/price-list-versions.component.{ts,html,scss,spec.ts}`
- **ERPm-FE (`loipham/s27-5-pricelist-permissions`):**
  - `src/app/app.routes.ts`
  - `src/app/shared/components/action-bar/action-bar.component.ts`
  - `src/app/shared/components/module-navigation/module-navigation.component.ts`
  - `src/assets/i18n/system.json`

## 5. Kiểm tra
- **BE Build:** `dotnet build ERPm-BE/ERPm.sln --nologo -v q` → **PASS** (`0 Warning(s), 0 Error(s)`).
- **BE EF Migration Check:** `dotnet ef migrations has-pending-model-changes` → **PASS** (`No changes have been made to the model since the last migration.`).
- **BE Unit Tests:** `dotnet test ERPm-BE/tests/ERPm.UnitTests/ERPm.UnitTests.csproj` → **PASS** (`Passed: 23, Failed: 0`, gồm 4 test mới trong `PriceListWorkflowTests` phủ catalog 22 quyền, toàn bộ vòng đời 12 bước + audit + thông báo, chặn quá `EffectiveTo` / ngoài khung header, cho phép tự duyệt khi đủ quyền, tách Mua/Bán và Data Scope chi nhánh).
- **BE PostgreSQL Integration (`ERPm.Verification`):** Đã cập nhật đủ test migration nâng cấp role, khóa kích hoạt đồng thời (`pg_advisory_xact_lock`), bảo toàn snapshot SO và ma trận HTTP IAM Mua/Bán/chi nhánh — **chưa chạy được cục bộ** vì `appsettings.local.json` báo lỗi `28P01: password authentication failed for user 'neondb_owner'` và môi trường local không có PostgreSQL/Docker; sẽ được xác minh khi chạy CI `verify.yml` (PostgreSQL 16) hoặc cung cấp `ERPM_TEST_CONNECTION`.
- **FE UI-STD:** `node tools/check-ui-std.mjs` → **PASS** (`UI-STD check OK`).
- **FE Unit Tests (`ChromeHeadless`):** `ng test --watch=false --browsers=ChromeHeadless` (price-lists + module-navigation + action-bar) → **PASS** (`TOTAL: 21 SUCCESS`, `0.733s`).
- **FE Production Build:** `npm run build` (`ng build`) → **PASS** (`Application bundle generation complete`, 0 lỗi, 0 cảnh báo trên các file sửa đổi).
- **BE/FE Dictionary Parity:** `1302/1302` khóa VI & EN khớp 100% (`diffVi: []`, `diffEn: []`).

## 6. Việc còn lại
- Mở PR theo thứ tự submodule (`ERPm-BE`, `ERPm-FE-SD` → `ERPm-FE` → `ERPm`), kiểm tra CI `Verify backend` (PostgreSQL 16 `ERPm.Verification`) PASS, sau đó merge PR, cập nhật trạng thái task sang `Done` và cập nhật Trello [#128](https://trello.com/c/5H2uSHMO).

## 7. Evidence và cập nhật
- Commit đã push (nhánh `loipham/s27-5-pricelist-permissions`):
  - `ERPm-BE`: `aa604e9971739e16a572eb775d8756e21c174663`
  - `ERPm-FE-SD`: `fffdc4af83e0df597da945177fd8f74541c870db`
  - `ERPm-FE`: `13fc5f4ff96be106360bcb5f4517dc5c44a7cfcf`
- CI / workflow run và kết quả: Chờ mở PR để chạy `verify.yml` (PostgreSQL 16)
- Ngày cập nhật cuối: 2026-11-19
- Đã xác minh: BE build 0 warnings/errors, EF `has-pending-model-changes` PASS, `ERPm.UnitTests` 23/23 PASS, FE `UI-STD` PASS, FE `ng test` 21/21 PASS, FE `ng build` production PASS, BE/FE i18n parity 1302/1302 PASS. Chưa xác minh trực tiếp trên PostgreSQL live (`ERPm.Verification`) do thiếu DB kết nối cục bộ.
