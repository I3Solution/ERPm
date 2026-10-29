# Chạy ERPm sau Step 19

Cập nhật 2026-10-29. Baseline web MVP đã có kiểm thử tự động; vẫn cần nghiệm thu quy trình thực tế.

## Máy hiện tại

Đã tạo database mới `erpm_mvp_local_a7b56c332ef941d3962eb338c78fc765` với master data tối thiểu, kho MAIN và admin. Database cũ giữ nguyên. Không có hàng hóa/giao dịch demo; số 0 trên màn hình là dữ liệu thực.

Thông tin đăng nhập ở `.ai/erpm-local.credentials.local.json`. File này, `ERPm-BE/src/ERPm.API/appsettings.local.json` và thư mục `.keys/` của API đều được Git bỏ qua.

Từ thư mục ERPm, chạy backend:

```powershell
& 'C:\Users\bizyo\.dotnet\dotnet.exe' run --project ERPm-BE/src/ERPm.API --launch-profile http
```

Ở terminal thứ hai:

```powershell
Set-Location ERPm-FE
npm.cmd start
```

Mở http://localhost:4200, đăng nhập bằng credentials cục bộ. API ở http://localhost:5000; Swagger ở `/swagger` trong Development. FE proxy `/api` cùng origin. Phiên lưu trong sessionStorage, thời hạn 1 giờ; hết hạn cần đăng nhập lại, chưa có endpoint refresh.

## Checkout mới

Cần recursive submodules, SDK theo `global.json`, Node 22/npm, PostgreSQL 16+ và Chrome cho test. SDK trên máy này là 10.0.403 ở thư mục người dùng, ngoài PATH mặc định.

1. Tạo cấu hình ignored từ `src/ERPm.API/appsettings.local.example.json`, đặt kết nối PostgreSQL local; hoặc dùng `ConnectionStrings__DefaultConnection`. Không đưa connection string thật vào file tracked.
2. Từ ERPm-BE, chạy `dotnet restore ERPm.sln` rồi `dotnet build ERPm.sln`.
3. Trong umbrella checkout, chạy `dotnet run --project tests/ERPm.Verification --no-build -- --setup-local` để tạo DB/admin mới. Lệnh cần quyền PostgreSQL CREATE DATABASE, cập nhật local connection và ghi credentials vào `.ai` của umbrella; chạy lại tạo DB khác, không reset DB trước.
4. Từ ERPm-FE, chạy `npm ci` rồi `npm start`.

Nếu dùng DB trống tự chuẩn bị: cấu hình `BootstrapAdmin__Password` ít nhất 12 ký tự, tùy chọn `BootstrapAdmin__UserName`, chạy API với `--migrate` một lần rồi khởi động bình thường. Bootstrap chỉ tạo admin khi chưa có user. `AutoMigrate` mặc định false; startup dừng rõ khi DB thiếu migration hoặc mất kết nối.

## Migration và dữ liệu cũ

Migrations/snapshot là nguồn triển khai chuẩn. SQL trong `database/` chỉ để tham chiếu, không dùng reset hoặc triển khai trực tiếp.

Đã kiểm thử upgrade từ initial migration 9 bảng UUID: bảng nguồn được giữ thành `legacy_*_uuid`, original UUID giữ trong ExternalId, ánh xạ FK/tenant sang khóa int. Migration carrying value thêm InventoryValue/CostAmount và backfill từ dữ liệu có sẵn. Các migration ổn định là forward-only; rollback bằng backup phù hợp.

DB 23 bảng từng tạo thủ công bằng script cũ, không có migration history, không nằm trong đường upgrade tự động đã kiểm thử. Dùng DB thử nghiệm mới như máy hiện tại hoặc xây dựng adoption/export/import riêng nếu cần giữ dữ liệu.

## Quy tắc nghiệp vụ

