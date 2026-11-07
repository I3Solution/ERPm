# Refactor: Tách Trang Danh sách và Trang Chi tiết (Header / List detail) Phân hệ SD

- **Ngày:** 2026-11-07
- **Người thực hiện:** Phạm Hữu Lợi (loipham)
- **Trạng thái:** Done
- **Phạm vi:** Frontend (ERPm-FE, ERPm-FE-SD)

---

## 1. Lý do & Hiện trạng
- **Hiện trạng:** Trước đây, các màn hình chứng từ trong phân hệ Bán hàng & Phân phối (SD: Đơn bán hàng, Báo giá, Trả hàng, Bảng giá) được thiết kế theo dạng Master-Detail chia 2 cột song song (Split Pane) trên cùng một màn hình:
  - Cột trái: Danh sách thu nhỏ (bị hẹp, thiếu nhiều cột thông tin quan trọng như ngày đặt, chi nhánh, kho, nhân viên, trạng thái kho).
  - Cột phải: Khung chi tiết (bị bó hẹp chiều ngang, bảng danh mục sản phẩm/line items bị chật chội khi có nhiều dòng).
- **Yêu cầu refactor:**
  - Tách hoàn toàn danh sách và chi tiết thành 2 trang độc lập (routes chuyên biệt).
  - **Trang Danh sách (List Page):** Toàn màn hình (Full-width grid), bộ lọc tìm kiếm đầy đủ, hiển thị tất cả các cột nghiệp vụ, click vào dòng hoặc nút xem chuyển sang trang Detail.
  - **Trang Chi tiết (Detail Page):** Toàn màn hình theo mô hình chuẩn ERP **Header / Lines detail**:
    - Nút `← Quay lại danh sách`.
    - Phần Header: Stepper trạng thái, cảnh báo công nợ, thông tin khách hàng/chi nhánh/kho, thanh nút hành động (Chỉnh sửa, In, Duyệt nợ, Xác nhận, Hủy đơn).
    - Phần List Detail: Bảng danh mục sản phẩm đơn hàng (Line items) rộng rãi, đầy đủ cột SKU, Tên, SL, Giữ kho, Đơn giá, Chiết khấu, Thành tiền; bảng tóm tắt tài chính và ghi chú.

---

## 2. Các thành phần đã triển khai

1. **Đơn bán hàng (`orders`):**
   - Refactor `OrdersComponent` thành trang Danh sách toàn màn hình (`/sales/orders` và `/orders`).
   - Xây dựng component trang mới: `OrderDetailComponent` (`/sales/orders/:id` và `/orders/:id`).
   - Tích hợp Status Stepper 5 bước, cảnh báo vượt hạn mức nợ, thanh hành động, bảng line items full width, dialogs Chỉnh sửa & In ấn.
2. **Báo giá (`quotations`):**
   - Refactor `QuotationsComponent` thành trang Danh sách toàn màn hình (`/sales/quotations` và `/quotations`).
   - Xây dựng component trang mới: `QuotationDetailComponent` (`/sales/quotations/:id` và `/quotations/:id`).
   - Bảng sản phẩm toàn màn hình, nút 1-Click chuyển đơn SO, In PDF A4, Gửi email.
3. **Trả hàng bán (`returns`):**
   - Refactor `ReturnsComponent` thành trang Danh sách toàn màn hình (`/sales/returns` và `/returns`).
   - Xây dựng component trang mới: `ReturnDetailComponent` (`/sales/returns/:id` và `/returns/:id`).
   - Bảng mặt hàng hoàn trả, thẻ hiển thị tự động bút toán đảo (521/131/156/632) và phiếu nhập kho hoàn hàng.
4. **Bảng giá (`price-lists`):**
   - Refactor `PriceListsComponent` thành trang Danh sách toàn màn hình (`/sales/price-lists` và `/price-lists`).
   - Xây dựng component trang mới: `PriceListDetailComponent` (`/sales/price-lists/:id` và `/price-lists/:id`).
   - Bảng phân cấp bậc thang số lượng sỉ/lẻ (`PriceListItemsComponent`), nút mô phỏng giá nhanh (`PricingSimulatorDialogComponent`).
5. **Đa ngôn ngữ & Dark Mode:**
   - Bổ sung `common.back_to_list` và `common.view_detail` cho cả VI và EN.
   - Kiểm tra và đảm bảo 100% tương thích Dark Mode qua các CSS tokens chuẩn hệ thống (`--erpm-surface-*`, `--erpm-text-*`, `--erpm-border-*`, `dark:*`).

---

## 3. Bằng chứng kiểm thử & Nghiệm thu
- **FE Build:** `npm run build` đạt 0 error, build bundle thành công.
- **Unit Tests:** Karma unit tests đạt **150/150 pass** (bổ sung tests mới cho `OrderDetailComponent`, `QuotationDetailComponent`, `ReturnDetailComponent`, `PriceListDetailComponent`).
- **Commit:**
  - SD Submodule: `b0be470`
  - FE Submodule: `d57f07b`
