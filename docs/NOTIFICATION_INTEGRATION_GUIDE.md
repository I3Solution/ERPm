# 📢 QUY CHUẨN TÍCH HỢP HỆ THỐNG THÔNG BÁO DOANH NGHIỆP (NOTIFICATION INTEGRATION GUIDE)

> **Dành cho:** Toàn bộ thành viên phát triển ERPm (Tech Lead, Backend Dev, Frontend Dev và AI Agent).  
> **Áp dụng cho:** 10 phân hệ ERPm (`SYS`, `WMS`, `SD`, `PUR`, `ACC`, `CRM`, `HRM`, `MFG`, `SCM`, `PM`) trên cả Desktop Web, Tablet và Mobile App.  
> **Nền tảng hạ tầng:** Step 21 — Enterprise Notification Engine (SignalR WebSocket, PostgreSQL Outbox Pattern, Smart IAM/Org Router).

---

## 📌 1. NGUYÊN TẮC BẮT BUỘC (MANDATORY PRINCIPLES)

1. **Tính Bắt buộc theo Nghiệp vụ (Zero Missing Events):**
   - Mọi chức năng nghiệp vụ khi phát sinh sự kiện quan trọng (tạo mới, gửi duyệt, phê duyệt, từ chối, hủy bỏ chứng từ, cảnh báo ngưỡng an toàn, quá hạn công nợ/hợp đồng, thay đổi quyền hạn) **BẮT BUỘC PHẢI PHÁT SINH THÔNG BÁO**.
   - Không được để người dùng phải liên tục F5 hoặc hỏi nhau thủ công qua chat ngoài về trạng thái của chứng từ và cảnh báo hệ thống.

2. **Bất đồng bộ & Decoupled (Không làm nghẽn Transaction chính):**
   - Logic nghiệp vụ cốt lõi (lưu DB, sinh bút toán, ghi sổ) phải được ưu tiên hoàn tất trước.
   - Việc phát sinh thông báo qua `INotificationEngine.PublishAsync` phải được thực thi theo phương thức **Decoupled** (Fire-and-forget qua `_ = notificationEngine.PublishAsync(...)` hoặc chạy ngầm độc lập với DB transaction chính), đảm bảo lỗi kết nối mạng hoặc lỗi gửi tin ngoại vi (Email/Push) **tuyệt đối không làm rollback chứng từ nghiệp vụ**.

3. **Chống Gửi Trùng lặp (Strict Idempotency):**
   - Mọi sự kiện phát sinh thông báo bắt buộc phải có `idempotencyKey` duy nhất theo ngữ cảnh:  
     `{MODULE}_{ACTION}_{ENTITY_ID}_{TIMESTAMP_OR_STATUS}`  
     *Ví dụ:* `SD_ORD_APPROVED_1024_20261101` hoặc `WMS_LOW_STOCK_SKU09_WH01_20261101`.

4. **Đa ngôn ngữ & Tham số Động (100% Bilingual & Placeholder):**
   - Không hard-code chuỗi thông báo tiếng Việt hoặc tiếng Anh vào mã nguồn C# hay TypeScript.
   - Toàn bộ nội dung thông báo phải quản lý qua Template mã hóa trong CSDL (`tbl_SYS_NotificationTemplate`) với các placeholder `{param}`, hỗ trợ song ngữ Anh - Việt qua JSONB translations.

5. **Deep Link Điều hướng Trực tiếp (`ActionUrl`):**
   - Mọi thông báo bắt buộc phải có `actionUrl` trỏ thẳng tới màn hình hoặc chi tiết chứng từ liên quan (ví dụ: `/sales/orders/102` hoặc `/inventory?warehouseId=3`), để khi người dùng click vào Toast hoặc Quả chuông là xem được ngay dữ liệu.

---

## 🧭 2. MA TRẬN SỰ KIỆN BẮT BUỘC THEO 10 PHÂN HỆ

Bất kỳ khi nào phát triển màn hình / tính năng thuộc các phân hệ dưới đây, nhà phát triển bắt buộc phải đối chiếu và hiện thực thông báo tương ứng:

