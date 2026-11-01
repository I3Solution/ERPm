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

## 📡 3. BẢNG API CONTRACTS CHUẨN HÓA (CONTRACT-FIRST SPECIFICATIONS)

> **CHỐT KIẾN TRÚC & HỢP ĐỒNG (ARCHITECT SIGN-OFF):**  
> Bản hợp đồng dưới đây là **Cam kết bất biến (Immutable Contract)** giữa Backend và Frontend cho toàn bộ Step 22.  
> - **Lợi (FE):** Dùng trực tiếp các TypeScript Interface và DTO mẫu dưới đây để tạo `sd.models.ts` và `sd-mock.service.ts`. Dựng xong 100% UI mà không cần chờ Backend.  
> - **Thiện (BE):** Triển khai Controller, DTO, FluentValidation và Service logic trả về cấu trúc JSON đúng 100% như cam kết.

---

### 3.0. Quy chuẩn chung (Global Contract Standards)

1. **ApiResponse Wrapper:**
```typescript
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}
```

2. **Phân trang chuẩn (Pagination):**
```typescript
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}
```

3. **Kiểu dữ liệu & Quy ước:**
   - Số tiền và số lượng: Bắt buộc `decimal(18, 4)` (TypeScript biểu diễn bằng `number`).
   - Thời gian: Bắt buộc định dạng ISO 8601 UTC `YYYY-MM-DDTHH:mm:ssZ`.
   - Khóa ID: `id` (int nội bộ dùng cho quan hệ FK/database), `externalId` (UUIDv7 string dùng cho tích hợp ngoài).

---

### 3.1. Phân hệ Bảng giá & Tính giá (Price Lists & Pricing Engine)

#### 3.1.1. Bảng Endpoints
| Endpoint | Method | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/sales/price-lists` | `GET` | `sd:pricelist:view` | Lấy danh sách bảng giá phân trang |
| `/api/v1/sales/price-lists/{id}` | `GET` | `sd:pricelist:view` | Lấy chi tiết bảng giá kèm danh mục mặt hàng |
| `/api/v1/sales/price-lists` | `POST` | `sd:pricelist:create` | Tạo bảng giá mới |
| `/api/v1/sales/price-lists/{id}` | `PUT` | `sd:pricelist:edit` | Cập nhật thông tin bảng giá |
| `/api/v1/sales/price-lists/{id}` | `DELETE` | `sd:pricelist:delete` | Xóa bảng giá (chỉ khi chưa phát sinh đơn bán) |
| `/api/v1/sales/price-lists/calculate-price` | `POST` | `sd:order:view` | **Tính giá tự động** tối ưu theo Khách hàng + Số lượng |

#### 3.1.2. TypeScript Interfaces & DTO Mẫu
```typescript
export interface PriceListItemDto {
  id?: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  unitName?: string;
  unitPrice: number;            // decimal(18, 4)
  minQuantity: number;          // decimal(18, 4) - bậc thang số lượng
  discountPercent: number;      // decimal(18, 4)
}

export interface PriceListDetailDto {
  id: number;
  externalId: string;
  code: string;
  name: string;
  currency: string;
  effectiveFrom: string;        // ISO UTC
  effectiveTo?: string;         // ISO UTC
  branchId?: number;
  branchName?: string;
  isActive: boolean;
  notes?: string;
  items: PriceListItemDto[];
}

export interface CreatePriceListRequest {
  code: string;
  name: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  branchId?: number;
  isActive: boolean;
  notes?: string;
  items: {
    itemId: number;
    unitPrice: number;
    minQuantity: number;
    discountPercent: number;
  }[];
}

// API Tính giá tự động
export interface CalculatePriceRequest {
  customerId?: number;
  branchId: number;
  items: {
    itemId: number;
    quantity: number;
  }[];
}

export interface CalculatePriceResponse {
  items: {
    itemId: number;
    appliedPriceListId?: number;
    appliedPriceListName?: string;
    originalPrice: number;
    unitPrice: number;          // Giá sau bảng giá/bậc thang
    discountPercent: number;
    discountAmount: number;
    lineTotal: number;
  }[];
}
```

---

### 3.2. Phân hệ Báo giá Khách hàng (Sales Quotations)

#### 3.2.1. Bảng Endpoints
| Endpoint | Method | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/sales/quotations` | `GET` | `sd:quotation:view` | Danh sách báo giá (lọc trạng thái, nhân viên, ngày) |
| `/api/v1/sales/quotations/{id}` | `GET` | `sd:quotation:view` | Chi tiết báo giá |
| `/api/v1/sales/quotations` | `POST` | `sd:quotation:create` | Lập báo giá mới |
| `/api/v1/sales/quotations/{id}` | `PUT` | `sd:quotation:edit` | Sửa báo giá (chỉ khi Draft hoặc Sent) |
| `/api/v1/sales/quotations/{id}/send-email` | `POST` | `sd:quotation:edit` | Gửi email báo giá (tích hợp Step 21 Outbox) |
| `/api/v1/sales/quotations/{id}/convert-to-order` | `POST` | `sd:order:create` | **1-Click** chuyển đổi Báo giá thành Đơn bán hàng |

