# [bug] Sửa lỗi Cannot find module './functions/cmp' và type mismatch trong SD POS

> **Loại:** bug
> **Ngày tạo:** 2026-10-31 · **Người làm:** AI Assistant · **Người yêu cầu:** User
> **Trạng thái:** Done
> **Liên quan:** commit SD: `457eac0`, commit ERPm-FE: `e03e145`

## 1. Mô tả
- **Hiện tượng:** Khi chạy `npm start` trong thư mục `ERPm-FE`, quá trình khởi động Angular CLI (`ng serve`) thất bại ngay từ khâu nạp module với lỗi:
  ```
  Error: Cannot find module './functions/cmp'
  Require stack:
  - J:\I3Solution\ERPm\ERPm-FE\node_modules\@angular\cli\node_modules\semver\index.js
  - J:\I3Solution\ERPm\ERPm-FE\node_modules\@angular\cli\lib\init.js
  ```
- **Cách tái hiện:** Chạy `npm start` tại `J:\I3Solution\ERPm\ERPm-FE`.
- **Môi trường:** Windows 11, Node.js v22.18.0, npm 10.9.3, Angular CLI 20.3.42.

## 2. Phân tích
- **Nguyên nhân 1 (node_modules bị hỏng / thiếu file):**
  - Trước đó, các thao tác dọn dẹp hoặc cài đặt dang dở (`npkill` / `npm i` bị gián đoạn) khiến thư mục `node_modules` bị thiếu nhiều file quan trọng. Hơn 80 thư mục package (như `listr2`, `acorn`...) bị mất file `package.json`, và `@angular/cli/node_modules/semver` bị thiếu các hàm `functions/cmp.js`, `functions/coerce.js`, `classes/comparator.js`.
  - Khi chạy `npm install` tiếp theo, npm nhận thấy thư mục package đã tồn tại nên bỏ qua không giải nén lại.
- **Nguyên nhân 2 (Lỗi kiểu dữ liệu trong SD POS và Sales Service):**
  - Sau khi khôi phục `node_modules`, `ng build` phát hiện 3 lỗi biên dịch TypeScript tại `src/app/modules/SD/pos.component.ts`:
    1. `selectedCustomerId` được khai báo là `string | null` trong khi `PartnerDto.id` và `CreateSalesInvoiceRequest.customerId` có kiểu `number`.
    2. `defaultWarehouseId` gán chuỗi fallback `'44444444-4444-4444-4444-444444444444'` trong khi `WarehouseDto.id` và `CreateSalesInvoiceRequest.warehouseId` có kiểu `number`.
    3. `CreateSalesInvoiceRequest.requestId` bắt buộc (`requestId: string;`) trong interface nhưng chưa được tự động tạo GUID nếu component không truyền.

## 3. Cách làm
- **Dọn dẹp và cài đặt lại node_modules:**
  - Xóa sạch thư mục `ERPm-FE/node_modules`.
  - Chạy `npm install` để đồng bộ lại `package-lock.json` và tải đầy đủ 979 packages.
- **Sửa kiểu dữ liệu trong `ERPm-FE` và submodule `ERPm-FE-SD`:**
  - `src/app/core/services/sales.service.ts`:
    - Đổi `requestId?: string;` thành optional trong `CreateSalesInvoiceRequest`.
    - Trong hàm `checkout()`, tự động gán fallback `requestId: request.requestId || crypto.randomUUID()`.
  - `src/app/modules/SD/pos.component.ts`:
    - Đổi `public selectedCustomerId: number | null = null;`.
    - Đổi fallback kho mặc định sang số `defaultWarehouseId = this.stockService.warehouses()[0]?.id || 1;`.
    - Kiểm tra `selectedCustomerId` trước khi tìm kiếm đối tác: `const customerObj = this.selectedCustomerId ? this.partnerService.partners().find(p => p.id === this.selectedCustomerId) : null;`.

## 4. Kiểm tra
- `npx ng version`: Thành công, hiển thị đầy đủ thông tin Angular CLI 20.3.42, Node 22.18.0.
- `npm run build`: Thành công 100%, bundle generation complete (`dist/client`).
- `npm start` (`ng serve`): Khởi động thành công máy chủ phát triển tại `http://localhost:4200/`.

## 5. Việc còn lại
- Không.
