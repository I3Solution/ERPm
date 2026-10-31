# [bug] ERPm-FE master trỏ submodule SD/CRM vào commit chưa có trên GitHub

> **Loại:** bug
> **Ngày tạo:** 2026-10-31 · **Người làm:** _(giao: Phúc, hoặc người được Phúc đồng ý)_ · **Người yêu cầu:** Thiện
> **Trạng thái:** Todo
> **Liên quan:** ERPm-FE `6c9addc` (merge), `e03e145`, `4cd07e1`; root `c83239f`; chặn [plan step 20](../plans/plan-step-20-iam-dynamic-role-and-organization.md) Task 20.4.x và 20.6.6

## 1. Mô tả
- **Hiện tượng:** clone sạch rồi chạy `git submodule update --init --recursive` ở `ERPm-FE` thì báo lỗi:
  ```
  fatal: remote error: upload-pack: not our ref 52500c57ea9ff0fa8ed84c91b3c088fc4618da40   (SD)
  fatal: remote error: upload-pack: not our ref 9f4a4c696d5eb4a9a40bcb25f318ebf61d4772ca   (CRM)
  ```
  Vì vậy thiếu code SD/CRM, và `npm run build` không chạy được.
- **Cách tái hiện:** `git clone --recursive https://github.com/I3Solution/ERPm.git` rồi `cd ERPm-FE && git ls-tree origin/master src/app/modules/SD src/app/modules/CRM`. Hai commit này không có trong `git ls-remote` của `ERPm-FE-SD`/`ERPm-FE-CRM`.
- **Môi trường:** Windows 11, git 2.x, 2026-10-31.

## 2. Phân tích
- Lịch sử con trỏ submodule trong `ERPm-FE`:

  | Commit FE | Người | SD | CRM |
  | :--- | :--- | :--- | :--- |
  | `4cd07e1` | Lợi | `cb78d4d` (có trên GitHub) | `6dd2c0f` (có trên GitHub) |
  | `e03e145` | Lợi | `457eac0` (**chưa push**, bản sửa POS) | `6dd2c0f` |
  | `6c9addc` (merge) | Phúc | `52500c5` (**chưa push**) | `9f4a4c6` (**chưa push**) |

- **Nguyên nhân gốc:** khi merge ở `6c9addc`, con trỏ submodule lấy theo bản local của Phúc. Phúc chưa push 2 commit đó lên `ERPm-FE-SD`/`ERPm-FE-CRM`. Bản merge này cũng đè mất cập nhật của Lợi (`457eac0`, `6dd2c0f`).
- Commit `457eac0` của Lợi (sửa kiểu `selectedCustomerId`, kho mặc định, xem `bug-20261031-fe-semver-missing-modules-and-pos-types.md`) cũng chưa push.

## 3. Cách làm
Chọn **một** trong hai cách:
- **Cách A (khuyến nghị, nếu 2 commit còn trên máy Phúc):**
  1. Phúc vào `ERPm-FE/src/app/modules/SD` → `git push origin HEAD:master`; làm tương tự cho `CRM`.
  2. Lợi push `457eac0` trong SD. Nếu lệch với `52500c5` thì merge hoặc rebase trong repo SD, rồi bump lại con trỏ.
- **Cách B (nếu không còn 2 commit đó):**
  1. Trong SD, áp lại bản sửa POS của Lợi lên `origin/master` (`cb78d4d`), rồi commit và push.
  2. `ERPm-FE`: trỏ SD về commit mới và CRM về `6dd2c0f`. Commit `[fix](CORE) repoint SD/CRM submodules to pushed commits`, rồi bump `ERPm-FE` ở root.
- **Chống tái phát:** trước khi push `ERPm-FE`/root, chạy `git push --recurse-submodules=check` (hoặc `git config push.recurseSubmodules check`). Git sẽ chặn push khi submodule còn commit chưa đẩy.

## 4. Kiểm tra
- Clone sạch vào một thư mục mới, chạy `git submodule update --init --recursive` thì không còn lỗi `not our ref`.
- Kết quả `ERPm-FE`: `npm ci && npm run build` 0 lỗi.

## 5. Việc còn lại
- Chờ Phúc chọn cách A hay B và push.
