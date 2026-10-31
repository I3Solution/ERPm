# [bug] ERPm-FE master trỏ submodule SD/CRM vào commit chưa có trên GitHub

> **Loại:** bug  
> **Ngày tạo:** 2026-10-31 · **Người làm:** Phúc · **Người yêu cầu:** Thiện  
> **Trạng thái:** Done  
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

## 3. Cách làm (Đã thực hiện Cách A)
- **Cách A:**
  1. Trong `ERPm-FE/src/app/modules/SD`: fast-forward `master` lên `52500c5` và chạy `git push origin master` cùng nhánh `phuc/bug-submodule-sdcrm`.
  2. Trong `ERPm-FE/src/app/modules/CRM`: fast-forward `master` lên `9f4a4c6` và chạy `git push origin master` cùng nhánh `phuc/bug-submodule-sdcrm`.
  3. Trong `ERPm-FE`: tạo và đẩy nhánh `phuc/bug-submodule-sdcrm` lên remote `origin`.
- **Chống tái phát:** trước khi push `ERPm-FE`/root, chạy `git push --recurse-submodules=check` (hoặc `git config push.recurseSubmodules check`). Git sẽ chặn push khi submodule còn commit chưa đẩy.

## 4. Kiểm tra
- Đã chạy `git ls-remote https://github.com/I3Solution/ERPm-FE-SD.git`:
  + `52500c57ea9ff0fa8ed84c91b3c088fc4618da40 HEAD`
  + `52500c57ea9ff0fa8ed84c91b3c088fc4618da40 refs/heads/master`
  + `52500c57ea9ff0fa8ed84c91b3c088fc4618da40 refs/heads/phuc/bug-submodule-sdcrm`
- Đã chạy `git ls-remote https://github.com/I3Solution/ERPm-FE-CRM.git`:
  + `9f4a4c696d5eb4a9a40bcb25f318ebf61d4772ca HEAD`
  + `9f4a4c696d5eb4a9a40bcb25f318ebf61d4772ca refs/heads/master`
  + `9f4a4c696d5eb4a9a40bcb25f318ebf61d4772ca refs/heads/phuc/bug-submodule-sdcrm`
- Hai commit `52500c5` và `9f4a4c6` đã hiện diện đầy đủ trên remote GitHub, triệt tiêu hoàn toàn lỗi `upload-pack: not our ref`.

## 5. Việc còn lại
- Không còn. Bug đã được xử lý hoàn tất.
