# [add] Dialog dùng chung: Confirm, Info, Success, Warning, Error, Prompt

> **Loại:** change (yêu cầu của Thiện, 2026-11-07: mọi thông báo/hỏi xác nhận phải đi qua một dialog chung)
> **Ngày tạo:** 2026-11-07 · **Người làm:** Thiện (FE) · **Người yêu cầu:** Thiện
> **Trạng thái:** Doing (chờ tester và Thiện gõ merge)
> **Liên quan:** FE nhánh `thien/ui-shared-dialog` (4049f46), BE nhánh cùng tên (từ điển), root cùng tên

## 1. Lý do
Các màn đang dùng `window.confirm` và `alert` của trình duyệt (14 chỗ, xem mục 5): giao diện không đồng nhất, không dịch được, không theo dark mode, không dùng được trên một số webview di động và không test được.

## 2. Cách dùng
Tiêm `DialogService` (`core/services/dialog.service.ts`); `AppDialogComponent` đã gắn một lần trong `app.component.html`, màn không tự vẽ dialog.

```ts
private dialogs = inject(DialogService);

if (!await this.dialogs.confirm({ message: 'order.cancel_confirm' })) return;           // hỏi, trả true/false
if (!await this.dialogs.confirmDanger({ message: 'role.delete_confirm' })) return;      // hành động hủy/xóa: nút đỏ
const reason = await this.dialogs.prompt({ message: 'order.cancel_reason', required: true }); // chuỗi đã trim hoặc null
await this.dialogs.success('common.saved');   // info / success / warning / error: một nút, trả về khi người dùng đóng
```
- `message`, `title`, `confirmText`, `cancelText`, `label`, `placeholder` nhận khóa từ điển hoặc chữ thường; khóa không có thì hiện nguyên chữ.
- Tiêu đề mặc định theo loại (`dialog.title.info|success|warning|danger`); nút mặc định `dialog.ok` / `dialog.confirm` / `common.cancel`.
- Esc, bấm ra ngoài và nút Hủy đều là "không" (confirm = false, prompt = null). Nhiều dialog gọi cùng lúc được xếp hàng và hiện lần lượt.
- Trợ năng: `role="dialog"` (`alertdialog` cho thông báo), focus vào nút chính hoặc ô nhập.

## 3. Đã làm
- `DialogService`, `AppDialogComponent` (html, scss, spec), 7 khóa từ điển VI/EN (cả hai file giống từng byte), gắn vào `app.component`.
- Màn Vai trò (`roles.component`, thuộc repo FE gốc) chuyển từ `window.confirm` sang `confirmDanger` làm mẫu.

## 4. Kiểm tra
- `npm run build`: 0 lỗi. Karma: 158/158 (151 cũ + 7 mới: không vẽ khi rảnh, confirm đúng/sai, Esc và bấm ra ngoài, thông báo một nút và nút đỏ cho lỗi, prompt bắt buộc và cắt khoảng trắng, hủy prompt, xếp hàng).
- Chưa thử bằng tay trên trình duyệt (chưa chạy dev server với API); nên xem nhanh ở Vai trò > Xóa.

## 5. Việc còn lại: chuyển các chỗ còn dùng hộp thoại trình duyệt (thuộc submodule, mỗi repo một PR, chủ module làm)
| Module | Chỗ |
| :--- | :--- |
| HRM | `department-levels`, `employees`, `job-positions`, `work-histories` (xóa), `org-tree` (2 chỗ xóa) |
| SD | `order-detail`, `order-detail-drawer` (duyệt bảo lãnh, hủy đơn; chuỗi tiếng Việt cứng cần chuyển sang khóa từ điển), `quotation-detail-drawer` (chuyển đổi), `quotation-detail` (`alert` đã gửi email) |
| WMS | `items` (`alert(errorMsg)` → `dialogs.error`) |
- `window.confirm` đồng bộ phải đổi thành `await`, nên các hàm đó thành `async`; spec nào giả lập `window.confirm` cần giả lập `DialogService.confirm`.
- Nên thêm vào quy ước FE (PROJECT_MASTER): cấm `window.confirm/alert/prompt`, dùng `DialogService`. Chưa sửa PROJECT_MASTER vì cần Phúc đồng ý.
