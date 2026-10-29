# 🛠️ STEP 18: NÂNG CẤP ANGULAR 20, CẤU HÌNH MÔI TRƯỜNG FE & BỎ MẬT KHẨU KHỎI CẤU HÌNH BE

> **Ngày thực hiện:** 2026-10-29
> **Người thực hiện:** Thiện (hỗ trợ anh Phúc)
> **Trạng thái:** Hoàn thành (100%)
> **Mục tiêu:**
> - Nâng `ERPm-FE` từ Angular 17.3 lên **Angular 20**, khớp với dự án tham chiếu ART-ERP-FE.
> - Bỏ địa chỉ API hard-code.
> - Bỏ mật khẩu DB khỏi Git.
> - Sửa link tài liệu chỉ mở được trên máy anh Phúc.

---

## 🎯 1. THAY ĐỔI

### 1.1. Angular 20 (`ERPm-FE`)
- Nâng tuần tự bằng `ng update`: 17 -> 18 -> 19 -> 20.
- Phiên bản sau khi nâng:

  | Gói | Phiên bản |
  | :--- | :--- |
  | `@angular/*` | `^20.3.34` |
  | `@angular/cli`, `@angular-devkit/build-angular` | `^20.3.42` |
  | `typescript` | `~5.8.3` |
  | `zone.js` | `~0.15.1` |
  | `@ionic/angular` | `^8.8.19` (bản Ionic 8 có hỗ trợ Angular 20; vẫn giữ Ionic 8 như ART-ERP-FE) |

- Migration tự động được giữ lại:
  - `tsconfig.json`: `moduleResolution` đổi sang `bundler`.
  - `angular.json`: thêm khối `schematics`, để `ng generate` tiếp tục sinh file `*.component.ts` / `*.service.ts` như cũ.
- Migration **không** giữ: migration v19 xóa `standalone: true`. Với Angular 20, khai báo này vẫn hợp lệ, chỉ là thừa.
  - Lý do không giữ: migration này format lại toàn bộ decorator, đụng tới cả các submodule CRM/SD đang có commit chưa push.
  - Có thể chạy riêng sau khi mọi submodule đã đồng bộ.
- `src/styles.scss`: đổi `@import` sang `@use`.
  - Lý do: Sass `@import` đã deprecated và sẽ bị bỏ ở Dart Sass 3.
  - Các file theme không dùng biến hay mixin Sass, nên thứ tự và kết quả CSS không đổi.

### 1.2. Cấu hình môi trường (`ERPm-FE`)
- Thêm 2 file:
  - `src/environments/environment.ts`: bản production, mặc định.
  - `src/environments/environment.development.ts`: dùng khi `ng serve`.
- Cả 2 file có `apiBaseUrl` (hiện là `http://localhost:5000`).
- `angular.json`: cấu hình `development` có `fileReplacements` trỏ sang `environment.development.ts`.
- 7 service trong `src/app/core/services/` dùng `${environment.apiBaseUrl}/api/v1/...`: branch, dashboard, item, localization, partner, sales, stock.
- Khi deploy, chỉ cần sửa `apiBaseUrl`. Ví dụ đặt `'/svc'` nếu API chạy chung site IIS.

### 1.3. Bỏ mật khẩu DB (`ERPm-BE`)
- `src/ERPm.API/appsettings.json`: chuỗi kết nối không còn `Password`.
- `src/ERPm.API/ERPm.API.csproj`: thêm `<UserSecretsId>erpm-api-dev</UserSecretsId>`.
- Cách cấp mật khẩu:
  - Máy dev chạy một lần:
    ```
    dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=erpm_db;Username=postgres;Password=<mật-khẩu>" --project src/ERPm.API
    ```
  - Server / IIS: đặt biến môi trường `ConnectionStrings__DefaultConnection`.
- ⚠️ Mật khẩu cũ vẫn nằm trong lịch sử Git (commit `2cd9e56`). Nếu mật khẩu đó còn dùng cho DB thật thì **cần đổi mật khẩu**.

### 1.4. Tài liệu
- Đổi 197 link `file:///d:/WORKING%20PLACE/ERPm/...` sang đường dẫn tương đối, áp dụng cho:
  - `.ai/` và các file `AGENTS.md`, `PROJECT_MASTER.md` ở root, BE và FE
  - `README.md` của submodule dashboard
- Đường dẫn của cấu trúc cũ được đổi sang cấu trúc hiện tại:
  - `client/` -> `ERPm-FE/`
  - `src/` -> `ERPm-BE/src/`
  - `database/` -> `ERPm-BE/database/`
