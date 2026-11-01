# [change] Quản trị Mẫu Thông báo Đa ngôn ngữ (Notification Template Management & Live Editor)

> **Loại:** change  
> **Ngày tạo:** 2026-11-01 · **Người làm:** Lợi (FE) & Thiện (BE) · **Người yêu cầu:** User  
> **Trạng thái:** Done  
> **Liên quan:** [Step 21 Plan](../plans/plan-step-21-notification-system.md), [Step 21 Log](../steps/step-21-enterprise-notification-engine.md)

---

## 1. Mô tả
- **Yêu cầu ban đầu:** Step 21 nạp sẵn các mẫu thông báo qua seeder CSDL (`NotificationTemplateSeeder.cs`), người dùng chỉ có màn hình xem thông báo và màn hình cài đặt nhận tin cá nhân (`/notifications/preferences`).
- **Yêu cầu mới (User Feedback):** Cần màn hình quản trị toàn diện cho các Mẫu thông báo (`tbl_SYS_NotificationTemplate`) vì nội dung thông báo, tiêu đề, placeholder động, kênh gửi và bản dịch tiếng Anh/Việt cần được quản trị viên tùy biến, cập nhật liên tục mà không cần can thiệp CSDL hay khởi động lại Backend.
- **Phạm vi tính năng:**
  1. API RESTful CRUD cho `tbl_SYS_NotificationTemplate` (`GET`, `POST`, `PUT`, `preview`, `test-send`).
  2. Màn hình quản trị `/notifications/templates` với bảng danh sách, bộ lọc phân hệ, trạng thái hoạt động.
  3. Drawer/Modal soạn thảo mẫu thông báo song ngữ (VI/EN), công cụ gợi ý biến tham số `{param}` dạng chips để chèn nhanh, Live Preview thời gian thực, và nút "Bắn thông báo thử (Test Send)" kiểm tra trực tiếp.

---

## 2. API Contract (Contract-First)

| Endpoint | Method | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/sys/notification-templates` | `GET` | `sys:notification:view` | Lấy danh sách mẫu (lọc theo `category`, `search`, `isActive`) |
| `/api/v1/sys/notification-templates/{id}` | `GET` | `sys:notification:view` | Chi tiết một mẫu theo Id |
| `/api/v1/sys/notification-templates` | `POST` | `sys:notification:edit` | Tạo mẫu thông báo mới |
| `/api/v1/sys/notification-templates/{id}` | `PUT` | `sys:notification:edit` | Cập nhật mẫu thông báo |
| `/api/v1/sys/notification-templates/preview` | `POST` | `sys:notification:view` | Render thử mẫu với tham số JSON mẫu |
| `/api/v1/sys/notification-templates/{id}/test-send` | `POST` | `sys:notification:broadcast` | Bắn thử thông báo thực tế tới người dùng hiện tại |

### Data Structures:
```typescript
interface NotificationTemplateDto {
  id: number;
  externalId: string;
  code: string;
  name: string;
  category: string;
  defaultSeverity: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  supportedChannels: string[]; // ["IN_APP", "PUSH_MOBILE", "EMAIL"]
  titleTemplate: string;
  bodyTemplate: string;
  translations: Record<string, { title: string; body: string }>;
  actionUrlPattern?: string;
  isDigestAllowed: boolean;
  digestWindowSeconds: number;
  isActive: boolean;
}
```

---

## 3. Cách làm
1. **BE (Thiện):**
   - Thêm DTOs trong `NotificationDtos.cs`: `NotificationTemplateDto`, `CreateNotificationTemplateRequest`, `UpdateNotificationTemplateRequest`, `PreviewNotificationTemplateRequest`, `PreviewNotificationTemplateResponse`.
   - Bổ sung phương thức quản lý template trong `INotificationService` & `NotificationService.cs`.
   - Tạo controller `NotificationTemplatesController.cs` (`/api/v1/sys/notification-templates`).
   - Thêm phương thức `TestSendTemplateAsync` bắn thông báo in-app thực tế kiểm chứng template.
   - Bổ sung `RenderString` trong `ITemplateRenderer` và `TemplateRenderer.cs`.
   - Thêm unit & integration checks trong `tests/ERPm.Verification/NotificationChecks.cs`.
2. **FE (Lợi):**
   - Model `NotificationTemplate` trong `src/app/core/models/notification.model.ts`.
   - Component `NotificationTemplatesComponent` (`src/app/modules/SYS/notifications/notification-templates.component.ts`, `.html`, `.scss`).
   - Modal/Drawer biên tập mẫu với tabs VI/EN, parameter chips chèn nhanh (`{item_name}`, `{order_code}`, `{amount}`, `{user_name}`...), Live Preview hộp tin nhắn Toast/Popover, nút Test Send.
   - Thêm route `/notifications/templates` vào `app.routes.ts` bảo vệ bởi `permissionGuard('sys:notification:view')`.
   - Thêm nút liên kết "📝 Mẫu thông báo" trong trung tâm thông báo `/notifications`.
   - Bổ sung từ điển `system.json` và `system_dictionary.json`.

---

## 4. Kiểm tra
- Backend: `dotnet build ERPm.sln` -> 0 warning / 0 error.
- Verification: `ERPm.Hrm.Verification` -> 28 / 28 PASS.
- Frontend: `npm run build` -> 0 error (chunk `notification-templates-component` 38.36 kB).

---

## 5. Việc còn lại
- Không.
