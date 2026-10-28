# 🏢 STEP 09: TRIỂN KHAI BỘ CHỌN CHI NHÁNH ĐỆ QUY VÔ HẠN (TREE SELECT) & CƠ CHẾ QUERY THEO PHÂN CẤP CHA - CON

> **Mã bước:** `step-09`  
> **Thời gian thực hiện:** 2026-10-22  
> **Trọng tâm:** Xây dựng component Angular `BranchTreeSelectComponent` đệ quy vô hạn với icon đóng/mở nhánh con trên thanh menu/header; thiết lập cơ chế lọc dữ liệu Backend theo chi nhánh và toàn bộ con cháu trực thuộc (`GetBranchAndDescendantIdsAsync`) cho Sales, Dashboard và Inventory.

---

## 🎯 1. MỤC TIÊU CỦA BƯỚC NÀY
1. **Component Tree-Select tùy biến độc bản (`BranchTreeSelectComponent`):**
   - Đặt trên Top Header Bar, cho phép người dùng chọn nhanh chi nhánh đang làm việc.
   - Hiển thị cây phân cấp đa tầng (Đệ quy cha - con vô hạn qua `ng-template` & `ngTemplateOutlet`).
   - Có icon đóng/mở (`›` xoay 90° mượt mà) cho các node cha.
   - Tích hợp ô tìm kiếm real-time ngay trong flyout dropdown: tự động mở rộng (auto-expand) các nhánh cha có kết quả khớp.
   - Có tùy chọn cấp cao nhất: `🌐 Toàn hệ thống (Tất cả chi nhánh)` để xem số liệu tổng hợp.
   - Lưu vết chi nhánh đã chọn vào `localStorage` (`erpm_selected_branch_id`) để giữ trạng thái khi F5 tải lại trang.
2. **Cơ chế Backend lọc dữ liệu phân cấp Cha - Con (`IBranchService`):**
   - Phương thức BFS tối ưu: `Task<List<Guid>> GetBranchAndDescendantIdsAsync(Guid branchId)`.
   - Nếu chọn `Tổng công ty` (hoặc All branches): query lấy dữ liệu toàn bộ hệ thống.
   - Nếu chọn một chi nhánh cụ thể (ví dụ ID chi nhánh miền Bắc): tự động truy xuất dữ liệu của chi nhánh đó VÀ toàn bộ các chi nhánh con/cháu trực thuộc (Hà Nội, Hoàn Kiếm, Cầu Giấy, Hải Phòng...).
   - Endpoint: `GET /api/v1/branches/{id}/descendants`.
3. **Liên kết nghiệp vụ tự động phản ứng (Signals & Effects):**
   - **Bán hàng (Sales / Orders):** `SalesInvoiceService.GetInvoicesAsync(branchId)` lọc theo danh sách ID con cháu; POS checkout tự động gán `branchId` đang chọn.
   - **Dashboard (Metrics):** `DashboardService.GetMetricsAsync(branchId)` tính toán doanh thu hôm nay, giá trị kho, số lượng chứng từ theo chi nhánh và các con.
   - **Tồn kho (Inventory & Warehouses):** `StockService.GetStockBalancesAsync` & `GetWarehousesAsync` tự động co cụm theo chi nhánh được chọn.
   - Sử dụng Angular `effect(() => ...)`: khi người dùng đổi chi nhánh trên menu, toàn bộ trang chủ, đơn hàng và kho tự động làm mới ngay lập tức.

---

## 📂 2. DANH SÁCH FILE ĐÃ TẠO & CHỈNH SỬA

