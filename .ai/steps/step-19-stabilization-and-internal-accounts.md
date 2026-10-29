# Step19 — Ổn định MVP và tài khoản nội bộ

Ngày2026-10-29. Người dùng yêu cầu sửa lỗi/triển khai ưu tiên báo cáo Step18; xác nhận dữ liệu chỉ thử nghiệm và chọn tài khoản ERPm nội bộ.

## Mục tiêu và thay đổi

1. Đồng bộ migrations/snapshot/schema SQL tham chiếu, upgrade UUID giữ ExternalId/FK/legacy và seed tối thiểu; startup/migration rõ ràng.
2. Tài khoản/password hash/lockout/rate-limit, bearer chuẩn ASP.NET Core, role/branch scope server, security-stamp revoke và audit. Secrets/config/keys dùng local ignored hoặc environment.
3. Atomic posting, retry/advisory locks/sequence/idempotency, input/branch/credit/account validation. Giá vốn theo InventoryValue, CostAmount, xử lý phần dư; cash/partial/change và journal cân bằng bắt buộc.
4. Hủy hóa đơn bằng reversal, hoàn kho/nợ idempotent, Posted/Cancelled bất biến cả header/detail. Item đã phát sinh không xóa/đổi loại/UOM; khóa shared/exclusive bảo vệ định nghĩa hàng với posting.
5. Order aggregate riêng, totals server-side, load lines và Draft/Confirmed; generic CRUD có search/sort/cap. Dashboard thực với ngày Việt Nam/Posted/scope.
6. FE login/guard/interceptor, Signals/forms/CVA/OnPush, decimal totals, i18n JSON237→238 keys, routes/lazy loading, paging/state và remote lookup/barcode, bỏ mock, print CSS và cải thiện label/keyboard/zoom.
7. Verification PostgreSQL/API, Chrome regressions, CI và đồng bộ tài liệu root/BE/FE/4 module theo kết quả thực.

## Lệnh chính đã chạy

Lệnh .NET dùng host C:/Users/bizyo/.dotnet/dotnet.exe và DOTNET_ROOT tương ứng; danh sách dưới rút gọn tham số đường dẫn/tooling. Không in secret connection/password.

- `dotnet restore ERPm.sln --ignore-failed-sources -p:NuGetAudit=false`
- `dotnet build ERPm.sln --no-restore`
- `dotnet-ef migrations add StabilizeMvp`
- `dotnet-ef migrations add PreserveInventoryCarryingValue`
- `dotnet run --project tools/ERPm.Schema -- database/current_model.sql`
- `dotnet run --project tests/ERPm.Verification --no-restore`
- `dotnet run --project tests/ERPm.Verification --no-build -- --setup-local`
- `API --migrate (Development, chỉ DB local mới)`
- `dotnet build-server shutdown`
- `dotnet tests/ERPm.Verification/bin/Debug/net10.0/ERPm.Verification.dll (TEMP/TMP trên D:)`
- `npm.cmd run build`
- `node_modules/.bin/tsc.cmd --noEmit -p tsconfig.spec.json`
- `CHROME_BIN=... npm.cmd test -- --watch=false --browsers=ChromeHeadless`
- `git status, git diff --check, git check-ignore, kiểm kê i18n keys/comments`

## Verification

- Backend solution build: **0 warning, 0 error** với SDK10.0.403; không dùng dotnet8 trên PATH.
- PostgreSQL18: **44 kiểm tra đạt**, DB cuối erpm_verify_4e0da447e406407398afec289ace3df2. Fixture nâng cấp chứa UOM/item UUID cũ và FK; kiểm tra snapshot/model, dashboard0, costing/payment/journal/idempotency/validation/concurrency/JSONB/cancellation/scope/immutability/master-data guard và HTTP auth/orders/revoke. Fixture chưa bao phủ mọi dạng dữ liệu lịch sử tài chính.
- Chạy đồng thời 4 bán +4 nhập không mất cập nhật. Case nhập3@1 +4@2 giữ trị giá tồn11; xuất hết ghi giá vốn11, tồn quantity/value0.
- Frontend production build đạt; initial **604.08kB**, còn warning budget500kB và Stencil empty-glob. Spec type-check đạt; **7/7 ChromeHeadless đạt**.
- 238 key VI và238 key EN từ JSON chung; literal template keys và error codes backend không thiếu bản dịch.
- Local smoke: migration/seed, admin login/profile, dictionary238 key và dashboard0 đạt trên DB mới erpm_mvp_local_a7b56c332ef941d3962eb338c78fc765. Database cũ không reset. Credentials/config/keys đều được git check-ignore xác nhận ignored.
- CI workflow mới ở root/BE/FE chưa chạy trên GitHub; chưa có E2E toàn bộ app trên mobile/desktop hoặc kiểm tra thiết bị in.

## Gián đoạn và giới hạn môi trường

- Ban đầu công cụ gặp os error112; người dùng đã dọn dung lượng và công việc được tiếp tục. SDK10 thực tế đã có trong thư mục người dùng, ngoài PATH; đính chính đánh giá Step18.
- NuGet advisory feed không truy cập được; restore dùng cache và tắt audit chỉ qua tham số lệnh, không thay chính sách CI.
- Một lượt kiểm thử cuối bị Npgsql SSLRequest error do PostgreSQL **out of memory/recovery**, log Windows1455. Đã đọc log được cấp quyền, xác nhận ổ C: hết chỗ (D: còn~96GB), tắt MSBuild/Roslyn build servers và chạy lại tuần tự với TEMP/TMP trên D:. Lượt sau đạt đủ44. Không sửa logic để che lỗi và không restart/reset DB.
- Cần duy trì dung lượng C:/virtual memory để tránh sự cố vận hành lặp lại. Không tự dọn dữ liệu người dùng ngoài workspace.

## Hướng tiếp theo

Nghiệm thu MVP bằng quy trình thực tế; E2E mobile/desktop và CI private submodules; UI quản trị account/hủy chứng từ; PO→nhận hàng→hóa đơn mua và thu/chi; sau đó sổ cái, chuyển kho/kiểm kê, native/ESC-POS/offline. DB tạo thủ công bằng script cũ cần adoption riêng nếu giữ dữ liệu. Chưa commit/push/deploy server trong phiên.

## File tạo/chỉnh sửa/xóa (đường dẫn trong repo này)

- `.ai/roadmap.md` (M)
- `.ai/status.md` (M)
- `.gitignore` (M)
- `ERPm-BE` (M)
- `ERPm-FE` (M)
- `PROJECT_MASTER.md` (M)
- `README.md` (M)
- `.ai/reviews/2026-10-29-priority-resolution.md` (??)
- `.ai/reviews/2026-10-29-source-review.md` (??)
- `.ai/steps/step-18-source-review-and-development-assessment.md` (??)
- `.ai/steps/step-19-stabilization-and-internal-accounts.md` (??)
- `.github/workflows/verify.yml` (??)
- `docs/LOCAL_DEVELOPMENT.md` (??)
- `global.json` (??)
