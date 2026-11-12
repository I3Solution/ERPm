# Step 25 — Bảng giá chuẩn ERP (Bán/Mua, Thuế, Versioning) & Nâng cấp Địa chỉ Đối tác

> **Ngày lập:** 2026-11-13 · **Người yêu cầu:** Product Owner / Architect · **Kế hoạch & Hỗ trợ chung:** Phúc  
> **Trạng thái:** Sẵn sàng triển khai (Ready for Execution)  
> **Tài liệu đặc tả nghiệp vụ:** [PRICING_AND_PARTNER_ADDRESS_ERP_SPEC.md](../../docs/PRICING_AND_PARTNER_ADDRESS_ERP_SPEC.md)  
> **Phân công nòng cốt:** Lợi (Dev chính Backend) · Thiện (Dev chính Frontend) · Phúc (Hỗ trợ, Kiến trúc, Code dùng chung & Verification)

---

## 1. MỤC TIÊU VÀ PHẠM VI

1. **Bảng giá chuẩn ERP (Enterprise Pricing Engine):**
   - Phân loại 2 chiều: Bảng giá Bán (Sales) vs Bảng giá Mua (Purchase / Vendor).
   - Cơ chế thuế: Đã gồm thuế (`IsTaxInclusive = true`) vs Chưa gồm thuế (`IsTaxInclusive = false`).
   - Quản lý Phiên bản (Price List Versioning): 3 cấp (Header ➔ Version ➔ Items). Vòng đời Draft ➔ Active ➔ Expired.
   - Tính năng nhân bản (Clone Version) và điều chỉnh giá hàng loạt (Bulk adjustment +X%, làm tròn).
2. **Nâng cấp Địa chỉ Đối tác & Bảo toàn lịch sử:**
   - Bổ sung phân loại địa chỉ trong CRM: Địa chỉ giao hàng (Shipping), Địa chỉ xuất hóa đơn (Billing), Trụ sở (Office).
   - Đồng bộ địa chỉ giao hàng mặc định vào Báo giá (Quotations) và giữ nguyên bản chụp snapshot khi chuyển thành Đơn bán hàng (Convert to Order).

---

## 2. PHÂN CHIA NHIỆM VỤ (TASK BREAKDOWN)

> **Cơ chế phân công:** Lợi đảm nhận toàn bộ phần Backend (DB, Services, API); Thiện đảm nhận toàn bộ phần Frontend (SD & CRM); Phúc đóng vai trò hỗ trợ, quy hoạch kiến trúc, xây dựng các module/code dùng chung (Shared/Core) và lead nghiệm thu.

