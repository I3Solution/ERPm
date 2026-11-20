# [change] Thiết kế và bàn giao Branch Settings trong Step 27

> **Loại:** change
> **Ngày tạo:** 2026-11-21 · **Người làm:** Phúc (Codex) · **Người yêu cầu:** Phúc
> **Trạng thái:** Done
> **Progress aggregation:** v1
> **Liên quan:** [Step 27](../steps/step-27-sales-controls-and-preferences.md), S27.6–S27.9
> **Phạm vi:** đồng bộ workspace, đặc tả SYS/FE và tích hợp WMS/SD, API contract, Trello

## 1. Mô tả

Lập thiết kế cấu hình chi nhánh mở rộng được theo key. Người quản trị được chọn kế thừa hoặc tự cấu hình theo từng key. Có API contract, phân công triển khai và tiêu chí nghiệm thu trên Trello.

## 2. Phân tích

- Baseline sau đồng bộ là ERPm `60d4c7715c4c163869ee292af572c095b6d6069f`, BE `371856a9b0772c492a049c656e702c2166f4395e`, FE `35d34305ab75e6e0184901a9e20c92cc895fc7d5`, SD `d270b678333518d2dbedc710f5d295572ea2d323` và WMS `8b3e3c756ce3104ea2f9339678837d2a61a99c25`.
- `Branch.ParentId` và `CompanyId` cung cấp cây và ranh giới công ty. `BranchServingWarehouse` đã có danh sách kho phục vụ có khóa ngoại và cờ mặc định. `StockController` và `ServingWarehouses` là dependency trực tiếp cho tích hợp. FE dùng tree, toolbar và control hiện có. Hợp đồng dùng `ApiResponse<T>` của ERPm.
- Hạng mục này bàn giao DB, resolver, IAM, FE, API và kịch bản QA. Migration, API runtime và UI do chủ trì từng card thực hiện.

## 3. Features / Milestones

- [x] Đồng bộ nhánh theo master và checkout gitlink.
- [x] Chốt nghiệp vụ, DB, FE và API contract trong Step 27.
- [x] Tạo, gán người phụ trách và xác minh checklist Trello.

## 4. Cách làm

- Bắt đầu nhánh `phuc/s27-branch-settings` từ master đã fetch và cập nhật các submodule theo gitlink.
- Bổ sung [plan Branch Settings](../plans/plan-step-27-branch-settings.md), [API contract](../../docs/BRANCH_SETTINGS_API_CONTRACT.md) và nhật ký Step 27. Giao S27.6 và S27.8 cho Thiện, S27.7 cho Lợi, S27.9 cho Phúc.

## 5. Kiểm tra

- Đối chiếu revision đã pin, ranh giới công ty, API và envelope hiện có. Đọc lại bốn card Trello, xác minh người phụ trách, cột và bốn mục nghiệm thu mỗi card.
- Kiểm tra sáu ví dụ JSON, 16 liên kết tương đối trong tài liệu và liên kết của cả bốn card. Kiểm tra whitespace Git trước khi commit. Dictionary tại baseline FE/BE có blob khác nhau, tình trạng CI này được ghi trong plan.

## 6. Việc còn lại

- Triển khai và kiểm thử runtime được bàn giao theo các card S27.6–S27.9.

## 7. Evidence và cập nhật

- Ngày cập nhật cuối: 2026-11-21
