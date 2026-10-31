# ERPm — Trạng thái hiện hành, Step 20 (2026-10-31)

Giai đoạn 1 đã có baseline ổn định với kiểm thử tự động; tiếp tục nghiệm thu quy trình thực tế. Giai đoạn 2 mới có API đơn mua/đơn bán Draft → Confirmed và nhập kho ghi nhận công nợ, chưa hoàn thiện mua hàng/sổ quỹ. Giai đoạn 3–4 chưa triển khai đầy đủ. Không sử dụng tỷ lệ hoàn thành lịch sử làm bằng chứng nghiệm thu.

## Completed

- [x] Đồng bộ migration/snapshot/schema tham chiếu; nâng cấp schema UUID 9 bảng sang model hiện hành, giữ bản gốc legacy và ExternalId.
- [x] Tài khoản ERPm nội bộ, Admin/Operator/Viewer, scope chi nhánh ở server, khóa đăng nhập, thu hồi tài khoản/token và audit.
- [x] Posting nguyên tử; khóa cập nhật kho/công nợ, sequence mã chứng từ và idempotency; kiểm tra dữ liệu, kho–chi nhánh, tồn và hạn mức nợ.
- [x] Giá vốn bình quân với carrying value chính xác; thanh toán một phần/tiền thừa; bút toán cân bằng bắt buộc và hủy hóa đơn bằng bút toán đảo.
- [x] Sửa Signals/reactive form, dictionary bundle, routes, phân trang, tìm SKU/barcode/bản dịch; bỏ số liệu demo, tách state item theo màn hình.
- [x] Kiểm tra: backend solution build 0 warning/0 error; **44 kiểm tra PostgreSQL/API đạt**. FE production build đạt, type-check spec đạt; **7 kiểm thử Chrome đạt**.
- [x] **HRM (Step 20):** lõi nghiệp vụ thuần QTCT / phạm vi dữ liệu / tính công trong `ERPm.Domain/Services/HumanResource`, **28 kiểm tra HRM đạt** (`tests/ERPm.Hrm.Verification`, không cần DB, đã thêm vào CI) — [Step 20](steps/step-20-hrm-domain-rules.md).
- [x] **IAM & tổ chức (Step 20 BE, nhánh `thien/step-20-iam`):** cây Tập đoàn/Công ty/Chi nhánh, phòng ban, chức danh, nhân viên + QTCT, role động JSONB, `[RequirePermission]` thay khóa cứng Admin, guard leo thang; **75 kiểm tra PostgreSQL/API đạt** — [Step 20 IAM](steps/step-20-iam-dynamic-role-and-organization.md).
- [x] **Notification Engine (Step 21, nhánh loipham/Notification):** Nền tảng thông báo đa kênh toàn hệ thống (In-App SignalR, Outbox, Email, Smart IAM/Org router, Quiet Hours, Dynamic bilingual templates); tự động kích hoạt sự kiện WMS (tồn tối thiểu), SD (đơn mới, hủy hóa đơn), IAM (thay đổi vai trò); UI Angular 20 Standalone (Chuông, Popover, Toast, Notification Center, Preferences); **93/93 kiểm tra PostgreSQL/API đạt** — [Step 21](steps/step-21-enterprise-notification-engine.md).
- [x] Tạo database local mới và admin ngẫu nhiên; giữ DB cũ; credentials chỉ trong file ignored. Thêm workflow CI root/BE/FE (chưa chạy trên GitHub).
- [x] **Sửa lỗi FE module / build (2026-10-31):** Khôi phục `node_modules` bị thiếu/hỏng (`semver/functions/cmp`, `listr2`, `acorn`), sửa type mismatch trong `SD/pos.component.ts` và `sales.service.ts` (`requestId`, `selectedCustomerId`, `warehouseId`). FE build và `npm start` (`ng serve`) chạy bình thường 100% — [Task Bug](tasks/bug-20261031-fe-semver-missing-modules-and-pos-types.md).

## In-Progress

