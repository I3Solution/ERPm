# 📑 KẾ HOẠCH MASTER STEP 22: PHÂN HỆ BÁN HÀNG & PHÂN PHỐI DOANH NGHIỆP (ENTERPRISE SD)

> **Mã Step:** Step 22  
> **Tên tính năng:** Chuyên sâu Phân hệ Bán hàng & Phân phối (Sales Quotations, Sales Orders, Pricing Policies, Sales Returns & B2B/B2C Operations)  
> **Người lập kế hoạch (Architect / Tech Lead):** Phúc  
> **Thực thi Backend:** Thiện  
> **Thực thi Frontend:** Lợi  
> **Mô hình phối hợp:** Contract-First Development (Áp dụng chuẩn mục 8 AGENTS.md)  
> **Tiền đề giả định:** Step 20 (IAM & Tổ chức đa cấp) và Step 21 (Notification Engine đa kênh) đã hoàn thành và merge `master`.

---

## 🎯 1. BỐI CẢNH & TẦM NHÌN (VISION & OBJECTIVES)

### 1.1. Hiện trạng sau Step 20 & Step 21:
- Hệ thống đã có cây tổ chức hoàn chỉnh (`Tập đoàn` -> `Công ty` -> `Chi nhánh` -> `Phòng ban` -> `Chức danh` -> `Nhân sự`).
- IAM Policy động với `DataScope` (`SELF`, `DEPARTMENT`, `DEPARTMENT_TREE`, `BRANCH`, `BRANCH_TREE`, `COMPANY`, `GROUP`).
- Notification Engine SignalR & Outbox Email đã sẵn sàng gửi thông báo thời gian thực khi có sự kiện nghiệp vụ.
- **Điểm nghẽn ở Module SD:** Hiện tại module SD mới chỉ có màn hình **POS bán lẻ nhanh** (`pos.component.ts`) kiêm trừ kho và ghi nhận hóa đơn. Doanh nghiệp B2B và chuỗi bán buôn/phân phối chưa thể vận hành vì:
  1. Thiếu quy trình **Báo giá (Sales Quotation)** gửi khách hàng trước khi ký hợp đồng/chốt đơn.
  2. Thiếu quy trình **Đơn bán hàng (Sales Order - SO)** chuẩn: đặt cọc, phê duyệt đơn, kiểm tra hạn mức tín dụng khách hàng (Credit Limit) và giữ chỗ tồn kho (Stock Reservation).
  3. Thiếu quản lý **Bảng giá (Price List)** linh hoạt (giá lẻ, giá sỉ, giá đại lý, chiết khấu theo số lượng).
  4. Thiếu quy trình **Hàng bán bị trả lại (Sales Return / Credit Memo)** khi khách đổi trả.
  5. Màn hình FE cho Sales Order và Sales Invoice chưa được dựng (mới chỉ có POS).

### 1.2. Mục tiêu của Step 22:
- Nâng cấp phân hệ SD thành **Giải pháp Quản lý Bán hàng & Phân phối Doanh nghiệp toàn diện** cho cả 2 mô hình:
  - **B2B (Bán buôn, Hợp đồng, Phân phối):** Báo giá -> Duyệt đơn -> Giữ tồn -> Giao hàng từng phần -> Hóa đơn & Công nợ.
  - **B2C (Bán lẻ, Chuỗi cửa hàng):** Tối ưu POS, tích hợp bảng giá khuyến mãi, in bill K80/A4/A5, tích hợp quét mã barcode.
- 100% tuân thủ **Contract-First**: BE và FE độc lập, FE dựng mock theo contract, BE dựng unit tests và logic.

---

## 🏗️ 2. PHÂN RÃ CÁC GIAI ĐOẠN (PHASES & SCOPE)

### 🏷️ Phase 22.1: Bảng giá & Chính sách giá (Price Lists & Pricing Policy)
- **Mục tiêu:** Cho phép định nghĩa nhiều bảng giá theo đối tượng khách hàng (Bán lẻ, Đại lý Cấp 1, Bán sỉ, VIP) và bảng giá theo thời vụ / chi nhánh.
- **Backend:**
  - Bảng `tbl_SD_PriceList` (Mã, Tên, Loại tiền tệ, Ngày bắt đầu, Ngày kết thúc, Chi nhánh áp dụng, Trạng thái kích hoạt).
  - Bảng `tbl_SD_PriceListItem` (Bảng giá, Sản phẩm, Đơn vị tính, Giá bán, Số lượng tối thiểu, Tỷ lệ chiết khấu).
  - Bổ sung `PriceListId` vào thông tin Đối tác/Khách hàng (`tbl_MD_Partner`).
  - Pricing Service: Tự động tính giá tối ưu nhất khi nhập sản phẩm vào đơn hàng dựa trên Khách hàng + Số lượng.
