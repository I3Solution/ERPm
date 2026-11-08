# [add] API địa chỉ giao hàng đối tác + hạn mức nợ không giới hạn (S23.2.2)

> **Loại:** change (đặc tả BA chốt 2026-11-07, thuộc Step 23 nhóm 2)
> **Ngày tạo:** 2026-11-07 · **Người làm:** Thiện (BE) · **Người yêu cầu:** BA
> **Trạng thái:** Doing (chờ tester và Thiện gõ merge)
> **Liên quan:** [spec](../plans/plan-step-23-s23-2-2-delivery-address-spec.md) · Trello https://trello.com/c/EKIvMBXK · nhánh `thien/s23-crm-addresses-api` (BE, FE, root) · phụ thuộc S23.2.1 ([task](db-20261107-partner-delivery-address.md), BE PR #25)

## 1. Mô tả
Làm đúng mục 1–6 của spec: 6 endpoint địa chỉ giao hàng, quy tắc mặc định, ràng buộc dữ liệu, quyền, cờ `IsUnlimitedCredit` với hàm kiểm hạn mức dùng chung.

## 2. Quyết định kỹ thuật và chỗ lệch spec (cần BA xác nhận)
- **Id kiểu số nguyên, không phải guid.** Mọi API hiện có trả `int Id`; spec ghi guid. Giữ `int` cho nhất quán với `PartnerDto.Id`.
- **Thêm `PUT /partners/{id}/unlimited-credit`** (quyền `crm:partner:unlimited-credit`): hiện chỉ có tạo đối tác, chưa có API sửa, nên không có cách bật/tắt cờ sau khi tạo. Tạo đối tác với `isUnlimitedCredit=true` cũng cần quyền này (403 nếu thiếu).
- **Phạm vi dữ liệu:** `Partner` chỉ có bộ lọc xóa mềm, chưa có DataScope theo chi nhánh. Vì vậy 404 chỉ khi đối tác không tồn tại hoặc đã xóa; chưa có 404 "ngoài phạm vi".
- **Audit:** hệ thống chỉ ghi người sửa và thời điểm (`LastModifiedBy/At`); chưa có bảng nhật ký giá trị cũ/mới. Giá trị cũ/mới đi qua thông báo (`state` ON/OFF).
- Quyền `crm:partner:unlimited-credit` nằm trong `crm:*` nên template "Branch director" cũng có; Admin có sẵn qua `*`.
- Người nhận thông báo: duyệt mọi tài khoản đang hoạt động, đánh giá quyền từng người; đủ nhanh cho quy mô hiện tại.

## 3. Cách làm
- Domain: `CreditLimitPolicy` (một hàm `Evaluate`, dùng ở xác nhận đơn và hóa đơn/POS), động từ `unlimited-credit` trong `PermissionCatalog`.
- Application/Infrastructure: `IPartnerDeliveryAddressService` + `PartnerDeliveryAddressService` (khóa tư vấn theo đối tác, giao dịch, bỏ cờ cũ rồi mới đặt cờ mới); `PartnerService` (cờ, quyền, thông báo `CRM_PARTNER_UNLIMITED_CREDIT_CHANGED` sau khi lưu).
- API: 6 endpoint địa chỉ + `PUT unlimited-credit` trong `PartnersController`.
- Từ điển VI/EN: 8 khóa (BE `system_dictionary.json`, FE `system.json` chỉ thêm đúng 16 dòng). Lưu ý: FE `system.json` có khóa của Lợi mà BE không có (`common.back_to_list`, `so.*`, `table.*`...), nên không chép đè file BE sang FE được; cần Lợi/Phúc đồng bộ ngược.

## 4. Kiểm tra
- `dotnet build ERPm.sln`: 0 warning, 0 error.
- `ERPm.Verification` (Docker cục bộ): 321 check đạt (290 + 31 mới): mặc định đầu tiên, thay mặc định, không hạ mặc định, set-default nguyên tử + đồng thời, xóa mặc định chuyển cái cũ nhất, xóa mềm, giới hạn 20, phone, 404, cờ bỏ hạn mức ở đơn và hóa đơn, quyền 403, thông báo trừ người thao tác, lặp giá trị không thông báo.
- Chưa có test HTTP cho 7 endpoint mới (đã kiểm ở tầng service); tester nên thử qua API thật.

## 5. Việc còn lại
- BA xác nhận 4 chỗ lệch ở mục 2; tester kiểm; Thiện gõ merge (merge sau PR #25 của S23.2.1).
- Neon: migration S23.2.1 chưa chạy, chờ Thiện gõ lệnh trực tiếp.