- Nghiệm thu thủ công trên thiết bị và quy trình bán–nhập–hủy–đối chiếu thực tế; chưa coi đây là nghiệm thu production.
- FE đã lên Angular 20.3 / Ionic 8.8 (Step 18, `step-18-angular-20-env-config-and-secrets.md`); initial bundle ~604 kB còn vượt budget 500 kB và có warning empty-glob của Stencil.

## Next Steps

1. **Step 20.4 FE — Phân quyền động:** `AuthService.can()`/`permissionGuard` từ `/auth/me`, màn cây tổ chức, chức danh + gán role, nhân viên, Role designer (ma trận + JSON). Chờ Phúc đẩy FE SD/CRM; sau đó merge `thien/step-20-iam`. Đặc tả: [plan](plans/plan-step-20-iam-dynamic-role-and-organization.md), BE: [step log](steps/step-20-iam-dynamic-role-and-organization.md).
2. Nghiệm thu MVP theo [hướng dẫn chạy](../docs/LOCAL_DEVELOPMENT.md), bổ sung kiểm thử E2E toàn ứng dụng và CI cho private submodules.
2. Hoàn thiện liên kết PO → nhận hàng/hóa đơn mua và phiếu thu/chi, công nợ đầu kỳ được hạch toán, quản lý tài khoản/hủy chứng từ qua UI.
3. HRM bước 2: pháp nhân/cơ cấu đã ánh xạ vào `tbl_SYS_Branch` + `tbl_HRM_Department` (Step 20); còn hợp đồng, ca, chấm công + màn hình `ERPm-FE-HRM`.
4. Sổ cái/báo cáo tài chính, chuyển kho/kiểm kê/đổi trả, native scanner/ESC-POS và offline theo roadmap.

Bằng chứng và giới hạn: [Step 19](steps/step-19-stabilization-and-internal-accounts.md), [đối chiếu F01–F22](reviews/2026-10-29-priority-resolution.md). SDK .NET 10 đã có ở thư mục người dùng nhưng chưa trên PATH; nhận định thiếu SDK trong Step 18 đã được đính chính.


---

## Tài liệu trước Step 19 — lưu để truy vết

# 📊 DỰ ÁN ERPM - BẢNG TRẠNG THÁI HIỆN TẠI (CURRENT STATUS)

> **Đánh giá hiện hành: 2026-10-29 — Step 18.**
>
> **Giai đoạn:** Giai đoạn 1 đã có source MVP, đang cần ổn định và nghiệm thu lại; Giai đoạn 2 mới có một phần khung.
>
> **Kết luận:** Chưa đủ bằng chứng sẵn sàng dùng dữ liệu thật. Các tỷ lệ 100% trong phần lịch sử bên dưới không phải kết quả nghiệm thu nghiệp vụ hiện hành.

## Completed — Đã hoàn thành rà soát

- [x] Kiểm kê source root/BE/FE và 10 submodule; đọc kiến trúc, roadmap, status và các luồng nghiệp vụ hiện có.
- [x] Ghi [báo cáo rà soát 2026-10-29](reviews/2026-10-29-source-review.md) với 22 phát hiện và vị trí source; lưu [Step 18](steps/step-18-source-review-and-development-assessment.md).
- [x] Xác minh production FE build exit 0, có 2 warning; phát hiện phần test chưa compile được (TS2339).
- [x] Tái hiện cục bộ lỗi Signals ở POS/CRM/branch tree và effect POS/Inventory; đối chiếu contract localization và routes.
- [x] Xác định model EF 23 bảng hiện hành không khớp migration/snapshot 9 bảng cũ.

## In-Progress — Tình trạng thực tế

- Giai đoạn 1: **cần ổn định lại**, chưa nghiệm thu kho–công nợ–kế toán hoặc vận hành đa người dùng.
- Chưa bắt đầu sửa các phát hiện trong lượt review này; không chỉnh sửa source ứng dụng hoặc database.
- Build BE/integration PostgreSQL chưa được xác minh: máy hiện chỉ có SDK .NET 8.0.400, các project nhắm net10.0.
- FE thực tế dùng Angular 17.3 (runtime đang cài 17.3.12) + Ionic 8; chưa có cấu hình Capacitor/native/offline trong checkout.

## Next Steps — Ưu tiên sau rà soát

