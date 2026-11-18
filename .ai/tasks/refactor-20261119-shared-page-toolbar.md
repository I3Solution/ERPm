# [refactor] Toolbar dùng chung cho trang danh sách và chi tiết

> **Loại:** refactor
> **Ngày tạo:** 2026-11-19 · **Người làm:** Phúc (Codex) · **Người yêu cầu:** Phúc
> **Trạng thái:** Done
> **Progress aggregation:** v1
> **Liên quan:** UI-STD, Step 24
> **Phạm vi:** ERPm-FE shell và component dùng chung, ACC Hệ thống tài khoản, SD Đơn bán hàng, WMS Sản phẩm, dictionary FE/BE

## 1. Mô tả

Thống nhất vị trí tìm kiếm, bộ lọc, thao tác chính và menu trên trang danh sách. Trang chi tiết dùng cùng cách bố trí cho nút quay lại và nhóm thao tác. Toolbar dùng token ERPm, tự xuống hàng ở màn hẹp và giữ nguyên quyền, trạng thái vô hiệu hóa, nội dung tùy biến và sự kiện hiện có.

## 2. Phân tích

- Context bắt đầu lúc 00:18 ngày 2026-11-19 (UTC+07). `I3Solution/ERPm` HEAD ban đầu `05a1c9986471ab8ab39985ab8e1a09b93ca9acd5` và master sau khi đồng bộ `2480c84c5ba1cda13931d22c9189c30afa150085` đều pin `I3Solution/ERPm-FE` tại `e6f73fdccea83db1dd1d91c1c6a8f4ae2faa7c66`. Worktree FE riêng lấy từ master `f4634b3dbe7d3794f03944820ecdea2c433641ca`, với cùng gitlink các module nghiệp vụ.
- `src/app/shared/components/list-page` lặp phần render và lọc quyền của `action-bar`. `detail-page` gọi `action-bar` và tự bố trí thanh quay lại. Mẫu đối chiếu là SYS Users và SD Orders cho bộ lọc, WMS Item Detail cho slot `[actions]`.
- Dependency trực tiếp gồm `AuthService.can`, `DropdownMenuComponent`, `TranslatePipe`, `src/theme/components.scss` và token tại `src/theme/variables.scss`. Giữ API component và slot công khai của hai shell. API nghiệp vụ, database, dictionary, menu điều hướng và màn tự dựng giao diện nằm ngoài phạm vi lượt đầu.
- Xác minh dự kiến bằng build Angular, UI-STD, spec shell và kiểm tra hiển thị ở kích thước desktop/mobile. Cần xác nhận content projection lồng nhau và kích thước bộ lọc trong trang thực tế.
- Context bổ sung ngày 2026-11-19 lúc 00:56 (UTC+07). Root `2480c84c5ba1cda13931d22c9189c30afa150085`, FE worktree `f4634b3dbe7d3794f03944820ecdea2c433641ca`. ACC pin `5eeb3c1867ddd3b2b7e56aaaefa7972a66afa2e7`, master `77b0fc19fdb9d925a3a4e9af2aa41b7950339087` có cùng tree. SD pin và master `8dec82c372e5f531b3b02777bcdf6e4afc23d899`. BE pin và master `776ca1b86a0c609a596261b91d7f3644c836dd47`.
- `AppComponent` đang nhân bản tùy chọn tài khoản giữa header desktop và menu mobile. Sidebar chứa nhóm liên kết tĩnh. `DataTableComponent` đã có checkbox nhưng thiếu trạng thái chọn do màn điều khiển và SD Orders đang dựng hai layout. `ChartOfAccountsComponent` đang tự làm phẳng cây, làm mất nhánh khi lọc.
- Bổ sung WMS Items vì danh sách Sản phẩm cũng tự render bảng desktop và thẻ mobile. WMS pin và master cùng ở `49e5fa09652e1afb2d41ee86a5a2be1b09996d1c`. Dùng cùng helper lựa chọn cho SD và WMS, giữ tìm kiếm, phân trang và route chi tiết hiện có.
- Mở rộng dùng chung tới `tree-view`, menu điều hướng, lựa chọn dòng trên bảng/thẻ, toolbar và từ điển VI/EN. Giữ nghiệp vụ CRUD và route guard hiện có. Chức năng duyệt hoặc từ chối hàng loạt là hạng mục tương lai, chỉ chuẩn bị dữ liệu chọn và điểm nối toolbar ở đợt này. Xác minh bằng build, ChromeHeadless, UI-STD, đối chiếu dictionary và thao tác trình duyệt với dữ liệu mẫu.

## 3. Features / Milestones

- [x] Dùng một toolbar cho cả danh sách và chi tiết, giữ hành vi và slot hiện có.
- [x] Xác minh toolbar và bố cục responsive.
- [x] Quy tắc FE dùng chung và đầu việc trên Trello.
- [x] Menu tài khoản, thứ tự header và menu thao tác toolbar.
- [x] Checkbox và trạng thái chọn dòng trên Đơn bán hàng và Sản phẩm.
- [x] Cây điều hướng theo module và Hệ thống tài khoản.
- [x] Rà soát và kiểm chứng các màn đã thay đổi.