- Sau khi đổi: 180 link trỏ đúng file. 39 link còn lại trỏ tới file đã đổi tên hoặc xóa ở các step trước, giữ nguyên vì là lịch sử.
- Chưa sửa `README.md` của CRM, SD, WMS: đang chờ đồng bộ submodule.
- Cập nhật phiên bản Angular 20 trong `PROJECT_MASTER.md` (root, BE, FE), `README.md` và `ERPm-FE/AGENTS.md`.
- Giao diện:
  - Chân sidebar (`app.component.html`) đổi thành ".NET 10 & PostgreSQL".
  - Thẻ kiến trúc trên dashboard đổi thành ".NET 10" / "Angular 20" (submodule dashboard).

---

## 📂 2. FILE ĐÃ TẠO / CHỈNH SỬA

**Thêm mới**
- `ERPm-FE/src/environments/environment.ts`
- `ERPm-FE/src/environments/environment.development.ts`

**Chỉnh sửa**
- `ERPm-FE`:
  - `package.json`, `package-lock.json`, `angular.json`, `tsconfig.json`, `src/styles.scss`
  - `src/app/app.component.html`
  - `src/app/core/services/*.service.ts` (7 file)
  - `AGENTS.md`, `PROJECT_MASTER.md`
- `ERPm-FE/src/app/modules/dashboard`: `dashboard.component.html`, `README.md`
- `ERPm-BE`: `src/ERPm.API/appsettings.json`, `src/ERPm.API/ERPm.API.csproj`, `AGENTS.md`, `PROJECT_MASTER.md`
- Root: `AGENTS.md`, `PROJECT_MASTER.md`, `README.md`, `.ai/status.md`, `.ai/plans/*`, `.ai/steps/*`

---

## ⌨️ 3. LỆNH ĐÃ CHẠY
```
npm ci
npx ng update @angular/core@18 @angular/cli@18 --allow-dirty --force
npx ng update @angular/core@19 @angular/cli@19 --allow-dirty --force
npx ng update @angular/core@20 @angular/cli@20 --allow-dirty --force
npm install @ionic/angular@^8.8.19
npx ng build                      # production
npx ng build -c development
dotnet build ERPm-BE/ERPm.sln
```

---

## ✅ 4. KẾT QUẢ KIỂM TRA (VERIFICATION)
- `dotnet build ERPm-BE/ERPm.sln`: **0 Warning, 0 Error**.
- **Mốc trước khi nâng (Angular 17)**: bản clone mới từ GitHub **không build được**, báo 3 lỗi TS ở `modules/SD/pos.component.ts`.
  - Nguyên nhân: submodule SD trên GitHub vẫn là code cũ, id kiểu `string`.
  - Commit SD (`430149b`) và CRM (`c2d5335`) mà repo cha trỏ tới **chưa được push**. Xem mục 5.
- **Sau khi nâng (Angular 20)**: vẫn đúng 3 lỗi cũ đó, không phát sinh lỗi mới. Số cảnh báo Sass giảm từ 4 xuống 0.
- **Build trọn vẹn**: vá tạm kiểu dữ liệu trong SD (không commit), rồi build:
  - Cả `production` và `development` đều **build thành công**.
  - Còn 1 cảnh báo budget: initial 792 kB > 500 kB (budget mặc định).
- **Chạy thật**:
  - API master chạy trên DB test được tạo từ `erpm_schema.sql`, chuỗi kết nối cấp qua biến môi trường.
  - `GET /api/v1/branches`, `items`, `partners`, `stock/warehouses`, `dashboard/metrics` đều trả **200**, id kiểu `int`.
  - FE bản production mở bằng Edge headless: giao diện render đầy đủ, cây chi nhánh "Tổng Công Ty (Head Office)" được tải từ API qua `apiBaseUrl`.

---

## 🚀 5. HƯỚNG ĐI TIẾP THEO
1. **Anh Phúc push submodule SD (`430149b`) và CRM (`c2d5335`)**, để clone mới build được.
2. Sau khi đồng bộ submodule:
   - Có thể chạy `ng update @angular/core --name control-flow-migration` để chuyển sang cú pháp `@if` / `@for`.
   - Sửa link tương đối trong `README.md` của CRM, SD, WMS.
3. EF Migration vẫn là bản cũ `20261011` (Guid, tên bảng cũ). Hiện `MigrateAsync()` lúc khởi động báo lỗi, rồi bỏ qua.
   - Cần chốt nguồn schema chuẩn: EF Migrations hay `erpm_schema.sql`.
4. Đổi mật khẩu DB cũ nếu nó còn dùng cho môi trường thật.
