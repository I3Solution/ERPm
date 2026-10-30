# Step 20 — Tổ chức đa cấp, Chức danh & Phân quyền động kiểu AWS IAM (Backend)

> Ngày: 2026-10-31 · Kế hoạch: [PLAN-STEP-20](../plans/plan-step-20-iam-dynamic-role-and-organization.md) · Nhánh: `thien/step-20-iam` (root + `ERPm-BE` commit `3d82ab5`) · Trạng thái: **BE xong (20.1, 20.2, 20.3, 20.5); FE 20.4 chờ Phúc đẩy SD/CRM.**

## 1. Mục tiêu
Cây Tập đoàn → Công ty → Chi nhánh → Phòng ban → Chức danh → Nhân viên; Role động theo công ty với `PolicyDocument` JSONB kiểu AWS IAM; phân quyền 90% theo chức danh + 10% ngoại lệ theo user; Data Scope động; bỏ khóa cứng `Policy = "Admin"`.

## 2. Đã làm

| Phase | Nội dung |
| :--- | :--- |
| 20.1 DB | `tbl_SYS_Branch` thêm `org_unit_type` (0 Group / 1 Company / 2 Branch, mặc định 2), `company_id`, `tax_code`. Bảng mới `tbl_HRM_Department`, `tbl_HRM_JobPosition`, `tbl_HRM_Employee`, `tbl_HRM_WorkHistory`, `tbl_SYS_Role` (`policy_document` jsonb), `tbl_SYS_JobPositionRole`, `tbl_SYS_UserRole` (`scope_override` jsonb). `tbl_SYS_User` thêm `is_super_admin`, `inline_policy` (jsonb). `department_id` (nullable) trên SalesOrder, SalesInvoice, PurchaseOrder, StockReceipt, StockIssue. Migration `AddIamOrganization`. |
| 20.2 IAM | Domain thuần `Services/Iam`: `PermissionCatalog` (`module:resource:verb`), `IamPolicyEvaluator` (wildcard glob, Default Deny, Explicit Deny thắng, hợp DataScope), `OrgContext`/`OrgTree`, `EffectiveDataScope`, `IamPrincipal` (cache quyết định + guard leo thang), `SystemRoles`. Infrastructure `IamService` (gộp role chức danh + role user + role legacy + inline; cache `IMemoryCache` theo `UserId + SecurityStamp + IAM version + ngày`, TTL 5 phút). API: `[RequirePermission]`, `[PermissionResource]`, `PermissionFilter` thay `WriteAccessFilter`; `CurrentUser` đọc scope theo action của endpoint → global query filter. |
| 20.3 API | `api/v1/hrm/{departments,job-positions,employees,work-histories}` (BaseCrud, lọc theo scope). `api/v1/sys/roles` (CRUD, `job-positions/{id}`, `users/{id}`), `api/v1/sys/permissions/catalog`. `/auth/me` trả thêm `permissions[]`, `readScope`, org position. Privilege Escalation Guard ở role, gán chức danh, gán user, tạo/sửa tài khoản. |
| 20.5 Test | `tests/ERPm.Verification/IamChecks.cs` + kiểm tra HTTP trong `Program.cs`. |

Bảng ánh xạ endpoint → action: `BaseCrudController` dùng `:view/:create/:edit/:delete` ghép với `[PermissionResource]` của controller (`wms:category`, `wms:uom`, `wms:item-attribute`, `sd:order`, `pur:order`, `hrm:*`). Endpoint riêng: `wms:item:*`, `wms:stock:view`, `wms:receipt:create`, `sd:invoice:{view,create,cancel}`, `sd:order:confirm`, `pur:order:confirm`, `crm:partner:{view,create}`, `dashboard:metrics:view`, `sys:branch:create`, `sys:localization:edit`, `sys:user:{view,create,edit}`, `sys:role:*`. GET chi nhánh để mở cho mọi tài khoản đăng nhập (FE cần dropdown) — dữ liệu vẫn bị cắt theo read scope.

