# [change] Core Import/Export (Excel/CSV) cho Backend & Frontend

> **Loại:** change
> **Ngày tạo:** 2026-11-17 · **Người làm:** loipham · **Người yêu cầu:** loipham
> **Trạng thái:** Done
> **Progress aggregation:** v1
> **Liên quan:** S26.7 (tiền đề Core), `ERPm-BE`, `ERPm-FE`
> **Phạm vi:** `ERPm-BE` (`ERPm.Application/Common/Transfer`, `ERPm.Infrastructure/Services/Common/Transfer`, `BaseApiController`, `ERPm.UnitTests`), `ERPm-FE` (`src/app/core/models`, `src/app/core/services/file-transfer.service.ts`, `src/app/shared/components/import-dialog`, `src/assets/i18n/system.json`)

## 1. Mô tả
Xây dựng lớp Core Import/Export dùng chung cho toàn hệ thống trên cả Backend (`ERPm-BE`) và Frontend (`ERPm-FE`) trước khi triển khai các báo cáo nghiệp vụ (S26.7) và các module khác.

## 2. Phân tích
- `ERPm-BE` và `ERPm-FE` trước đó chưa có bất kỳ service/contract dùng chung nào cho xuất Excel/CSV hoặc nhập dữ liệu từ Excel.
- Cần một contract thống nhất: BE sinh file `.xlsx` chuẩn (`ClosedXML`), parse & validate từng dòng khi import trả về `ImportResult<T>`; FE cung cấp `FileTransferService` tải blob theo `Content-Disposition`, export CSV UTF-8 BOM nhẹ khi cần, và `ImportDialogComponent` dùng chung.

## 3. Features / Milestones
- [x] BE Core Export (`IExcelExportService`, `ExcelExportService` dùng `ClosedXML`, `BaseApiController.ExcelFile`).
- [x] BE Core Import (`IExcelImportService`, `ExcelImportService` validate header & row-level errors).
- [x] BE Unit Tests (`ERPm.UnitTests` với xUnit, `dotnet test` 5/5 PASS).
- [x] FE Core Transfer (`FileTransferService`, `file-transfer.models.ts` + unit tests).
- [x] FE Shared `ImportDialogComponent` (standalone triad + unit tests + i18n keys trong `system.json`).

## 4. Cách làm
- **Nhánh:** `loipham/core-import-export` tại `ERPm`, `ERPm-BE`, `ERPm-FE`.
- **BE (`ERPm-BE`)**:
  - Cài `ClosedXML` (`0.105.1`) vào `ERPm.Infrastructure`.
  - Tạo `ERPm.Application/Common/Transfer/TransferModels.cs` & `IExcelTransferService.cs`.
  - Tạo `ERPm.Infrastructure/Services/Common/Transfer/ExcelExportService.cs` & `ExcelImportService.cs`, đăng ký singleton trong `DependencyInjection.cs`.
  - Thêm `BaseApiController.ExcelFile(ExportFileResult)`.
  - Tạo project xUnit `tests/ERPm.UnitTests` và thêm vào `ERPm.sln`.
- **FE (`ERPm-FE`)**:
  - Tạo `src/app/core/models/file-transfer.models.ts` & `src/app/core/services/file-transfer.service.ts` (+ `.spec.ts`).
  - Tạo `src/app/shared/components/import-dialog/` (`.ts`, `.html`, `.scss`, `.spec.ts`).
  - Bổ sung i18n keys `transfer.*` vào `src/assets/i18n/system.json` (`vi` và `en`).

## 5. Kiểm tra
- **BE**: `dotnet build ERPm-BE/ERPm.sln` **PASS** (0 Warning(s), 0 Error(s)); `dotnet test ERPm-BE/tests/ERPm.UnitTests/ERPm.UnitTests.csproj --no-build` **PASS** (5/5 passed, 0 failed).
- **FE**: `npm ci` **PASS**; `npx tsc --noEmit -p tsconfig.app.json` & `tsconfig.spec.json` **PASS**; `npx ng build` **PASS**; `npx ng test --watch=false --browsers=ChromeHeadless` **PASS** (**281/281 SUCCESS** trên Node `v22.23.5`).

## 6. Việc còn lại
- Chạy `ng build` & `ng test` trên môi trường Node `>=22.12` (hoặc CI) và commit/PR sau khi bạn kiểm tra.
- Tiếp tục triển khai S26.7 (BE Reports + UnitTest + E2E) dựa trên Core Export vừa tạo.

## 7. Evidence và cập nhật
- Ngày cập nhật cuối: 2026-11-17
