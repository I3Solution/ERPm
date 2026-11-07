# Step 23 - Đặc tả S23.2.2: API địa chỉ giao hàng đối tác + hạn mức nợ không giới hạn

Ngày chốt: 2026-11-07 (BA, theo yêu cầu của Thiện). Phạm vi: card S23.2.2 (BE), kéo theo S23.2.3/2.4 (FE) và S23.3.1 (đơn bán).
Ghi chú: file plan tổng `plan-step-23-ux-refactor-item-crm-sales-enhancements.md` (Phúc) chưa có trên master; file này là phần đặc tả chi tiết riêng cho S23.2.2, gộp vào plan tổng khi Phúc đưa lên.

## 1. Quyền và phạm vi dữ liệu
| Thao tác | Quyền | Ghi chú |
| :--- | :--- | :--- |
| GET danh sách / chi tiết | `crm:partner:view` | |
| POST, PUT, DELETE, set-default | `crm:partner:create` | Catalog hiện chỉ có view/create cho `crm:partner`, chưa có verb edit. Không mở rộng catalog trong S23.2.2; nếu sau này tách edit thì đổi một chỗ. |
| Bật/tắt `IsUnlimitedCredit` | `crm:partner:unlimited-credit` (verb MỚI) | Chỉ role kế toán trưởng/quản lý được cấp. Thêm vào catalog và seed cho nhóm Admin. |
- Phạm vi dữ liệu: địa chỉ đi theo đối tác. Tải đối tác qua truy vấn đã áp DataScope hiện có; đối tác ngoài phạm vi thì trả 404 (`error.crm.partner_not_found`), không lộ sự tồn tại.

## 2. Quy tắc địa chỉ mặc định
- Địa chỉ đầu tiên của đối tác tự thành mặc định (bỏ qua giá trị `isDefault` client gửi).
- POST/PUT với `isDefault=true`: bỏ cờ mặc định của địa chỉ cũ rồi đặt cờ mới, trong CÙNG một transaction. Lưu ý chỉ mục duy nhất `ux_partner_delivery_address_default`: phải bỏ cờ cũ (SaveChanges) trước rồi mới đặt cờ mới, trong một transaction.
- `set-default` là thao tác nguyên tử như trên, idempotent nếu địa chỉ đã là mặc định.
- Xóa địa chỉ mặc định: tự chuyển mặc định sang địa chỉ còn sống tạo sớm nhất. Hết địa chỉ thì không còn mặc định.
- Không cho PUT hạ `isDefault=false` của địa chỉ mặc định duy nhất còn lại (bỏ qua, vẫn là mặc định); muốn đổi thì set-default cái khác.

## 3. Xóa địa chỉ đang được đơn bán tham chiếu
- Luôn xóa mềm, KHÔNG chặn.
- Đơn bán (S23.3.1) lưu `DeliveryAddressId` và thêm bản chụp lúc tạo/sửa đơn: `DeliveryRecipientName`, `DeliveryPhone`, `DeliveryAddressText` (ghép sẵn). Hiển thị/in đơn luôn dùng bản chụp, nên đổi hay xóa địa chỉ gốc không làm đổi chứng từ đã lập. Thêm các cột này vào phạm vi S23.3.1.

## 4. Ràng buộc dữ liệu
| Trường | Quy tắc |
| :--- | :--- |
| recipientName | Bắt buộc, tối đa 255 |
| address | Bắt buộc, tối đa 500 |
| phone | Tùy chọn; nếu có: 8-15 chữ số, cho phép đầu `+`, bỏ khoảng trắng/dấu `.-()` trước khi kiểm; lưu dạng đã chuẩn hóa |
| city, district, ward | Tùy chọn, tối đa 100 mỗi trường |
| Số địa chỉ / đối tác | Tối đa 20 (còn sống). Vượt: 422 `error.crm.delivery_address_limit` |

