# Step 21 — Nền tảng Thông báo Doanh nghiệp (Enterprise Notification Engine)

> Ngày: 2026-10-31 · Kế hoạch: [PLAN-STEP-21-ENTERPRISE-NOTIFICATION-ENGINE](../plans/plan-step-21-notification-system.md) · Nhánh: `loipham/Notification` (root + `ERPm-BE` + `ERPm-FE`) · Trạng thái: **Hoàn thành 100% (Backend + Frontend + Triggers + Verification)**.

---

## 1. Mục tiêu
Xây dựng **Notification Engine dùng chung cho toàn bộ các phân hệ ERP** (`SYS`, `WMS`, `SD`, `PUR`, `ACC`, `CRM`, `HRM`, `MFG`, `SCM`, `PM`) và mọi nền tảng (Web Desktop, Mobile App, Tablet).
- Hỗ trợ đa kênh (`In-App SignalR`, `Email`, `Push Mobile`, `Outbox Pattern`).
- Định tuyến thông minh theo IAM & Cây tổ chức từ Step 20 (`UserId`, `JobPositionId`, `DepartmentId`, `BranchId`, `BRANCH_TREE`, `CompanyId`, `GROUP`, IAM Action).
- Cấu hình nhận tin cá nhân hóa (`UserNotificationPreference`) và lọc khung giờ yên tĩnh (Quiet Hours).
- Mẫu thông báo đa ngôn ngữ động (`tbl_SYS_NotificationTemplate`) với token substitution `{param}` và JSONB translations song ngữ.
- Tự động kích hoạt thông báo từ nghiệp vụ:
  - `WMS_LOW_STOCK`: Cảnh báo tồn kho xuống dưới mức tối thiểu (`MinStockAlert`).
  - `SD_ORDER_NEW`: Thông báo có đơn đặt hàng mới cần xử lý.
  - `SD_INVOICE_CANCELLED`: Cảnh báo cấp bách (`DANGER`) khi hủy hóa đơn bán hàng sinh bút toán đảo.
  - `SYS_ROLE_CHANGED`: Thông báo khi quyền hạn hoặc vai trò người dùng được cập nhật.
- Giao diện người dùng Angular 20 + Ionic 8: Chuông thông báo Real-time (`NotificationBell`), Popover xem nhanh, Toast Container nổi 4s, Trung tâm thông báo (`/notifications`), Trang cấu hình nhận tin (`/notifications/preferences`), Web Audio API chime sound.

---

## 2. Các thành phần đã triển khai

### 2.1. Cơ sở dữ liệu (PostgreSQL — Dual-Key UUIDv7)
Migration: `20261031042947_AddNotificationEngine` trên `ERPm-BE`:
1. `tbl_SYS_NotificationTemplate`: Danh mục mẫu thông báo, `supported_channels` mảng chuỗi, `translations` JSONB, tham số placeholder `{param}`, cấu hình gom tin `is_digest_allowed`.
2. `tbl_SYS_Notification`: Bản ghi thông báo gốc, `category`, `severity`, `title`, `body`, `action_url`, `data` JSONB.
3. `tbl_SYS_NotificationRecipient`: Phân phối theo từng người nhận (`user_id`), `is_read`, `read_at`, `is_archived`. Tối ưu với Partial Index `idx_notif_recipient_unread` (`WHERE is_read = false AND is_deleted = false`) cho tốc độ đếm chưa đọc < 1ms.
4. `tbl_SYS_UserNotificationPreference`: Cấu hình nhận tin theo phân hệ (`category`), kênh (`channel`), bật/tắt và khung giờ yên tĩnh (`quiet_hours_enabled`, `quiet_hours_start`, `quiet_hours_end`).
5. `tbl_SYS_NotificationOutbox`: Hàng đợi phân phối Outbox Pattern (`PENDING`, `PROCESSING`, `SENT`, `FAILED`), retry với exponential backoff.

### 2.2. Backend (.NET 10 — Clean Architecture)
- **Domain:**
  - `NotificationEnums`: `NotificationCategory`, `NotificationSeverity`, `NotificationChannel`, `NotificationTargetType`, `NotificationOutboxStatus`.
  - `INotificationEvent` / `NotificationEvent`: Hợp đồng sự kiện chuẩn cho toàn hệ thống.
  - Entities: `NotificationTemplate`, `Notification`, `NotificationRecipient`, `UserNotificationPreference`, `NotificationOutbox`.