- **Frontend:**
  - Màn hình Quản lý Bảng giá: Danh sách bảng giá, Chi tiết cấu hình bảng giá (lưới sản phẩm, gán giá sỉ/lẻ, import/export Excel giá).

### 📝 Phase 22.2: Báo giá Khách hàng (Sales Quotations)
- **Mục tiêu:** Nhân viên kinh doanh lập báo giá gửi khách hàng, in PDF hoặc gửi email báo giá tự động, 1-click chuyển đổi thành Đơn bán hàng.
- **Backend:**
  - Bảng `tbl_SD_SalesQuotation` & `tbl_SD_SalesQuotationItem`.
  - Trạng thái: `Draft` (Nháp) -> `Sent` (Đã gửi khách) -> `Accepted` (Khách đồng ý) -> `Rejected` (Từ chối) -> `Converted` (Đã chuyển thành SO) -> `Expired` (Hết hạn).
  - API chuyển đổi tự động: `POST /api/v1/sales/quotations/{id}/convert-to-order`.
  - Tích hợp Step 21: Gửi email báo giá tự động đính kèm bản xem trước cho khách hàng.
- **Frontend:**
  - Màn hình Danh sách Báo giá (lọc theo trạng thái, nhân viên phụ trách, hạn báo giá).
  - Màn hình Lập/Sửa Báo giá (Responsive, hỗ trợ thêm nhanh sản phẩm, chọn bảng giá, ghi chú điều khoản thương mại).
  - Nút in báo giá khổ A4 chuyên nghiệp và nút "Chuyển thành Đơn bán".

### 📦 Phase 22.3: Đơn đặt hàng & Phê duyệt (Sales Orders & Approval Workflow)
- **Mục tiêu:** Quản lý vòng đời đơn bán hàng B2B, kiểm soát công nợ & tồn kho, phân quyền theo DataScope của Nhân viên kinh doanh.
- **Backend:**
  - Nâng cấp `SalesOrder`: Gán `SalespersonId` (Nhân viên phụ trách - HRM), `PriceListId`, `DeliveryAddress`, `ExpectedDeliveryDate`, `CreditCheckStatus`.
  - Cơ chế **Kiểm tra Hạn mức công nợ (Credit Limit Check)**: Nếu công nợ hiện tại + giá trị đơn > Hạn mức nợ của khách hàng, cảnh báo hoặc bắt buộc Trưởng phòng/Kế toán duyệt (`sd:order:approve_credit`).
  - Cơ chế **Giữ chỗ kho (Stock Reservation)**: Khi đơn sang trạng thái `Confirmed`, hệ thống tạm khóa số lượng tồn khả dụng (Available = OnHand - Reserved) để tránh bán âm.
  - Vòng đời: `Draft` -> `PendingApproval` -> `Confirmed` -> `Processing` -> `Completed` -> `Cancelled`.
- **Frontend:**
  - Màn hình Quản lý Đơn bán hàng: Lưới dữ liệu chuyên nghiệp (Desktop) & Card xem nhanh (Mobile).
  - Màn hình Chi tiết Đơn bán hàng: Trạng thái trực quan dạng Stepper, cảnh báo công nợ màu đỏ/vàng, tab Lịch sử xử lý đơn, tab Giữ tồn kho.
  - Nút thao tác: "Gửi duyệt", "Phê duyệt đơn", "Tạo hóa đơn/Giao hàng", "Hủy đơn".

### 🔄 Phase 22.4: Trả hàng bán & Giảm trừ công nợ (Sales Returns & Credit Memos)
- **Mục tiêu:** Xử lý trường hợp khách hàng trả lại hàng hóa do lỗi kỹ thuật hoặc đổi sản phẩm.
- **Backend:**
  - Bảng `tbl_SD_SalesReturn` & `tbl_SD_SalesReturnItem`.
  - Liên kết ngược tới `SalesInvoiceId` gốc (hoặc cho phép trả hàng không hóa đơn kèm lý do).
  - Tự động sinh Phiếu nhập kho hoàn hàng (Stock Receipt) và sinh Bút toán giảm trừ doanh thu/công nợ (Nợ 521 / Có 131 hoặc Hoàn tiền mặt Nợ 521 / Có 111).
