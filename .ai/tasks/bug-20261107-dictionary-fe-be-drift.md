# [bug] Từ điển FE và BE lệch nhau làm CI root đỏ

> **Loại:** bug
> **Ngày tạo:** 2026-11-07 · **Người làm:** Thiện (BE) · **Người yêu cầu:** BA
> **Trạng thái:** Doing (chờ merge, Thiện gõ lệnh)
> **Liên quan:** BE nhánh `thien/fix-dictionary-fe-be-drift` (8f4878a), root cùng tên

## Hiện tượng
Job backend của CI root so `ERPm-FE/src/assets/i18n/system.json` với `ERPm-BE/.../system_dictionary.json` bằng `cmp` (hai file phải giống từng byte). CI đỏ trên master kể từ lần merge nhánh `loipham/s22-separate-list-detail`.

## Nguyên nhân gốc
FE được thêm 32 khóa (16 cho mỗi ngôn ngữ: `common.back_to_list`, `common.view_detail`, `menu.departments`, `so.*`, `table.*`...) mà BE chưa có; BE không có khóa nào FE thiếu. Người sửa FE không đồng bộ sang BE.

## Cách sửa
Chép đúng nội dung FE (master) sang BE (chiều FE → BE vì FE là tập cha), rồi nâng con trỏ BE ở root.

## Bằng chứng
- Trước khi chép: so sánh theo khóa, BE cũ không mất khóa nào và không đổi giá trị nào (0 mất, 0 đổi, 16 thêm mỗi ngôn ngữ).
- Sau khi chép: hai file có cùng mã băm blob git (`8d942b5`), tức giống từng byte.

## Test chống tái phát
Đã có bước `cmp` trong CI. Quy tắc cho người sửa từ điển: thêm khóa vào cả hai file trong cùng đợt, chèn đúng khóa mới, không chép đè một chiều khi hai bên có khóa riêng.

## Việc còn lại
- Merge BE trước, rồi root. Các nhánh S23 (BE #25, #26, #27; FE #19, #20; root #39, #40, #41) cần merge master vào sau đó để CI xanh; các khóa S23 đã chèn cùng vị trí ở cả hai file nên sẽ khớp.