| Phân hệ | Hành động / Sự kiện kích hoạt | Mã Template chuẩn | Mức độ (`Severity`) | Đối tượng nhận (`TargetType`) | Kênh mặc định |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Bán hàng (SD)** | Đơn đặt hàng mới được tạo | `SD_ORDER_NEW` | `INFO` | Nhân viên bán hàng & Quản lý kho | In-App, Push |
| | Đơn hàng được phê duyệt hạn mức nợ | `SD_ORDER_APPROVED` | `SUCCESS` | Nhân viên tạo đơn | In-App |
| | Hủy hóa đơn bán hàng (sinh bút toán đảo) | `SD_INVOICE_CANCELLED` | `DANGER` | Kế toán trưởng & Ban giám đốc (`BranchTree`) | In-App, Push, Email |
| | Báo giá chuyển thành công thành Đơn hàng | `SD_QUOTATION_CONVERTED` | `SUCCESS` | Khách hàng & Sales phụ trách | In-App |
| **Kho hàng (WMS)** | Tồn kho chạm ngưỡng tối thiểu | `WMS_LOW_STOCK` | `WARNING` | Thủ kho & Quản lý chi nhánh (`BranchTree`) | In-App, Push, Email |
| | Nhập kho hoàn tất (GRN) | `WMS_RECEIPT_COMPLETED` | `SUCCESS` | Bộ phận mua hàng & Kế toán kho | In-App |
| | Lệch kho phát hiện sau kiểm kê | `WMS_STOCK_VARIANCE` | `WARNING` | Ban kiểm kê & Kế toán tổng hợp | In-App, Email |
| **Mua hàng (PUR)** | Yêu cầu mua sắm cần phê duyệt | `PUR_PR_PENDING_APPROVAL` | `WARNING` | Trưởng phòng duyệt mua | In-App, Push |
| | Nhà cung cấp chậm giao hàng quá hạn | `PUR_DELIVERY_OVERDUE` | `DANGER` | Nhân viên mua hàng | In-App, Push |
| **Kế toán (ACC)** | Khóa sổ kỳ kế toán tháng/quý | `ACC_PERIOD_CLOSED` | `INFO` | Toàn bộ kế toán viên (`Department`) | In-App |
| | Bút toán lệch nợ/có cần xử lý | `ACC_ENTRY_UNBALANCED` | `DANGER` | Kế toán trưởng | In-App, Email |
| | Nhận thanh toán công nợ từ khách hàng | `ACC_PAYMENT_RECEIVED` | `SUCCESS` | Nhân viên quản lý công nợ & Sales | In-App |
| **Nhân sự (HRM)** | Đơn xin nghỉ phép cần phê duyệt | `HRM_LEAVE_PENDING` | `INFO` | Trưởng bộ phận trực tiếp | In-App, Push |
| | Hợp đồng lao động sắp hết hạn trước 30 ngày | `HRM_CONTRACT_EXPIRING` | `WARNING` | Phòng Nhân sự | In-App, Email |
| | Bảng lương tháng đã được duyệt chi | `HRM_PAYROLL_APPROVED` | `SUCCESS` | Toàn bộ nhân viên công ty | In-App, Email |
| **Khách hàng (CRM)**| Cơ hội bán hàng (Lead) mới được phân bổ | `CRM_LEAD_ASSIGNED` | `INFO` | Nhân viên phụ trách (`User`) | In-App, Push |
| | Khách hàng vượt hạn mức nợ cho phép | `CRM_CREDIT_EXCEEDED` | `WARNING` | Quản lý kinh doanh & Kế toán công nợ | In-App, Push |
| **Hệ thống (SYS)** | Cập nhật phân quyền / gán vai trò mới | `SYS_ROLE_CHANGED` | `INFO` | Tài khoản được gán (`User`) | In-App |
| | Phát hiện đăng nhập bất thường / Khóa tài khoản | `SYS_SECURITY_ALERT` | `DANGER` | Người dùng & Quản trị hệ thống | In-App, Email, Push |
| | Thông báo bảo trì hoặc chỉ đạo chung | `SYS_BROADCAST` | `INFO` | Toàn hệ thống (`All`) | In-App, Push |
| **Sản xuất (MFG)** | Lệnh sản xuất bị nghẽn vật tư | `MFG_MATERIAL_SHORTAGE` | `DANGER` | Quản đốc phân xưởng & Thủ kho | In-App, Push |
| **Dự án (PM)** | Công việc dự án bị chậm tiến độ (Deadline) | `PM_TASK_OVERDUE` | `WARNING` | Người phụ trách & Quản trị dự án | In-App |