| Mã Task | Phân hệ / Tầng | Người phụ trách chính | Hỗ trợ | Tên công việc & Nội dung cốt lõi |
| :--- | :--- | :--- | :--- | :--- |
| **S25.1** | BE (Domain / DB) | **Lợi** (Dev chính BE) | Phúc | **Nâng cấp Schema Database & Entity Bảng giá**: Thêm trường `Type`, `IsTaxInclusive` cho `PriceList`; tạo bảng `PriceListVersions`; chuyển `PriceListItems` liên kết với `PriceListVersionId`. Migration PostgreSQL. |
| **S25.2** | BE (Service / API) | **Lợi** (Dev chính BE) | Phúc | **Động cơ định giá (PricingEngine) & Dịch vụ Phiên bản**: Tự động so khớp phiên bản có hiệu lực tại ngày chứng từ, xử lý thuế Inclusive/Exclusive, API Clone version và Bulk adjustment. |
| **S25.3** | BE (SD Module) | **Lợi** (Dev chính BE) | Phúc | **Tích hợp Địa chỉ Snapshot vào Báo giá (Quotations)**: Thêm `DeliveryAddressId`, `DeliveryRecipientName`, `DeliveryPhone`, `DeliveryAddressText` vào `SalesQuotation`; truyền snapshot sang `SalesOrder` khi convert. |
| **S25.4** | FE (SD / Price Lists) | **Thiện** (Dev chính FE) | Phúc | **Giao diện Quản lý Bảng giá & Phiên bản**: Hiển thị phân loại Bán/Mua, cờ thuế, quản lý danh sách phiên bản, dialog Clone version, công cụ tăng giảm giá hàng loạt. |
| **S25.5** | FE (SD / Quotations) | **Thiện** (Dev chính FE) | Phúc | **Tích hợp Địa chỉ & Bảng giá trên Báo giá**: Dropdown chọn địa chỉ giao hàng của đối tác, auto-select địa chỉ mặc định, ghi chú giá có thuế/chưa thuế theo bảng giá đã chọn. |
| **S25.6** | FE (CRM / Partner) | **Thiện** (Dev chính FE) | Phúc | **Nâng cấp Giao diện Địa chỉ Đối tác CRM**: Bổ sung phân loại `AddressType` (Giao hàng, Hóa đơn, Trụ sở), hoàn thiện form quản lý nhiều địa chỉ và gán cờ mặc định. |
| **S25.7** | QA / Verification | **Phúc** (Lead nghiệm thu) | Thiện, Lợi | **Kiểm thử tự động & Nghiệm thu toàn diện**: Unit test PricingEngine (so khớp bậc số lượng, thuế, versioning), kiểm thử snapshot địa chỉ bất biến, `dotnet build` 0 warning, `npm test` 100% pass. |

---

## 3. TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

1. **Bảng giá:**
   - Tạo được bảng giá Bán và bảng giá Mua với tiền tệ và cờ thuế tương ứng.
   - Tạo được nhiều phiên bản giá cho 1 bảng giá; hệ thống chỉ áp dụng phiên bản `Active` nằm trong khoảng ngày chứng từ.
   - Nhân bản (Clone) version hoạt động chính xác kèm công cụ điều chỉnh giá hàng loạt.
   - Bán lẻ/POS hiển thị giá đã gồm VAT; Bán buôn/PO hiển thị giá chưa VAT.
2. **Địa chỉ đối tác:**
   - 1 đối tác có thể lưu nhiều địa chỉ với phân loại rõ ràng (Giao hàng, Hóa đơn, Trụ sở).
   - Tạo Báo giá hoặc Đơn bán hàng tự động điền địa chỉ giao hàng mặc định của khách hàng.
   - Sửa hoặc xóa địa chỉ trong CRM tuyệt đối không làm thay đổi thông tin trên các Báo giá và Đơn hàng cũ.
3. **Kỹ thuật & CI/CD:**
   - Migration PostgreSQL chạy mượt mà, giữ an toàn dữ liệu hiện có.
   - `dotnet test` và `npm test` đạt 100% SUCCESS, build production 0 error.
   - Tuân thủ quy tắc Git: branch cá nhân `thien/*`, `phuc/*`, `loipham/*`, push submodule trước khi cập nhật repo cha.

---

## 4. HỢP ĐỒNG API CHI TIẾT (API CONTRACT)

