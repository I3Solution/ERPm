# Step 20.4.1 — FE `AuthService.can()` + `permissionGuard`

> Ngày: 2026-10-31 · Plan: [PLAN-STEP-20 §Phase 20.4](../plans/plan-step-20-iam-dynamic-role-and-organization.md) Task 20.4.1 · Nhánh `thien/step20-fe-auth` (ERPm-FE `5a225bd`, CRM `e796779`, WMS `8d755c5`, SD `22d60d7`) · Trạng thái: **xong, chờ Phúc review**

## 1. Mục tiêu
FE phân quyền theo `permissions[]` của `GET /api/v1/auth/me` thay cho kiểm tra cứng `role === 'Admin' | 'Operator'`.

## 2. Đã làm

| Nơi | Thay đổi |
| :--- | :--- |
| `core/services/auth.service.ts` | `Account` có `permissions[]`, `readScope`, `isSuperAdmin`, `employeeId`, `companyId`, `primaryBranchId`, `departmentId`, `jobPositionId`; `role` thêm giá trị `None`. Thêm `permissions` (Set), `readScope`, `can(action)`, `canAny(actions)`. Bỏ `canWrite`. |
| `core/permission.guard.ts` | `permissionGuard(...actions)`: chưa đăng nhập → `/login`; thiếu mọi quyền → `/forbidden`; tải `/auth/me` khi F5 rồi mới quyết định. |
| `core/forbidden/` | Trang 403 dùng khóa `error.access.denied` / `menu.dashboard` đã có sẵn. |
| `app.routes.ts` | dashboard `dashboard:metrics:view`, catalog `wms:item:view`, sales `sd:invoice:view`, inventory `wms:stock:view`, partners `crm:partner:view`; thêm route `/forbidden`. Thông báo vẫn chỉ cần đăng nhập (API không đòi quyền riêng). |
| `app.component.html` | 10 link (sidebar + bottom tab) chỉ hiện khi `auth.can(...)`. |
| Submodule CRM / WMS / SD | `partners` nút Thêm → `crm:partner:create`; `inventory` nút nhập kho → `wms:receipt:create`; `items` nút Thêm → `wms:item:create`; POS thanh toán → `sd:invoice:create`. Spec POS mock `can`. |

Quyết định: `can()` so khớp chính xác với `permissions[]` vì BE đã trả danh sách đã bung wildcard (`AllowedActions`); không viết lại bộ so khớp wildcard ở FE.

## 3. Lệnh đã chạy
```
npm ci            # node_modules cũ thiếu @microsoft/signalr của Step 21
npm run build
npx ng test --watch=false --browsers=ChromeHeadless
```

## 4. Kết quả kiểm tra
- `npm run build`: 0 lỗi.
- Karma (ChromeHeadless): **17/17 đạt** (7 cũ + 10 mới: `AuthService` 4, `permissionGuard` 6).
- Chưa làm: thao tác tay trên trình duyệt với tài khoản admin và viewer (cần API + DB chạy). Phần ẩn/hiện nút đã được phủ bằng spec guard và `can()`, chưa có spec render template.

## 5. Việc tiếp theo
- Phúc review 4 PR (ERPm-FE, ERPm-FE-CRM, ERPm-FE-WMS, ERPm-FE-SD) rồi merge theo thứ tự module → FE → root.
- Task kế: S20.4.2 + S20.6.6, S20.4.3, S20.4.4.
