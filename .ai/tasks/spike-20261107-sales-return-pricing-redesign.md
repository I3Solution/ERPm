# [spike] Trả hàng bán và thiết kế lại Bảng giá / Chiết khấu (S23.4.1)

> **Loại:** spike
> **Ngày tạo:** 2026-11-07 · **Người làm:** Thiện (BE) · **Người yêu cầu:** BA
> **Trạng thái:** Done (tài liệu đề xuất, chờ team chốt các câu hỏi ở mục 6 trước khi code)
> **Liên quan:** Trello https://trello.com/c/2R6kenSh · nhánh `thien/s23-spike-return-pricing`
> **Lưu ý về nguồn:** phần "mô hình ERP thực tế" (mục 3) viết từ hiểu biết chung về SAP, Odoo, ERPNext và cách kế toán Việt Nam xử lý hàng bán trả lại; phiên này không tra cứu web nên chưa kiểm chứng tài liệu hãng. Mọi chỗ liên quan thuế/hóa đơn điện tử cần kế toán hoặc BA xác nhận trước khi chốt.

## 1. Câu hỏi cần trả lời
1. Trả hàng bán hiện làm được gì, thiếu gì so với nhu cầu thực tế: trả lấy tiền, trả trừ công nợ, đổi hàng, phí trả hàng?
2. Chiết khấu nên chia thành những tầng nào (dòng, đơn, khuyến mãi) và áp theo thứ tự nào để thuế, trả hàng và báo cáo đều đúng?
3. Làm theo thứ tự nào, mỗi bước cần quyết định gì của team?

## 2. Hiện trạng (đọc từ code đã merge)
**Trả hàng** (`SalesReturn`, `SalesReturnService`)
- Hoàn tiền: `Cash` (111), `BankTransfer` (112), `ReduceDebt` (ghi giảm phải thu 131). Bút toán: Nợ 521 / Có 111-112-131; Nợ 156 / Có 632. Hàng nhập lại kho theo đúng giá vốn lúc bán.
- Trả theo hóa đơn: số lượng không vượt số đã bán trừ số đã trả; giá hoàn lấy từ dòng hóa đơn, giảm giá đầu hóa đơn chia theo tỷ lệ `TotalAmount / SubTotal`. Trả không hóa đơn: nhập giá tay, giá vốn lấy bình quân kho.
- Phiếu trả đã ghi sổ là bất biến; hóa đơn đã có phiếu trả thì không hủy được. `ReduceDebt` không vượt công nợ phải thu.
- **Chưa có:** đổi hàng, phí trả hàng, hạn trả hàng, tình trạng hàng (tốt/lỗi) và kho riêng cho hàng lỗi, duyệt trả hàng, hoàn VAT, liên kết với đơn bán (chỉ liên kết với hóa đơn).

**Giá và chiết khấu**
- `PriceList` + `PriceListItem` có bậc số lượng (`MinQuantity`), giá và `DiscountPercent` theo bậc; `PricingEngine` là hàm thuần: bậc cao nhất không vượt số lượng, bảng giá riêng của khách thắng, còn lại lấy giá ròng thấp nhất, cuối cùng giá niêm yết.
- Chiết khấu hiện có ở 3 chỗ rời rạc: `DiscountPercent` trong bảng giá, `DiscountAmount` trên từng dòng (nhập tay hoặc từ bảng giá), `DiscountAmount` đầu đơn/đầu hóa đơn. Giảm giá đầu đơn chỉ được chia về dòng khi trả hàng, không được lưu theo dòng.
- Đơn bán vừa có VAT theo dòng (S23.3.1): thuế tính trên số tiền dòng sau giảm giá dòng, không tính lại sau giảm giá đầu đơn. Hóa đơn từ đơn có VAT vẫn bị chặn.
- **Chưa có:** khuyến mãi (điều kiện, tặng hàng, giới hạn lượt), thứ tự áp dụng có tài liệu, lưu nguồn của từng khoản giảm để kiểm toán và để trả hàng hoàn đúng.