- Admin quản trị danh mục/tài khoản, override giá niêm yết, nhập tồn đầu kỳ và hủy hóa đơn. Operator ghi chứng từ trong phạm vi được cấp. Viewer chỉ đọc. Scope gồm nhánh con đang hoạt động, được server áp lại mỗi request.
- Login: POST `/api/v1/auth/login`, trả accessToken. API bảo vệ dùng header `Authorization: Bearer <accessToken>`. Quản trị account: GET/POST `/api/v1/auth/users`, PUT `/api/v1/auth/users/{id}`. Đổi password/quyền/trạng thái quay security stamp, vô hiệu token cũ. UI quản trị tài khoản chưa có.
- Tạo hàng hóa, khách hàng/NCC trước khi nhập/bán. Code có thể để trống để server cấp. Hàng hóa cần đơn vị tính thực.
- Nhập mua bắt buộc NCC, ghi 156/331 cùng tồn và nợ. API tồn đầu kỳ `IsOpeningBalance=true` dành cho Admin, ghi 156/411. UI hiện dành cho nhập mua.
- Goods phải đủ tồn; Service không trừ kho; Combo bị từ chối tới khi có BOM. Giá vốn lấy từ giá trị tồn tại kho, không dùng Item.CostPrice. Operator không đổi đơn giá so với niêm yết.
- Cash tách TenderedAmount/PaidAmount/ChangeAmount. Thanh toán 0/một phần cần khách hàng và hạn mức nợ; CreditLimit=0 không cho mua nợ. Bank không nhận trả thừa; Debt có paid=0. Sổ thu/chi thanh toán sau chưa triển khai.
- Client ghi chứng từ luôn gửi RequestId: cùng ID/nội dung trả kết quả cũ; cùng ID khác nội dung trả 409. RequestId là UUID bắt buộc, không được rỗng.
- Hủy hóa đơn: POST `/api/v1/sales/invoices/{id}/cancel`, body `{ reason: ... }`, Admin. Đảo journal, hoàn tồn/nợ một lần, giữ lịch sử gốc. UI hủy chưa có. Posted/Cancelled không sửa/xóa trực tiếp.
- Đơn bán/mua có Draft/Confirmed, totals server-side, update/delete chỉ Draft, confirm giữ dòng. Chưa có luồng hoàn chỉnh giao/nhận hàng/hóa đơn từ order.

## Kiểm tra

Từ ERPm-BE:

```powershell
dotnet build ERPm.sln --no-restore
dotnet run --project tests/ERPm.Verification --no-restore
```

Verification tạo DB `erpm_verify_*` riêng, kiểm tra migration/nghiệp vụ/HTTP, giữ DB để đối chiếu. Có thể dùng `ERPM_TEST_CONNECTION` thay local config. Đã đạt 44 kiểm tra; build 0 warning/0 error.

Từ ERPm-FE:

```powershell
npm.cmd run build
.\node_modules\.bin\tsc.cmd --noEmit -p tsconfig.spec.json
$env:CHROME_BIN='C:\Program Files\Google\Chrome\Application\chrome.exe'
npm.cmd test -- --watch=false --browsers=ChromeHeadless
```

Đã đạt 7 kiểm thử Chrome: số tiền, dashboard lỗi/0, dictionary/UTF-8, branch computed, POS form/totals/search, lookup barcode và phản hồi 401 của phiên cũ. Build còn warning bundle vượt 500 kB và Stencil empty-glob; chưa đổi budget để che.

CI root/BE/FE đã tạo, chưa chạy trên GitHub. Private submodules cần `SUBMODULES_TOKEN` có quyền đọc. Khi publish: commit feature module → FE/pointer → BE → umbrella/pointer. Phiên này chưa commit, push hoặc deploy server.

## Ngoài môi trường local

Dùng Production, HTTPS/reverse proxy cùng origin, connection string/bootstrap qua secret environment. `DataProtection:KeyPath` cần volume bền vững; cấu hình `DataProtection:CertificatePath`/`CertificatePassword` để mã hóa key. API yêu cầu certificate ngoài Development. Chỉ cấu hình `Cors:Origins` khi frontend khác origin. Chạy migration riêng trước khi instance phục vụ.

Cần nghiệm thu backup/restore, E2E/thiết bị và dependency online. Phiên này chưa truy cập được NuGet advisory feed; restore offline dùng `--ignore-failed-sources -p:NuGetAudit=false` tạm thời, không tắt audit vĩnh viễn hay trong CI. Native scanner/ESC-POS/offline và kế toán tài chính đầy đủ vẫn theo roadmap.

Lượt kiểm thử cuối từng gặp PostgreSQL hết bộ nhớ/recovery (Windows1455), khi ổ C: hết dung lượng. Sau khi tắt build servers và chạy tuần tự, chuyển TEMP/TMP kiểm thử sang D:, bộ 44 kiểm tra đạt. Cần giữ đủ dung lượng C:/virtual memory để tránh lặp lại.
