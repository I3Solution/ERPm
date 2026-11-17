# [change] S26.7: Báo cáo Tuổi nợ (AR Aging), Sổ Nhật ký chung, Sổ Cái & Kiểm thử E2E / UnitTest

> **Loại:** change
> **Ngày tạo:** 2026-11-17 · **Người làm:** loipham · **Người yêu cầu:** loipham
> **Trạng thái:** Done
> **Progress aggregation:** v1
> **Liên quan:** Trello S26.7 (`https://trello.com/c/wN5cx4jk`), Core Import/Export (`5bb4a8c`)
> **Phạm vi:** `ERPm-BE` (`SalesInvoice.DueDate` + migration, `AccountingReportService`, `AccountingReportsController`, `PermissionCatalog`, `ERPm.UnitTests`, `ERPm.Verification`), `tests/e2e/specs/accounting-s26.spec.ts`

## 1. Mô tả
Triển khai phần Backend, Unit Tests và E2E Playwright cho thẻ **[S26.7][QA/Core]**:
- Báo cáo Phân tích Tuổi nợ Khách hàng (AR Aging Report) + Xuất Excel dùng `IExcelExportService`.
- Báo cáo Đối chiếu Công nợ Đối tác (Statement of Account).
- Sổ Nhật ký chung (General Journal), Sổ Cái (General Ledger) & Sổ chi tiết Quỹ/Ngân hàng (Treasury Ledger).
- Bộ kiểm thử tự động: `ERPm.UnitTests` (`dotnet test`), `ERPm.Verification` (`AccountingReportChecks`), và E2E Playwright (`accounting-s26.spec.ts`).

## 2. Phân tích
- `SalesInvoice` trước đó chưa có `DueDate` nên cần bổ sung `DateTime? DueDate` và EF Core migration `AddSalesInvoiceDueDate` (mặc định `InvoiceDate` khi chưa truyền).
- `PermissionCatalog` bổ sung `acc:report:view` để bảo vệ các endpoint báo cáo kế toán.

## 3. Features / Milestones
- [x] `SalesInvoice.DueDate` + EF migration `AddSalesInvoiceDueDate`.
- [x] `IAccountingReportService`, `AccountingReportService`, `AccountingReportsController` (AR Aging + Excel Export, Statement of Account, General Journal, General Ledger, Treasury Ledger).
- [x] `ERPm.UnitTests` (`AccountingReportRulesTests`, `AccountingReportServiceTests`, `DynamicPostingEngineTests`, `ExcelTransferServiceTests` — 19/19 PASS).
- [x] `ERPm.Verification` (`AccountingReportChecks`).
- [x] `tests/e2e/specs/accounting-s26.spec.ts` (luồng Credit Invoice -> AR Aging / Statement / General Journal -> FIFO ReceiptVoucher -> Reports).

## 4. Cách làm
- Tạo nhánh `loipham/s26-7-reports-and-tests` tại `ERPm-BE` và `ERPm`.
- Cập nhật `SalesInvoice`, `SalesDtos`, `SalesPostingService`, tạo migration `AddSalesInvoiceDueDate`.
- Tạo `AccountingReportDtos.cs`, `IAccountingReportService.cs`, `AccountingReportService.cs`, `AccountingReportsController.cs`, cập nhật `PermissionCatalog.cs` & `DependencyInjection.cs`.
- Bổ sung tests vào `ERPm.UnitTests`, `ERPm.Verification`, và `tests/e2e/specs/accounting-s26.spec.ts`.

## 5. Kiểm tra
- `dotnet build ERPm-BE/ERPm.sln`: **PASS** (`0 Warning(s)`, `0 Error(s)`).
- `dotnet test ERPm-BE/tests/ERPm.UnitTests/ERPm.UnitTests.csproj`: **PASS** (`19/19 passed, 0 failed`).
- `dotnet run --project ERPm-BE/tests/ERPm.Verification --no-build` (isolated Neon DB `erpm_verify_928fb5b1c4bb43cf8683bb308348c464`): **PASS** (`VERIFIED 571 checks`).
- `npx playwright test` (`tests/e2e/` trên isolated Neon DB `erpm_e2e_e86640d8`): **PASS** (`10/10 passed` — gồm `accounting-s26.spec.ts`, `org-reparent.spec.ts`, `rights.spec.ts`, `seed.spec.ts`).

## 6. Việc còn lại
- Không (chờ review & merge PR).

## 7. Evidence và cập nhật
- Ngày cập nhật cuối: 2026-11-17