## 3. Mô hình tham khảo (hiểu biết chung, chưa kiểm chứng)
| Chủ đề | Cách các hệ thống thường làm | Ý rút ra cho ERPm |
| :--- | :--- | :--- |
| Trả hàng | SAP: đơn trả hàng, giao hàng trả, rồi phiếu ghi có (credit memo). Odoo: phiếu nhập trả + ghi giảm hóa đơn (credit note), hoàn tiền hoặc giữ làm số dư. ERPNext: phiếu trả gắn hóa đơn gốc, tự sinh credit note. | Tách 3 việc: nhận hàng về kho, ghi giảm doanh thu/thuế, hoàn tiền hoặc ghi giảm công nợ. ERPm đã gộp 3 việc trong một giao dịch; giữ cách gộp nhưng cho phép trạng thái trung gian khi cần duyệt. |
| Đổi hàng | Thường là hai chứng từ liên kết: phiếu trả và đơn/hóa đơn mới, thanh toán bù chênh lệch. Không có chứng từ "đổi" riêng. | Làm tương tự, không tạo loại chứng từ thứ ba. |
| Phí trả hàng | Một dòng khấu trừ vào số hoàn (restocking fee), doanh thu khác, có thể thu một phần theo tỷ lệ. | Thêm dòng phí vào phiếu trả, cấu hình theo lý do hoặc tỷ lệ. |
| Hàng lỗi / hạn trả | Kho riêng cho hàng lỗi, thời hạn trả tính từ ngày bán, trả quá hạn cần duyệt. | Thêm tình trạng hàng và kho nhận, hạn trả ở cấu hình. |
| Thuế Việt Nam | Hàng bán trả lại thường xử lý bằng hóa đơn điều chỉnh giảm hoặc chứng từ thỏa thuận; thuế đầu ra giảm tương ứng. | Cần kế toán chốt quy trình trước khi làm hoàn VAT (xem câu hỏi 4). |
| Chiết khấu | Chia tầng: giá bán, chiết khấu dòng, khuyến mãi (chương trình có điều kiện), chiết khấu đơn; mỗi khoản giảm giữ mã nguồn của nó; chiết khấu đơn phân bổ về dòng. | Dùng cùng khung tầng, phân bổ về dòng ngay khi lưu để thuế và trả hàng không phải tính lại. |

## 4. Đề xuất: trả hàng
Làm theo ba bậc, mỗi bậc dùng được ngay và không phá bậc trước.
1. **Bậc 1 (nhỏ, nên làm trước):** thêm `ReturnCondition` (Good/Defective) và kho nhận theo tình trạng; hạn trả hàng cấu hình (số ngày) và quá hạn cần quyền `sd:return:approve` hoặc từ chối; liên kết phiếu trả với đơn bán qua hóa đơn để hiển thị trên đơn; phí trả hàng là một dòng khấu trừ (`RestockingFeeAmount` trên phiếu, hạch toán vào tài khoản doanh thu khác do kế toán chọn).
2. **Bậc 2 (vừa):** đổi hàng bằng hai chứng từ liên kết: màn "Đổi hàng" tạo phiếu trả và đơn bán mới trong một thao tác, chênh lệch thanh toán hoặc ghi vào công nợ; trường `ExchangeGroupId` nối hai chứng từ.
3. **Bậc 3 (lớn, phụ thuộc thuế):** hoàn VAT khi hóa đơn có thuế: dòng phiếu trả mang `VatRate`, `TaxAmount` hoàn lại; bút toán Nợ 3331 tương ứng. Chỉ làm sau khi chốt cách xuất hóa đơn có VAT (hiện chặn) và quy trình hóa đơn điều chỉnh.

Giữ nguyên: phiếu đã ghi sổ bất biến; hoàn tiền không vượt công nợ khi `ReduceDebt`; giá vốn nhập lại bằng giá vốn lúc bán.

## 5. Đề xuất: bảng giá và chiết khấu
**Thứ tự áp dụng (cố định, ghi vào tài liệu và test):**
1. Giá gốc: bảng giá của khách, hoặc giá thấp nhất, hoặc giá niêm yết (giữ `PricingEngine`).
2. Chiết khấu dòng: phần trăm từ bậc bảng giá, cộng chiết khấu tay (có trần theo quyền, ví dụ `sd:order:discount` kèm % tối đa).
3. Khuyến mãi dòng (nếu có engine, mục dưới).
4. Chiết khấu đơn: theo tổng giá trị hoặc nhóm khách; **phân bổ về từng dòng ngay khi lưu** (`OrderDiscountShare`), phần dư dồn vào dòng lớn nhất để tổng khớp đến 4 chữ số thập phân.
5. Thuế: tính trên số tiền dòng sau bước 2–4. Đây là thay đổi so với S23.3.1 (thuế tính trước giảm giá đầu đơn); nếu theo luật cần tính thuế sau chiết khấu thương mại thì phải đổi công thức và chạy lại số liệu cũ. **Cần kế toán xác nhận.**

