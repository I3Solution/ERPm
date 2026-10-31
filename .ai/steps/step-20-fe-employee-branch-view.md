# Danh sách nhân viên: hiện đường dẫn đơn vị (breadcrumb) và lọc theo cây tổ chức

> Ngày: 2026-11-01 · Yêu cầu trực tiếp của Thiện (xem màn Nhân viên, cột "Chi nhánh") · Nhánh `thien/fe-employee-branch-filter` (+ `-be` ở ERPm-BE) · Trạng thái: **xong, chờ review**

## 1. Mục tiêu
Nhìn cột "Chi nhánh" biết ngay nhân viên thuộc đơn vị nào (Công ty › Chi nhánh › Cửa hàng), không chỉ tên node lá; và lọc danh sách theo một node của cây (lấy cả node con). Tham khảo `branch-breadcrumbs` của ERP cũ về ý tưởng, không chép cách làm (quét đệ quy danh sách phẳng mỗi lần vẽ, style Ionic).

## 2. Đã làm

| Nơi | Nội dung |
| :--- | :--- |
| `shared/components/branch-breadcrumbs/` (`app-branch-breadcrumbs`) | Đầu vào `tree` (cây lồng của `/branches/tree`), `branchId`, `maxItems`, `itemsBeforeCollapse/AfterCollapse`, `skipGroup`. Công ty tô màu chính, node cuối đậm, tooltip là đường dẫn đầy đủ; đường dẫn dài thu gọn phần giữa thành nút "…" bấm để mở. Id không có trong cây: không vẽ gì. |
| `core/models/org-tree.util.ts` | `branchIndex()` (Map id→node và id→cha, **cache theo tham chiếu mảng cây** nên cả bảng chỉ dựng một lần) và `branchPath()` (đi ngược theo cha, chi phí bằng độ sâu, có chặn vòng lặp). |
| Màn Nhân viên (HRM) | Cột Chi nhánh dùng breadcrumb; thêm bộ lọc `type="branch-tree"` trên đầu bảng (`branchFilterControl`, gửi `branchId`, xoá thì bỏ tham số). |
| BE `EmployeeFilterQuery.BranchId` | `EmployeeService` tính cây con bằng `OrgTree.Subtree` một lần rồi lọc `BranchId IN (...)`: chọn công ty / chi nhánh thì có cả nhân viên ở node con. |
| Từ điển | Thêm `emp.all_branches` (VI/EN) vào cả hai file, nội dung giống hệt (`git hash-object` trùng). |

## 3. Lệnh đã chạy
```
dotnet build   (ERPm-BE)                       -> 0 error
dotnet run --project tests/ERPm.Verification   -> VERIFIED 121 checks (120 cũ + 1 mới: lọc nhân viên theo node và con cháu)
npx ng test --watch=false --browsers=ChromeHeadless -> 72/72 (5 spec breadcrumb, 1 spec lọc, 1 spec cột sửa)
npx ng build                                   -> 0 error
```
Kiểm tra trình duyệt thật (CDP, web thử localhost:4200): mọi dòng hiện đường dẫn có "›", công ty tô màu, chọn "Chi nhánh Hà Nội" ở bộ lọc thì danh sách từ 5 còn 4 dòng đều thuộc Hà Nội.

## 4. Việc còn lại / bước tiếp
- Chưa dùng breadcrumb ở màn Cây tổ chức (chi tiết node) và Tài khoản; component đã sẵn để tái dùng.
- Tiếp hàng đợi BA: S20.4.3 (đặc tả mới 2026-11-01), BUG-20261101.
