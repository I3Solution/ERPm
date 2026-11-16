# Task Record: Bump ERPm-BE Pointer for S26 Spec Alignment & Unlock .ai/status.md

- **Loại:** change
- **Ngày tạo:** 2026-11-16
- **Người thực hiện:** loipham
- **Branch:** `loipham/s26-be-pointer`
- **Trạng thái:** Done

## Mục tiêu
1. Cập nhật gitlink `ERPm-BE` từ `8e76c18` lên `8456be1` (bao gồm S26.1, S26.2, S26.3 và nhánh `loipham/s26-align-spec` đồng bộ BE theo đặc tả `TREASURY_AND_DYNAMIC_ACCOUNTING_ERP_SPEC.md`).
2. Gỡ bỏ ghi chú `LEGACY / FROZEN: Do not update it...` trong `.ai/status.md` theo yêu cầu.

## Verification
- `ERPm-BE` (`8456be1`): `dotnet build ERPm-BE/ERPm.sln` **PASS** (0 Warning(s), 0 Error(s)); `dotnet run --project ERPm-BE/tests/ERPm.Verification --no-build` **PASS** (`VERIFIED 560 checks` trên Neon isolated DB `erpm_verify_62a030da7d0041a4af7cbc4184a447ba`).