- **Frontend:**
  - Màn hình Danh sách & Tạo Phiếu Trả hàng bán.
  - Chọn hóa đơn gốc -> Chọn sản phẩm trả & số lượng trả -> Tự động tính tiền hoàn trả.

### 📈 Phase 22.5: Báo cáo Doanh số & KPI Bán hàng (Sales Analytics & Reporting)
- **Mục tiêu:** Giúp Quản lý & Giám đốc theo dõi sức khỏe kinh doanh tức thời.
- **Backend:**
  - Dapper Queries hiệu năng cao cho Dashboard kinh doanh:
    - Doanh thu theo Nhân viên kinh doanh (Sales Rep Performance).
    - Doanh thu theo Chi nhánh & Phòng ban (Branch/Department Breakdown).
    - Top sản phẩm bán chạy nhất & Tỷ lệ hoàn tất đơn hàng (Fulfillment Rate).
- **Frontend:**
  - Dashboard Bán hàng trực quan (biểu đồ đường, cột, phễu chuyển đổi từ Báo giá -> Đơn hàng -> Hóa đơn).

---

## 📡 3. BẢNG API CONTRACTS (CONTRACT-FIRST SPECIFICATIONS)

> **Ghi chú cho Lợi (FE):** Dùng trực tiếp Request/Response DTO dưới đây để tạo TypeScript Interfaces và Mock Services.  
> **Ghi chú cho Thiện (BE):** Triển khai Controller, DTO và Validation theo đúng định dạng cam kết dưới đây.

### 3.1. Phân hệ Bảng giá (Price Lists)
| Endpoint | Method | Quyền (Permission) | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/sales/price-lists` | `GET` | `sd:pricelist:view` | Danh sách bảng giá (lọc chi nhánh, hiệu lực) |
| `/api/v1/sales/price-lists/{id}` | `GET` | `sd:pricelist:view` | Chi tiết bảng giá kèm danh sách mặt hàng |
| `/api/v1/sales/price-lists` | `POST` | `sd:pricelist:create` | Tạo bảng giá mới |
| `/api/v1/sales/price-lists/{id}` | `PUT` | `sd:pricelist:edit` | Cập nhật bảng giá |
| `/api/v1/sales/price-lists/{id}/items` | `POST` | `sd:pricelist:edit` | Cập nhật hàng loạt danh mục giá sản phẩm |

**Request DTO Mẫu (`CreatePriceListRequest`):**
```json
{
  "code": "PL-WHOLESALE-2026",
  "name": "Bảng giá bán buôn Đại lý Cấp 1",
  "currency": "VND",
  "effectiveFrom": "2026-01-01T00:00:00Z",
  "effectiveTo": "2026-12-31T23:59:59Z",
  "branchId": null,
  "isActive": true,
  "items": [
    {
      "itemId": 105,
      "unitPrice": 185000.0000,
      "minQuantity": 10.0000,
      "discountPercent": 5.0000
    }
  ]
}
```

### 3.2. Phân hệ Báo giá (Sales Quotations)
| Endpoint | Method | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/sales/quotations` | `GET` | `sd:quotation:view` | Danh sách báo giá (hỗ trợ DataScope) |
| `/api/v1/sales/quotations/{id}` | `GET` | `sd:quotation:view` | Chi tiết báo giá |
| `/api/v1/sales/quotations` | `POST` | `sd:quotation:create` | Lập báo giá mới |
| `/api/v1/sales/quotations/{id}/send-email` | `POST` | `sd:quotation:edit` | Gửi email báo giá cho khách (tích hợp Step 21) |
| `/api/v1/sales/quotations/{id}/convert-to-order` | `POST` | `sd:order:create` | Chuyển báo giá thành Đơn bán hàng |

