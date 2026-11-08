# 📑 KẾ HOẠCH MASTER STEP 23: TỐI ƯU TRẢI NGHIỆM NGƯỜI DÙNG (UX), REFACTOR MASTER ITEM, CRM & ĐƠN BÁN HÀNG

> **Mã Step:** Step 23  
> **Tên tính năng:** UX Refactor, Master Item Enhancement, CRM Delivery Addresses, Sales Order UX & Pricing/Return Market Spike  
> **Người lập kế hoạch & Phụ trách Shared/Branch/Item:** Phúc (Tech Lead)  
> **Phụ trách Backend (CRM & SD Core):** Thiện  
> **Phụ trách Frontend (CRM & SD UI):** Lợi  
> **Thời điểm khởi tạo:** 2026-11-07  

---

## 🎯 1. BỐI CẢNH & MỤC TIÊU (OBJECTIVES)

Dựa trên phản hồi thực tế từ quá trình vận hành thử nghiệm và chuẩn hóa quy trình bán hàng ERP, Step 23 tập trung xử lý các điểm nghẽn then chốt về trải nghiệm người dùng (UX), cấu trúc dữ liệu cơ sở (Item, Kho, Chi nhánh), thông tin khách hàng đa địa chỉ và tiện ích thao tác đơn bán hàng.

### Các mục tiêu cốt lõi:
1. **Trải nghiệm Popup / Modal:** Chấm dứt tình trạng vô tình bấm ra ngoài nền (backdrop) làm mất dữ liệu nhập dở; các form lớn chuyển hẳn sang trang riêng (Full Page Navigation) có nút Back chuẩn.
2. **Component dùng chung:** Xây dựng bộ Dialog tương tác chuyên nghiệp (`Confirm`, `Info`, `Warning`, `Error`) và Component `<app-async-select>` phục vụ tìm kiếm dữ liệu lớn từ xa.
3. **Cơ cấu tổ chức & Kho:** Thêm loại `Warehouse` (Kho) vào cây tổ chức `Branch` để thống nhất phân quyền và quản lý địa bàn.
4. **Refactor Item:** Quản lý giá bán, giá mua và thuế suất VAT trực tiếp trên danh mục mặt hàng.
5. **CRM (Khách hàng/Đối tác):** Mở form dạng trang riêng; quản lý nhiều địa chỉ giao hàng cho 1 khách hàng; checkbox "Không giới hạn hạn mức công nợ".
6. **Đơn bán hàng (Sales Order):** Nút tắt chuyển nhanh sang trang khách hàng; tự động nạp địa chỉ giao hàng; async search sản phẩm; quét/chọn trùng sản phẩm thì tự động cộng dồn số lượng; chọn ngày giờ giao hàng chi tiết; icon xóa màu đỏ; tính thuế VAT và format tiền tệ chuẩn.
7. **Nghiên cứu thị trường & Kế hoạch lại:** Khảo sát thực tế luồng Trả hàng bán (Sales Return) và tái cấu trúc Bảng giá & Chiết khấu.

---

## 👥 2. PHÂN CÔNG TRÁCH NHIỆM (RACI)