- **Application:**
  - DTOs: `NotificationDto`, `NotificationListResponse`, `UnreadCountDto`, `UserNotificationPreferenceDto`, `UpdatePreferenceRequest`, `BroadcastNotificationRequest`, `NotificationResult`.
  - Interfaces: `INotificationEngine`, `INotificationRouter`, `ITemplateRenderer`, `INotificationChannelProvider`, `INotificationService`.
- **Infrastructure:**
  - `TemplateRenderer`: Thay thế biến `{param}` regex an toàn, tự động chọn bản dịch tiếng Việt/Anh theo ngôn ngữ người nhận.
  - `NotificationRouter`: Định tuyến người nhận theo `USER`, `JOB_POSITION`, `DEPARTMENT`, `BRANCH_TREE`, `COMPANY`, `ROLE`, `ALL`.
  - `NotificationHub`: ASP.NET Core SignalR hub (`/hubs/notifications`) tự động gom kết nối vào các group `User_{id}`, `Branch_{id}`, `Company_{id}`.
  - `InAppChannelProvider`: Đẩy DTO qua WebSocket SignalR tới user hoặc group.
  - `EmailChannelProvider`: Xử lý phân phối email qua Outbox.
  - `NotificationEngine`: Hạt nhân xử lý sử dụng `IServiceScopeFactory` tạo DB Context độc lập tránh nghẽn thread nghiệp vụ và race condition Npgsql; kiểm tra tính duy nhất qua Idempotency Key, lọc người dùng bật Quiet Hours.
  - `NotificationService`: Truy vấn, phân trang, `MarkAsReadAsync`, `MarkAllAsReadAsync`, `ArchiveAsync`, quản lý cấu hình nhận tin.
  - `NotificationOutboxWorker`: Background service tự động quét hàng đợi `tbl_SYS_NotificationOutbox` và phân phối ngoại vi.
  - Seeders: `NotificationTemplateSeeder` nạp sẵn 5 mẫu chuẩn (`WMS_LOW_STOCK`, `SD_ORDER_NEW`, `SD_INVOICE_CANCELLED`, `SYS_ROLE_CHANGED`, `SYS_BROADCAST`).
- **Triggers trong Nghiệp vụ:**
  - `SalesPostingService.cs`: Bắn `WMS_LOW_STOCK` khi tồn kho chạm ngưỡng cảnh báo.
  - `SalesOrderService.cs`: Bắn `SD_ORDER_NEW` khi đơn hàng được tạo/xác nhận.
  - `SalesCancellationService.cs`: Bắn `SD_INVOICE_CANCELLED` cấp `DANGER` tới kế toán và quản lý.
  - `RoleService.cs`: Bắn `SYS_ROLE_CHANGED` khi gán hoặc chỉnh sửa vai trò tài khoản.
- **API & Security:**
  - `NotificationsController` (`/api/v1/sys/notifications`): Endpoints cho danh sách phân trang, đếm chưa đọc, đánh dấu đã đọc, đánh dấu tất cả đã đọc, lưu trữ, preferences, và broadcast toàn hệ thống (yêu cầu quyền `sys:notification:broadcast`).
  - `Startup.cs`: Đăng ký `AddSignalR()`, cấu hình CORS `AllowCredentials()`, hỗ trợ token qua query string `access_token` cho WebSocket transport.

### 2.3. Frontend (Angular 20 Standalone + Ionic 8)
- **Services:**
  - `NotificationSignalRService`: Quản lý kết nối `/hubs/notifications`, tự động reconnect, bắt sự kiện `ReceiveNotification`, `NotificationReadSync`, `UnreadCountUpdated`.
  - `NotificationStateService`: Quản lý State bằng **Angular Signals** (`unreadCount`, `recentItems`, `isBellShaking`), hỗ trợ optimistic updates.
  - `NotificationSoundService`: Bộ tổng hợp âm thanh bằng Web Audio API (chime thanh thoát, không cần tải file MP3 ngoài).
