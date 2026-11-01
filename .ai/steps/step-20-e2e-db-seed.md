# E2E (B6): database tạm + seed dữ liệu

> Ngày: 2026-11-01 · Card Trello B6 [add](QA) · Nhánh `thien/b6-e2e-playwright` · Trạng thái: **xong phần DB/seed, chờ review**

## 1. Phạm vi (đã chốt lại)
Phúc chia B6: **Thiện = DB/seed cho E2E**, Lợi = selector / luồng UI, Phúc = review + cấu hình CI. Bản này chỉ làm phần của Thiện; không có kịch bản trình duyệt nào.

## 2. Đã làm (`tests/e2e/`)

| Tệp | Nội dung |
| :--- | :--- |
| `playwright.config.ts` | Khởi động API (DLL đã build) với DB tạm `erpm_e2e_<ngẫu nhiên>`, `AutoMigrate`, tài khoản `admin` do `BootstrapAdmin__*` tạo; một worker, một DB dùng chung. |
| `global-setup.ts` | Seed dữ liệu giả qua API công khai: cây Tập đoàn › Công ty A › 2 chi nhánh › cửa hàng, phòng Tài chính, chức danh có role, 2 nhân viên, tài khoản `viewer` / `limited` / `accountant`. |
| `global-teardown.ts` | Xoá DB tạm (`DROP DATABASE ... WITH (FORCE)`). |
| `support/env.ts`, `support/api.ts` | Tên DB, chuỗi kết nối, mật khẩu sinh mỗi lần chạy (không ghi ra đĩa); client API nhỏ để seed và đọc lại trạng thái. |
| `specs/seed.spec.ts` | 3 kiểm tra chỉ gọi API: seed đúng cây, phòng ban, chức danh + role, nhân viên, 3 tài khoản đăng nhập được và quyền khác nhau như thiết kế. |
| `README.md` | Dữ liệu seed, cách gọi từ spec, cách chạy local, phần còn lại cho FE và CI. |
| `proxy.json` | Proxy `/api`, `/hubs` cho `ng serve` khi Lợi thêm webServer FE. |

## 3. Kiểm tra
`npx tsc --noEmit` sạch. `npx playwright test`: 3/3 đạt (~18 s) trên Postgres Docker local; sau chạy không còn DB `erpm_e2e_*` và API đã tắt.

## 4. Việc còn lại
- Lợi: thêm `ng serve` vào `webServer`, viết kịch bản UI (chuyển 39+12+12 kịch bản kiểm tay, gồm B4) dựa trên seed.
- Phúc: job `e2e` trong `.github/workflows/verify.yml` (gợi ý ở cuối `tests/e2e/README.md`).
