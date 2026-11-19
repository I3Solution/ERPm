# Step 27 · Kho xuất, giá SO, quyền duyệt và tùy chọn menu

Ngày lập kế hoạch 2026-11-19. Hạng mục S26 đang được theo dõi trên Trello ERPm. Step 27 gom các việc phát sinh sau cập nhật UI dùng chung và giữ nghiệp vụ bán hàng hiện có làm mốc.

## Mục tiêu và phân công

| Hạng mục | Chủ trì | Phạm vi |
| --- | --- | --- |
| [S27.1 · Kho phục vụ SO](https://trello.com/c/0SwFTBCA) | Võ Quốc Thiện | WMS/SD/ACC, dữ liệu cấu hình, phân bổ giữ tồn và xuất SO |
| [S27.2 · Áp chiết khấu theo bậc vào SO](https://trello.com/c/zV2AnLHV) | Phạm Hữu Lợi | SD FE/BE, tính giá, hợp đồng lưu SO, hồi quy giá |
| [S27.3 · Nhớ mở/thu menu theo tài khoản](https://trello.com/c/t0ChToZx) | Phạm Hữu Lợi | FE shell, sidebar và trang Thêm trên mobile |
| [S27.4 · Quyền chuyển trạng thái SO](https://trello.com/c/clYox5Xy) | Võ Quốc Thiện | SD/IAM, quyền, trạng thái, lý do, thông báo và audit |
| [S27.5 · Quyền chuyển trạng thái bảng giá](https://trello.com/c/5H2uSHMO) | Phạm Hữu Lợi | SD/IAM, phê duyệt, kích hoạt, đóng phiên bản |
| [Hậu kiểm · Duyệt/từ chối hàng loạt](https://trello.com/c/uhjNtPC1) | Võ Quốc Thiện | Card hiện hữu, triển khai sau S27.4 và sau khi kiểm chứng giữ tồn |

Khởi động S27.1 và S27.2 trên hai nhánh độc lập, thống nhất trước các trường dùng chung của SO. S27.3 độc lập với backend. Chốt ma trận S27.4 và S27.5 trước khi triển khai chuyển trạng thái. Ghép PR SD/BE tuần tự khi đụng chung service hoặc DTO. Tác vụ hàng loạt gọi lại cùng một nghiệp vụ và chính sách đã kiểm thử ở mức một chứng từ.

## S27.1 · Kho phục vụ SO

- Giữ `SO.BranchId` làm chi nhánh bán. Thiết kế danh sách kho phục vụ được phép theo chi nhánh bán, có kho mặc định và kiểm tra cùng công ty. Ở đợt này, mỗi SO có hàng hóa chốt một kho xuất khi còn nháp và trước lúc xác nhận/duyệt. SO chỉ dịch vụ đi theo quy tắc hàng hóa hiện hành.
- Dùng cùng kho đã chốt cho xem khả dụng, giữ tồn, duyệt và xuất hóa đơn. Tồn khả dụng bằng tồn thực trừ đã giữ. Backend xác minh kho hoạt động, quan hệ kho phục vụ và quyền thao tác. Giữ tồn trong transaction, có khóa và audit. Đổi kho khi còn nháp sẽ tính lại khả dụng.
- Rà riêng nhánh bán, sở hữu tồn kho, chứng từ xuất và định khoản. Hiện `SalesPostingService` lấy chi nhánh kho cho hóa đơn, phiếu xuất và bút toán. Chốt cách tách hoặc quy trình điều chuyển nội bộ với ACC trước khi bật xuất chéo ở bất kỳ công ty nào. Kho khác công ty và xuất từ nhiều kho trên một SO theo dõi như phạm vi riêng.
- Chốt chạy song song với SO cũ. Đơn nháp có thể cập nhật kho. Đơn đã giữ hàng phải theo dấu reservation hiện có, hoặc chuyển kho qua nghiệp vụ có giao dịch và audit. Giữ nguyên khóa chứng từ đã ghi sổ.
- Nghiệm thu với A bán và kho B phục vụ A dưới cùng công ty. UI, giữ tồn và xuất kho cùng dùng B, SO vẫn thuộc A. Kho ngoài danh sách, kho khác công ty và kho không đủ hàng bị chặn. Hai SO cạnh tranh một tồn không gây bán âm. Hủy đơn trả đúng kho đã giữ.

## S27.2 · Giá và chiết khấu trên SO

- Dùng `POST /api/v1/sales/price-lists/calculate-price` hoặc service giá hiện có. Chốt thứ tự chọn bảng giá bằng bảng giá chỉ định khi hợp lệ, bảng của khách và quy tắc mặc định. Xác thực branch, khách, loại Sales, phiên bản đang hiệu lực và ngưỡng số lượng. Hiện API bỏ dòng bảng giá có `UomId` riêng và request tính giá chưa nhận ID bảng chỉ định. Thêm ca kiểm thử điều kiện này.
- Tính lại bản nháp khi chọn hàng, quét mã/gộp dòng, đổi số lượng, khách, chi nhánh, bảng giá hoặc ngày hiệu lực. Chặn phản hồi cũ ghi đè dòng đã đổi/xóa. Khi thiếu cấu hình hoặc API lỗi, hướng dẫn người dùng và phân biệt giá danh mục với giá đã áp.
- Lưu ID bảng/phiên bản đã áp và snapshot đơn giá, tiền chiết khấu, VAT theo dòng. BE tái tính hoặc xác minh trước khi lưu; chốt quyền sửa tay và lý do trước khi cho override. Mở lại SO đã chốt hiển thị snapshot, kể cả sau khi đổi hoặc đóng bảng giá.
- Bộ mẫu cho SP 2 với đơn giá 10.000 đ, bậc cơ sở 0% và bậc từ 100 là 1%. Số lượng 99, 100, 101, rồi quay về 99 cho kết quả 0 đ, 10.000 đ, 10.100 đ, 0 đ. Kiểm tra bản SO đã lưu và hóa đơn giữ được giá đã thỏa thuận. Nếu nghiệp vụ yêu cầu **10.000 đ cố định mỗi dòng** từ ngưỡng 100, chốt kiểu giảm cố định và quy tắc thuế riêng. Mô hình hiện tại lưu phần trăm.

## S27.3 · Cá nhân hóa menu

- Dùng lưu trữ phiên bản hóa theo định danh tài khoản để nhớ nhóm menu đã mở/thu trên cùng trình duyệt. Sidebar và trang Thêm cùng đọc/ghi một preference. Lưu ID nhóm ổn định, loại nhóm đã xóa và tôn trọng quyền hiện tại.
- Route truy cập trực tiếp có thể mở tạm nhánh chứa trang hiện tại. Trạng thái tự mở hỗ trợ điều hướng và không ghi đè lựa chọn thủ công. Chốt hành vi khi thu nhóm đang active và khi tải lại, rồi ghi vào hướng dẫn FE.
- Nghiệm thu tải lại, đổi trang, đóng/mở trình duyệt, đăng xuất/đăng nhập và đăng nhập hai tài khoản trên cùng trình duyệt. Sidebar desktop và trang Thêm mobile đồng bộ theo tài khoản. Nhóm mất quyền không hiện. Xử lý có dữ liệu cũ hoặc storage bị chặn. Đồng bộ liên thiết bị có thể tái dùng cơ chế hồ sơ người dùng khi được yêu cầu.

## S27.4 · Ma trận SO

Ma trận đề xuất cho từng thao tác. Quyền hiệu lực, phạm vi dữ liệu và trạng thái cùng được kiểm tại server; UI hiển thị lý do thao tác bị chặn khi phù hợp. Nhánh triển khai xác nhận mã quyền trong catalogue hiện hành và chốt quyền mặc định với người duyệt nghiệp vụ.

| Trạng thái xuất phát | Thao tác và quyền đề xuất | Kết quả hoặc điều kiện |
| --- | --- | --- |
| Draft | Sửa/xóa nháp bằng quyền CRUD hiện có, xác nhận bằng `sd:order:confirm` | Xác nhận thành Confirmed nếu đủ điều kiện; vượt hạn mức chuyển PendingApproval. Chỉ xóa nháp theo chính sách soft-delete. |
| Draft, nếu bật duyệt nghiệp vụ | Gửi duyệt bằng quyền riêng | Trạng thái chờ duyệt nghiệp vụ riêng, phân biệt với chờ duyệt tín dụng. |
| Chờ duyệt nghiệp vụ, nếu bật | Duyệt hoặc từ chối bằng quyền riêng | Duyệt chạy lại kiểm giá, tồn và công nợ; từ chối ghi lý do và áp quy tắc trả nháp/đóng đã chốt. |
| PendingApproval tín dụng | `sd:order:approve_credit` hoặc quyền từ chối tín dụng được chốt | Duyệt ghi lý do, giữ tồn và chuyển Confirmed. Từ chối ghi lý do và áp luồng được duyệt. |
| Draft / PendingApproval / Confirmed | `sd:order:cancel` | Chỉ khi chưa lập hóa đơn, có lý do và giải phóng giữ tồn nếu có. |
| Confirmed / Processing | `sd:invoice:create` theo điều kiện hiện có | Xuất kho/hóa đơn hợp lệ thì chuyển Completed. Chốt quyền bắt đầu xử lý và hủy phần còn lại nếu có giao hàng từng phần. |
| Completed / Cancelled | Xem lịch sử theo scope | Đảo/hủy chứng từ đã ghi sổ qua nghiệp vụ hóa đơn hoặc trả hàng có quyền riêng. |

Kiểm thử người tạo, người xác nhận, người duyệt, người hủy, người xem và người ngoài scope. Kiểm thử API gọi trực tiếp, sai trạng thái, hai người thao tác đồng thời, audit ai/khi nào/lý do và thông báo theo hướng dẫn repo. Không dùng quyền xem bảng giá làm điều kiện để người tạo SO được tính giá; xác nhận quyền tính giá và scope riêng ở S27.2 nếu cần.

## S27.5 · Ma trận phiên bản bảng giá

Hiện trạng là Draft → Active → Expired và có enum Archived. Kích hoạt và đóng đang dùng cùng `sd:pricelist:edit`. Chủ trì chốt phương án migration quyền, trạng thái và lịch hiệu lực trước triển khai. Nếu thêm trạng thái, giữ nguyên giá trị enum cũ cho dữ liệu hiện có.

| Trạng thái xuất phát | Thao tác và quyền đề xuất | Kết quả hoặc điều kiện |
| --- | --- | --- |
| Draft | Sửa dòng, sao chép, xóa theo quyền sửa/xóa nháp; gửi duyệt bằng quyền riêng | Phiên bản chờ duyệt hoặc tiếp tục là nháp nếu không áp duyệt ở phạm vi đã chốt. |
| Chờ duyệt | Duyệt hoặc từ chối bằng quyền riêng | Duyệt cho phép xuất bản. Từ chối ghi lý do và trả nháp. Chốt nguyên tắc tách người sửa và người duyệt. |
| Đã duyệt | Kích hoạt bằng `sd:pricelist:activate` đề xuất | Kiểm tra chi nhánh, loại bảng, khoảng ngày và chống trùng hiệu lực trong transaction. |
| Active | Đóng sớm bằng `sd:pricelist:close` đề xuất | Có lý do và audit. Giá mới đi qua phiên bản nháp kế tiếp. |
| Expired / Archived | Xem lịch sử; lưu trữ hoặc nhân bản qua quyền phù hợp | Giữ lịch sử giá áp dụng cho SO và hóa đơn. |

Nghiệm thu tách đủ quyền sửa, gửi duyệt, duyệt/từ chối, kích hoạt, đóng và lưu trữ. Kiểm thử API với quyền sai, trạng thái sai, phạm vi mua/bán và hai kích hoạt đối đầu. Xác nhận việc đóng phiên bản cập nhật giá cho đơn nháp theo chính sách S27.2, còn SO đã chốt giữ snapshot.

## Quy tắc kiểm thử chung

- FE build, UI-STD, Angular spec và Chrome desktop/mobile; BE verification trên PostgreSQL tạm. Thêm E2E cho luồng SO nháp → tính giá → xác nhận/duyệt → giữ tồn → xuất hoặc hủy, và vòng đời phiên bản bảng giá.
- Cập nhật dictionary VI/EN cùng lúc ở FE/BE, audit theo domain, kiểm tra quyền ở API lẫn UI. Thông báo chuyển trạng thái thực hiện theo [hướng dẫn tích hợp thông báo](../../docs/NOTIFICATION_INTEGRATION_GUIDE.md).
- Theo dõi phân công và bằng chứng ở [step log](../steps/step-27-sales-controls-and-preferences.md).