## 5. IsUnlimitedCredit
- Quyền bật/tắt: `crm:partner:unlimited-credit` (mục 1). Không có quyền mà gửi thay đổi giá trị: 403; gửi cùng giá trị cũ thì bỏ qua.
- Audit: dùng cơ chế auditing chuẩn (người đổi, thời điểm, giá trị cũ/mới). Thông báo: phát sự kiện `CRM_PARTNER_UNLIMITED_CREDIT_CHANGED` qua Notification Engine tới người có quyền `crm:partner:unlimited-credit`, loại trừ người thao tác, theo `docs/NOTIFICATION_INTEGRATION_GUIDE.md` (emit SAU khi lưu thành công).
- Bỏ qua kiểm hạn mức ở MỌI điểm đang chặn theo hạn mức nợ: xác nhận đơn bán, tạo hóa đơn trực tiếp, POS (nếu có kiểm). Tìm mọi chỗ kiểm hạn mức bằng grep; đưa vào một hàm dùng chung, không rải điều kiện.
- Công nợ vẫn ghi sổ và báo cáo như thường. Khi `IsUnlimitedCredit=true` thì KHÔNG hiện cảnh báo 80% hạn mức. Trường hạn mức vẫn lưu giá trị cũ (không xóa) để bật lại không mất.

## 6. API Contract
Tiền tố `/api/v1`. Header chuẩn auth như các API khác.

| # | Method | URL | Quyền | Request | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | GET | `/partners/{partnerId}/delivery-addresses` | view | - | 200 `DeliveryAddressDto[]` (mặc định lên đầu, rồi theo ngày tạo) |
| 2 | GET | `/partners/{partnerId}/delivery-addresses/{id}` | view | - | 200 `DeliveryAddressDto` |
| 3 | POST | `/partners/{partnerId}/delivery-addresses` | create | `SaveDeliveryAddressRequest` | 201 `DeliveryAddressDto` |
| 4 | PUT | `/partners/{partnerId}/delivery-addresses/{id}` | create | `SaveDeliveryAddressRequest` | 200 `DeliveryAddressDto` |
| 5 | DELETE | `/partners/{partnerId}/delivery-addresses/{id}` | create | - | 204 |
| 6 | POST | `/partners/{partnerId}/delivery-addresses/{id}/set-default` | create | - | 200 `DeliveryAddressDto` |

```jsonc
// SaveDeliveryAddressRequest
{ "recipientName": "string", "phone": "string|null", "address": "string",
  "city": "string|null", "district": "string|null", "ward": "string|null",
  "isDefault": false }
// DeliveryAddressDto
{ "id": "guid", "partnerId": "guid", "recipientName": "...", "phone": "...", "address": "...",
  "city": "...", "district": "...", "ward": "...", "isDefault": true,
  "createdAt": "ISO8601 UTC" }
```
`PartnerDto` / request lưu đối tác thêm `isUnlimitedCredit: boolean` (đọc cho mọi người có view; ghi cần quyền riêng).

### Mã lỗi (VI/EN trong cả `system_dictionary.json` và `system.json`)
| HTTP | Code | EN | VI |
| :--- | :--- | :--- | :--- |
| 404 | `error.crm.partner_not_found` | Partner not found | Không tìm thấy đối tác |
| 404 | `error.crm.delivery_address_not_found` | Delivery address not found | Không tìm thấy địa chỉ giao hàng |
| 400 | `error.crm.delivery_address_recipient_required` | Recipient name is required | Tên người nhận là bắt buộc |
| 400 | `error.crm.delivery_address_address_required` | Address is required | Địa chỉ là bắt buộc |
| 400 | `error.crm.delivery_address_phone_invalid` | Phone number is invalid | Số điện thoại không hợp lệ |
| 422 | `error.crm.delivery_address_limit` | A partner can have at most 20 delivery addresses | Mỗi đối tác tối đa 20 địa chỉ giao hàng |
| 403 | `error.crm.unlimited_credit_forbidden` | You are not allowed to change unlimited credit | Bạn không có quyền thay đổi hạn mức nợ không giới hạn |

## 7. Việc còn lại / ghi chú
- Migration S23.2.1 trên Neon: chỉ chạy khi Thiện ra lệnh trực tiếp trong phiên executor.
- Test cần có: mặc định đầu tiên, xóa mặc định → chuyển, set-default nguyên tử, giới hạn 20, 404 theo DataScope, bật unlimited cần quyền, unlimited bỏ qua kiểm hạn mức ở mọi điểm.