**Khuyến mãi — ba phương án:**
| | Nội dung | Ưu | Nhược |
| :--- | :--- | :--- | :--- |
| A | Không làm engine; chỉ chiết khấu tay và bảng giá | Không tốn công | Không kiểm soát được chương trình, khó báo cáo hiệu quả |
| B (đề xuất) | Bảng `Promotion` đơn giản: thời gian, chi nhánh, nhóm khách, điều kiện (mặt hàng hoặc nhóm, số lượng tối thiểu, tổng đơn tối thiểu), hành động (giảm %, giảm số tiền, giá cố định; tặng hàng làm sau), cờ cộng dồn, độ ưu tiên, giới hạn lượt dùng | Phủ 80% nhu cầu, tính được khoản giảm mỗi dòng và lưu `PromotionId` | Không có điều kiện lồng nhau, không mua X tặng Y ở bản đầu |
| C | Engine đầy đủ (quy tắc lồng, combo, mua X tặng Y, mã coupon) | Linh hoạt | Tốn công lớn, dễ lỗi làm tròn và xung đột quy tắc; chỉ nên làm khi có yêu cầu thật |

**Lưu nguồn khoản giảm:** thêm vào dòng đơn/hóa đơn các trường `DiscountSource` (Manual/PriceList/Promotion/OrderShare) và `PromotionId`; trả hàng hoàn đúng phần đã giảm của dòng thay vì chia theo tỷ lệ toàn hóa đơn.

**Bảng giá:** giữ cấu trúc hiện tại; bổ sung ngày hiệu lực theo từng dòng giá nếu cần giá tương lai (hiện chỉ theo cả bảng), bảng giá theo đơn vị tính (đã có `UomId`, cần kiểm tra việc dùng ở tính giá) và nhập khẩu giá hàng loạt. Không đổi `PricingEngine`.

## 6. Câu hỏi cần team chốt trước khi code
1. **Thuế sau chiết khấu đơn?** Thuế tính trên số tiền dòng trước hay sau khi chia chiết khấu đơn (ảnh hưởng S23.3.1 đã merge). Cần kế toán trả lời.
2. **Hóa đơn từ đơn có VAT:** hiện bị chặn; khi nào làm, và hóa đơn điện tử có tích hợp nhà cung cấp nào không?
3. **Phí trả hàng:** tính theo tỷ lệ hay số tiền, tài khoản kế toán nào, có đưa vào cấu hình theo lý do trả hàng?
4. **Hoàn VAT khi trả hàng:** dùng hóa đơn điều chỉnh hay cách khác; kế toán có yêu cầu chứng từ riêng?
5. **Hạn trả hàng** mặc định bao nhiêu ngày, quá hạn do ai duyệt?
6. **Khuyến mãi:** chọn phương án A, B hay C; có cần tặng hàng ngay bản đầu; ai quản lý chương trình (quyền)?
7. **Trần chiết khấu tay** theo vai trò: có hay không, ví dụ nhân viên tối đa 5%.
8. **Đổi hàng:** giữ hai chứng từ liên kết hay cần một màn riêng; chênh lệch ghi công nợ hay thu ngay?

## 7. Lộ trình gợi ý (sau khi chốt)
| # | Việc | Phụ thuộc | Cỡ |
| :--- | :--- | :--- | :--- |
| 1 | Trả hàng bậc 1: tình trạng hàng, hạn trả, phí trả, liên kết đơn | Câu 3, 5 | Vừa |
| 2 | Chiết khấu: lưu nguồn khoản giảm và phân bổ chiết khấu đơn về dòng, trần chiết khấu tay | Câu 1, 7 | Vừa |
| 3 | Khuyến mãi phương án B (bảng, engine, API, màn quản lý) | Câu 6, bước 2 | Lớn |
| 4 | Đổi hàng hai chứng từ liên kết | Bậc 1, câu 8 | Vừa |
| 5 | Hóa đơn từ đơn có VAT và hoàn VAT khi trả hàng | Câu 2, 4 | Lớn |

## 8. Rủi ro
- Đổi cách tính thuế (câu 1) làm thay đổi tổng đơn đã lập; cần chạy lại hoặc chỉ áp cho đơn mới.
- Làm tròn khi phân bổ chiết khấu về dòng: phải có test tổng khớp đến 4 chữ số thập phân với nhiều dòng và số lẻ.
- Khuyến mãi cộng dồn có thể đẩy giá dưới giá vốn: cần cảnh báo hoặc chặn theo quyền.
- Trả hàng lệch tháng làm đảo báo cáo doanh thu đã chốt: cần quy tắc ghi nhận theo ngày trả hàng.

## 9. Việc còn lại
- Team (BA, Phúc, kế toán) chốt mục 6; sau đó BA tách thành task và đưa vào plan Step 24 hoặc bản sau.