---

## 🛠️ 3. QUY TRÌNH & HƯỚNG DẪN KỸ THUẬT BACKEND (.NET 10)

### 3.1. Đăng ký Template mới (Nếu sự kiện chưa có sẵn trong CSDL)
Mỗi sự kiện phải có bản ghi trong `tbl_SYS_NotificationTemplate`. Bạn có thể:
1. Thêm vào seeder: `ERPm-BE/src/ERPm.Infrastructure/Persistence/Seeders/NotificationTemplateSeeder.cs`.
2. Hoặc tạo nhanh trực tiếp qua màn hình **Mẫu thông báo (`/notifications/templates`)**.

*Quy ước đặt mã Template:*  
`[PHÂN_HỆ]_[ĐỐI_TƯỢNG]_[HÀNH_ĐỘNG]`  
*Ví dụ:* `SD_ORDER_APPROVED`, `WMS_LOW_STOCK`, `HRM_LEAVE_REJECTED`.

### 3.2. Inject và Gửi Thông báo trong Application Service
Inject `INotificationEngine` vào constructor của Service. Khi phát sinh sự kiện, tạo instance `NotificationEvent` và gọi `PublishAsync`:

```csharp
using ERPm.Application.Common.Notifications;
using ERPm.Domain.Enums;
using ERPm.Domain.Events;

public class OrderApprovalService : IOrderApprovalService
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationEngine _notificationEngine;

    public OrderApprovalService(
        IApplicationDbContext context,
        INotificationEngine notificationEngine)
    {
        _context = context;
        _notificationEngine = notificationEngine;
    }

    public async Task<OrderDto> ApproveOrderAsync(int orderId, CurrentUser user, CancellationToken ct)
    {
        // 1. Thực hiện nghiệp vụ chính
        var order = await _context.SalesOrders.FindAsync(new object[] { orderId }, ct);
        order.Status = OrderStatus.Approved;
        order.ApprovedBy = user.UserId;
        order.ApprovedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        // 2. Kích hoạt thông báo (Decoupled, không block transaction chính)
        _ = _notificationEngine.PublishAsync(new NotificationEvent(
            templateCode: "SD_ORDER_APPROVED",
            category: NotificationCategory.SD,
            severity: NotificationSeverity.SUCCESS,
            targetType: NotificationTargetType.User,
            targetId: order.CreatedByUserId, // Gửi đích danh cho nhân viên tạo đơn
            companyId: order.CompanyId,
            branchId: order.BranchId,
            senderUserId: user.UserId,
            idempotencyKey: $"SD_ORD_APP_{order.Id}_{DateTime.UtcNow:yyyyMMdd}",
            actionUrl: $"/sales/orders/{order.Id}",
            parameters: new Dictionary<string, object>
            {
                ["order_code"] = order.Code,
                ["approver_name"] = user.DisplayName ?? "Quản lý",
                ["approved_at"] = DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm")
            }
        ), ct);

        return MapToDto(order);
    }
}
```

### 3.3. Các loại Đối tượng nhận (`NotificationTargetType`)

| Target Type | Ý nghĩa | Giá trị `targetId` | Trường hợp sử dụng |
| :--- | :--- | :--- | :--- |
| `USER` | Đích danh 1 tài khoản | `UserId` (`int`) | Người tạo chứng từ, nhân viên phụ trách cá nhân |
| `JOB_POSITION` | Tất cả nhân viên giữ chức danh này | `JobPositionId` (`int`) | Gửi cho tất cả "Kế toán trưởng", "Thủ kho", "Trưởng phòng kinh doanh" |
| `DEPARTMENT` | Toàn bộ nhân sự thuộc phòng ban | `DepartmentId` (`int`) | Thông báo nội bộ Phòng Kế toán, Phòng Mua hàng |
| `BRANCH_TREE` | Toàn bộ chi nhánh và các cấp con | `BranchId` (`int`) | Cảnh báo tồn kho cho cụm chi nhánh khu vực miền Nam |
| `COMPANY` | Toàn bộ nhân sự trong 1 pháp nhân | `CompanyId` (`int`) | Thông báo chính sách công ty |
| `ROLE` | Người nắm quyền hạn / Vai trò IAM | `RoleId` (`int`) | Gửi cho bất kỳ ai có quyền duyệt hạn mức tín dụng |
| `ALL` | Toàn bộ người dùng trong hệ sinh thái | `null` | Thông báo khẩn cấp toàn hệ thống, bảo trì server |