1. Chuẩn bị môi trường .NET 10; xác minh restore/build BE, đồng bộ migration và bootstrap/upgrade DB thử nghiệm không mất dữ liệu.
2. Sửa computed/effect và tổng tiền FE; sửa routes, i18n contract, phân trang; bỏ số demo khỏi dashboard nghiệp vụ.
3. Bổ sung xác thực/phân quyền, validation, kiểm tra kho–chi nhánh, cấp số chứng từ/idempotency và concurrency tồn kho/công nợ.
4. Thống nhất giá vốn, thanh toán một phần/tiền thừa, posting bắt buộc và vòng đời chứng từ; kiểm thử đối chiếu kho–sổ–công nợ.
5. Nghiệm thu lại Giai đoạn 1 theo test có bằng chứng, cập nhật roadmap/status BE/FE, rồi tiếp tục PUR/Sổ quỹ.

---

## Lịch sử trước Step 18 — Giữ để truy vết

Các số liệu hoàn thành, phiên bản stack và lệnh chạy dưới đây là ghi nhận cũ, có điểm không còn khớp source. Dùng đánh giá hiện hành phía trên và báo cáo Step 18 để xác định công việc tiếp theo.

> **Đánh giá hiện hành: 2026-10-29 — Step 18.**
>
> **Giai đoạn:** Giai đoạn 1 đã có source MVP, đang cần ổn định và nghiệm thu lại; Giai đoạn 2 mới có một phần khung.
>
> **Kết luận:** Chưa đủ bằng chứng sẵn sàng dùng dữ liệu thật. Các tỷ lệ 100% trong phần lịch sử bên dưới không phải kết quả nghiệm thu nghiệp vụ hiện hành.

## Completed — Đã hoàn thành rà soát

- [x] Kiểm kê source root/BE/FE và 10 submodule; đọc kiến trúc, roadmap, status và các luồng nghiệp vụ hiện có.
- [x] Ghi [báo cáo rà soát 2026-10-29](reviews/2026-10-29-source-review.md) với 22 phát hiện và vị trí source; lưu [Step 18](steps/step-18-source-review-and-development-assessment.md).
- [x] Xác minh production FE build exit 0, có 2 warning; phát hiện phần test chưa compile được (TS2339).
- [x] Tái hiện cục bộ lỗi Signals ở POS/CRM/branch tree và effect POS/Inventory; đối chiếu contract localization và routes.
- [x] Xác định model EF 23 bảng hiện hành không khớp migration/snapshot 9 bảng cũ.

## In-Progress — Tình trạng thực tế

- Giai đoạn 1: **cần ổn định lại**, chưa nghiệm thu kho–công nợ–kế toán hoặc vận hành đa người dùng.
- Chưa bắt đầu sửa các phát hiện trong lượt review này; không chỉnh sửa source ứng dụng hoặc database.
- Build BE/integration PostgreSQL chưa được xác minh: máy hiện chỉ có SDK .NET 8.0.400, các project nhắm net10.0.
- FE thực tế dùng Angular 17.3 (runtime đang cài 17.3.12) + Ionic 8; chưa có cấu hình Capacitor/native/offline trong checkout.

## Next Steps — Ưu tiên sau rà soát

1. Chuẩn bị môi trường .NET 10; xác minh restore/build BE, đồng bộ migration và bootstrap/upgrade DB thử nghiệm không mất dữ liệu.
2. Sửa computed/effect và tổng tiền FE; sửa routes, i18n contract, phân trang; bỏ số demo khỏi dashboard nghiệp vụ.
3. Bổ sung xác thực/phân quyền, validation, kiểm tra kho–chi nhánh, cấp số chứng từ/idempotency và concurrency tồn kho/công nợ.
4. Thống nhất giá vốn, thanh toán một phần/tiền thừa, posting bắt buộc và vòng đời chứng từ; kiểm thử đối chiếu kho–sổ–công nợ.
5. Nghiệm thu lại Giai đoạn 1 theo test có bằng chứng, cập nhật roadmap/status BE/FE, rồi tiếp tục PUR/Sổ quỹ.

---

## Lịch sử trước Step 18 — Giữ để truy vết

