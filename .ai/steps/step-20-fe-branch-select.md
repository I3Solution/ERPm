# FE `BranchSelectComponent` — control chọn cây tổ chức dùng chung

> Ngày: 2026-11-01 · Card Trello: [BranchSelectComponent](https://trello.com/c/V3qOpb2T) (giao theo lệnh Thiện, chen trước hàng đợi) · Nhánh `thien/fe-branch-select` · Trạng thái: **xong, chờ review**

## 1. Mục tiêu
Một control chọn node cây tổ chức (Tập đoàn › Công ty › Chi nhánh) dùng chung, thay 3 màn đang tự làm phẳng cây bằng `walk()`: nhân viên, chức danh, cây tổ chức. Tham khảo `ng-select-branch` của ERP cũ nhưng không copy cách làm (dựng lại danh sách và duyệt đệ quy mỗi lần đổi cấu hình).

## 2. Đã làm

| Nơi | Nội dung |
| :--- | :--- |
| `shared/components/branch-select/` (`app-branch-select`) | `ControlValueAccessor`, nhận trực tiếp cây lồng nhau `OrgBranch[]` của `GET /branches/tree`. Thụt lề theo độ sâu, nút thu gọn / mở từng node, ô tìm theo tên / mã (hiện cả tổ tiên của kết quả), `nodeTypeFilter` (node không được chọn vẫn hiện nhưng khoá), `scopeRootId` + `scopeMode`, `excludeSubtreeOf` (ẩn một nhánh, dùng chọn cấp trên). Bàn phím: mũi tên, Enter, Esc, phải / trái để mở / thu gọn. |
| `InputControlType` + `<app-form-control>` | Thêm type `'branch-tree'`; `input-control` chuyển sang `app-branch-select`; `form-control` truyền thêm `branchTree`, `nodeTypeFilter`, `scopeRootId`, `scopeMode`, `excludeSubtreeOf`. Nhãn, lỗi validate giữ nguyên hợp đồng như mọi type khác. |
| `core/models/org-tree.util.ts` | `flattenBranches()` / `companiesOf()` (một vòng lặp, không đệ quy) thay 4 bản `walk()` chép tay. |
| 3 màn + hộp thoại tài khoản | Nhân viên (công ty, chi nhánh theo công ty), chức danh (lọc công ty, công ty của form), cây tổ chức (bộ chọn công ty, cấp trên khi sửa chi nhánh, chi nhánh của phòng ban) dùng `type="branch-tree"`; xoá các `*Options` tự dựng. Không đổi hành vi nghiệp vụ. |

## 3. Tối ưu (theo yêu cầu BA)
1. **Chỉ mục dựng một lần** (`computed`): `Map<id, node>` kèm cha, độ sâu, danh sách con, chuỗi tìm kiếm; chỉ dựng lại khi cây hoặc ràng buộc đổi, không dựng lại khi gõ hay mở / thu gọn.
2. **Chỉ duyệt node đang hiển thị:** con của node thu gọn không được duyệt, không vào DOM.
3. **Debounce tìm kiếm 200 ms.**
4. **Panel chỉ tồn tại khi mở.**
5. `@for ... track id`; không quét toàn mảng để tìm cha / con (tra `Map`, O(1)).
6. Khác card, thêm một việc cần thiết: khi mở, panel được đưa ra `<body>` và định vị `fixed` dưới (hoặc trên) ô chọn, vì `.erpm-modal` có `overflow: hidden` làm panel cây bị cắt nửa. Panel tự gỡ khi component bị hủy lúc đang mở (có test chống rò rỉ).

Giao diện: dùng chung stylesheet và class của `custom-select` (token màu, trạng thái, dark mode); chỉ thêm phần cây (`.bs-row`, `.bs-toggle`).

## 4. Lệnh đã chạy
```
npm run build
npx ng test --watch=false --browsers=ChromeHeadless
```

## 5. Kết quả kiểm tra (Verification)
- `npm run build`: 0 lỗi. Karma: **66/66** (53 trước đó + 13 mới của `BranchSelectComponent`: không có panel khi đóng, panel ra `<body>` và gỡ khi hủy, thụt lề / thu gọn, mở xuống node đang chọn, debounce (không lọc trước 200 ms, chỉ lần gõ cuối của một loạt có tác dụng), tìm theo mã, node khoá, `scopeRootId` kể cả khi chưa có gốc, `excludeSubtreeOf`, form control (ghi / xoá / phát giá trị), bàn phím, cây 600+ node chỉ vẽ 13 dòng).
- Kiểm trên trình duyệt thật (Chrome headless qua CDP, web test cục bộ, dữ liệu giả) **12/12**:
  - giao diện: ô chọn cây và `custom-select` cùng nền, viền, bo góc, màu chữ, cỡ chữ ở chế độ sáng và tối (so `getComputedStyle`; ảnh chụp đối chiếu bằng mắt, dark mode đúng token);
  - hành vi: panel không có trong DOM khi đóng; chi nhánh của nhân viên chỉ hiện cây của công ty đã chọn; mở một chi nhánh thấy cửa hàng; tìm "cửa hàng" chờ debounce rồi giữ kết quả cùng tổ tiên; chọn node điền vào form; khi sửa chi nhánh, ô "Cấp trên" ẩn chính nó cùng nhánh con và khoá node Tập đoàn; panel nằm trọn trong khung nhìn, không bị modal cắt;
  - cây lớn: chặn phản hồi `/branches/tree` để thay bằng cây giả 600+ node (không đụng DB): mở panel **33 ms** và chỉ vẽ **13 dòng**; gõ tìm "cong ty 7" ổn định sau **217 ms** gồm 200 ms debounce (còn 2 dòng).
- Chưa kiểm: thanh cuộn của cây rất lớn khi mở hết nhiều tầng (chưa cần virtual scroll, để dành card B5); màn hình mobile nhỏ.

## 6. Việc tiếp theo
- Review và merge theo thứ tự ERPm-FE-HRM → ERPm-FE → ERPm (root). Không có thay đổi BE hay từ điển (dùng khóa sẵn có `common.*`, `org.toggle`).
- **Xác nhận với Phúc / Lợi trước khi merge**: card ghi Phúc từng nhắc đã giao việc này cho người khác ngoài Trello.
- Role designer (S20.4.3) dùng lại control này cho phạm vi `BRANCH_TREE` / `CUSTOM_BRANCHES` (`scopeRootId`, `scopeMode`).
- Các ô chọn trong modal khác (`custom-select`) vẫn bị `overflow: hidden` của modal cắt như trước; cách đưa panel ra `<body>` ở đây có thể áp cho chúng nếu muốn.
