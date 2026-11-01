# [bug] Banner lỗi API (ApiErrorService) không tự xoá khi gọi API tiếp theo thành công

> **Loại:** bug
> **Ngày tạo:** 2026-11-01 · **Người làm:** _(giao: Phúc hoặc Lợi — code lõi dùng chung)_ · **Người yêu cầu:** Thiện
> **Trạng thái:** Doing (đã sửa, chờ tester)
> **Liên quan:** `src/app/core/api.interceptor.ts`, `src/app/core/services/api-error.service.ts`, `src/app/app.component.html`; code gốc commit `1059c82` (bizyoh, 2026-10-30)

## 1. Mô tả
- **Hiện tượng:** đăng nhập sai mật khẩu → hiện banner đỏ "Tài khoản hoặc mật khẩu không đúng...". Đăng nhập lại đúng ngay sau đó → vào được hệ thống, nhưng banner lỗi cũ **vẫn còn hiển thị** trên màn tiếp theo (ví dụ màn Nhân viên), dù thao tác đã thành công.
- **Cách tái hiện:** ở bất kỳ màn nào, gọi 1 API bị lỗi (banner hiện ra), rồi gọi 1 API khác thành công — banner không tự mất, chỉ mất khi người dùng tự bấm dấu `×`.
- **Môi trường:** web, Angular 20.3, 2026-11-01.

## 2. Phân tích
- `ApiErrorService.message` ([api-error.service.ts](../../ERPm-FE/src/app/core/services/api-error.service.ts)) là 1 signal, chỉ được **set** trong `apiInterceptor` ([api.interceptor.ts:18](../../ERPm-FE/src/app/core/api.interceptor.ts#L18)) khi `catchError`.
- Không có chỗ nào **clear** signal này khi một request tiếp theo thành công. Banner hiển thị toàn cục ([app.component.html:2](../../ERPm-FE/src/app/app.component.html#L2)), nên lỗi này ảnh hưởng **mọi API trong hệ thống**, không riêng đăng nhập.
- Nguyên nhân gốc: interceptor chỉ xử lý nhánh lỗi (`catchError`), thiếu nhánh thành công để reset `errors.message.set(null)`.

## 3. Cách làm (đề xuất)
- Trong `apiInterceptor`, thêm `tap(() => errors.message.set(null))` vào pipe cho nhánh thành công (trước hoặc cùng `catchError`), để mỗi request thành công tự xoá banner lỗi cũ.
- Cân nhắc: không xoá nếu banner đang hiển thị lỗi của chính response hiện tại (tránh nhấp nháy) — nhưng vì lỗi và thành công là 2 nhánh loại trừ nhau của cùng 1 request nên không xung đột.
- Viết 1 spec Karma: gọi lỗi → banner hiện; gọi thành công tiếp theo → banner biến mất.

## 4. Kiểm tra
- `apiInterceptor` thêm `tap` chỉ xử lý `HttpResponse` (bỏ qua các sự kiện trung gian của HttpClient): response thành công của một request `/api/` xoá `ApiErrorService.message`. Request không phải `/api/` không đụng tới banner.
- Spec mới `src/app/core/api.interceptor.spec.ts` (3 test): lỗi → hiện, request thành công kế tiếp → biến mất; lỗi mới nhất vẫn hiện; request ngoài `/api/` không xoá banner.
- Karma 75/75 (72 cũ + 3 mới), `ng build` 0 lỗi. Chưa kiểm tay trên trình duyệt: để tester (đăng nhập sai rồi đúng, banner phải mất khi vào `/dashboard`).

## 5. Việc còn lại
- Tester kiểm tay; sau khi pass báo BA cập nhật `status.md` và Trello. PR: ERPm-FE (nhánh `thien/bug-stale-api-error-banner`) và root (log + bump).
