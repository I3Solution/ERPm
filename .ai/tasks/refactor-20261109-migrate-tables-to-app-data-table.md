# [refactor] Chuẩn hóa <app-data-table> với <app-column> khai báo và tự động hóa EditMode

> **Loại:** refactor
> **Ngày tạo:** 2026-11-09 · **Người làm:** loipham · **Người yêu cầu:** loipham
> **Trạng thái:** Done
> **Liên quan:** `ERPm-FE` (submodule) & repo root `ERPm` · Nhánh: `loipham/refactor-app-data-table`

## 1. Mục tiêu & Vấn đề giải quyết
1. **Loại bỏ việc định nghĩa mảng `columns: TableColumn[]` trong file TypeScript:** Chuyển sang cú pháp khai báo trực quan, linh hoạt bằng `<app-column>` (`TableColumnComponent`) trực tiếp trong HTML template.
2. **Loại bỏ sự dư thừa 2 thẻ `<app-data-table>` ở các màn hình có View/Edit Mode:** Hợp nhất thành 1 thẻ `<app-data-table [canEdit]="isEditing()">` duy nhất.
3. **Tự động hóa chuyển đổi ô (Smart Cell Switching):**
   - Khi `canEdit === false`: Ô hiển thị dạng `<span>` định dạng chuẩn theo `type` (tiền tệ `currency`, số `number`, ngày `date`, `badge`).
   - Khi `canEdit === true` và cột có `[editable]="true"`: Ô tự động render `<app-form-control>` (ở chế độ `compact="true"`, `size="sm"`) liên kết trực tiếp với FormControl tương ứng trong dòng `FormGroup`. Lập trình viên không phải viết `<ng-template>` cho các ô nhập liệu chuẩn.

## 2. Các thành phần đã tạo mới & nâng cấp
1. **Tạo mới `TableColumnComponent` (`<app-column>`):**
   - File: `ERPm-FE/src/app/shared/components/data-table/table-column.component.ts`.
   - Hỗ trợ các thuộc tính: `key`, `label`, `width`, `minWidth`, `align`, `type`, `sortable`, `sticky`, `nowrap`, `dateFormat`, `numberFormat`, `badgeMap`, `visible`, `suffix`, `prefix`.
   - Thuộc tính EditMode: `[editable]="true"`, `controlType`, `[options]`, `[min]`, `[max]`, `[step]`, `[disabled]`.
   - Hỗ trợ template projections: `<ng-template let-row="row">`, `<ng-template #viewTemplate let-row="row">`, `<ng-template #editTemplate let-group="group">`.
2. **Nâng cấp `DataTableComponent` (`<app-data-table>`):**
   - Thêm `@Input() canEdit: boolean = false;`.
   - Bỏ ràng buộc `{ required: true }` trên `columns` input để cho phép sử dụng thuần `<app-column>`.
   - Sử dụng `contentChildren(TableColumnComponent)` để tự động nhận diện các cột được khai báo.
   - Hỗ trợ tự động render `<app-form-control>` khi `canEdit && col.editable`.
3. **Refactor toàn bộ các màn hình sang `<app-column>`:**
   - **SD Orders** (`orders.component` & `order-detail.component`): Chuyển sang `<app-column>`, hợp nhất bảng View/Edit thành 1 bảng duy nhất.
   - **SD Quotations** (`quotations.component` & `quotation-detail.component`): Chuyển sang `<app-column>`, hợp nhất bảng View/Edit thành 1 bảng duy nhất.
   - **SD Returns** (`returns.component` & `return-detail.component`): Chuyển sang `<app-column>`, hợp nhất bảng View/Edit thành 1 bảng duy nhất.
   - **SD Price Lists** (`price-lists.component` & `price-list-items.component`): Chuyển sang `<app-column>`.
   - **CRM Partners** (`partners.component`): Chuyển sang `<app-column>`.
   - **WMS Items & Inventory** (`items.component` & `inventory.component`): Chuyển sang `<app-column>`.
   - **HRM Employees, Department Levels, Job Positions** (`employees.component`, `department-levels.component`, `job-positions.component`): Chuyển sang `<app-column>`.
   - **SYS Users, Notification Center, Notification Templates** (`users.component`, `notification-center.component`, `notification-templates.component`): Chuyển sang `<app-column>`.