---

## 💻 4. QUY TRÌNH & HƯỚNG DẪN KỸ THUẬT FRONTEND (ANGULAR 20 + IONIC 8)

### 4.1. Cơ chế Tiếp nhận Real-time Tự động (Zero Config)
Nhờ kiến trúc tại `AppComponent` (`app.component.html`), toàn bộ ứng dụng đã được tích hợp sẵn:
- `<app-notification-bell>`: Tự động kết nối WebSocket SignalR `/hubs/notifications`.
- Huy hiệu đỏ đếm unread (`99+`) và animation lắc chuông tự động kích hoạt khi có thông báo mới rơi xuống.
- `<app-notification-toast>`: Tự động bật popup thông báo nổi góc trên màn hình trong 4 giây kèm âm thanh chime nhẹ nhàng.
- **Nhà phát triển màn hình nghiệp vụ KHÔNG CẦN viết thêm code kết nối WebSocket.**

### 4.2. Xử lý Deep Link (Điều hướng khi click vào thông báo)
Khi xây dựng trang chi tiết chứng từ (ví dụ `/sales/orders/:id`), bạn chỉ cần đảm bảo Component đọc được `route.snapshot.paramMap.get('id')` và tải đúng chứng từ. Khi người dùng click vào Toast hoặc Quả chuông, Router Angular sẽ tự động chuyển hướng chính xác đến màn hình đó.

### 4.3. Bổ sung Điều hướng vào Menu Sidebar (Desktop & Mobile)
Nếu màn hình mới tạo là một trung tâm theo dõi cảnh báo hoặc danh mục mẫu:
- Đặt router link trong `ERPm-FE/src/app/app.component.html`.
- Kiểm tra quyền hiển thị qua `*ngIf="auth.can('module:feature:view')"`.
- Bổ sung cặp từ điển tiếng Việt và tiếng Anh tại cả:
  - `ERPm-FE/src/assets/i18n/system.json`
  - `ERPm-BE/src/ERPm.Infrastructure/Persistence/Seeders/system_dictionary.json`

---

## ✅ 5. CHECKLIST NGHIỆM THU (MANDATORY DEFINITION OF DONE)

Trước khi chuyển bất kỳ task nào sang **Review / Done**, lập trình viên và AI Agent bắt buộc phải kiểm tra 6 tiêu chí:

- [ ] **1. Đánh giá Sự kiện:** Đã rà soát luồng nghiệp vụ của màn hình/chức năng, xác định danh sách các sự kiện cần bắn thông báo.
- [ ] **2. Khai báo Mẫu (Template):** Mẫu thông báo đã được định nghĩa mã chuẩn `<MODULE>_<ENTITY>_<ACTION>`, có đủ bản dịch song ngữ Anh - Việt.
- [ ] **3. Định tuyến Chính xác:** Đã chọn đúng `TargetType` (User, JobPosition, Department, BranchTree...) và mức độ quan trọng `Severity` phù hợp.
- [ ] **4. Khóa Idempotency:** Đã cấu hình `idempotencyKey` đảm bảo không bị lặp thông báo khi user click nhiều lần.
- [ ] **5. Deep Link Hợp lệ:** `actionUrl` trỏ chính xác về route xem chi tiết chứng từ.
- [ ] **6. Không làm nghẽn Luồng:** Lệnh `PublishAsync` được gọi an toàn theo cơ chế decoupled, không làm block hay rollback nghiệp vụ chính khi có lỗi gửi tin.
