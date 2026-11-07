# [refactor] Tách các service nghiệp vụ từ core/services về modules/<MODULE>/services

> **Loại:** refactor
> **Ngày tạo:** 2026-11-05 · **Người làm:** Lợi (loipham) · **Người yêu cầu:** Thiện (quy tắc AGENTS.md 2026-11-03)
> **Trạng thái:** Done
> **Liên quan:** `AGENTS.md` (mục 4), commit `dcd4df5`, `ERPm-FE`, các submodule `SD`, `CRM`, `WMS`, `dashboard`, `HRM`

## 1. Mô tả
Theo quy tắc kỹ thuật trong `AGENTS.md` (cập nhật ngày 2026-11-03):
- `ERPm-FE/src/app/core/services/` chỉ chứa service cross-cutting thật dùng chung toàn app: `auth`, `api-error`, `localization`, `theme`, `notification-*` (chuông/toast/SignalR).
- Các service nghiệp vụ thuộc về module phải nằm trong `modules/<MODULE>/services/`, không dồn chung vào `core/services/`.

## 2. Phân tích & Phạm vi di chuyển
1. **Module WMS (`src/app/modules/WMS` - Submodule):**
   - `core/services/item.service.ts` ➔ `modules/WMS/services/item.service.ts`
   - `core/services/stock.service.ts` ➔ `modules/WMS/services/stock.service.ts`
   - Cập nhật imports trong `inventory.component.ts`, `items.component.ts`.
2. **Module CRM (`src/app/modules/CRM` - Submodule):**
   - `core/services/partner.service.ts` ➔ `modules/CRM/services/partner.service.ts`
   - Cập nhật imports trong `partners.component.ts`.
3. **Module SD (`src/app/modules/SD` - Submodule):**
   - `core/services/sales.service.ts` ➔ `modules/SD/services/sales.service.ts`
   - `core/services/sd.service.ts` ➔ `modules/SD/services/sd.service.ts`
   - `core/models/sd.models.ts` ➔ `modules/SD/models/sd.models.ts`
   - Cập nhật imports trong 20 files thuộc `orders/`, `pos/`, `price-lists/`, `print-preview/`, `quotations/`, `returns/`.
4. **Module DASHBOARD (`src/app/modules/dashboard` - Submodule):**
   - `core/services/dashboard.service.ts` ➔ `modules/dashboard/services/dashboard.service.ts`
   - Cập nhật imports trong `dashboard.component.ts`.
5. **Module SYS (`src/app/modules/SYS` - Thư mục thuộc ERPm-FE):**
   - `core/services/branch.service.ts` ➔ `modules/SYS/services/branch.service.ts`
   - `core/services/org-admin.service.ts` & `org-admin.service.spec.ts` ➔ `modules/SYS/services/org-admin.service.ts` & `org-admin.service.spec.ts`
   - Cập nhật imports trong `SYS/roles/`, `SYS/users/`, `shared/components/`, `app.component.*`.
6. **Module HRM (`src/app/modules/HRM` - Submodule):**
   - Cập nhật imports của `OrgAdminService` trỏ sang `../../SYS/services/org-admin.service` trong 13 files (`department-levels/`, `employees/`, `job-positions/`, `org-tree/`, `work-histories/`).

## 3. Cách làm
- Tạo nhánh cá nhân `loipham/refactor-fe-module-services` trên các repo con (SD, CRM, WMS, dashboard, HRM) và repo `ERPm-FE`, `ERPm` (root).
- Di chuyển file, cập nhật toàn bộ import.
- Xóa các file cũ trong `core/services/` và `core/models/sd.models.ts`.
- Chạy `ng build` và Karma tests đạt 100%.
- Commit với tag `[refactor]` theo đúng quy chuẩn:
  - WMS: `baf2975` · PR #3: https://github.com/I3Solution/ERPm-FE-WMS/pull/3
  - CRM: `fb54a0c` · PR #3: https://github.com/I3Solution/ERPm-FE-CRM/pull/3
  - SD: `b933f22` · PR #4: https://github.com/I3Solution/ERPm-FE-SD/pull/4
  - dashboard: `69b106a` · PR #2: https://github.com/I3Solution/ERPm-FE-DASHBOARD/pull/2
  - HRM: `61b2f1d` · PR #9: https://github.com/I3Solution/ERPm-FE-HRM/pull/9
  - ERPm-FE: `abd1bdc` · PR #14: https://github.com/I3Solution/ERPm-FE/pull/14
  - ERPm (root): `caad5bc` · PR #26: https://github.com/I3Solution/ERPm/pull/26

## 4. Kiểm tra
- `ng build`: 0 error
- Karma unit tests: **145/145 SUCCESS (100% pass)**
- Thư mục `core/services/` chỉ còn 100% service cross-cutting (`auth`, `api-error`, `localization`, `theme`, `notification-*`).

## 5. Việc còn lại
- Không. Đã hoàn thành 100%.
