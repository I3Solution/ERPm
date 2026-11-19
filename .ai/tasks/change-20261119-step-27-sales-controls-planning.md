# [change] Điều phối Step 27 cho bán hàng và cá nhân hóa menu

> **Loại:** change
> **Ngày tạo:** 2026-11-19 · **Người làm:** Phúc (Codex) · **Người yêu cầu:** Phúc
> **Trạng thái:** Done
> **Progress aggregation:** v1
> **Liên quan:** [Step 27](../steps/step-27-sales-controls-and-preferences.md), [board ERPm](https://trello.com/b/sul5ncJg/erpm)
> **Phạm vi:** rà source BE/FE; tài liệu và phân công Trello cho SD, WMS, SYS/FE

## 1. Mô tả

Rà chênh lệch phạm vi kho của SO và tồn kho, tìm nguyên nhân SO chưa tự áp chiết khấu theo số lượng, rồi lập kế hoạch nhớ trạng thái menu và phân quyền chuyển trạng thái SO, bảng giá. Bàn giao việc triển khai qua Trello.

## 2. Phân tích

- Baseline ERPm master `f018a08863d68ca0152dcbabb50b3d40c3908e11`, BE `479fc01c42c6827f28441bfeb7a96b05bcef5c6d`, FE `c03ff29c6f369e64f743b8a886bf17b774efe59e`. Mai sau triển khai cần tra domain và code tại gitlink của nhánh tương ứng.
- `OrderStockReservations`, `SalesPostingService` và `StockService` dùng các phạm vi kho khác nhau. `OrderDetailComponent` chưa nối API tính giá theo bậc. `ModuleNavigationComponent` giữ trạng thái mở nhóm trong bộ nhớ của instance. `SalesOrdersController` đã tách một số quyền chuyển trạng thái, còn phiên bản bảng giá dùng quyền sửa cho cả kích hoạt và đóng.
- Phạm vi lượt này là phân tích, kế hoạch và giao việc. Tiêu chí kiểm thử API, phân quyền, giao diện và dữ liệu nằm ở plan và card triển khai.

## 3. Features / Milestones

- [x] Rà luồng kho, chiết khấu, menu và quyền theo trạng thái.
- [x] Tạo plan và step log mới, ghi tiêu chí nghiệm thu và thứ tự phụ thuộc.
- [x] Tạo hoặc cập nhật card Trello và xác minh thành viên được gán.

## 4. Cách làm

- Đối chiếu source tại gitlink của workspace và các hạng mục hiện có trên board ERPm.
- Viết [plan Step 27](../plans/plan-step-27-sales-controls-and-preferences.md) và lưu phân công ở step log. Tạo S27.1–S27.5, cập nhật card hàng loạt hiện hữu.

## 5. Kiểm tra

- Rà source theo baseline đã pin. Chạy console .NET 10 với `PricingEngine` hiện tại xác minh các điểm 99/100/101/99. Trello đọc lại đủ năm card Todo có người phụ trách, bốn mục nghiệm thu mỗi card và một card Backlog có phụ thuộc.

## 6. Việc còn lại

- Chủ trì các card thực hiện code, kiểm thử nghiệp vụ và chốt các lựa chọn được ghi trong plan.

## 7. Evidence và cập nhật

- Ngày cập nhật cuối: 2026-11-19