## 3. Danh sách Commit (Nhánh `loipham/refactor-app-data-table`)
- Submodule `SD`:
  - `a8ddaad` - `[refactor](SD) pilot declarative app-column and auto-edit data-table in orders screen`
  - `f4418d3` - `[refactor](SD) refactor all SD tables to declarative app-column and unified tables`
- Submodule `CRM`:
  - `17c5ed3` - `[refactor](CRM) migrate partners table to declarative app-column`
- Submodule `WMS`:
  - `1ffc4e9` - `[refactor](WMS) migrate items and inventory tables to declarative app-column`
- Submodule `HRM`:
  - `31718ef` - `[refactor](HRM) migrate employee, department-level and job-position tables to declarative app-column`
- Submodule `ERPm-FE`:
  - `77642f4` - `[add](SHARED) TableColumnComponent and canEdit auto-rendering in DataTableComponent`
  - `532d35c` - `[refactor](SYS) migrate SYS tables to declarative app-column and update submodules`
- Root repo `ERPm`:
  - `8023a4f` - `[update] update ERPm-FE submodule pointer for app-column pilot in SD orders`
  - `8fef8ad` - `[update] update ERPm-FE submodule pointer after declarative app-column refactor`

## 4. Kết quả nghiệm thu
- `npm run build`: Hoàn thành 100% không có lỗi (0 error).
- Toàn bộ các màn hình hiển thị danh sách và chứng từ chi tiết hoạt động đồng nhất, mã nguồn ngắn gọn, dễ bảo trì và mở rộng.

## 5. Cập nhật sửa lỗi EditMode trên các trang Detail (2026-11-09)
### Hiện tượng & Nguyên nhân gốc
- Khi người dùng bấm "Chỉnh sửa" trên `sales/quotations/:id` hoặc `sales/price-lists/:id`: danh sách chi tiết dòng sản phẩm / mức giá vẫn ở trạng thái xem, không cho sửa.
- **Nguyên nhân 1:** Trong nhánh render object thuần (`!formArray`) của `DataTableComponent`, hàm `getCellTemplate(col, false)` và context `{ canEdit: false }` bị gán cứng là `false` thay vì sử dụng getter `isEditActive`. Do đó, các template projection sử dụng `let-canEdit="canEdit"` luôn nhận `canEdit === false`.
- **Nguyên nhân 2:** Component `price-list-detail` chưa truyền `[canEdit]="isEditing()"` xuống component con `<app-price-list-items>`, và bản thân `price-list-items` chưa hỗ trợ nhập liệu inline cho các cột số lượng tối thiểu, đơn giá và phần trăm chiết khấu.

### Giải pháp xử lý
1. **`DataTableComponent` (`data-table.component.html`):** Thay thế `getCellTemplate(col, false)` và `canEdit: false` bằng `getCellTemplate(col, isEditActive)` và `canEdit: isEditActive`.
2. **`QuotationDetailComponent` (`quotation-detail.component.html`):** Khi `isEditing()` chuyển sang `true`, `canEdit` truyền vào template projection là `true`, lập tức kích hoạt dropdown chọn sản phẩm, các ô input số lượng, đơn giá, chiết khấu và nút xóa dòng.
3. **`PriceListDetailComponent` & `PriceListItemsComponent`:**
   - Truyền `[canEdit]="isEditing()"` từ `price-list-detail` xuống `price-list-items`.
   - `price-list-items` kích hoạt chế độ sửa inline cho `minQuantity`, `unitPrice` (`erpmCurrencyInput`) và `discountPercent` khi `canEdit === true`.
   - Ẩn nút "➕ Thêm mức giá" và nút xóa `🗑️` ở chế độ xem; chỉ hiển thị khi `canEdit === true`.
   - Hỗ trợ lưu trữ `originalPriceList` để rollback sạch sẽ khi bấm "✕ Hủy chỉnh sửa".
4. **Commits liên quan:**
   - Submodule `SD`: `6d647b2` - `[fix](SD) enable inline edit mode for price list items and quotation detail`
   - Repo `ERPm-FE`: `1bea28a` - `[fix](SHARED) pass isEditActive to cell template context in DataTableComponent`