Các số liệu hoàn thành, phiên bản stack và lệnh chạy dưới đây là ghi nhận cũ, có điểm không còn khớp source. Dùng đánh giá hiện hành phía trên và báo cáo Step 18 để xác định công việc tiếp theo.

> **Cập nhật lần cuối:** 2026-10-29  
> **Giai đoạn hiện tại:** Giai đoạn 1 (Nền tảng Kiến trúc Nhanh & Multi-Branch Deep Dive) -> Chuẩn bị bước vào Giai đoạn 2 (Mua hàng & Sổ quỹ)  
> **Trạng thái:** Backend .NET 8 Clean Architecture hoàn thiện + Multi-Branch Tree Select vô hạn tầng + Lọc dữ liệu cha con tự động cho toàn bộ hệ thống.

---

## 📌 1. TIẾN ĐỘ TỔNG QUAN

| Hạng mục / Phân hệ | Tiến độ | Trạng thái | Ghi chú |
| :--- | :---: | :---: | :--- |
| **Quy chuẩn & Kế hoạch Master** | 100% |  Hoàn thành | Đã tạo `PROJECT_MASTER.md`, `AGENTS.md`, `.ai/` |
| **Backend Clean Architecture (.NET 10)** | 100% |  Hoàn thành | Đã tách 4 tầng (`net10.0`), build 0 errors ([step-16.md](steps/step-16-upgrade-dotnet-10-lts.md)) |
| **PostgreSQL & Schema Script** | 100% |  Hoàn thành | Đã có [erpm_schema.sql](../ERPm-BE/database/erpm_schema.sql) 540+ dòng |
| **Phân hệ ITEM & Danh mục** | 100% |  Hoàn thành | Backend CRUD + Frontend Adaptive UI hoàn chỉnh ([step-02.md](steps/step-02-frontend-angular-ionic-setup.md)) |
| **Phân hệ Đa ngôn ngữ (i18n)** | 100% |  Hoàn thành | Backend Bundle API + Frontend TranslatePipe & Signal (VI/EN) |
| **Frontend Angular + Ionic Hybrid** | 100% |  Hoàn thành | Hoàn thiện tất cả 5 màn hình, build 0 errors ([step-03.md](steps/step-03-full-mvp-sales-inventory-pos.md)) |
| **Phân hệ Bán hàng & POS Touch** | 100% |  Hoàn thành | Giao diện thu ngân POS, giỏ hàng, thanh toán, in hóa đơn nhiệt |
| **Phân hệ Tồn kho (Inventory)** | 100% |  Hoàn thành | Xem tồn tức thời, cảnh báo hết hàng, lập phiếu nhập kho nhanh |
| **Phân hệ Khách hàng (Partner)** | 100% |  Hoàn thành | Danh bạ KH/NCC, phân loại, hạn mức nợ và theo dõi công nợ |
| **Hạt nhân Kế toán (Double-Entry)** | 100% |  Hoàn thành | Tự động sinh bút toán Nợ/Có (111/131/511/632/156) khi bán hàng |
| **Tâm điểm Chi nhánh (Multi-Branch)** | 100% |  Hoàn thành | Cây phân cấp, branch_id cho toàn bộ chứng từ & kho bãi ([step-05.md](steps/step-05-multi-branch-architecture-and-table-prefix-redesign.md)) |
| **Framework Base CRUD cho Solo Dev** | 100% |  Hoàn thành | Generic Base CRUD Type-safe + Module Folder ([step-06.md](steps/step-06-solo-dev-rapid-crud-architecture-and-module-modularization.md)) |
| **Frontend Modularization & 3 Files Triad** | 100% |  Hoàn thành | Tách thư mục modules, tách độc lập .ts, .html, .scss ([step-07.md](steps/step-07-frontend-modularization-and-component-triad-separation.md)) |
| **Design System & Ionic Customization** | 100% |  Hoàn thành | Tokens, Tables, Ionic Overrides & Reusable UI ([step-08.md](steps/step-08-modern-design-system-and-ionic-customization.md)) |
| **Multi-Branch Tree-Select & Querying** | 100% |  Hoàn thành | Tree Select menu đệ quy vô hạn + BFS lọc cha con con cháu ([step-09.md](steps/step-09-multi-branch-nested-tree-select-and-recursive-filtering.md)) |
| **Custom Select, Pointer & Full i18n** | 100% |  Hoàn thành | Custom Select Component, triệt tiêu caret nhấp nháy, phủ song ngữ 100% ([step-10.md](steps/step-10-custom-select-cursor-and-complete-i18n.md)) |
| **Dynamic Item Attributes (JSONB)** | 100% |  Hoàn thành | Thuộc tính động Schema-driven + PostgreSQL JSONB + GIN Index ([step-11.md](steps/step-11-dynamic-item-attributes-jsonb.md)) |
| **Git Remote & Gitignore Configuration** | 100% |  Hoàn thành | Cấu hình remote `origin` GitHub & Master `.gitignore` ([step-12.md](steps/step-12-git-remote-and-gitignore-setup.md)) |
| **Multi-Repo & Submodules Architecture** | 100% |  Hoàn thành | Tách BE/FE thành 2 repo riêng, phân rã submodule FE lồng nhau ([step-13.md](steps/step-13-multi-repo-and-submodule-enterprise-architecture.md)) |
| **Enterprise Module Acronyms & Gitmodules** | 100% |  Hoàn thành | Chuẩn hóa 10 module viết tắt (ACC, SD, PUR, WMS, CRM, HRM, MFG, SCM, PM, DASHBOARD) ([step-14.md](steps/step-14-enterprise-erp-module-standardization.md)) |
| **Dual-Key Architecture (`int Id` + `UUIDv7 ExternalId`)** | 100% |  Hoàn thành | PK/FK `int` tự tăng + `ExternalId` UUIDv7 Covering Index ([step-15.md](steps/step-15-dual-key-int-id-and-uuidv7-external-id.md)) |
| **Nâng cấp Backend lên .NET 10 LTS (`net10.0`)** | 100% |  Hoàn thành | EF Core 10.0.14, Npgsql 10.0.3, Native `Guid.CreateVersion7()` ([step-16.md](steps/step-16-upgrade-dotnet-10-lts.md)) |
| **Standardized Reactive Forms (`FormGroup` + `InputControl` / `FormControl`)** | 100% |  Hoàn thành | `<app-form-control>` & `<app-input-control>` đa kiểu dữ liệu ([step-17.md](steps/step-17-standardized-form-group-and-input-control-components.md)) |
| **Angular 20 + Cấu hình môi trường & Bảo mật cấu hình** | 100% |  Hoàn thành | Angular 20.3 + Ionic 8.8, `environment.apiBaseUrl`, bỏ mật khẩu DB khỏi `appsettings.json`, link tài liệu tương đối ([step-18.md](steps/step-18-angular-20-env-config-and-secrets.md)) |