#### 3.2.2. TypeScript Interfaces & DTO Mẫu
```typescript
export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Converted' | 'Expired';

export interface SalesQuotationItemDto {
  id?: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  unitName?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  notes?: string;
}

export interface SalesQuotationDetailDto {
  id: number;
  externalId: string;
  quotationNumber: string;      // BG-YYYYMM-XXXX
  quotationDate: string;
  validUntil: string;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  salespersonId?: number;
  salespersonName?: string;
  branchId: number;
  branchName: string;
  departmentId?: number;
  status: QuotationStatus;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  termsAndConditions?: string;  // Điều khoản thương mại
  convertedSalesOrderId?: number;
  items: SalesQuotationItemDto[];
}

export interface CreateSalesQuotationRequest {
  quotationDate: string;
  validUntil: string;
  customerId: number;
  branchId: number;
  departmentId?: number;
  salespersonId?: number;
  priceListId?: number;
  termsAndConditions?: string;
  items: {
    itemId: number;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    notes?: string;
  }[];
}
```

---

### 3.3. Phân hệ Đơn đặt hàng B2B (Sales Orders)

#### 3.3.1. Bảng Endpoints
| Endpoint | Method | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/sales/orders` | `GET` | `sd:order:view` | Danh sách đơn hàng (hỗ trợ DataScope SELF/DEPT/BRANCH) |
| `/api/v1/sales/orders/{id}` | `GET` | `sd:order:view` | Chi tiết đơn hàng |
| `/api/v1/sales/orders` | `POST` | `sd:order:create` | Tạo đơn bán hàng mới |
| `/api/v1/sales/orders/{id}` | `PUT` | `sd:order:edit` | Sửa đơn hàng (khi ở trạng thái Draft) |
| `/api/v1/sales/orders/{id}/confirm` | `POST` | `sd:order:confirm` | **Xác nhận đơn**: Kích hoạt Giữ chỗ kho + Kiểm tra nợ |
| `/api/v1/sales/orders/{id}/approve-credit` | `POST` | `sd:order:approve_credit` | **Duyệt vượt hạn mức nợ** (Trưởng phòng/Kế toán) |
| `/api/v1/sales/orders/{id}/cancel` | `POST` | `sd:order:cancel` | Hủy đơn và **nhả tồn kho giữ chỗ** |
| `/api/v1/sales/orders/{id}/create-invoice` | `POST` | `sd:invoice:create` | Sinh Hóa đơn xuất kho từ Đơn bán |

#### 3.3.2. TypeScript Interfaces & DTO Mẫu
```typescript
export type SalesOrderStatus = 'Draft' | 'PendingApproval' | 'Confirmed' | 'Processing' | 'Completed' | 'Cancelled';
export type CreditCheckStatus = 'Passed' | 'Warning' | 'PendingApproval' | 'Overridden';
export type ReservationStatus = 'None' | 'Reserved' | 'Released';

export interface SalesOrderItemDto {
  id?: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  unitName?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  invoicedQuantity: number;     // Số lượng đã xuất hóa đơn
}

export interface SalesOrderDetailDto {
  id: number;
  externalId: string;
  orderNumber: string;          // SO-YYYYMM-XXXX
  orderDate: string;
  expectedDeliveryDate?: string;
  quotationId?: number;
  quotationNumber?: string;
  customerId: number;
  customerName: string;
  deliveryAddress?: string;
  salespersonId?: number;
  salespersonName?: string;
  branchId: number;
  branchName: string;
  departmentId?: number;
  status: SalesOrderStatus;
  creditCheckStatus: CreditCheckStatus;
  reservationStatus: ReservationStatus;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  items: SalesOrderItemDto[];
}

export interface CreateSalesOrderRequest {
  orderDate: string;
  expectedDeliveryDate?: string;
  quotationId?: number;
  customerId: number;
  deliveryAddress?: string;
  branchId: number;
  departmentId?: number;
  salespersonId?: number;
  notes?: string;
  items: {
    itemId: number;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
  }[];
}

export interface ApproveCreditRequest {
  reason: string;
}

export interface CancelOrderRequest {
  reason: string;
}

export interface CreateInvoiceFromOrderRequest {
  warehouseId: number;
  paymentMethod: number;        // 1=Cash, 2=BankTransfer, 3=Debt
  tenderedAmount: number;
  notes?: string;
}
```

---

### 3.4. Phân hệ Trả hàng bán (Sales Returns & Credit Memos)

#### 3.4.1. Bảng Endpoints
| Endpoint | Method | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/sales/returns` | `GET` | `sd:return:view` | Danh sách phiếu trả hàng |
| `/api/v1/sales/returns/{id}` | `GET` | `sd:return:view` | Chi tiết phiếu trả hàng |
| `/api/v1/sales/returns` | `POST` | `sd:return:create` | Lập phiếu trả hàng: Tự động nhập kho + Bút toán đảo |