## 4. Cách làm

- Nâng cấp `app-action-bar`, dùng trong `app-list-page` và `app-detail-page`. Có 17 template danh sách và 3 template chi tiết đang dùng hai shell.
- Thêm kiểm thử cho slot bộ lọc, nút tùy biến, toolbar rỗng và điều hướng quay lại. Dùng token màu chữ hiện hành trong `back-button` để tăng độ tương phản ở giao diện tối.
- Bản FE nằm ở worktree `tmp/ERPm-FE-page-toolbar` trên nhánh `phuc/shared-page-toolbar`.
- Bổ sung `ERPm-FE/FE_UI_GUIDE.md` và dẫn từ AGENTS. Header đặt chuông bên trái, menu tài khoản gom ngôn ngữ, giao diện, hiển thị ô bảng và đăng xuất.
- `app-tree-view` dùng chung trong sidebar và trang Thêm trên mobile, cùng Hệ thống tài khoản ACC. Tìm kiếm ACC giữ tổ tiên, hỗ trợ từ khóa không dấu và giữ trạng thái mở trước khi lọc. Toolbar cây có mở/thu tất cả, menu dòng có thêm cấp con và sửa theo quyền.
- `app-data-table` dùng cùng checkbox và lựa chọn trên desktop/mobile cho SD Đơn bán hàng và WMS Sản phẩm. `createListSelection` xóa lựa chọn khi query hoặc dữ liệu đổi. Toolbar nhận số đã chọn, cho bỏ chọn và hỗ trợ `requiresSelection`.

## 5. Kiểm tra

- `npm.cmd run build` thành công. Build có cảnh báo ngân sách bundle khởi tạo (958,67 kB so với ngưỡng cảnh báo 500 kB) và hai cảnh báo template ACC/HRM.
- `npm.cmd test -- --watch=false --browsers=ChromeHeadless` với Chrome local qua 294/294.
- `node tools/check-ui-std.mjs` và `git diff --check` đạt.
- Chrome kiểm tra bản build với API mẫu. SD Orders tại 1440 px và 390 px không tràn toolbar, giữ nhãn nút tạo và gửi truy vấn tìm kiếm. WMS Item Detail ở 390 px giao diện tối hiển thị nút quay lại, xóa và lưu. Ảnh cục bộ tại `tmp/toolbar-orders-desktop.png`, `tmp/toolbar-orders-mobile.png` và `tmp/toolbar-item-detail-mobile-dark.png`.
- Bản cập nhật kiểm tra lại build production, UI-STD và ChromeHeadless 297/297. Hai dictionary dùng cùng git blob `cf54b0df1cc99f702ceaa1f8aa6fa466674e19a4`. Bundle khởi tạo 959,39 kB, vẫn phát cảnh báo ngân sách 500 kB và hai cảnh báo template đã nêu.
- Chrome với dữ liệu mẫu ở 1440 px và 390 px đã kiểm tra đổi VI/EN, sáng/tối, đăng xuất, bàn phím đóng menu và phục hồi focus, chuông hiển thị trong viewport, lọc menu theo quyền, chọn dòng/chọn cả trang/bỏ chọn, xóa chọn khi tìm kiếm, cây ACC nở/thu và tìm tài khoản cấp sâu. Ảnh cục bộ tại `tmp/erp-ui-*.png`.

## 6. Việc còn lại

- Nghiệp vụ duyệt/từ chối nhiều đơn nằm ở [Backlog](https://trello.com/c/uhjNtPC1) theo yêu cầu triển khai sau. Các danh sách khác có thể dùng API chọn dòng khi nghiệp vụ cần thao tác hàng loạt.
- Bản thay đổi đã chuẩn bị PR theo thứ tự repo phụ thuộc và đang chờ review.

## 7. Evidence và cập nhật

- Ngày cập nhật cuối: 2026-11-19
- Build, kiểm thử ChromeHeadless và kiểm tra giao diện đều đã chạy trên worktree nêu trên.
- Trello Review gồm [Quy tắc FE](https://trello.com/c/UD6daXQC), [header và toolbar](https://trello.com/c/RVtYYvyR), [chọn dòng](https://trello.com/c/8rty58cP), [menu module](https://trello.com/c/FmTl1I9P) và [cây tài khoản](https://trello.com/c/FANHfJaF).
- PR phụ thuộc gồm [BE #89](https://github.com/I3Solution/ERPm-BE/pull/89), [ACC #7](https://github.com/I3Solution/ERPm-FE-ACC/pull/7), [SD #24](https://github.com/I3Solution/ERPm-FE-SD/pull/24), [WMS #7](https://github.com/I3Solution/ERPm-FE-WMS/pull/7) và [FE #95](https://github.com/I3Solution/ERPm-FE/pull/95).