---

## 🛠️ 2. CÔNG VIỆC VỪA HOÀN THÀNH (COMPLETED IN STEP 15, 16, 17 & 18)
- [x] **Nâng cấp Frontend (`ERPm-FE`) lên Angular 20 (step-18):**
  - `@angular/*` `17.3` -> `20.3`, `@angular/cli` `20.3`, TypeScript `5.8`, `zone.js` `0.15`, `@ionic/angular` `8.3` -> `8.8` (bản Ionic 8 hỗ trợ Angular 20).
  - `styles.scss`: đổi `@import` sang `@use` (Sass `@import` đã deprecated), build 0 warning Sass.
- [x] **Cấu hình môi trường Frontend:** Thêm `src/environments/environment.ts` + `environment.development.ts` (`apiBaseUrl`), thay toàn bộ 7 service hard-code `http://localhost:5000`.
- [x] **Bảo mật cấu hình Backend:** Bỏ mật khẩu DB khỏi `appsettings.json`; mật khẩu cấp qua `dotnet user-secrets` (dev) hoặc biến môi trường `ConnectionStrings__DefaultConnection` (server).
- [x] **Tài liệu:** Đổi link tuyệt đối `file:///d:/WORKING%20PLACE/ERPm/...` sang đường dẫn tương đối (mở được trên mọi máy); cập nhật phiên bản Angular 20.
- [x] **Chuẩn hóa `FormGroup` & Bộ Component `InputControlComponent` / `FormControlComponent`:**
  - Xây dựng [`InputControlComponent`](../ERPm-FE/src/app/shared/components/input-control/input-control.component.ts) (`<app-input-control>`) xử lý tự động theo `type` (`'text' | 'number' | 'currency' | 'date' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox'`) và `dataSource` (`SelectOption[]`).
  - Xây dựng [`FormControlComponent`](../ERPm-FE/src/app/shared/components/form-control/form-control.component.ts) (`<app-form-control>`) bọc `<app-input-control>`, tích hợp `ControlValueAccessor` + `NgControl`, tự động vẽ nhãn, đơn vị, dấu `*` bắt buộc và thông báo lỗi validation.
  - Chuyển đổi toàn bộ các Form nhập liệu lưu dữ liệu (`InventoryComponent`, `ItemsComponent` kể cả Dynamic Attributes JSONB, `PartnersComponent`, `PosComponent`) từ `[(ngModel)]` sang `FormGroup` (`ReactiveFormsModule`).
