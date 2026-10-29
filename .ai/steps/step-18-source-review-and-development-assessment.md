# Step 18: Đọc source và đánh giá lại tiến độ ERPm

> Snapshot trước khi sửa. Xem [Step 19](step-19-stabilization-and-internal-accounts.md) và bảng đối chiếu sửa ưu tiên để biết trạng thái hiện hành. Đính chính: SDK10.0.403 nằm ở thư mục người dùng, ngoài PATH; đã dùng SDK này build/test backend.

> Ngày: 2026-10-29
>
> Trạng thái: Hoàn thành rà soát; các lỗi phát hiện chưa được sửa trong step này.

## Mục tiêu

Tiếp nhận dự án từ trạng thái hiện có, kiểm kê source, đối chiếu tài liệu với implementation và xác định các bất cập cần ưu tiên trước khi phát triển thêm.

## File tạo/chỉnh sửa

- Tạo `.ai/reviews/2026-10-29-source-review.md`: giai đoạn thực tế, 22 phát hiện có vị trí source, ảnh hưởng, kiểm tra và thứ tự xử lý.
- Tạo `.ai/steps/step-18-source-review-and-development-assessment.md`: nhật ký step này.
- Cập nhật `.ai/status.md`: đưa đánh giá 2026-10-29 lên đầu, tách trạng thái hiện hành khỏi các tuyên bố hoàn thành lịch sử.

Không chỉnh sửa source BE/FE, dependency, cấu hình hoặc dữ liệu. Không commit/push và không thay Git submodule pointer.

## Lệnh/kiểm tra đã chạy

- `rg --files`, `rg -n`, `Get-Content -Encoding UTF8`, `Get-FileHash`, đối chiếu model/DTO/API/component/config/SQL và tài liệu.
- `git status --short`, `git submodule status --recursive`, `git log`, `git -C ERPm-BE log`, `git -C ERPm-FE log`.
- `dotnet --info`; trong BE: `dotnet build ERPm.sln --no-restore`.
- `node --version`; trong FE: `npm.cmd run build`, sau đó chạy lại với kết nối mạng được cấp phép để tải Google Fonts.
- Trong FE: `.\node_modules\.bin\tsc.cmd --noEmit -p tsconfig.spec.json`.
- Script Node qua stdin: tái hiện biểu thức Signals trong POS/CRM/branch tree; callback effects trong watch context; đối chiếu routes, contract localization, EF tables và migration/SQL tables. Không lưu script thử vào source ứng dụng.
- `git diff --check` và kiểm tra lại diff tài liệu sau khi ghi báo cáo.

## Verification

- BE chưa build được vì máy chỉ có SDK 8.0.400 nhưng project yêu cầu net10.0: NETSDK1045. Chưa kết luận build/restore BE đạt hoặc source C# có lỗi compile.
- Production FE build đạt exit 0 sau khi cho phép tải font: initial bundle 707,29 kB, 2 cảnh báo (budget và Stencil empty-glob).
- Spec TypeScript fail TS2339 vì test vẫn dùng `AppComponent.title` đã không còn tồn tại. Chưa chạy Karma hoặc e2e.
- Tái hiện lỗi computed giữ cache của POS search/discount và CRM tab; signal write bị từ chối trong effects POS/Inventory và computed tìm chi nhánh. Đây là kiểm tra cục bộ trên runtime Angular 17.3.12, không DOM/API.
- Model hiện có 23 bảng tbl_* nhưng migration/snapshot chỉ còn 9 bảng cũ dùng UUID. Không thực thi SQL/migration để tránh ảnh hưởng dữ liệu hiện có.
- Báo cáo có 22 phát hiện, phân biệt bằng chứng tĩnh, tái hiện cục bộ và các điểm cần integration test.

## Hướng đi tiếp theo

Đưa Giai đoạn 1 về trạng thái ổn định: môi trường .NET 10 và database tái lập; sửa Signals, dữ liệu demo, validation, concurrency, costing, payment/posting và phân quyền. Chưa nghiệm thu Giai đoạn 1 hoặc chuyển sang phát triển PUR/Sổ quỹ dựa trên các tỷ lệ 100% trước đây.
