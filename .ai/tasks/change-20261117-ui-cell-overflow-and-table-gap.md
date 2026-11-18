# [change] Ô bảng dài: cắt có "..." + hover hoặc xuống dòng (cấu hình toàn app); sửa dải trống dưới bảng

> **Loại:** change
> **Ngày tạo:** 2026-11-17 · **Người làm:** Thiện (AI) · **Người yêu cầu:** Thiện (PO)
> **Trạng thái:** Done
> **Progress aggregation:** v1
> **Pipeline:** stage=REPORT · round=BA/TA:1, DEV/TEST:1 · gate=none
> **Metrics:** BA=? · TA=? · DESIGN=? · DEV=? · TEST=? · REPORT=?
> **PR/SHA:** BE#87 (merged) · FE#93 @80864b8 (merged, QA PASS)
> **Env:** http://localhost:4400 (admin/T2-Admin-12345) chạy trực tiếp từ worktree FE-demo
> **Phạm vi:** ERPm-FE core (`app-data-table`, theme/tables.scss, header, TableDisplayService) + dictionary BE/FE; không đụng submodule

## 1. Mô tả
1. /employees có dải trống dưới hàng cuối bảng, bên trong thẻ bảng.
2. Quy tắc mới: ô dữ liệu quá dài. Cấu hình toàn màn hình, 2 chế độ: (truncate) cắt tối đa vài dòng kết thúc "...", rê chuột hiện đủ; (wrap) tự xuống dòng hiện đủ.

## 2. Phân tích (TA)
- Dải trống: màn Nhân viên (HRM) bọc `app-data-table` trong `.erpm-table-container` của riêng nó, mà `app-data-table` cũng có `.erpm-table-container` (margin-bottom 1rem) → hai thẻ lồng nhau, thẻ trong chừa 16px dưới. Có 4 nơi bọc như vậy (HRM employees, ACC receipt-form, SD quotation-detail, return-detail). Sửa tập trung trong data-table.component.scss bằng `:host-context(.erpm-table-container)`, không đụng submodule.
- Ô dài: bảng chính dùng Material (`erpm-mat-table`, table-layout fixed); `td` không clamp được nên bọc nội dung ô vào `.cell-content` (trừ cột actions), CSS line-clamp theo `html[data-cell-overflow]`.
- Giả định cần Thiện xác nhận: "xuống dòng hiện 3 chấm" = cắt tối đa 2 dòng rồi "..." (đổi bằng `--erpm-cell-clamp-lines`).

## 3. Features / Milestones
- [x] F1 Hết dải trống dưới bảng (đo: đáy thẻ trong = đáy hàng cuối, trước là +18px)
- [x] F2 Chế độ truncate (mặc định): 2 dòng + "...", tooltip đủ nội dung khi bị cắt (đã đo 32px, có title)
- [x] F3 Chế độ wrap: hiện đủ nội dung (đã đo 192px cho chuỗi test)
- [x] F4 Nút chuyển chế độ trên header, lưu localStorage, i18n vi/en (BE dictionary là nguồn, FE chép)
- [x] F5 Quy tắc ghi vào ERPm-FE/AGENTS.md
- [ ] TEST độc lập (1366/390, sáng/tối, vài bảng khác: đơn bán, phiếu thu, đối tác)

## P-DEV
tsc OK, check-ui-std OK, ng test 291 (có spec mới TableDisplayService; sửa app.component.spec cho tham số mới).
Giới hạn: bảng non-mat (sửa trực tiếp/FormArray) chưa bọc `.cell-content`; cột actions không clamp; ô chứa select/input nằm ngoài phạm vi.

## P-TEST
Tester độc lập (FE 80864b8, env :4400/erpm_demo). tsc OK; ng test 291/291 SUCCESS; không có script check-ui-std trong package.json (không chạy được).
F1 PASS 1366 sáng/tối: /employees, partners, sales orders, quotation list/detail, order detail: đáy khung - đáy hàng cuối = 0-1px (1px là viền); bo 16px giữ nguyên; scrollWidth=clientWidth. Quotation-detail: khung ngoài cao hơn 143px là phần tổng tiền (đúng), bảng trong 0px.
F2 PASS: sửa tạm full_name NV025 thành chuỗi dài (đã khôi phục): cao 32px (2 dòng, scrollHeight 240), line-clamp 2; title chỉ gắn khi hover và chỉ ô bị cắt; ô ngắn không có title riêng.
F3/F4 PASS: bấm nút → data-cell-overflow=wrap, ô cao 240px, hàng 52→257px; reload giữ wrap (localStorage erpm_cell_overflow); tooltip nút đổi vi/en đúng.
F5/hồi quy PASS: nút actions 12x17, không clamp, không nằm trong .cell-content; console không lỗi. Nút chuyển ẩn ở 390.
Lưu ý: host app-list-page có attr title="emp.title" (chưa dịch) nên ô ngắn có thể hiện tooltip native "emp.title" (có từ trước, ngoài phạm vi).
KHÔNG kiểm được: ACC receipt-form/phiếu thu/chi và return-detail (DB không có dữ liệu, bảng trống); 390 dùng thẻ (không có bảng) nên đo dải trống ở 390 là N/A, chỉ xác nhận không tràn ngang; bảng non-mat.

## P-REPORT
F1-F5 xong; tester độc lập PASS @80864b8 (1366 sáng/tối). Merged 2026-11-18: BE#87 rồi FE#93. Chưa kiểm: bảng non-mat, ACC receipt-form/return-detail (DB thiếu dữ liệu). Tách riêng: title="emp.title" chưa dịch ở app-list-page.

## P-LESSON
Dev chỉ đo 1 bảng; tester mới thấy thiếu dữ liệu cho màn lồng khác. Lần sau seed dữ liệu cho các màn bị ảnh hưởng trước khi gửi TEST.