```
STEP 23 TASK ALLOCATION
│
├── 🅰️ PHÚC (Tech Lead): Component dùng chung, Branch/Kho & Refactor Item
│   ├── S23.0.1: Component Dialog chuẩn hóa (Confirm, Info, Warning, Error)
│   ├── S23.0.2: Component Search Select Async & Nút Back trang chuẩn
│   ├── S23.0.3: Chuẩn hóa Modal/Popup: Full page hoặc Chặn Backdrop Dismiss
│   ├── S23.1.1: Bổ sung OrgUnitType Kho (Warehouse) trên Cây tổ chức Branch
│   └── S23.1.2: Refactor Master Item: Bổ sung Thuế suất (VAT), Giá bán, Giá mua
│
├── 🅱️ THIỆN (Backend Developer): CRM Delivery Addresses, SD VAT & Pricing Spike
│   ├── S23.2.1: Entity & Migration: Nhiều địa chỉ giao hàng và Checkbox không giới hạn nợ
│   ├── S23.2.2: API CRUD Địa chỉ giao hàng đối tác & Validate hạn mức nợ
│   ├── S23.3.1: Nâng cấp API Đơn bán: Tính thuế VAT theo Item & Hỗ trợ Giờ:Phút giao hàng
│   └── S23.4.1: Nghiên cứu thị trường quy trình Trả hàng bán & Thiết kế lại Bảng giá/Chiết khấu
│
└── 🅲️ LỢI (Frontend Developer): CRM Form/Addresses & Sales Order UX
    ├── S23.2.3: Màn hình Khách hàng: Chuyển sang Trang riêng & Quản lý nhiều Địa chỉ giao hàng
    ├── S23.2.4: Checkbox không giới hạn hạn mức nợ trên Form Khách hàng
    ├── S23.3.2: Cải tiến Form Đơn bán: Nút nhảy tới trang KH & Auto-load địa chỉ giao hàng
    ├── S23.3.3: Cải tiến Chọn sản phẩm: Async Search, Cộng dồn số lượng khi SP trùng
    └── S23.3.4: Hoàn thiện UI Đơn bán: Format tiền, Icon xóa đỏ, Thuế VAT, Giờ phút giao hàng
```

---

## 📡 3. BẢNG API CONTRACTS STEP 23 (CONTRACT-FIRST)

### 3.1. Phân hệ CRM: Nhiều địa chỉ giao hàng & Hạn mức nợ
- **Endpoints:**
  - `GET /api/v1/partners/{partnerId}/delivery-addresses` (View danh sách địa chỉ giao)
  - `POST /api/v1/partners/{partnerId}/delivery-addresses` (Thêm địa chỉ giao)
  - `PUT /api/v1/partners/{partnerId}/delivery-addresses/{id}` (Sửa địa chỉ)
  - `DELETE /api/v1/partners/{partnerId}/delivery-addresses/{id}` (Xóa địa chỉ)
  - `POST /api/v1/partners/{partnerId}/delivery-addresses/{id}/set-default` (Đặt làm mặc định)

**DTO Mẫu (`PartnerDeliveryAddressDto`):**
```typescript
export interface PartnerDeliveryAddressDto {
  id: number;
  partnerId: number;
  recipientName: string;
  phone: string;
  address: string;
  city?: string;
  district?: string;
  ward?: string;
  isDefault: boolean;
  notes?: string;
}

export interface CreateDeliveryAddressRequest {
  recipientName: string;
  phone: string;
  address: string;
  city?: string;
  district?: string;
  ward?: string;
  isDefault: boolean;
  notes?: string;
}
```

- **Thay đổi trên Partner DTO:**
```typescript
// Bổ sung vào PartnerDto và UpdatePartnerRequest:
isUnlimitedCredit: boolean; // Nếu true thì không chặn hạn mức nợ
```

### 3.2. Refactor Item DTO (Thuế & Giá bán/mua)
```typescript
// Bổ sung vào ItemDto và CreateItemRequest:
vatRate: number;            // Thuế suất VAT (0, 5, 8, 10,...)
purchasePrice: number;      // Giá mua / nhập tham chiếu
sellingPrice: number;       // Giá bán tiêu chuẩn
```

### 3.3. Nâng cấp Sales Order DTO (Giờ phút giao hàng & Thuế VAT)
```typescript
// Bổ sung vào SalesOrderItemDto:
vatRate: number;            // % VAT
taxAmount: number;          // Tiền thuế dòng = LineTotal * vatRate / 100

// Trong SalesOrderDetailDto:
expectedDeliveryDate: string; // ISO UTC gồm cả Giờ:Phút: 'YYYY-MM-DDTHH:mm:00Z'
deliveryAddressId?: number;   // ID địa chỉ giao hàng chọn từ danh sách của KH
```

---

## ✅ 4. CHI TIẾT CÁC NHIỆM VỤ (TASK DETAILS)