- [x] **Nâng cấp toàn bộ Backend (`ERPm-BE`) lên .NET 10 LTS (`net10.0`):**
  - Chuyển đổi 4 projects (`ERPm.Domain`, `ERPm.Application`, `ERPm.Infrastructure`, `ERPm.API`) lên `net10.0`.
  - Nâng cấp `Microsoft.EntityFrameworkCore` (`10.0.14`), `Npgsql.EntityFrameworkCore.PostgreSQL` (`10.0.3`), `EFCore.NamingConventions` (`10.0.1`), `Microsoft.AspNetCore.OpenApi` (`10.0.14`).
  - Cập nhật `Uuid7Generator.NewUuid7()` sử dụng trực tiếp hàm gốc `Guid.CreateVersion7()` của .NET 10.
- [x] **Chuẩn hóa Quy tắc Git Commit (`[tag]` / `[tag](MODULE)`):**
  - Thiết lập quy chuẩn commit message thống nhất trên cả 3 repo (`ERPm` Root, `ERPm-BE`, `ERPm-FE`) với 6 tag chuẩn: `[add]`, `[update]`, `[fix]`, `[refactor]`, `[db]`, `[docs]`.
  - Cập nhật đồng bộ vào [AGENTS.md](../AGENTS.md), [ERPm-BE/AGENTS.md](../ERPm-BE/AGENTS.md), [ERPm-FE/AGENTS.md](../ERPm-FE/AGENTS.md) và cả 3 file `PROJECT_MASTER.md`.
- [x] **Thiết kế & triển khai kiến trúc Dual-Key (`int Id` + `Guid ExternalId` UUIDv7):**
  - Chuyển khóa chính `Id` và toàn bộ khóa ngoại (`FK`) của các bảng sang `int` tự tăng (`GENERATED BY DEFAULT AS IDENTITY`) để tối ưu tốc độ `JOIN` nội bộ.
  - Bổ sung bộ sinh `Uuid7Generator.NewUuid7()` chuẩn RFC 9562 (48-bit Unix Timestamp ms Big-Endian) trong `BaseEntity.cs` và hàm `uuid_generate_v7()` trong `erpm_schema.sql`.
  - Đánh Unique Covering Index (`INCLUDE (id, is_deleted) WITH (fillfactor = 95)`) cho cột `external_id` trên toàn bộ các bảng.
  - Đảm bảo toàn bộ các API `GET` / `GetById` / Filter nội bộ chỉ dùng `int Id`, chưa cần dùng đến `ExternalId`.
- [x] **Chuẩn hóa danh mục 10 Module ERP viết tắt chuẩn mực:**
  - `ACC`, `SD`, `PUR`, `WMS`, `CRM`, `HRM`, `MFG`, `SCM`, `PM`, `DASHBOARD`.
- [x] **Tái cấu trúc CSDL PostgreSQL theo module:**
  - Chuẩn hóa các bảng bán hàng thành `tbl_SALE_Order`, `tbl_SALE_OrderItem`, `tbl_SALE_Invoice`, `tbl_SALE_InvoiceItem`.
  - Giữ vững các bảng `tbl_PURCHASE_...`, `tbl_WMS_...`, `tbl_CRM_...`, `tbl_ACC_...`, `tbl_SYS_...`.
