# [update](FE) Header: gom nút Đăng xuất vào menu hồ sơ người dùng

> **Loại:** change · **Người làm:** Thiện (Dev 1) · **Trạng thái:** Doing (chờ tester và merge)
> **Liên quan:** FE #45 · BE #55 (từ điển) · nhánh `thien/header-profile-menu-v2`

## Làm
- Bỏ nút "Đăng xuất" riêng ở thanh trên; ô hồ sơ (avatar + tên) mở menu thả xuống có mục "Đăng xuất". Luồng đăng xuất không đổi.
- Component dùng chung `app-dropdown-menu`: menu dựng từ danh sách mục (`profileItems`), thêm hồ sơ hoặc đổi mật khẩu bằng cách thêm mục và một case trong `onProfileAction`.
- Panel ra `<body>`, `position: fixed` (như B9); Esc, bấm ra ngoài, Tab đóng; mũi tên di chuyển; mobile chỉ hiện avatar nhưng vẫn mở được menu.
- Avatar lấy chữ cái từ tên hiển thị (trước đó cố định "AD"). Khóa từ điển `header.profile_menu` (BE+FE).

## Kiểm tra
- `npm run build` 0 lỗi; Karma 214/214 (6 spec mới cho menu). Chưa bấm tay trình duyệt.

## Còn lại
- Tester 1 kiểm desktop và mobile; Thiện gõ merge (BE #55 trước, FE #45 sau).
- Ngoài phạm vi, phát hiện khi kiểm B5: employees, employee-detail, job-positions, work-histories (HRM) vẫn gọi `departments({ pageSize: 1000 })`, BE cắt ở 200 nên các ô chọn phòng ban ở đó cũng bị cắt âm thầm. Đề nghị BA mở card riêng.
