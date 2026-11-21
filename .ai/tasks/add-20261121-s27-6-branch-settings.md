# [change] S27.6 Branch Settings: DB, resolver và API

> **Pipeline:** stage=TEST · round=BA/TA:1, DEV/TEST:1 · gate=none
> **PR/SHA:** BE#98 @1845613 · FE#105 @b303ed5 (dictionary) · root (this PR)
> **Env:** API http://localhost:5306, DB Docker `erpm_s276` (:5433, template `erpm_uistd`, đã migrate)
> **Metrics:** BA=? · TA=? · DESIGN=n/a · DEV=? · TEST=? · REPORT=?

> **Loại:** change
> **Ngày tạo:** 2026-11-21 · **Người làm:** Thiện (AI) · **Người yêu cầu:** Phúc
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** [Trello S27.6](https://trello.com/c/OBXh4Sg8), [plan](../plans/plan-step-27-branch-settings.md), [API contract](../../docs/BRANCH_SETTINGS_API_CONTRACT.md)
> **Phạm vi:** ERPm-BE (SYS: entity, migration, service, controller, IAM, dictionary), ERPm-FE (chỉ dictionary)

## 1. Mô tả

Nền tảng cấu hình theo đơn vị: catalog key có kiểu, override theo `(branchId, key)`, lịch sử, quyền SYS, resolver tại chỗ → cha gần nhất → mặc định trong cùng công ty, API theo contract v1 kèm xem ảnh hưởng và guard phiên bản.

## 2. Phân tích

- Cây `tbl_SYS_Branch` (`parent_id`, `company_id`, `org_unit_type`); chỉ Company/Branch đang hoạt động được cấu hình. Resolver bỏ qua đơn vị không hoạt động và không vượt ranh giới `company_id`.
- Quyền theo `PermissionFilter` + `EffectiveDataScope`; thêm `ICurrentUser.CanAt(action, branchId)` để kiểm tra quyền theo từng đơn vị (nguồn kế thừa, đơn vị con bị ảnh hưởng).
- Ghi trong `PostingTransaction` với advisory lock theo `(company, key)`; ETag băm tổ tiên + cây con + revision override của key.

## 3. Features / Milestones

- [x] Migration `AddBranchSettings` và kiểm tra giá trị 6 kiểu scalar, đăng ký key qua API.
- [x] Resolver giữ false/0, chọn cha gần nhất, reset và ranh giới công ty.
- [x] API quyền, preview scope, If-Match (428/412) và lịch sử ghi chung giao dịch.
- [x] BE verification và parity dictionary VI/EN (BE + FE cùng 12 dòng).
- [ ] Tester xác nhận PASS.

## 4. Cách làm

- BE: `Domain/Entities/System/BranchSetting.cs`, `Application/DTOs/System/BranchSettingDtos.cs`, `Application/Features/System/IBranchSettingService.cs` (kèm `IBranchSettingModuleProvider` cho S27.8), `Infrastructure/Services/BranchSettingService.cs`, `API/Controllers/SYS/BranchSettingsController.cs`, `PermissionCatalog`, `SystemRoles`, `ICurrentUser`/`CurrentUser`, migration `20261121062222_AddBranchSettings`, `system_dictionary.json`, `tests/ERPm.Verification/BranchSettingChecks.cs` + khối HTTP trong `Program.cs`.
- FE: `src/assets/i18n/system.json` thêm đúng 6 key × 2 ngôn ngữ như BE.

## 5. Kiểm tra

- `dotnet build ERPm.sln`: 0 lỗi, 0 cảnh báo. `dotnet ef migrations has-pending-model-changes`: không có thay đổi.
- ERPm.Verification trên Docker Postgres :5433: `VERIFIED 725 checks` (44 check mới: 38 service/pure + 6 HTTP). DB `erpm_verify_*` đã DROP.
- Baseline CI dictionary: FE `main` đã hơn BE `master` 3 key (`pl.discount_amount`, `so.calculating_price`, `so.price_edit_restricted`) do PR khác; PR này chỉ thêm cùng các dòng ở hai phía.

## 6. Việc còn lại

- Chờ tester độc lập (TEST). S27.7 dựng UI theo contract; S27.8 đăng ký key module `wms.so_warehouse_policy` qua `IBranchSettingModuleProvider`.

## P-BA

Theo plan §2–§3, contract v1 và checklist Trello (4 mục). Ngoài phạm vi: key module kho (S27.8), UI (S27.7), sửa/xóa định nghĩa (migration riêng).

## P-TA

BE `origin/master` 2cb021a. Chạm SYS mới, IAM catalog, DbContext, DI, dictionary. Không đụng file sales của BE#94. Test: build, pending-model, Verification.

## P-DESIGN

n/a (BE-only; FE chỉ đồng bộ dictionary).

## P-DEV

- Quyết định: `defaultValue` bắt buộc cho key scalar; `string` mặc định không nhận chuỗi rỗng trừ `allowEmpty=true`, `maxLength` mặc định 4000; mã lỗi stored-invalid dùng `error.branch_setting.invalid_value`.
- Quyền: Admin có qua `*`; Operator/Viewer (legacy, đồng bộ mỗi lần chạy) thêm `sys:branch-setting:view`; edit/manage_definition chưa cấp cho template (plan không yêu cầu) nên không cần migration cấp quyền.
- Ghi cùng giá trị cũ là no-op, không tạo lịch sử. Reset = soft-delete override, revision tiếp tục từ lịch sử.

## 7. Evidence và cập nhật

- Commit / PR: xem dòng PR/SHA.
- Ngày cập nhật cuối: 2026-11-21
- Đã xác minh: build, pending-model, Verification. Chưa xác minh: tester độc lập.