### Nhóm 1: Phúc (Lead / Core Shared & Master Data)
- [x] **Task S23.0.1 Component Dialog chuẩn hóa:** Dựng service `DialogService` và component Ionic/Angular cho Confirm (`Yes/No` / `OK/Cancel`), Alert/Info, Warning, Error. Trả về `Promise<boolean>` tiện lợi. (FE `6aaa6f6`, BE `671cd8f`, Root `943aa9d`).
- [x] **Task S23.0.2 Component Search Select Async & Nút Back:** Component `<app-async-select>` nhận callback API tìm kiếm từ xa, debounce 250ms, spinner, hiển thị item custom; `<app-back-button>` đồng bộ điều hướng tự động hoặc fallback url. (FE `a2f4ac7`/`f0c1e81`).
- [x] **Task S23.0.3 Quy chuẩn Modal/Popup:** Cấu hình toàn bộ modal popup nhập liệu chặn click backdrop (`backdropDismiss: false`), có nút X hoặc Hủy rõ ràng; các form nghiệp vụ nặng chuyển dần thành route page riêng. (FE `a2f4ac7`/`f0c1e81`, WMS `cfd64e4`/`cd7b180`).
- [x] **Task S23.1.1 Bổ sung OrgUnitType Kho (Warehouse):** Cập nhật enum `OrgUnitType` (thêm `Warehouse = 3`), cấu hình migration DB và hiển thị icon Kho chuyên biệt (`📦`) trên cây tổ chức. (BE `d32a690`/`218f917`, FE `a2f4ac7`/`f0c1e81`).
- [x] **Task S23.1.2 Refactor Master Item:** Thêm trường `VatRate`, `SalePrice`, `CostPrice` vào Entity `Item`, migration DB, cập nhật form tạo/sửa Item và bảng Item hiển thị VAT trên FE. (BE `d32a690`/`218f917`, FE `a2f4ac7`/`f0c1e81`, WMS `cfd64e4`/`cd7b180`).

### Nhóm 2: Thiện (Backend Developer)
- **Task S23.2.1 Entity & Migration Địa chỉ giao hàng & Checkbox nợ:** Tạo bảng `tbl_CRM_PartnerDeliveryAddress`, thêm `IsUnlimitedCredit` vào `tbl_MD_Partner`.
- **Task S23.2.2 API CRUD Địa chỉ giao hàng:** Xây dựng service & controller theo đúng API Contract; cập nhật logic kiểm tra hạn mức nợ: nếu `IsUnlimitedCredit == true` thì bỏ qua kiểm tra credit limit.
- **Task S23.3.1 Nâng cấp API Đơn bán hàng:** Lưu và tính toán `VatRate`, `TaxAmount` theo từng dòng; cập nhật `TotalAmount`; hỗ trợ lưu giờ phút giao hàng.
- **Task S23.4.1 Spike Trả hàng bán & Bảng giá:** Nghiên cứu đối chiếu quy trình trả hàng (đổi hàng, hoàn tiền, giảm nợ) và mô hình chiết khấu thực tế ngoài thị trường; viết tài liệu đề xuất kiến trúc.

### Nhóm 3: Lợi (Frontend Developer)
- **Task S23.2.3 Màn hình Khách hàng trang riêng & Địa chỉ giao:** Chuyển modal tạo/sửa khách hàng thành trang route riêng `/crm/partners/:id`; nhúng component danh sách địa chỉ giao hàng.
- **Task S23.2.4 Checkbox không giới hạn nợ:** Bổ sung checkbox vào form khách hàng; khi tick thì tự động disable ô nhập tiền hạn mức nợ.
- **Task S23.3.2 Cải tiến Form Đơn bán - Khách hàng:** Thêm icon chuyển nhanh sang trang xem chi tiết khách hàng; khi chọn khách hàng thì tự động gọi API lấy danh sách địa chỉ giao vào dropdown.
- **Task S23.3.3 Cải tiến Chọn sản phẩm:** Tích hợp `<app-async-select>` tìm kiếm sản phẩm; khi quét hoặc chọn trùng sản phẩm thì tự động tăng số lượng và hiện thông báo.
- **Task S23.3.4 Hoàn thiện UI Đơn bán:** Format tiền tệ chuẩn `1.000.000 đ`; icon xóa màu đỏ nổi bật; chọn giờ:phút ngày giao; tính hiển thị tổng tiền gồm thuế VAT.