- [x] **Cập nhật Backend Clean Architecture:**
  - Gom các Controllers theo thư mục module: `Controllers/SD/`, `Controllers/PUR/`, `Controllers/WMS/`, `Controllers/CRM/`, `Controllers/SYS/`, `Controllers/DASHBOARD/`.
  - Biên dịch kiểm tra: `dotnet build` đạt **0 Warning, 0 Error**.
- [x] **Cập nhật Frontend Angular 18 Submodules & .gitmodules:**
  - Tách bạch 10 Submodules tương ứng với remote `https://github.com/I3Solution/ERPm-FE-[MODULE].git`.
  - Mỗi submodule đều sở hữu `.ai/plan.md` (kế hoạch con từ task FE giao), `.ai/status.md` và `.ai/steps/`.
  - Biên dịch kiểm tra: `npm run build` đạt **0 Error**.
- [x] **Cập nhật tài liệu hệ thống:** `PROJECT_MASTER.md`, `README.md`, `.gitmodules`.
- [x] **Tách Backend & Frontend thành 2 Git Repo độc lập:**
  - `ERPm-BE`: `https://github.com/I3Solution/ERPm-BE.git` (.NET 8 Clean Architecture, PostgreSQL).
  - `ERPm-FE`: `https://github.com/I3Solution/ERPm-FE.git` (Angular 18 Standalone, Ionic 8 Hybrid).
- [x] **Phân rã 5 Git Submodule cho Frontend:**
  - `catalog`: `https://github.com/I3Solution/ERPm-FE-catalog.git`
  - `dashboard`: `https://github.com/I3Solution/ERPm-FE-dashboard.git`
  - `inventory`: `https://github.com/I3Solution/ERPm-FE-inventory.git`
  - `partners`: `https://github.com/I3Solution/ERPm-FE-partners.git`
  - `sales`: `https://github.com/I3Solution/ERPm-FE-sales.git`
- [x] **Hệ thống Quản lý Kế hoạch & Trạng thái độc lập:**
  - Mỗi repo chính (`ERPm-BE`, `ERPm-FE`) có `PROJECT_MASTER.md`, `AGENTS.md`, `.ai/` riêng.
  - Mỗi submodule FE có `.ai/plan.md` (kế hoạch con từ task FE giao), `.ai/status.md`, `.ai/steps/` riêng.
- [x] **Liên kết Submodules:** Cấu hình `.gitmodules` ở cả tầng Root và tầng Frontend.
- [x] **Kiểm thử biên dịch:** `dotnet build` (0 Error) và `npm run build` (0 Error).
- [x] **Cấu hình Git Remote Repository:**
  - Thiết lập remote `origin` trỏ tới `https://github.com/I3Solution/ERPm.git`.
  - Kiểm tra và xác nhận cả `fetch` và `push` đều kết nối thành công.
- [x] **Chuẩn hóa Master `.gitignore`:**
  - Bổ sung bộ lọc cho .NET 8 (bin, obj, publish, .vs, nupkg, test results, cache).
  - Bổ sung bộ lọc cho Angular 18 & Node.js (node_modules, .angular, dist, coverage, logs).
  - Bổ sung bộ lọc cho IDEs & Hệ điều hành (VS Code, JetBrains, Windows Thumbs/Desktop.ini, macOS .DS_Store).
  - Bảo vệ các tệp bí mật (.env, appsettings local/secrets).
- [x] **Mô hình Thuộc tính Động Schema-Driven (Hybrid Metadata + JSONB):**
  - Tạo bảng metadata `tbl_WMS_ItemAttribute` quản lý danh mục thuộc tính người dùng tự định nghĩa (`code`, `name`, `data_type`, `options`, `unit`, `is_required`, `is_filterable`).
  - Bổ sung cột `attributes jsonb DEFAULT '{}'::jsonb` vào `tbl_WMS_Item` với chỉ mục GIN `idx_tbl_wms_item_attributes_gin` cho tốc độ truy vấn JSON path tức thì.
