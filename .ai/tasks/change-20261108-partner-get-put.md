# [update] API xem và sửa đối tác: GET + PUT /partners/{id} (BE-INT.1)

> **Loại:** change
> **Ngày tạo:** 2026-11-08 · **Người làm:** Thiện (BE) · **Người yêu cầu:** BA (phát hiện khi kiểm tích hợp FE)
> **Trạng thái:** Doing (chờ tester và Thiện gõ merge)
> **Liên quan:** Trello https://trello.com/c/PLSefcdu · nhánh `thien/crm-partner-get-put` (BE, root)

## 1. Mô tả
Màn Khách hàng sửa tên, điện thoại, email, địa chỉ, MST, hạn mức, bảng giá chỉ lưu cục bộ trên FE vì BE chỉ có danh sách, tạo mới, bật/tắt không giới hạn nợ và CRUD địa chỉ.

## 2. Cách làm
- `GET /api/v1/partners/{id}` (quyền `crm:partner:view`): cùng cách tính `debtBalance` như danh sách; không có thì 404 `error.crm.partner_not_found`. `PartnerDto` thêm `notes`.
- `PUT /api/v1/partners/{id}` (quyền `crm:partner:create`, catalog chưa có verb edit): sửa `name`, `partnerType`, `phone`, `email`, `address`, `taxCode`, `creditLimit`, `priceListId`, `notes`, `isActive`. Không đổi `code`, `debtBalance` và không đổi `isUnlimitedCredit` (vẫn chỉ qua `PUT /{id}/unlimited-credit`, cần quyền riêng). Trả lại đối tác đã lưu.
- Kiểm tra: tên bắt buộc ≤255, loại hợp lệ, điện thoại ≤50, email ≤100, MST ≤50, địa chỉ ≤500, ghi chú ≤2000, hạn mức ≥0 tối đa 4 chữ số thập phân (`error.validation.number`), bảng giá phải đang hoạt động (giữ nguyên bảng giá đã tắt thì được). Trường tùy chọn để trống sẽ xóa giá trị. Mã lỗi đều đã có trong từ điển, không thêm khóa mới.
- Người sửa và thời điểm ghi theo auditing chuẩn (`LastModifiedBy/At`).
- `Partner` chưa có phạm vi dữ liệu theo chi nhánh (tồn đọng đã ghi ở S23.2.2), nên 404 chỉ khi không tồn tại.
- Lưu ý FE: PUT thay toàn bộ các trường trên (không phải cập nhật từng phần); trường gửi thiếu sẽ bị xóa hoặc về mặc định (`creditLimit` 0, `isActive` true).

## 3. Kiểm tra
- `dotnet build ERPm.sln`: 0 warning, 0 error.
- `ERPm.Verification` (Docker cục bộ): 367 check đạt (12 mới): đọc theo id, 404, sửa đủ trường, không đổi mã/công nợ/cờ không giới hạn, ghi người sửa, xóa trường tùy chọn và ngừng hoạt động, từ chối tên trống, điện thoại quá dài, hạn mức âm, bảng giá không tồn tại, loại sai, đối tác không tồn tại.

## 4. Việc còn lại
- Tester kiểm API thật (cả quyền view/create); Thiện gõ merge. Sau đó FE nối `getPartner/updatePartner` (FE-INT.1).