> **Quy ước:** Base URL `/api/v1`, Bearer JWT Authentication, chuẩn Response bọc `ApiResponse<T>`.  
> Chi tiết toàn bộ request/response payload xem tại [PRICING_AND_PARTNER_ADDRESS_ERP_SPEC.md#5-hợp-đồng-api-chi-tiết-api-contract](../../docs/PRICING_AND_PARTNER_ADDRESS_ERP_SPEC.md#5-hợp-đồng-api-chi-tiết-api-contract).

### 4.1. Bảng phân định Endpoints cho các Task

| Mã Task | Method | Endpoint URL | Quyền (Permission) | Mô tả tóm tắt | DTO Request / Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S25.1 & S25.2** | `GET` | `/sales/price-lists` | `sd:pricelist:view` | Lấy danh sách bảng giá (`?type=Sales/Purchase`) | `PriceListDto[]` |
| **S25.1 & S25.2** | `GET` | `/sales/price-lists/{id}` | `sd:pricelist:view` | Chi tiết bảng giá (kèm danh sách versions) | `PriceListDetailDto` |
| **S25.1 & S25.2** | `POST` | `/sales/price-lists` | `sd:pricelist:create` | Tạo bảng giá (`Type`, `IsTaxInclusive`, `Currency`) | `CreatePriceListRequest` ➔ `PriceListDetailDto` |
| **S25.1 & S25.2** | `PUT` | `/sales/price-lists/{id}` | `sd:pricelist:edit` | Sửa bảng giá | `UpdatePriceListRequest` ➔ `PriceListDetailDto` |
| **S25.2** | `GET` | `/sales/price-lists/{priceListId}/versions` | `sd:pricelist:view` | Danh sách phiên bản của bảng giá | `PriceListVersionDto[]` |
| **S25.2** | `GET` | `/sales/price-lists/{priceListId}/versions/{id}` | `sd:pricelist:view` | Chi tiết phiên bản (kèm danh sách items) | `PriceListVersionDetailDto` |
| **S25.2** | `POST` | `/sales/price-lists/{priceListId}/versions` | `sd:pricelist:edit` | Tạo phiên bản mới (`Draft`) | `CreatePriceListVersionRequest` |
| **S25.2** | `PUT` | `/sales/price-lists/{priceListId}/versions/{id}` | `sd:pricelist:edit` | Sửa thông tin phiên bản (khi còn `Draft`) | `UpdatePriceListVersionRequest` |
| **S25.2** | `POST` | `/sales/price-lists/{priceListId}/versions/{id}/activate` | `sd:pricelist:edit` | Kích hoạt phiên bản thành `Active` | `PriceListVersionDto` |
| **S25.2** | `POST` | `/sales/price-lists/{priceListId}/versions/{id}/close` | `sd:pricelist:edit` | Đóng phiên bản thành `Expired` | `PriceListVersionDto` |
| **S25.2** | `POST` | `/sales/price-lists/{priceListId}/versions/{id}/clone` | `sd:pricelist:edit` | Nhân bản toàn bộ giá sang phiên bản mới (+X%, làm tròn) | `ClonePriceListVersionRequest` |
| **S25.2** | `POST` | `/sales/price-lists/{priceListId}/versions/{id}/adjust-prices`| `sd:pricelist:edit` | Điều chỉnh giá hàng loạt items trong phiên bản | `AdjustPricesRequest` |
| **S25.2** | `GET` | `/sales/price-lists/{priceListId}/versions/{id}/items` | `sd:pricelist:view` | Lấy danh sách items (phân trang, search) | `PagedResult<PriceListItemDto>` |
| **S25.2** | `POST` | `/sales/price-lists/{priceListId}/versions/{id}/items` | `sd:pricelist:edit` | Thêm item vào phiên bản | `CreatePriceListItemRequest` |
| **S25.2** | `PUT` | `/sales/price-lists/{priceListId}/versions/{id}/items/{itemId}`| `sd:pricelist:edit`| Sửa giá, minQty, chiết khấu của item | `UpdatePriceListItemRequest` |
| **S25.2** | `DELETE`| `/sales/price-lists/{priceListId}/versions/{id}/items/{itemId}`| `sd:pricelist:edit`| Xóa item khỏi phiên bản | 204 No Content |
| **S25.2** | `POST` | `/sales/price-lists/calculate-price` | `sd:order:view` | Động cơ tính giá (so khớp version active, bóc tách VAT) | `CalculatePriceRequest` ➔ `CalculatePriceResponse` |
| **S25.3** | `POST` | `/sales/quotations` | `sd:quotation:create` | Tạo báo giá (kèm Snapshot Địa chỉ & PriceListId) | `CreateSalesQuotationRequest` |
| **S25.3** | `PUT` | `/sales/quotations/{id}` | `sd:quotation:edit` | Sửa báo giá (kèm Snapshot Địa chỉ & PriceListId) | `UpdateSalesQuotationRequest` |
| **S25.3** | `POST` | `/sales/quotations/{id}/convert-to-order` | `sd:order:create` | Chuyển Báo giá sang Đơn bán (kế thừa nguyên vẹn Snapshot) | `ConvertQuotationResponse` |
| **S25.6** | `GET` | `/partners/{partnerId}/delivery-addresses` | `crm:partner:view` | Lấy danh sách địa chỉ đối tác (thêm `addressType`) | `DeliveryAddressDto[]` |
| **S25.6** | `POST` | `/partners/{partnerId}/delivery-addresses` | `crm:partner:create` | Thêm địa chỉ mới (nhận `addressType`, `isDefault`) | `SaveDeliveryAddressRequest` |
| **S25.6** | `PUT` | `/partners/{partnerId}/delivery-addresses/{id}` | `crm:partner:create` | Sửa địa chỉ (nhận `addressType`, `isDefault`) | `SaveDeliveryAddressRequest` |

### 4.2. Mã lỗi API thống nhất (Error Codes)

| HTTP Code | Error Code | Mô tả tiếng Việt |
| :--- | :--- | :--- |
| `404` | `error.sales.price_list_not_found` | Không tìm thấy bảng giá |
| `404` | `error.sales.price_list_version_not_found` | Không tìm thấy phiên bản bảng giá |
| `404` | `error.sales.price_list_item_not_found` | Không tìm thấy mặt hàng trong bảng giá |
| `400` | `error.sales.price_list_version_code_duplicate` | Mã phiên bản đã tồn tại trong bảng giá này |
| `400` | `error.sales.price_list_version_immutable` | Không thể chỉnh sửa phiên bản đã Kích hoạt hoặc Hết hạn |
| `400` | `error.sales.price_list_version_dates_invalid` | Ngày hết hạn phải lớn hơn ngày bắt đầu hiệu lực |
| `422` | `error.sales.no_active_price_list_version` | Không tìm thấy phiên bản bảng giá có hiệu lực cho ngày chứng từ |
| `400` | `error.sales.price_list_in_use_cannot_delete` | Không thể xóa bảng giá đang được sử dụng trong giao dịch |
| `404` | `error.crm.partner_not_found` | Không tìm thấy đối tác |
| `404` | `error.crm.delivery_address_not_found` | Không tìm thấy địa chỉ giao hàng |
| `422` | `error.crm.delivery_address_limit` | Mỗi đối tác chỉ được lưu tối đa 20 địa chỉ |

---

## 5. TIẾN ĐỘ THEO DÕI

| Mã | Trạng thái | Phụ trách chính | Hỗ trợ / Phối hợp | Trello Card |
| :--- | :--- | :--- | :--- | :--- |
| **S25.1** | Todo | **Lợi** (Dev chính BE) | Phúc | https://trello.com/c/U54wkZHg |
| **S25.2** | Todo | **Lợi** (Dev chính BE) | Phúc | https://trello.com/c/6ZVphKjm |
| **S25.3** | Todo | **Lợi** (Dev chính BE) | Phúc | https://trello.com/c/xscVHtTF |
| **S25.4** | Todo | **Thiện** (Dev chính FE) | Phúc | https://trello.com/c/Y7c6odZA |
| **S25.5** | Todo | **Thiện** (Dev chính FE) | Phúc | https://trello.com/c/w1zfY2i6 |
| **S25.6** | Todo | **Thiện** (Dev chính FE) | Phúc | https://trello.com/c/sIPU3Vqb |
| **S25.7** | Todo | **Phúc** (Lead nghiệm thu) | Thiện, Lợi | https://trello.com/c/G1eRfjBl |