- [x] **Backend .NET 8 Clean Architecture:**
  - Entity `ItemAttribute`, `Item.Attributes` mapping qua EF Core Npgsql `jsonb` với `ValueComparer`.
  - Base CRUD Controller `ItemAttributesController` hỗ trợ endpoint `/api/v1/wms/item-attributes/by-category/{categoryId?}`.
  - Data Seeder nạp sẵn các thuộc tính thực tế: Màu sắc (`color`), Kích cỡ / Quy cách (`size`), Xuất xứ (`origin`), Thời hạn bảo hành (`warranty_months`).
- [x] **Frontend Dynamic UI (Angular 18 Standalone + Signals):**
  - `ItemService.loadAttributes()` tải danh sách thuộc tính động từ Backend hoặc fallback mặc định.
  - Form tạo sản phẩm mới tự động sinh các trường điều khiển theo kiểu dữ liệu (`Select` dùng `CustomSelectComponent`, `Number`, `Text`, `Date`, `Boolean`).
  - Hiển thị Pills/Badges thuộc tính trên Desktop Table và Mobile Cards.
- [x] **Kỷ luật Kỹ thuật (Technical Discipline):**
  - Toàn bộ comment trong source code (C#, TypeScript, SCSS, SQL) đều 100% Tiếng Anh (English only).
  - Biên dịch kiểm tra: `dotnet build` (0 Warning, 0 Error) và `npm run build` (0 Error).
- [x] **Xây dựng Reusable Component `CustomSelectComponent` (`app-custom-select`):**
  - Xóa bỏ hoàn toàn thẻ `<select>` / `<option>` native thô với nền xanh OS.
  - Tích hợp `ControlValueAccessor` tương thích hoàn hảo với `[(ngModel)]` và Form Controls.
  - Hỗ trợ thanh tìm kiếm lọc tức thì bên trong dropdown (dành cho danh sách nhiều mục).
  - Tự động đóng dropdown khi click ra ngoài hoặc bấm phím Escape.
  - Áp dụng thành công cho: Lọc kho hàng (Inventory), Modal nhập kho (Warehouse, Supplier, Item), Phân loại đối tác (Partners), và Chọn khách hàng (POS).
- [x] **Chuẩn hóa Cursor Pointer & Khắc phục triệt để lỗi con trỏ chuột nhấp nháy trên thẻ `<span>`:**
  - Thiết lập kỷ luật toàn cục: `body *:not(input):not(textarea):not([contenteditable="true"]) { caret-color: transparent !important; }`.
  - Ép `cursor: pointer !important; user-select: none !important;` lên tất cả các vùng tương tác (buttons, select triggers, tree nodes, table headers, pills, chips, icons) và toàn bộ các phần tử con (`*`).
- [x] **Phủ sóng Đa ngôn ngữ (i18n) 100% trên toàn bộ màn hình:**
  - Từ điển `DEFAULT_FALLBACK_DICTIONARY` mở rộng hơn 80+ keys song ngữ Anh - Việt.
  - Thay thế toàn bộ text cứng bằng `translate` pipe trên: Inventory, Catalog, Partners, Dashboard, POS, Branch Tree Select.
- [x] **Kiểm thử biên dịch:**
  - `npm run build`: **0 Warning, 0 Error, Code 0** (12.7s).

---

## 🚀 3. HƯỚNG DẪN KHỞI CHẠY & KIỂM THỬ
1. **Cơ sở dữ liệu:** File độc lập [database/erpm_schema.sql](../ERPm-BE/database/erpm_schema.sql).
2. **Backend .NET 10 Web API:** Lần đầu đặt chuỗi kết nối (không commit mật khẩu):
   `dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=erpm_db;Username=postgres;Password=<mật-khẩu>" --project ERPm-BE/src/ERPm.API`
   rồi chạy `dotnet run --project ERPm-BE/src/ERPm.API` (Swagger UI: `http://localhost:5000/swagger`).
3. **Frontend Angular 20 + Ionic:** Chạy `npm install` rồi `ng serve` trong thư mục `ERPm-FE/` (`http://localhost:4200`). Đổi địa chỉ API tại `ERPm-FE/src/environments/environment*.ts`.