#### 3.4.2. TypeScript Interfaces & DTO Mẫu
```typescript
export interface SalesReturnItemDto {
  id?: number;
  invoiceItemId?: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  unitName?: string;
  returnQuantity: number;
  unitPrice: number;
  refundAmount: number;
  reason?: string;
}

export interface SalesReturnDetailDto {
  id: number;
  externalId: string;
  returnNumber: string;         // SR-YYYYMM-XXXX
  returnDate: string;
  invoiceId?: number;
  invoiceNumber?: string;
  customerId: number;
  customerName: string;
  branchId: number;
  warehouseId: number;
  totalRefundAmount: number;
  refundMethod: number;         // 1=Cash, 2=BankTransfer, 3=ReduceDebt
  status: string;               // Posted
  stockReceiptId?: number;      // Phiếu nhập kho hoàn hàng
  journalEntryId?: number;      // Bút toán đảo nợ 521/131/156/632
  notes?: string;
  items: SalesReturnItemDto[];
}

export interface CreateSalesReturnRequest {
  invoiceId?: number;
  customerId: number;
  branchId: number;
  warehouseId: number;
  refundMethod: number;
  reason: string;
  items: {
    invoiceItemId?: number;
    itemId: number;
    quantity: number;
    unitPrice: number;
    reason?: string;
  }[];
}
```

---

### 3.5. Phân hệ Báo cáo & KPI Bán hàng (Sales Analytics)

#### 3.5.1. Bảng Endpoints
| Endpoint | Method | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `/api/v1/sales/analytics/summary` | `GET` | `sd:report:view` | Tổng quan doanh số, lợi nhuận gộp, số đơn |
| `/api/v1/sales/analytics/salesperson-kpi` | `GET` | `sd:report:view` | Hiệu suất kinh doanh theo từng nhân sự |
| `/api/v1/sales/analytics/funnel` | `GET` | `sd:report:view` | Phễu bán hàng (Báo giá -> Đơn bán -> Hóa đơn) |

#### 3.5.2. TypeScript Interfaces & DTO Mẫu
```typescript
export interface SalesSummaryDto {
  totalRevenue: number;         // Tổng doanh số
  totalCost: number;            // Tổng giá vốn
  grossProfit: number;          // Lợi nhuận gộp
  grossMarginPercent: number;   // Tỷ suất LN gộp (%)
  totalOrders: number;          // Số lượng đơn hàng
  completedOrders: number;
  cancelledOrders: number;
}

export interface SalespersonKpiDto {
  salespersonId: number;
  salespersonName: string;
  departmentName?: string;
  totalOrders: number;
  totalRevenue: number;
  targetRevenue?: number;
  completionRatePercent?: number;
}

export interface SalesFunnelDto {
  quotationCount: number;
  quotationTotalAmount: number;
  orderCount: number;
  orderTotalAmount: number;
  invoiceCount: number;
  invoiceTotalAmount: number;
  conversionRatePercent: number; // Tỷ lệ chuyển đổi BG -> SO
}
```

---

### 3.6. Danh mục Mã lỗi chuẩn (Error Codes Specification)

| Mã lỗi (Error Code) | Thông điệp Tiếng Việt (Default VI) | Thông điệp Tiếng Anh (Default EN) |
| :--- | :--- | :--- |
| `error.sd.quotation_expired` | Báo giá đã quá hạn hiệu lực, không thể chuyển thành đơn bán. | Quotation has expired and cannot be converted. |
| `error.sd.quotation_already_converted` | Báo giá này đã được chuyển thành đơn bán hàng trước đó. | This quotation has already been converted to an order. |
| `error.sd.credit_limit_exceeded` | Khách hàng vượt quá hạn mức công nợ cho phép. Cần phê duyệt. | Customer credit limit exceeded. Approval required. |
| `error.sd.insufficient_available_stock` | Tồn kho khả dụng không đủ để giữ chỗ cho đơn hàng. | Insufficient available stock for reservation. |
| `error.sd.order_invalid_status_for_action` | Trạng thái đơn hàng không hợp lệ với thao tác yêu cầu. | Invalid order status for the requested action. |
| `error.sd.cannot_cancel_invoiced_order` | Không thể hủy đơn hàng đã xuất hóa đơn giao hàng. | Cannot cancel an order that has already been invoiced. |
| `error.sd.return_quantity_exceeds_invoiced` | Số lượng trả lại vượt quá số lượng đã mua trên hóa đơn. | Return quantity exceeds invoiced quantity. |
| `error.sd.pricelist_duplicate_code` | Mã bảng giá đã tồn tại trong hệ thống. | Price list code already exists. |

---

---

## 👥 4. PHÂN CÔNG NHIỆM VỤ RACI & CONTRACT-FIRST

### 4.1. Phúc (Tech Lead / Architect):
- [x] **Task S22.0.1 Chốt toàn bộ kiến trúc, API Contract và tài liệu Step 22.** (Hoàn thành 2026-11-01).
- [x] **Khởi tạo danh sách 11 Card Trello cho Phase 22.1 -> 22.5, phân công rõ ràng cho Thiện và Lợi kèm Checklist.** (Hoàn thành 2026-11-01).
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

