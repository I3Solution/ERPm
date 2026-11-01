# BUG-20261102 – Role designer: lỗi tester trả lại (S20.4.3)

Trạng thái: Doing (đã sửa, chờ tester `erpm-60` kiểm lại)
Báo cáo tester: `notes/ai-team/test-reports/S20.4.3-role-designer-20261102.md`

| Mã | Hiện tượng | Nguyên nhân gốc | Cách sửa | Test chống tái phát |
| :--- | :--- | :--- | :--- | :--- |
| L1 (nặng) | Vai trò lưu từ ma trận, tải lại mở ra JSON, không về ma trận được | BE lưu `resources: ["*"]`, `dataScope: null`; `toMatrix()` chỉ coi đơn giản khi `resources` rỗng | Coi `[]` và `["*"]` đều là đơn giản (`policy-matrix.util.ts`) | `policy-matrix.util.spec.ts` (dữ liệu y như BE trả), `roles.component.spec.ts` (mở ở ma trận) |
| L2 | Ô phạm vi hiện khóa thô `jp.scope.CUSTOM_BRANCHES` | Khóa chỉ có cho 7 mode của chức danh | Dùng khóa `role.scope.CUSTOM_BRANCHES` (VI/EN, hai từ điển giống hệt) | spec nhãn phạm vi |
| L3 | CUSTOM_BRANCHES không chọn đơn vị vẫn lưu được | Thiếu kiểm tra phía FE | Chặn lưu, hiện `role.scope.custom_required` | spec "refuses CUSTOM_BRANCHES without any unit" |
| L4 | Mobile 390px vùng ma trận bị cắt bên phải | `fieldset` mặc định rộng bằng phần tử con rộng nhất | `min-width: 0` cho `.role-area`, `overflow-wrap` cho gợi ý | **chưa kiểm bằng mắt**, chờ tester |
| Gợi ý | Thông báo 409 chung chung | Banner chỉ in `error.request.conflict` | Ghi chú "tải lại rồi sửa lại" kèm nút Tải lại | spec conflict |

Kiểm tra: ng build 0 lỗi, Karma 96/96.
