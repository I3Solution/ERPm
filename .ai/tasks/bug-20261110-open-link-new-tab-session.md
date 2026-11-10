# [bug] Giữ phiên đăng nhập khi mở tab mới (Open link in new tab) và chuyển hướng đúng returnUrl

> **Loại:** bug  
> **Ngày tạo:** 2026-11-10 · **Người làm:** Lợi (`loipham`) · **Người yêu cầu:** Lợi  
> **Trạng thái:** Done  
> **Liên quan:** `AuthService`, `authGuard`, `permissionGuard`, `LoginComponent`, `NotificationSignalRService`  

---

## 1. Mô tả
- **Hiện tượng:**
  1. Khi người dùng click chuột phải vào bất kỳ liên kết/menu nào (ví dụ: mục "Tài khoản", "Báo giá", "Đơn hàng"...) và chọn **"Open link in new tab"** (Mở liên kết trong tab mới), tab mới luôn bị điều hướng về trang `/login` và bắt người dùng đăng nhập lại từ đầu dù tab cũ đang đăng nhập hợp lệ.
  2. Sau khi nhập thông tin đăng nhập thành công ở tab mới, người dùng luôn bị chuyển về `/dashboard`, không được đưa đến đúng trang mà liên kết vừa mở nhắm tới (ví dụ `/users`, `/sales/orders`...).
- **Cách tái hiện:**
  1. Đăng nhập vào ứng dụng tại `http://localhost:4200`.
  2. Click chuột phải vào mục "Tài khoản" (link `/users`) trên thanh điều hướng hoặc menu quản trị.
  3. Chọn **"Open link in new tab"**.
  4. Tab mới mở ra: bị chuyển sang `/login`.
  5. Đăng nhập lại: bị đẩy về `/dashboard` thay vì `/users`.

---

## 2. Phân tích nguyên nhân gốc (Root Cause)
1. **Cô lập phiên theo tab của `sessionStorage`:**
   - Trước đây `AuthService` và `NotificationSignalRService` lưu trữ bearer access token trong `sessionStorage` (`erpm_access_token`).
   - Theo đặc tả W3C Web Storage, `sessionStorage` bị giới hạn nghiêm ngặt trong phạm vi từng tab/window riêng biệt. Khi mở tab mới, `sessionStorage` của tab mới luôn rỗng (`null`).
   - Do đó, `authGuard` và `permissionGuard` kiểm tra `auth.isAuthenticated()` trả về `false` và đá người dùng về `/login`.
2. **Không lưu trữ URL đích (`returnUrl`):**
   - Cả `authGuard` và `permissionGuard` khi phát hiện chưa đăng nhập đều chỉ tạo UrlTree thô `router.createUrlTree(['/login'])`, hoàn toàn bỏ qua thông tin đường dẫn đang truy cập (`state.url`).
3. **Hardcode chuyển hướng sau khi Login:**
   - Trong `LoginComponent`, sau khi gọi `auth.login()` thành công, code bị hardcode:
     `void this.router.navigateByUrl('/dashboard');`
     dẫn tới việc không thể quay lại trang người dùng dự định truy cập.

---

## 3. Cách khắc phục
1. **Lưu trữ Token dùng chung qua `localStorage`:**
   - Cập nhật `AuthService`:
     - Khởi tạo token đọc kết hợp: `localStorage.getItem('erpm_access_token') || sessionStorage.getItem('erpm_access_token')`.
     - Khi `login()`: Lưu đồng thời vào cả `localStorage` và `sessionStorage`.
     - Khi `logout()`: Xóa sạch cả hai bộ lưu trữ.
   - Cập nhật `NotificationSignalRService`: Lấy token từ `localStorage` (kèm fallback `sessionStorage`).
2. **Bảo toàn URL đích trong Route Guards:**
   - Cập nhật `auth.guard.ts` và `permission.guard.ts`:
     Nhận `(_route, state)`, khi chưa xác thực thì tạo UrlTree:
     `router.createUrlTree(['/login'], { queryParams: state.url && state.url !== '/login' ? { returnUrl: state.url } : undefined })`
3. **Xử lý `returnUrl` tại `LoginComponent`:**
   - Inject `ActivatedRoute` và đọc query parameter `returnUrl`:
     Kiểm tra tính an toàn (`rawReturnUrl.startsWith('/') && !rawReturnUrl.startsWith('/login')`), nếu hợp lệ thì điều hướng tới `returnUrl`, nếu không thì fallback về `/dashboard`.

---

## 4. Kiểm tra nghiệm thu (Verification)
- **Kiểm thử tự động:**
  - `ng build`: Thành công 100%, 0 error.
  - Karma unit tests: **171/171 tests pass 100%**, bao gồm test case mới kiểm tra bảo toàn `returnUrl` trong `permission.guard.spec.ts`.
- **Kiểm thử thực tế trên trình duyệt:**
  - Tab 1: Đăng nhập quyền Admin.
  - Tab 2: Chuột phải vào bất kỳ liên kết nào (`/users`, `/sales/orders`) chọn "Open link in new tab" -> Tab mới tự động nhận phiên đăng nhập và mở thẳng trang đích mà không bị đá về `/login`.
  - Giả lập hết hạn phiên: Đưa về `/login?returnUrl=/users`, sau khi đăng nhập đưa thẳng về `/users`.
