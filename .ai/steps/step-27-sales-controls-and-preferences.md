# Step 27 · Nhật ký rà soát và bàn giao

Ngày 2026-11-19 (UTC+07). Phạm vi lượt này là khảo sát source, lập kế hoạch và phân công. [Kế hoạch và ma trận quyền](../plans/plan-step-27-sales-controls-and-preferences.md) · [Task record](../tasks/change-20261119-step-27-sales-controls-planning.md)

## Baseline đã đối chiếu

| Repo | Revision | Mục đích |
| --- | --- | --- |
| I3Solution/ERPm | `f018a08863d68ca0152dcbabb50b3d40c3908e11` | Nhánh master và gitlink của workspace |
| I3Solution/ERPm-BE | `479fc01c42c6827f28441bfeb7a96b05bcef5c6d` | Giữ tồn, xuất hàng, giá và quyền |
| I3Solution/ERPm-FE | `c03ff29c6f369e64f743b8a886bf17b774efe59e` | Shell điều hướng và gitlink module |
| I3Solution/ERPm-FE-SD | `aaf76564fa0e42f974a4a32927f3810c1d63a01f` | Form đơn bán, request lưu và API tính giá |
| I3Solution/ERPm-FE-WMS | `d4561295fc2c760d92c6e6162f99e16342c4b625` | Phạm vi hiển thị kho |

## Phát hiện đã xác minh

- `StockService.GetStockBalancesAsync` mở rộng phạm vi lọc theo đơn vị con. `OrderStockReservations.ReserveAsync` chỉ lấy kho có chi nhánh bằng SO và có thể giữ qua nhiều kho. `SalesPostingService.PostInvoiceAsync` xuất từ một kho, chặn sai chi nhánh và dùng chi nhánh của kho cho định khoản. Phải chốt nhánh bán, kho xuất và tác động ACC trước khi hỗ trợ kho phục vụ chéo chi nhánh.
- `OrderDetailComponent.onQuickAddProduct` khởi tạo chiết khấu bằng 0. `onProductSelect` lấy giá/VAT danh mục, còn sửa số lượng không nối `calculatePrice`. `SdService.saveOrder` không gửi `priceListId` và `CreateSalesOrderRequest` chưa có trường đó. `PriceListService.CalculateAsync` đã tính bậc và trả tiền chiết khấu theo phần trăm, có ID phiên bản áp dụng.
- `ModuleNavigationComponent.expanded` giữ mở/thu trong signal của instance. Sidebar và trang Thêm khởi tạo component riêng.
- `SalesOrdersController` có quyền riêng cho xác nhận, duyệt tín dụng, hủy và xuất hóa đơn. `PriceListsController` dùng `sd:pricelist:edit` cho cả kích hoạt và đóng phiên bản. Plan ghi rõ quyền hiện có và quyền cần chốt.

## Trello và người phụ trách

| Hạng mục | Người phụ trách | Trạng thái | Card |
| --- | --- | --- | --- |
| S27.1 · Kho xuất và giữ tồn SO | Võ Quốc Thiện | Todo | [Kho phục vụ SO](https://trello.com/c/0SwFTBCA) |
| S27.2 · Chiết khấu theo bậc | Phạm Hữu Lợi | Todo | [Áp chiết khấu SO](https://trello.com/c/zV2AnLHV) |
| S27.3 · Nhớ mở/thu menu | Phạm Hữu Lợi | Todo | [Cá nhân hóa menu](https://trello.com/c/t0ChToZx) |
| S27.4 · Quyền theo trạng thái SO | Võ Quốc Thiện | Todo | [Ma trận SO](https://trello.com/c/clYox5Xy) |
| S27.5 · Quyền theo trạng thái bảng giá | Phạm Hữu Lợi | Todo | [Ma trận bảng giá](https://trello.com/c/5H2uSHMO) |
| Hậu kiểm · Duyệt/từ chối nhiều SO | Võ Quốc Thiện | Backlog · phụ thuộc S27.1 và S27.4 | [Card hàng loạt hiện hữu](https://trello.com/c/uhjNtPC1) |

Đã đọc lại năm card mới từ Trello, xác minh người được gán, vị trí Todo và bốn mục nghiệm thu mỗi card. Card hàng loạt hiện hữu giữ Backlog và đã nối phụ thuộc.

## Kiểm tra

- Chạy `PricingEngine` từ source pin trong console .NET 10 tạm. Chọn SP mẫu giá 10.000 đ, bậc 100 giảm 1%. Chuỗi 99/100/101/99 cho tiền giảm 0/10.000/10.100/0 đ. Đây là kiểm tra engine độc lập. Hồi quy tích hợp trên màn SO sau khi nối API thuộc S27.2.
- Giả định cần người chủ trì xác nhận là “10.000 đ tại 100 sản phẩm” có thể là kết quả của tỷ lệ hoặc mức giảm cố định. Đã ghi cả hai trường hợp vào kế hoạch và card.
- Thay đổi của lượt điều phối nằm trong tài liệu và Trello. Kiểm thử toàn luồng nghiệp vụ được giao cùng từng card.

## 2026-11-21 · Branch Settings

- Đã fetch master và tạo `phuc/s27-branch-settings` tại `60d4c7715c4c163869ee292af572c095b6d6069f`. Đồng bộ BE `371856a9b0772c492a049c656e702c2166f4395e`, FE `35d34305ab75e6e0184901a9e20c92cc895fc7d5`, SD `d270b678333518d2dbedc710f5d295572ea2d323` và WMS `8b3e3c756ce3104ea2f9339678837d2a61a99c25` theo gitlink. Đối chiếu source lúc 01:25–01:29 UTC+07.
- Nghiệp vụ chốt theo từng key. Branch có thể tự cấu hình hoặc kế thừa theo cha gần nhất trong công ty, sau đó dùng mặc định. Các giá trị scalar có danh mục định kiểu và UI chung. Nhóm dữ liệu có quan hệ như kho phục vụ SO dùng bảng nghiệp vụ hiện có, bổ sung chế độ kế thừa.
- API contract quy định đăng ký key, trả nguồn và hiệu lực, xem ảnh hưởng, ghi đè/reset qua `If-Match`, lịch sử và giao thức chuyển tiếp của WMS. Thay đổi làm ảnh hưởng SO đang giữ tồn sẽ bị chặn. [Kế hoạch Branch Settings](../plans/plan-step-27-branch-settings.md) · [API contract](../../docs/BRANCH_SETTINGS_API_CONTRACT.md)

| Mốc | Người phụ trách | Trạng thái khi bàn giao | Card |
| --- | --- | --- | --- |
| S27.6 · DB, resolver và API SYS | Võ Quốc Thiện | Todo | [S27.6](https://trello.com/c/OBXh4Sg8) |
| S27.7 · Giao diện quản trị theo schema | Phạm Hữu Lợi | Todo | [S27.7](https://trello.com/c/mKVADVLW) |
| S27.8 · Tích hợp kho phục vụ SO | Võ Quốc Thiện | Todo, sau phần SYS | [S27.8](https://trello.com/c/otwGGI11) |
| S27.9 · QA tích hợp | Phúc | Backlog, sau S27.6–S27.8 | [S27.9](https://trello.com/c/LEibiBiE) |

Đã đọc lại các card trên Trello để xác minh người phụ trách, cột và bốn mục nghiệm thu mỗi card. Lượt này bàn giao tài liệu và phân công. Kiểm chứng runtime thuộc từng card. [Task record](../tasks/change-20261121-s27-branch-settings-planning.md)