## 3. Quyết định riêng (khác/chi tiết hơn plan)
1. **Chỉ giữ `Employee.UserId` (unique)**, không thêm `AppUser.EmployeeId/CompanyId/PrimaryBranchId/DepartmentId/JobPositionId`: vị trí tổ chức của user suy ra từ nhân viên liên kết → không có 2 nguồn lệch nhau.
2. **`tbl_HRM_WorkHistory` là nguồn sự thật**; các cột org của `Employee` là cache, làm mới khi thêm/sửa/xóa QTCT. `IamService` đọc thẳng dòng QTCT đã duyệt có hiệu lực hôm nay (dòng nghỉ việc → mất vị trí), nên thay đổi hẹn ngày tự áp dụng khi cache theo ngày hết hạn.
3. **Giữ cột legacy `AppUser.Role`**: `Admin` = super admin; `Operator`/`Viewer` ánh xạ sang role hệ thống `OPERATOR`/`VIEWER` (đồng bộ lại từ code mỗi lần seed, không sửa/xóa được). Thêm giá trị `None` cho tài khoản chỉ dùng role động (không bắt buộc BranchIds).
4. Statement không có `DataScope` → scope mặc định = `DefaultScopeMode` của chức danh ∪ cây chi nhánh legacy `AppUser.BranchIds` (giữ hành vi cũ cho Operator/Viewer).
5. Data scope trên chứng từ: `BranchId ∈ scope` **hoặc** `DepartmentId ∈ scope` **hoặc** (`SELF`) `CreatedBy = user` — áp vào global query filter của 5 chứng từ + dòng chi tiết. Bảng khác (kho, sổ cái, tồn) vẫn lọc theo chi nhánh.
6. Namespace `Entities/HumanResource` (khớp `Services/HumanResource` đã có) thay cho `Entities/HRM` trong plan.
7. Cho phép Chi nhánh nằm trực tiếp dưới Tập đoàn (CSDL một công ty cũ); Công ty phải nằm dưới Tập đoàn.
8. Cây mẫu (COMPANY_A, CA_HN, CA_HN_01, CA_HCM, phòng ACC/SALES, chức danh CHIEF_ACC/SALES_ACC/BRANCH_DIR/SALES_STAFF) nằm ở `OrganizationSampleSeeder`, chỉ chạy ở `--setup-local` và test — `EssentialDataSeeder` (production) chỉ seed Group root, 3 role hệ thống và 4 role mẫu cấp tập đoàn.
9. Guard leo thang: Allow cấp ra phải nằm trong quyền của người cấp; `GROUP` cần scope không giới hạn; `COMPANY` cần phủ cả công ty; `CUSTOM_BRANCHES`/phòng ban phải nằm trong scope; Deny luôn được phép. Người không phải super admin chỉ quản lý role/chức danh/tài khoản của công ty mình; role mẫu tập đoàn và chức danh cấp tập đoàn chỉ super admin sửa.
10. Cache principal là in-process (API một instance). Khi scale nhiều instance cần chuyển version sang Redis/DB.

## 4. Lệnh đã chạy
```
dotnet ef migrations add AddIamOrganization -p src/ERPm.Infrastructure -s src/ERPm.API -o Persistence/Migrations --no-build
dotnet run --project tools/ERPm.Schema --no-build -- database/current_model.sql
dotnet build ERPm.sln                                   # 0 warning, 0 error
dotnet run --project tests/ERPm.Verification --no-build  # ERPM_TEST_CONNECTION=...Port=5433
dotnet run --project tests/ERPm.Hrm.Verification --no-build
```

## 5. Kết quả kiểm tra
- `ERPm.Verification`: **75 checks đạt** (44 cũ + 31 IAM), gồm: wildcard, Deny thắng, Default Deny, hợp scope BRANCH_TREE + CUSTOM_BRANCHES, kế thừa role từ chức danh, query filter theo cây chi nhánh, role phụ có scope override, inline Deny, điều chuyển QTCT đổi scope, guard leo thang (action thừa, scope GROUP, công ty khác, gán role chức danh, sửa role hệ thống), và qua HTTP: `/auth/me` trả quyền, đơn bán bị cắt theo BRANCH_TREE, hủy hóa đơn 403 do Deny, endpoint ngoài quyền 403.
- `ERPm.Hrm.Verification`: **28 checks đạt**.
- 44 kiểm tra legacy (Admin/Operator/Viewer, scope chi nhánh, viewer không được nhập kho, thu hồi token) vẫn đạt.

## 6. Còn lại / bước tiếp
1. **20.4 FE** (chờ Phúc đẩy FE SD `52500c5`, CRM `9f4a4c6`): `AuthService.can()` + `permissionGuard` từ `/auth/me`; màn cây tổ chức, chức danh + gán role, hồ sơ nhân viên + cấp tài khoản; Role designer (ma trận + JSON editor); từ điển VI/EN cho nhãn.
2. FE cần đọc `permissions[]` thay cho kiểm tra `role === 'Admin'`.
3. Gán `DepartmentId` khi tạo chứng từ (hiện nullable, chưa có UI/DTO nhập).
4. Merge `thien/step-20-iam` vào `master` sau khi FE xong và Phúc review.