- **Components & Pipes:**
  - `RelativeTimePipe`: Định dạng thời gian thân thiện người dùng (`vừa xong`, `5 phút trước`, `2 giờ trước`).
  - `NotificationBellComponent`: Chuông thông báo header bar, huy hiệu đếm unread (`99+`), animation rung chuông.
  - `NotificationPopoverComponent`: Dropdown popover nổi hiển thị 5 thông báo gần nhất, phân loại icon/màu sắc theo mức độ, nút thao tác nhanh.
  - `NotificationToastComponent`: Khay thông báo Toast nổi góc trên màn hình, tự đóng sau 4 giây, click để chuyển trang trực tiếp đến chứng từ liên quan.
  - `NotificationsComponent` (`/notifications`): Trung tâm thông báo đầy đủ, lọc đa chiều (phân hệ, mức độ, trạng thái đọc), phân trang, chế độ Responsive Adaptive (bảng trên Desktop, card trên Mobile).
  - `NotificationPreferencesComponent` (`/notifications/preferences`): Ma trận bật/tắt nhận tin theo từng phân hệ cho từng kênh, cấu hình giờ yên tĩnh (Quiet Hours).
- **Đa ngôn ngữ & Routes:**
  - Bổ sung toàn bộ từ điển Anh - Việt trong `system.json` và `system_dictionary.json`.
  - Định tuyến lazy loading `/notifications` và `/notifications/preferences` bảo vệ bởi `authGuard`.
  - Cấu hình SignalR proxy trong `proxy.conf.json`.

---

## 3. Lệnh đã chạy
```bash
# Cài đặt công cụ và Migration EF Core
dotnet tool install --global dotnet-ef --version 10.0.14
dotnet ef migrations add AddNotificationEngine -p src/ERPm.Infrastructure -s src/ERPm.API -o Persistence/Migrations --no-build
dotnet run --project tools/ERPm.Schema --no-build -- database/erpm_schema.sql

# Biên dịch Backend
dotnet build ERPm.sln                                   # 0 Warning, 0 Error

# Kiểm thử Backend trên CSDL cô lập
dotnet run --project tests/ERPm.Hrm.Verification --no-build
dotnet run --project tests/ERPm.Verification --no-build

# Cài đặt thư viện Frontend và kiểm tra Build
cd ERPm-FE
npm install @microsoft/signalr
npm run build                                           # Build thành công, tạo chunks lazy loading
```

---

## 4. Kết quả kiểm tra (Verification)
- `ERPm.Hrm.Verification`: **28 / 28 HRM checks PASS**.
- `ERPm.Verification`: **93 / 93 checks PASS**, trong đó toàn bộ kịch bản Notification Engine đều vượt qua:
  - `PASS: TemplateRenderer renders localized Vietnamese strings and formats placeholders`
  - `PASS: TemplateRenderer renders localized English strings`
  - `PASS: NotificationEvent constructor preserves category, severity, and branchId`
  - `PASS: at least 5 standard notification templates seeded`
  - `PASS: WMS_LOW_STOCK template exists`
  - `PASS: SD_ORDER_NEW template exists`
  - `PASS: SD_INVOICE_CANCELLED alert exists`
  - `PASS: notification published successfully to target user`
  - `PASS: idempotency key prevents duplicate notification delivery`
  - `PASS: unread notification count is greater than zero`
  - `PASS: notifications list contains published item`
  - `PASS: notification marked as read`
  - `PASS: mark all as read sets unread count to 0`
  - `PASS: user preference successfully toggled`
  - `PASS: admin reads unread notification count over HTTP`
  - `PASS: admin reads notification list over HTTP`
  - `PASS: admin reads preferences over HTTP`
  - `PASS: admin can broadcast notification over HTTP`
- Frontend: `npm run build` hoàn tất không lỗi cú pháp, bundle phân tách tối ưu với lazy loading cho các trang thông báo.

---

## 5. Hướng đi cho step tiếp theo
- Step 22: Triển khai Kế toán Kép (Double-Entry General Ledger) & Tự động sinh Bút toán từ Bán hàng/Kho sang Sổ cái.
- Sẵn sàng mở rộng FCM Push Notification cho ứng dụng Mobile Ionic khi đóng gói Capacitor.
