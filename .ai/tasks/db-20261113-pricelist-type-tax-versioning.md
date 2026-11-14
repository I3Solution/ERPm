# [db] S25.1 Schema Bảng giá: Type, IsTaxInclusive, Versioning

> **Loại:** db
> **Ngày tạo:** 2026-11-13 · **Người làm:** Lợi (Dev chính Backend) · **Người yêu cầu:** Phúc (Kiến trúc & Review)
> **Trạng thái:** Done
> **Progress aggregation:** v1
> **Liên quan:** Trello card `[S25.1][BE] Schema Database & Entity Bảng giá (Type, Thuế, Versioning)` (`https://trello.com/c/U54wkZHg`) · `ERPm-BE` PR [#43](https://github.com/I3Solution/ERPm-BE/pull/43) (merge `54217df0b04cf5fb4be654ade7d6b57ddb6b1d07`) & PR [#49](https://github.com/I3Solution/ERPm-BE/pull/49) (merge `8a9abd62f43988ab3f700d0bb741a668d9050571`) · `ERPm-BE/.ai/tasks/db-20261113-pricelist-type-tax-versioning.md`
> **Phạm vi:** `ERPm-BE` (`Domain`, `Application`, `Infrastructure`, `Migrations`, `Verification`), `ERPm` (gitlink `ERPm-BE`, `.ai/context/workspace-map.yaml`)

## 1. Mô tả
Thiết kế Entity và Migration PostgreSQL cho Bảng giá chuẩn ERP (Step 25 — S25.1):
- Bổ sung `Type` (`PriceListType`: `1 = Sales`, `2 = Purchase`) và `IsTaxInclusive` (`bool`) vào `PriceList`.
- Tạo bảng `tbl_SD_PriceListVersion` (`VersionCode`, `EffectiveFrom`, `EffectiveTo`, `Status`: `Draft = 1`, `Active = 2`, `Expired = 3`, `Archived = 4`).
- Chuyển `PriceListItem` liên kết qua `PriceListVersionId` thay cho `PriceListId`.
- Backfill an toàn toàn bộ bảng giá và dòng giá cũ sang version `V1`.

## 2. Phân tích
- Lưu enum dạng `integer` kèm CHECK constraint ở PostgreSQL (`CK_tbl_SD_PriceList_Type`, `CK_tbl_SD_PriceListVersion_Status`, `CK_tbl_SD_PriceListVersion_Range`).
- `PriceListVersion` kế thừa `BaseAuditableEntity`; unique `(price_list_id, version_code)` lọc `is_deleted = false`.
- Đặt tên tường minh cho FK (`fk_tbl_sd_price_list_item_price_list_version_id`) và unique index (`ix_tbl_sd_price_list_item_version_item_uom_min_quantity`, `AreNullsDistinct(false)`) của `PriceListItem` để tuân thủ giới hạn 63 ký tự của PostgreSQL.
- Cập nhật Global Query Filter trong `ApplicationDbContext` cho `PriceListVersion` và `PriceListItem`.
- Giữ tương thích ngược tạm thời trong `PriceListService` qua version `Active` hiện hành (`CurrentVersion`).

## 3. Features / Milestones
- [x] Feature 1 — Bổ sung `PriceListType` (`Sales`/`Purchase`) và `IsTaxInclusive` vào `PriceList` entity & `DbContext`.
- [x] Feature 2 — Thiết kế `PriceListVersion` entity, bảng `tbl_SD_PriceListVersion` và chuyển `PriceListItem` liên kết sang `PriceListVersionId`.
- [x] Feature 3 — Xây dựng migration `20261113030000_AddPriceListTypeTaxAndVersioning` kèm backfill `V1` an toàn và rollback `Down`.
- [x] Feature 4 — Cập nhật `PriceListService` tương thích ngược và bổ sung kiểm thử trong `ERPm.Verification`.
- [x] Feature 5 — Xác minh `dotnet build`, `dotnet ef migrations has-pending-model-changes`, CI GitHub Actions, Neon test branch và cập nhật gitlink `ERPm-BE`.

## 4. Cách làm
- Trong `ERPm-BE` (PR [#43](https://github.com/I3Solution/ERPm-BE/pull/43), đã merge tại `54217df0b04cf5fb4be654ade7d6b57ddb6b1d07`):
  - Tạo migration `20261113030000_AddPriceListTypeTaxAndVersioning.cs` và `.Designer.cs`.
  - Cập nhật `PriceList.cs`, `IApplicationDbContext.cs`, `ApplicationDbContext.cs`, `ApplicationDbContextModelSnapshot.cs`, `PriceListService.cs`, `tests/ERPm.Verification/Program.cs`.
  - Cập nhật task record và thêm step log `step-25-1-pricelist-schema-versioning.md` (PR [#49](https://github.com/I3Solution/ERPm-BE/pull/49), merge `8a9abd62f43988ab3f700d0bb741a668d9050571`).
- Trong umbrella `ERPm`:
  - Cập nhật gitlink `ERPm-BE` từ `235173fd193ae2fb60081fa4573434f5edd506f3` lên `8a9abd62f43988ab3f700d0bb741a668d9050571`.
  - Cập nhật `pinned_revision` trong `.ai/context/workspace-map.yaml`.

## 5. Kiểm tra
- **PostgreSQL 16 tạm (migration & constraints):** `28/28` kiểm tra đạt (backfill `V1`, CHECK constraints, unique indexes, cascade delete, rollback `Down`, guards chặn dữ liệu lỗi).
- **CI GitHub Actions (run `#43394426337`):** `dotnet build ERPm.sln`, `ERPm.Hrm.Verification`, `ERPm.Verification` — **PASS**.
- **Neon test branch (migration & backfill):** Tạo `V1` cho `2/2` `PriceList` (`Active = 2`, `Expired = 3`), backfill `4/4` `PriceListItem`, `missing_v1 = 0`, `orphan_items = 0` — **PASS**.
- **Kiểm tra trực tiếp trên `ERPm-BE@54217df0b04cf5fb4be654ade7d6b57ddb6b1d07` với .NET SDK `10.0.403`:**
  - `dotnet build ERPm-BE/ERPm.sln --nologo -v q` → **PASS** (`0 Warning(s), 0 Error(s)`).
  - `dotnet ef migrations has-pending-model-changes --project ERPm-BE/src/ERPm.Infrastructure --startup-project ERPm-BE/src/ERPm.Api --no-build` → **PASS** (`No changes have been made to the model since the last migration.`).

## 6. Việc còn lại
Không. Các phần DTO/API quản lý version, `PricingEngine` theo `DocumentDate`, tính thuế Inclusive/Exclusive, Clone & Bulk Adjustment thuộc S25.2.

## 7. Evidence và cập nhật
- Commit / PR đã merge (`ERPm-BE`):
  - PR [#43](https://github.com/I3Solution/ERPm-BE/pull/43), merge commit `54217df0b04cf5fb4be654ade7d6b57ddb6b1d07` (commits `4550a0d`, `2c6f47c`, `9197f0c`).
  - PR [#49](https://github.com/I3Solution/ERPm-BE/pull/49), merge commit `8a9abd62f43988ab3f700d0bb741a668d9050571` (`[docs](SD) S25.1 mark task record Done, add step log and update status`).
- CI / workflow run: GitHub Actions run `#43394426337` — PASS.
- Ngày cập nhật cuối: 2026-11-14
- Đã xác minh: build, EF model snapshot match, CI verification, Neon test migration và gitlink `ERPm-BE`.
