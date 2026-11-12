# [change] Step 25: Bảng giá chuẩn ERP (Bán/Mua, Thuế, Versioning) & Nâng cấp Địa chỉ Đối tác

> **Loại:** change
> **Ngày tạo:** 2026-11-13 · **Người làm:** Phúc (Lead/Hỗ trợ), Lợi (BE), Thiện (FE) · **Người yêu cầu:** Product Owner / Architect
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** [Plan Step 25](../plans/plan-step-25-enterprise-pricing-and-partner-address.md) · [Spec nghiệp vụ](../../docs/PRICING_AND_PARTNER_ADDRESS_ERP_SPEC.md) · Trello Board `sul5ncJg`
> **Phạm vi:** `ERPm-BE` (Sales, CRM, Domain, DB), `ERPm-FE` (SD, CRM)

## 1. Mô tả
- Chuẩn hóa phân hệ Bảng giá (Price Lists) theo chuẩn ERP doanh nghiệp:
  - Hỗ trợ Bảng giá Bán (Sales) vs Bảng giá Mua (Purchase / Vendor).
  - Khai báo rõ cơ chế thuế: Đã gồm thuế (`IsTaxInclusive = true`) vs Chưa gồm thuế (`IsTaxInclusive = false`).
  - Quản lý phiên bản 3 cấp (Header ➔ Version ➔ Items), hỗ trợ Clone Version và điều chỉnh giá hàng loạt (+X%, làm tròn).
  - Động cơ định giá (PricingEngine) tự động so khớp phiên bản Active tại ngày lập chứng từ và bóc tách thuế VAT.
- Chuẩn hóa danh bạ Địa chỉ Đối tác (Partner Delivery Addresses):
  - Phân loại `AddressType`: Giao hàng (`Shipping`), Hóa đơn (`Billing`), Trụ sở (`Office`), Khác (`General`).
  - Quản lý địa chỉ giao hàng mặc định (`isDefault = true`).
  - Tích hợp Snapshot Pattern vào Báo giá (`SalesQuotation`) và kế thừa nguyên vẹn sang Đơn bán (`SalesOrder`) khi convert, đảm bảo dữ liệu lịch sử không bị sai lệch.

## 2. Phân tích
- Trước đây:
  - `PriceLists` chỉ là bảng 1 cấp, chỉ dành cho Sales, chưa có thuộc tính phân loại Mua/Bán, thiếu cờ thuế `IsTaxInclusive`, và không có bảng `PriceListVersions` trung gian để quản lý hiệu lực theo kỳ.
  - `SalesQuotation` chưa có các trường Snapshot địa chỉ (`DeliveryAddressId`, `DeliveryRecipientName`, `DeliveryPhone`, `DeliveryAddressText`).
  - Danh bạ địa chỉ đối tác chưa phân định rõ địa chỉ giao hàng vs địa chỉ hóa đơn/trụ sở.

## 3. Features / Milestones
- [x] Feature 1 — Nghiên cứu & lập Đặc tả Nghiệp vụ chuẩn ERP (`docs/PRICING_AND_PARTNER_ADDRESS_ERP_SPEC.md`).
- [x] Feature 2 — Soạn thảo Kế hoạch triển khai & Hợp đồng API chi tiết (`.ai/plans/plan-step-25-enterprise-pricing-and-partner-address.md`).
- [x] Feature 3 — Phân rã 7 tasks chi tiết và assign đúng vai trò trên Trello (Lợi: BE, Thiện: FE, Phúc: Hỗ trợ & Verification).
- [ ] Feature 4 — [S25.1][BE] Nâng cấp Schema Database & Entity Bảng giá (PostgreSQL Migration).
- [ ] Feature 5 — [S25.2][BE] Động cơ định giá (PricingEngine) & Dịch vụ Phiên bản Bảng giá (Clone & Bulk Adjust).
- [ ] Feature 6 — [S25.3][BE] Tích hợp Địa chỉ Snapshot vào Báo giá & Convert to Order.
- [ ] Feature 7 — [S25.4][FE] Giao diện Quản lý Bảng giá & Phiên bản (Bán/Mua, Cờ thuế, Clone Version).
- [ ] Feature 8 — [S25.5][FE] Tích hợp Chọn Địa chỉ & Cờ giá Thuế trên Báo giá (Quotations).
- [ ] Feature 9 — [S25.6][FE] Nâng cấp Giao diện Địa chỉ Đối tác CRM (Phân loại AddressType & Mặc định).
- [ ] Feature 10 — [S25.7][QA] Kiểm thử tự động & Nghiệm thu toàn diện (dotnet test, npm test 100% pass).

## 4. Cách làm
- Tạo tài liệu đặc tả nghiệp vụ: `docs/PRICING_AND_PARTNER_ADDRESS_ERP_SPEC.md`.
- Tạo kế hoạch chi tiết kèm hợp đồng API: `.ai/plans/plan-step-25-enterprise-pricing-and-partner-address.md`.
- Tạo và assign cards Trello: `U54wkZHg`, `6ZVphKjm`, `xscVHtTF`, `Y7c6odZA`, `w1zfY2i6`, `sIPU3Vqb`, `G1eRfjBl`.

## 5. Kiểm tra
- Rà soát Hợp đồng API đảm bảo đầy đủ REST endpoints, DTO schema, Error Codes và Permissions.
- Kiểm tra Trello Board đảm bảo các cards đã nằm ở cột `Todo` và gán đúng thành viên.

## 6. Việc còn lại
- Chờ Lợi (BE) triển khai S25.1, S25.2, S25.3.
- Chờ Thiện (FE) triển khai S25.4, S25.5, S25.6.
- Phúc hỗ trợ giải quyết vướng mắc, code shared utilities và lead nghiệm thu S25.7.

## 7. Evidence và cập nhật
- Branch kế hoạch: `phuc/step-25-pricing-partner-address` (hoặc `phuc/ld5-sd-fe-server-paging`)
- Ngày cập nhật: 2026-11-13