**Response DTO Mẫu (`SalesQuotationDto`):**
```json
{
  "id": 12,
  "externalId": "018f3a5b-9c2d-7841-a123-456789abcdef",
  "quotationNumber": "BG-2026-0012",
  "quotationDate": "2026-11-01T08:00:00Z",
  "validUntil": "2026-11-15T23:59:59Z",
  "customerId": 88,
  "customerName": "Công ty TNHH Hoàng Long",
  "salespersonId": 14,
  "salespersonName": "Nguyễn Văn Kinh Doanh",
  "branchId": 2,
  "departmentId": 5,
  "status": "Sent",
  "subTotal": 50000000.0000,
  "discountAmount": 2500000.0000,
  "taxAmount": 4750000.0000,
  "totalAmount": 52250000.0000,
  "items": [
    {
      "id": 1,
      "itemId": 105,
      "itemCode": "ITM00105",
      "itemName": "Màn hình Dell UltraSharp 27 inch",
      "unitName": "Cái",
      "quantity": 5.0000,
      "unitPrice": 10000000.0000,
      "discountAmount": 500000.0000,
      "lineTotal": 49500000.0000
    }
  ]
}
```

### 3.3. Phân hệ Đơn bán hàng (Sales Orders)
| Endpoint | Method | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/sales/orders` | `GET` | `sd:order:view` | Danh sách đơn hàng (Filter status, branch, date, staff) |
| `/api/v1/sales/orders/{id}` | `GET` | `sd:order:view` | Chi tiết đơn hàng |
| `/api/v1/sales/orders` | `POST` | `sd:order:create` | Tạo đơn hàng mới |
| `/api/v1/sales/orders/{id}` | `PUT` | `sd:order:edit` | Sửa đơn hàng (khi ở trạng thái Draft) |
| `/api/v1/sales/orders/{id}/confirm` | `POST` | `sd:order:confirm` | Xác nhận đơn hàng & giữ chỗ kho |
| `/api/v1/sales/orders/{id}/approve-credit` | `POST` | `sd:order:approve_credit` | Duyệt vượt hạn mức nợ (Trưởng phòng/Kế toán) |
| `/api/v1/sales/orders/{id}/cancel` | `POST` | `sd:order:cancel` | Hủy đơn hàng & nhả tồn kho giữ chỗ |
| `/api/v1/sales/orders/{id}/create-invoice` | `POST` | `sd:invoice:create` | Xuất hóa đơn / phiếu giao hàng từ đơn bán |

**Mã lỗi nghiệp vụ (Error Codes) bắt buộc:**
- `error.sd.quotation_expired`: Báo giá đã hết hạn hiệu lực.
- `error.sd.quotation_already_converted`: Báo giá này đã được chuyển thành đơn bán hàng trước đó.
- `error.sd.credit_limit_exceeded`: Khách hàng vượt quá hạn mức công nợ cho phép.
- `error.sd.insufficient_available_stock`: Không đủ tồn kho khả dụng để giữ chỗ.
- `error.sd.order_invalid_status_for_action`: Trạng thái đơn không hợp lệ để thực hiện thao tác.
- `error.sd.cannot_cancel_invoiced_order`: Không thể hủy đơn hàng đã xuất hóa đơn giao hàng.

---

## 👥 4. PHÂN CÔNG NHIỆM VỤ RACI & CONTRACT-FIRST

### 4.1. Phúc (Tech Lead / Architect):
- [ ] Chốt toàn bộ kiến trúc, API Contract và tài liệu Step 22.
- [ ] Khởi tạo danh sách Card Trello cho Phase 22.1 -> 22.5, phân công rõ ràng cho Thiện và Lợi.
- [ ] Review PR của Thiện (BE) và Lợi (FE).
- [ ] Chịu trách nhiệm merge vào nhánh `master` sau khi toàn bộ verify pass.

### 4.2. Thiện (Backend Developer):
- **Nhánh đề xuất:** `thien/s22-sd-backend`
- [ ] **BE-22.1:** Thiết kế Migration bảng `tbl_SD_PriceList`, `tbl_SD_PriceListItem`, bổ sung quan hệ Partner.
- [ ] **BE-22.2:** Service & Controller Bảng giá + Tự động tính giá tối ưu (Pricing Engine).
- [ ] **BE-22.3:** Entity, Migration, Service & Controller Báo giá (`tbl_SD_SalesQuotation`) + Chuyển đổi sang Sales Order.
- [ ] **BE-22.4:** Nâng cấp `SalesOrder`: Logic Giữ chỗ kho (`StockReservation`), Kiểm tra hạn mức nợ (`CreditLimitCheck`), Tích hợp Step 21 Notification khi duyệt đơn.
- [ ] **BE-22.5:** Entity & Service Trả hàng bán (`tbl_SD_SalesReturn`) + Bút toán hạch toán tự động (521/131/156/632).
- [ ] **BE-22.6:** Unit Tests & Verification Tests trong `ERPm.Verification` (Cam kết 100% pass, 0 warning).

### 4.3. Lợi (Frontend Developer):
- **Nhánh đề xuất:** `loi/s22-sd-frontend`
- [ ] **FE-22.1:** Dựng TypeScript Interfaces & Mock Services bám sát 100% API Contract (không phụ thuộc BE).
- [ ] **FE-22.2:** Màn hình Quản lý Bảng giá (Danh sách, Tạo/Sửa bảng giá, Lưới phân cấp số lượng sỉ/lẻ).
- [ ] **FE-22.3:** Màn hình Quản lý Báo giá: Danh sách, Form lập báo giá chuyên nghiệp, Nút In PDF A4 & Nút Chuyển đơn.
- [ ] **FE-22.4:** Màn hình Quản lý Đơn bán hàng (Sales Order):
  - Danh sách Đơn bán hàng (Responsive Desktop/Mobile, Lọc trạng thái, Chi nhánh, Nhân viên).
  - Chi tiết Đơn bán hàng (Status Stepper, Cảnh báo công nợ, Nút Xác nhận/Duyệt nợ/Hủy đơn).
- [ ] **FE-22.5:** Màn hình Trả hàng bán (Sales Returns): Chọn đơn/hóa đơn gốc, nhập số lượng trả, hiển thị tiền hoàn.
- [ ] **FE-22.6:** Màn hình In ấn hóa đơn & Báo giá chuẩn (Template K80, A4, A5).
- [ ] **FE-22.7:** Từ điển VI/EN đầy đủ cho toàn bộ phân hệ SD mới.
- [ ] **FE-22.8:** Đổi cờ kết nối từ Mock sang API thật khi Thiện hoàn thành.

---

## 📅 5. LỘ TRÌNH TRIỂN KHAI DỰ KIẾN (TIMELINE)

```
Tuần 1: Phase 22.1 (Bảng giá) & Phase 22.2 (Báo giá)
├── Thiện: DB Migration, Pricing Service, Quotation CRUD, API Convert
└── Lợi: Mock Data, UI Bảng giá, UI Báo giá & Form in ấn

