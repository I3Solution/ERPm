# [bug] Từ điển FE và BE lệch lần 2 làm CI root đỏ

> **Loại:** bug
> **Ngày tạo:** 2026-11-07 · **Người làm:** Thiện (BE) · **Người yêu cầu:** BA
> **Trạng thái:** Doing (chờ Thiện gõ merge)
> **Liên quan:** BE nhánh `thien/fix-dictionary-fe-be-drift-2` (1415b71), root cùng tên · lần 1: [bug-20261107-dictionary-fe-be-drift](bug-20261107-dictionary-fe-be-drift.md)

## Hiện tượng
Bước "Verify shared dictionaries" (`cmp`) của CI root đỏ trên master (run 42374458358, lệch byte 43910).

## Nguyên nhân gốc
FE `10ab3f2` (nhánh `loipham/s22-sd-inline-edit-col6-all`) thêm 3 khóa chỉ vào FE `system.json`: `sq.payment_terms`, `pl.simulate_pricing`, `pl.effective_dates` (vi và en). BE `system_dictionary.json` không có.

## Cách sửa
So khóa trước khi chép: BE không có khóa nào FE thiếu, không khóa chung nào khác giá trị; chỉ 3 khóa FE-only. Chép FE sang BE.

## Bằng chứng
Hai file cùng mã băm blob git (`8ada486`) tức giống từng byte; `dotnet build` 0 warning / 0 error.

## Việc còn lại
- Thiện gõ merge: BE trước rồi root. Quy tắc cho người sửa từ điển: thêm khóa đồng thời vào cả hai file (BA nhắn Lợi).
