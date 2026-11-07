# [db] Nhiều địa chỉ giao hàng của đối tác + cờ không giới hạn nợ (S23.2.1)

> **Loại:** db
> **Ngày tạo:** 2026-11-07 · **Người làm:** Thiện (BE) · **Người yêu cầu:** BA (Step 23, nhóm 2)
> **Trạng thái:** Doing (chờ tester và Thiện gõ merge)
> **Liên quan:** plan-step-23 (nhóm 2) · Trello https://trello.com/c/Zy4DXMFD · BE 8166055 (nhánh `thien/s23-crm-addresses-db`)

## 1. Mô tả
- Bảng mới `tbl_CRM_PartnerDeliveryAddress`: PartnerId, RecipientName, Phone, Address, City, District, Ward, IsDefault (+ cột chuẩn của entity có audit/xóa mềm).
- Cột mới `is_unlimited_credit` (boolean, mặc định false) trên bảng đối tác. Lưu ý: bảng thật là `tbl_CRM_Partner` (card ghi `tbl_MD_Partner`).

## 2. Phân tích
- Mỗi đối tác nhiều địa chỉ; tối đa **một** địa chỉ mặc định còn sống: chỉ mục duy nhất một phần `ux_partner_delivery_address_default` (`is_default = true AND is_deleted = false`).
- Xóa đối tác kéo theo địa chỉ (cascade); bộ lọc truy vấn ẩn địa chỉ đã xóa mềm hoặc của đối tác đã xóa.
- Cờ `IsUnlimitedCredit` chỉ là dữ liệu ở task này; việc bỏ qua chặn hạn mức nằm ở S23.2.2.

## 3. Cách làm
- Tạo: `Domain/Entities/Partner/PartnerDeliveryAddress.cs`, migration `AddPartnerDeliveryAddress`.
- Sửa: `Partner.cs`, `ApplicationDbContext.cs`, `tests/ERPm.Verification/Program.cs`.
- Lệnh: `dotnet ef migrations add AddPartnerDeliveryAddress` (chạy trong git worktree vì API đang chạy khóa DLL), rồi chép file về.

## 4. Kiểm tra
- `dotnet build`: 0 warning, 0 error.
- `ERPm.Verification` trên Docker cục bộ: 290 check đạt (287 cũ + 3 mới: cờ mặc định, nhiều địa chỉ, chặn địa chỉ mặc định thứ hai); `migration matches current model` đạt.
- Chưa chạy migration trên Neon: theo quy tắc phiên, chỉ chạy khi Thiện gõ lệnh trực tiếp.

## 5. Việc còn lại
- Tester kiểm; Thiện gõ merge. Chạy migration trên Neon nếu Thiện yêu cầu.
- Tiếp theo: S23.2.2 (API CRUD địa chỉ, bỏ chặn hạn mức khi `IsUnlimitedCredit`).