Tuần 2: Phase 22.3 (Đơn bán hàng & Phê duyệt hạn mức nợ / Giữ tồn kho)
├── Thiện: Stock Reservation Logic, Credit Limit Approval, Notification Trigger
└── Lợi: Sales Order Management UI, Approval Modal, Status Stepper

Tuần 3: Phase 22.4 (Trả hàng bán) & Phase 22.5 (Báo cáo & Tích hợp hoàn thiện)
├── Thiện: Sales Return Posting, Verification Tests đạt 100%
├── Lợi: Sales Return UI, Báo cáo Sales Dashboard, Kết nối API thật
└── Phúc: Review tổng thể, Kiểm thử E2E Playwright, Merge master
```

---

## ✅ 6. TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

1. **Backend:**
   - `dotnet build` đạt 0 cảnh báo, 0 lỗi.
   - Thêm đầy đủ Verification tests cho toàn bộ luồng: Báo giá -> Đơn bán -> Giữ tồn kho -> Kiểm tra nợ -> Trả hàng.
   - Đảm bảo tính nhất quán dữ liệu kế toán kép và tồn kho nguyên tử.
2. **Frontend:**
   - `npm run build` đạt 0 lỗi.
   - Toàn bộ Form sử dụng `FormGroup` + `<app-form-control>`/`<app-input-control>`.
   - Responsive hoàn hảo trên cả Mobile (Ionic tab/card) và Desktop (Lưới dữ liệu, Toolbar).
3. **IAM & Bảo mật:**
   - Phân quyền chặt chẽ với các permission mới (`sd:pricelist:*`, `sd:quotation:*`, `sd:order:*`, `sd:order:approve_credit`, `sd:return:*`).
   - Tôn trọng triệt để `DataScope` của nhân viên bán hàng (chỉ thấy đơn của mình nếu gán scope `SELF`).
