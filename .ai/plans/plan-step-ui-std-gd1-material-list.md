# Plan: UI-STD GĐ1 — component list dùng chung trên Angular Material

> **Trạng thái:** Chờ quyết định (xung đột kiến trúc, mục 2). Chưa cài thư viện, chưa sửa mã.
> **Yêu cầu:** Thiện qua BA 1 (2026-11-14): giao diện list lộn xộn (bảng dài ngắn không đều, sort tệ); áp Angular Material + CDK, theme ERPm, sáng/tối, PC + mobile.
> **Căn cứ:** FE #46 (docs/ui-std/gd0-inventory.md, gd0-measurements.md): 47 màn, chỉ 5 màn dùng list-page, 11 màn `<table>` tay; dòng bảng 50–97px; nút trong dòng 26–36px.

## 1. Phạm vi GĐ1
- 4 màn: /job-positions, /department-levels, /employees, /users. Giữ nguyên chức năng (sort/lọc/phân trang, i18n, quyền).
- Màn khác chỉ mở sau khi Tester duyệt 4 màn này.

## 2. Xung đột cần BA/Thiện quyết (không tự chọn)
1. PROJECT_MASTER §3 (bảng công nghệ) và §4.2 chọn **Ionic 8** làm UI framework hybrid; mobile dùng Ionic UI (IonList Card...). Thêm Material là thư viện UI thứ hai → là đổi quyết định kiến trúc, cần sửa PROJECT_MASTER (và FE/AGENTS.md mục 4 "Angular 20 + Ionic 8"). Hai bên có thể đụng style toàn cục (ionic-overrides.scss, theme/*).
2. PROJECT_MASTER dòng 5 ghi Angular 17.3, thực tế package.json là Angular 20.3: cần sửa; Material/CDK phải cùng bản 20.x.
3. Form chuẩn (app-form-control/app-input-control) vẫn là bắt buộc; Material chỉ dùng cho bảng/list, không thay form, trừ khi quyết khác.
4. FE/AGENTS.md: component 3 file (ts/html/scss), comment tiếng Anh, i18n qua translate: giữ.
Phương án nhẹ hơn để so: nâng data-table hiện có (cột cố định, sort thật, thẻ trên mobile) bằng @angular/cdk table thay vì Material đầy đủ, ít xung đột Ionic hơn. Đề xuất: **Material + CDK chỉ cho bảng (mat-table, matSort, paginator), theme bằng token ERPm, form giữ nguyên**, nếu BA đồng ý sửa PROJECT_MASTER.

## 3. Các bước (sau khi duyệt)
1. Cài @angular/material + @angular/cdk 20.x; theme ERPm map từ token hiện có (variables.scss), sáng/tối theo cơ chế theme hiện tại.
2. Component dùng chung `app-data-list` (mat-table + matSort + paginator): cột Hành động cố định, bề rộng đều, sort đẩy lên server khi màn dùng phân trang server (nối createListQueryState như FE #49), mobile <768px chuyển thẻ, nút ≥44px, dùng token cỡ chữ/khoảng cách chung (không đặt riêng, theo UI-STD).
3. Thay data-table từng bước: 4 màn trước; data-table cũ giữ cho các màn còn lại.
4. Kiểm: build, spec, ảnh trước/sau PC 1366 và mobile 390 (sáng/tối), Tester 1.

## 4. Rủi ro
- Kích thước bundle tăng; xung đột CSS Ionic/Material; sort client vs server không đồng nhất giữa các màn (employees, users, job-positions đang sort client hay không cần kiểm khi làm).