| File | Hành động | Nội dung chính |
| :--- | :---: | :--- |
| [IBranchService.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Application/Features/System/IBranchService.cs) | Chỉnh sửa | Bổ sung phương thức `GetBranchAndDescendantIdsAsync` |
| [BranchService.cs (Backend)](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Infrastructure/Services/BranchService.cs) | Chỉnh sửa | Triển khai BFS duyệt cây phân cấp đệ quy vô hạn |
| [BranchesController.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.API/Controllers/BranchesController.cs) | Chỉnh sửa | Bổ sung endpoint `GET /api/v1/branches/{id}/descendants` |
| [DataSeeder.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Infrastructure/Persistence/Seeders/DataSeeder.cs) | Chỉnh sửa | Nạp cây dữ liệu mẫu 4 cấp (Tổng CT -> Khối miền -> Chi nhánh -> Cửa hàng) |
| [ISalesInvoiceService.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Application/Features/Sales/ISalesInvoiceService.cs) | Chỉnh sửa | Bổ sung tham số `branchId` cho `GetInvoicesAsync` |
| [SalesInvoiceService.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Infrastructure/Services/SalesInvoiceService.cs) | Chỉnh sửa | Tiêm `IBranchService` và lọc hóa đơn theo chi nhánh và con cháu |
| [SalesController.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.API/Controllers/SalesController.cs) | Chỉnh sửa | Tiếp nhận query param `?branchId=` |
| [IDashboardService.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Application/Features/Dashboard/IDashboardService.cs) | Chỉnh sửa | Bổ sung tham số `branchId` cho `GetMetricsAsync` |
| [DashboardService.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Infrastructure/Services/DashboardService.cs) | Chỉnh sửa | Lọc doanh thu, số dư kho, bút toán theo chi nhánh và con cháu |
| [DashboardController.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.API/Controllers/DashboardController.cs) | Chỉnh sửa | Tiếp nhận query param `?branchId=` |
| [IStockService.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Application/Features/Inventory/IStockService.cs) | Chỉnh sửa | Bổ sung tham số `branchId` cho `GetWarehousesAsync` & `GetStockBalancesAsync` |
| [StockService.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.Infrastructure/Services/StockService.cs) | Chỉnh sửa | Lọc kho và tồn kho theo chi nhánh và con cháu |
| [StockController.cs](file:///d:/WORKING%20PLACE/ERPm/src/ERPm.API/Controllers/StockController.cs) | Chỉnh sửa | Tiếp nhận query param `?branchId=` |
| [branch.service.ts (Frontend)](file:///d:/WORKING%20PLACE/ERPm/client/src/app/core/services/branch.service.ts) | Chỉnh sửa | Quản lý Signal `currentBranch`, `branchTree`, mock tree 4 tầng, `localStorage` và `getActiveBranchIdForQuery` |
| [branch-tree-select.component.ts](file:///d:/WORKING%20PLACE/ERPm/client/src/app/shared/components/branch-tree-select/branch-tree-select.component.ts) | **Tạo mới** | Logic component Tree Select: expand/collapse, search, host click listener |
| [branch-tree-select.component.html](file:///d:/WORKING%20PLACE/ERPm/client/src/app/shared/components/branch-tree-select/branch-tree-select.component.html) | **Tạo mới** | Template đệ quy vô hạn với `ngTemplateOutlet`, icon đóng/mở nhánh con |
| [branch-tree-select.component.scss](file:///d:/WORKING%20PLACE/ERPm/client/src/app/shared/components/branch-tree-select/branch-tree-select.component.scss) | **Tạo mới** | Styling cao cấp: flyout panel, guideline đứt đoạn cây phân cấp, chevron xoay |
| [app.component.ts](file:///d:/WORKING%20PLACE/ERPm/client/src/app/app.component.ts) | Chỉnh sửa | Khai báo import `BranchTreeSelectComponent` |
| [app.component.html](file:///d:/WORKING%20PLACE/ERPm/client/src/app/app.component.html) | Chỉnh sửa | Gắn component `app-branch-tree-select` vào thanh header trên cùng |
| [dashboard.component.ts](file:///d:/WORKING%20PLACE/ERPm/client/src/app/modules/dashboard/dashboard.component.ts) | Chỉnh sửa | Sử dụng Angular `effect` tự động nạp metrics theo chi nhánh đang chọn |
| [pos.component.ts](file:///d:/WORKING%20PLACE/ERPm/client/src/app/modules/sales/pos.component.ts) | Chỉnh sửa | Tự động nạp hóa đơn theo chi nhánh và gán `branchId` khi lập hóa đơn mới |
| [inventory.component.ts](file:///d:/WORKING%20PLACE/ERPm/client/src/app/modules/inventory/inventory.component.ts) | Chỉnh sửa | Tự động nạp danh sách kho & tồn kho theo chi nhánh đang chọn |

---

## ⚡ 3. CÁC LỆNH ĐÃ THỰC THI (COMMAND EXECUTION)

```bash
# 1. Build kiểm tra Backend .NET 8 Web API
dotnet build
# Kết quả: Build succeeded: 0 Warning(s), 0 Error(s).

# 2. Build kiểm tra Frontend Angular 18 Client
cd client
npm run build
# Kết quả: Application bundle generation complete [11.9s], 0 Error.
```

---

## 🔍 4. KẾT QUẢ KIỂM TRA (VERIFICATION)
1. **Giao diện Select Box cây phân cấp:**
   - Nút chọn chi nhánh hiển thị gọn gàng, thanh lịch trên Top Header với tên, mã và trực thuộc.
   - Nhấn mở dropdown: hiển thị cây phân cấp 4 tầng (Tổng CT -> Khối miền -> Chi nhánh -> Cửa hàng).
   - Icon `›` đóng/mở các nhánh con mượt mà, độc lập.
   - Tìm kiếm tức thời: gõ tên hoặc mã (ví dụ "Hoàn Kiếm" hoặc "Q1"), cây tự động lọc và mở bung các nhánh cha liên quan.
2. **Cơ chế lọc số liệu Cha - Con:**
   - Khi chọn `Tổng Công Ty` (hoặc Toàn hệ thống): Backend trả về toàn bộ dữ liệu.
   - Khi chọn `Khối Miền Bắc`: Backend lọc tất cả chứng từ của Khối Miền Bắc + Hà Nội + Hoàn Kiếm + Cầu Giấy + Hải Phòng.
   - Khi chọn `Cửa hàng Hoàn Kiếm`: Backend chỉ lấy đúng dữ liệu tại điểm bán Hoàn Kiếm.
   - Phản ứng tức thì: Thay đổi trên thanh menu sẽ kích hoạt Signal và `effect()` tự động kéo lại dữ liệu trên trang hiện tại.

---

## ⏭️ 5. HƯỚNG ĐI CHO BƯỚC TIẾP THEO (NEXT STEPS)
- Sẵn sàng tiến sang **Giai đoạn 2 (Phase 2 Roadmap)**:
  - Phân hệ **Mua hàng & Đơn mua hàng Nhà cung cấp (Purchase Orders)**.
  - Phân hệ **Sổ quỹ Tiền mặt & Tiền gửi Ngân hàng (Cash & Bank)**: Lập phiếu thu, phiếu chi, tự động hạch toán theo chi nhánh phát sinh.
