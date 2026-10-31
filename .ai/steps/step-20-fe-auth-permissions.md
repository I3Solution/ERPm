# Step 20.4.1 — FE `AuthService.can()` + `permissionGuard`

> Ngày: 2026-10-31 · Plan: [PLAN-STEP-20 §Phase 20.4](../plans/plan-step-20-iam-dynamic-role-and-organization.md) Task 20.4.1 · Nhánh `thien/step20-fe-auth` (ERPm-FE `3a18eec`, CRM `80415d8`, WMS `d5cddcd`, SD `22d60d7`) · Trạng thái: **xong, chờ Phúc review**

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

### Kiểm tra tay trên trình duyệt (2026-10-31)
Môi trường: DB mới `erpm_manual_*` trên Docker `erpm_postgres` :5433 (đã xóa sau khi thử); API chạy `dotnet ERPm.API.dll` từ BE master `029e3e9` ở `http://127.0.0.1:5143` (biến môi trường, không sửa `appsettings.local.json`); `ng serve` trên nhánh `thien/step20-fe-auth` ở `http://127.0.0.1:4200` với file proxy tạm (ngoài repo). Điều khiển Chrome headless qua CDP, đăng nhập bằng form thật, tải đầy đủ từng route (đúng luồng F5 của guard). Chỉ dùng dữ liệu giả, không chụp ảnh.

Tài khoản thử: `admin` (bootstrap, super admin), `viewer` (role cũ `Viewer`, branch gốc), `limited` (role `None` + inline policy chỉ cho phép `wms:item:view`). Role `Viewer` cũ có đủ quyền xem của 5 màn nên không bị chặn route nào; vì vậy dùng thêm tài khoản `limited` để thử guard.

| Tài khoản | `/partners` | `/inventory` | `/catalog` | `/dashboard` | `/sales` (sau khi thêm 1 mặt hàng vào giỏ) | Menu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| admin | thấy nút thêm (đầu trang và khi danh sách trống) | thấy nút nhập kho (2 chỗ) | thấy nút thêm (2 chỗ) | vào được | nút Thanh toán **bật** | 5 mục |
| viewer | vào được, **0 nút** | vào được, **0 nút** | vào được, **0 nút** | vào được | nút Thanh toán **tắt** | 5 mục |
| limited | bị đẩy về `/forbidden` | bị đẩy về `/forbidden` | vào được, 0 nút | bị đẩy về `/forbidden` | bị đẩy về `/forbidden` | chỉ `/catalog` |

Kết luận: admin thấy đủ 4 quyền tạo (`crm:partner:create`, `wms:receipt:create`, `wms:item:create`, `sd:invoice:create`); viewer không thấy nút nào; tài khoản thiếu quyền xem gõ thẳng route bị chặn thì `permissionGuard` đẩy về trang `/forbidden`.

Phát hiện khi thử: còn 4 nút tạo ở trạng thái "danh sách trống" (CRM `partners` 1, WMS `inventory` 1, WMS `items` 2) chưa gắn `can()` nên viewer vẫn thấy khi danh sách rỗng. Đã sửa (CRM `80415d8`, WMS `d5cddcd`, FE `3a18eec`) và chạy lại, kết quả bảng trên là sau khi sửa.

## 5. Việc tiếp theo
- Phúc review 4 PR (ERPm-FE, ERPm-FE-CRM, ERPm-FE-WMS, ERPm-FE-SD) rồi merge theo thứ tự module → FE → root.
- Task kế: S20.4.2 + S20.6.6, S20.4.3, S20.4.4.
