# B7: script nạp dữ liệu demo vào `tools/` của BE

> Ngày: 2026-11-01 · Card Trello B7 [tool] · ERPm-BE nhánh `thien/b7-demo-seed-tool` · Trạng thái: **xong, chờ review**

## 1. Mục tiêu
Cả nhóm dùng chung một cách dựng môi trường demo qua API, thay cho script riêng ở một máy (`notes/erpm-test-web/seed-testweb.py`).

## 2. Đã làm
`ERPm-BE/tools/demo-seed/seed_demo.py` + `README.md`. Chỉ gọi API công khai (không SQL), thư viện chuẩn Python. Nạp: Công ty A, 2 chi nhánh + cửa hàng, cây phòng ban, 4 chức danh có role mặc định, quyền role theo phòng ban, 5 nhân viên, 2 tài khoản, 3 mặt hàng.
So với bản gốc: địa chỉ API và `--out` là tham số; mật khẩu admin lấy từ `ERPM_ADMIN_PASSWORD`, mật khẩu demo từ `ERPM_DEMO_PASSWORD` hoặc sinh ngẫu nhiên (không nằm trên dòng lệnh hay trong git); chạy lần hai dừng sớm vì đã có Công ty A, không gây lỗi trùng mã giữa chừng.

## 3. Kiểm tra
Dựng API trên DB trống tạm, chạy script: nạp đủ 1 công ty / 4 chi nhánh / 4 phòng ban / 4 chức danh / 5 nhân viên / 2 tài khoản / 3 mặt hàng; chạy lần hai bị từ chối đúng; tài khoản `ketoan` đăng nhập được. Đã xoá DB và API tạm.

## 4. Việc còn lại
Không. (Bản `seed-testweb.py` local giữ nguyên, không push.)
