# [bug] Banner lỗi API (ApiErrorService) không tự xoá khi gọi API tiếp theo thành công

> **Loại:** bug
> **Ngày tạo:** 2026-11-01 · **Người làm:** _(giao: Phúc hoặc Lợi — code lõi dùng chung)_ · **Người yêu cầu:** Thiện
> **Trạng thái:** Doing (đã sửa lần 2, chờ tester kiểm lại)
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
- **Lần 1** (`tap` xoá banner ở mọi response thành công): tester (erpm-a9) phát hiện **regression**: response thành công của request chạy song song cũng xoá banner của lỗi thật (mở `/org` khi `/branches/tree` lỗi 500: 57 ms lỗi, 71 ms hai request 200 → banner mất). Báo cáo: `notes/ai-team/test-reports/bug-20261101-stale-api-error-banner.md`.
- **Lần 2 (sửa):** `ApiErrorService` đếm thứ tự bắt đầu request (`begin()`); `fail()` ghi lại số request đã bắt đầu tại thời điểm lỗi; `succeeded(order)` chỉ xoá banner khi request **bắt đầu sau** lỗi gần nhất. Interceptor gọi `begin()` / `succeeded()` / `fail()`; request không phải `/api/` không đụng tới banner.
- Spec `api.interceptor.spec.ts` (5 test): lỗi → request thành công sau đó xoá; lỗi mới nhất vẫn hiện; **thành công song song bắt đầu trước lỗi không xoá banner** (ca tester); request bắt đầu sau lỗi xoá được dù request cũ còn treo; request ngoài `/api/` bỏ qua. Spec `app.component.spec.ts` dùng service thật thay vì giả lập thiếu hàm.
- Karma 77/77, `ng build` 0 lỗi. Chưa kiểm tay lại trình duyệt: để tester chạy lại ca `/org` với `/branches/tree` = 500.

## 5. Việc còn lại
- Tester kiểm lại; pass thì báo BA cập nhật `status.md` và Trello. PR: ERPm-FE #6 (nhánh `thien/bug-stale-api-error-banner`) và root #12 (log + bump).
