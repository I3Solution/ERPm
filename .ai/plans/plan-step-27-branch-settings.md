# Step 27 · Branch Settings có kế thừa

Ngày chốt phạm vi 2026-11-21. [Kế hoạch Step 27](plan-step-27-sales-controls-and-preferences.md) · [API contract](../../docs/BRANCH_SETTINGS_API_CONTRACT.md) · [Nhật ký Step 27](../steps/step-27-sales-controls-and-preferences.md)

## 1. Mục tiêu

- Đăng ký được key mới và lưu giá trị theo đơn vị. FE tự dựng ô nhập đối với kiểu đã hỗ trợ.
- Mỗi key có hai lựa chọn là **Kế thừa** hoặc **Tự cấu hình**. Màn hình luôn hiện giá trị hiệu lực và nguồn.
- Một trang quản trị có nhiều nhóm cấu hình. Mô hình chung hỗ trợ giá trị đơn giản và cùng hiển thị các nhóm nghiệp vụ có dữ liệu định kiểu.
- Phạm vi đầu tiên gồm nền tảng SYS, UI quản trị, các kiểu giá trị cơ bản, và tích hợp cấu hình kho phục vụ SO hiện tại. Chính sách duyệt, bảng giá, ngày thanh toán và các thiết lập nghiệp vụ khác được nối khi có yêu cầu riêng.

## 2. Nghiệp vụ kế thừa

1. Xác định đơn vị từ đối tượng nghiệp vụ, ví dụ `SO.BranchId` khi lập SO. Khi dùng màn quản trị, đơn vị do người dùng chọn trong cây.
2. Với mỗi key, dùng override tại chỗ nếu có. Nếu không, đi từ cha gần nhất đến công ty sở hữu qua `ParentId`. Chỉ đọc các đơn vị hoạt động thuộc cùng công ty. Nếu thiếu cấu hình cả đường dẫn, dùng mặc định của định nghĩa hoặc fallback của module.
3. Giá trị `false`, `0` và chuỗi rỗng hợp lệ theo schema được coi là override. `Về kế thừa` xóa override hiện hành qua service, ghi lịch sử rồi trả về giá trị mới.
4. Cấu hình danh sách do module sở hữu kế thừa cả nhóm. Ở kho xuất SO, danh sách và kho mặc định đi cùng nhau. Đơn vị có thể chọn rõ **Dùng kho của đơn vị lập SO** như một cấu hình riêng.
5. Nếu có cấu hình đã khai báo nhưng nguồn hoặc tài nguyên đã vô hiệu, backend trả trạng thái lỗi cấu hình có nguồn. Với nhóm ảnh hưởng giao dịch, chặn thao tác mới cần cấu hình đó và cho quản trị viên sửa. Các quyền nghiệp vụ và phạm vi dữ liệu tiếp tục do IAM quyết định.

Ví dụ Công ty A đặt giờ chốt `16:00` và cờ `true`. Chi nhánh Hà Nội đặt riêng giờ chốt `17:00`, còn cờ kế thừa. Một điểm bán con của Hà Nội kế thừa `17:00` từ Hà Nội và `true` từ Công ty A. Chi nhánh khác có thể đặt `false` riêng. Đổi cha phải tính lại các giá trị hiệu lực và kiểm tra phạm vi công ty.

## 3. Thiết kế DB và quyền

| Bảng | Khóa và trường chính | Ràng buộc |
| --- | --- | --- |
| `tbl_SYS_Branch` hiện có | `id`, `parent_id`, `company_id`, `org_unit_type` | Dùng cây hiện có. Đợt đầu cho đặt cấu hình ở Company và Branch. |
| `tbl_SYS_SettingDefinition` | `setting_key` duy nhất, `group_key`, `value_type`, `labels_json`, `constraints_json`, `default_value_json`, `storage_kind`, `sort_order`, audit | Key ổn định. Kiểu scalar gồm boolean, integer, decimal, time, string, choice. Định nghĩa nghiệp vụ do module đăng ký với `storage_kind=module`. |
| `tbl_SYS_BranchSetting` | FK `branch_id`, FK `setting_key`, `value_json`, `revision`, audit | Duy nhất một override hiện hành cho mỗi `(branch_id, setting_key)`. Chỉ nhận key dùng lưu scalar. Giá trị JSON phải đạt schema của key. |
| `tbl_SYS_BranchSettingHistory` | `id`, `branch_id`, `setting_key`, `before_json`, `after_json`, `changed_by`, `changed_at_utc`, `reason`, `revision` | Ghi nối tiếp trong cùng giao dịch với thay đổi. Dùng chung cho scalar và thao tác tại module. |
| `tbl_WMS_BranchWarehousePolicy` | `branch_id` PK/FK, `mode`, `revision`, audit | Bản ghi riêng với `fixed_list` hoặc `own_warehouses`. Thiếu bản ghi nghĩa là tra kế thừa. |
| `tbl_WMS_BranchServingWarehouse` hiện có | `branch_id`, `warehouse_id`, `is_default`, audit | Giữ FK, unique theo nhánh/kho và index tối đa một mặc định. Backend yêu cầu đúng một trong danh sách chỉ định. |

Quyền đề xuất `sys:branch-setting:view`, `sys:branch-setting:edit` và `sys:branch-setting:manage_definition`. Quyền chỉnh tại cha áp theo scope IAM. Nếu lưu sẽ thay đổi giá trị hoặc nguồn của một đơn vị ngoài phạm vi được phép chỉnh, backend từ chối mà không tiết lộ dữ liệu của đơn vị đó. Các nhóm tài nguyên thực thi thêm kiểm tra quyền của module. Đăng ký key và thay override là hai thao tác được phân quyền riêng.

MVP cho người có quyền đăng ký key scalar bằng dữ liệu và dựng form từ schema này, không thêm cột. UI không chứa logic nghiệp vụ riêng qua biểu thức tự nhập. Module dùng key đã biết chỉ áp dụng hành vi khi có code sử dụng key. Định nghĩa hệ thống, kiểu, danh sách lựa chọn, ràng buộc và mặc định ổn định trong MVP. Nếu cần sửa schema đã dùng, có quy trình migration được duyệt riêng.

## 4. Tích hợp và chuyển dữ liệu

- Backfill các branch có dòng kho phục vụ hiện hành thành `fixed_list`; giữ nguyên cờ mặc định và chứng từ. Branch chưa có danh sách dùng fallback kho chính nó cho đến khi có cấu hình cấp cha.
- Cấu hình kho xuất SO dùng `ServingWarehouses` và endpoint WMS đang có. Mọi caller tra cùng resolver. Giữ giao thức cũ trong giai đoạn chuyển đổi theo contract, và gửi mode rõ ràng từ FE mới.
- Kiểm kho khả dụng, giữ tồn, xuất và hủy theo kho đã chọn trên SO. Cấu hình mới có hiệu lực lúc lấy mặc định cho đơn nháp mới hoặc khi tác vụ nháp cần tính lại. SO đã chốt giữ `WarehouseId` và chứng từ của nó.
- Khi gỡ kho ở cấp cha, kiểm tra cả đơn vị con có hiệu lực bị đổi. Nếu có giữ tồn hoạt động bị ảnh hưởng, chặn lưu; thay đổi mặc định với danh sách kho còn hợp lệ vẫn được phép. Backend kiểm tra lại bên trong giao dịch với thứ tự khóa thống nhất cho cấu hình, đơn và tồn kho. Không sửa lịch sử chứng từ.
- Hiện tại root master có lỗi CI ở bước so khớp dictionary FE/BE. Chạy lại và ghi rõ trạng thái baseline khi nhận card. Thay đổi key VI/EN trong cùng chuỗi PR để tránh tạo thêm sai lệch.

## 5. Ý tưởng FE

- Vào **Quản trị → Cấu hình chi nhánh**. Desktop hiển thị cây đơn vị bên trái. Mobile dùng bộ chọn cây ở đầu trang. URL có `branchId` để mở trực tiếp. Đơn vị cấu hình được chọn rõ và độc lập với ngữ cảnh thanh điều hướng.
- Chỉ hiện tab có dữ liệu và quyền. Mỗi dòng scalar có nhãn, giá trị hiệu lực, nguồn **Tự cấu hình**, **Kế thừa từ …** hoặc **Mặc định hệ thống**. Khi được sửa, dùng cùng control ERPm cho kiểu số, giờ, lựa chọn và bật/tắt.
- Dùng toolbar cho **Xem ảnh hưởng**, **Lưu**, **Về kế thừa** và **Lịch sử**. Khi đổi đơn vị mà form còn bẩn, dùng guard hiện có. Khi API trả xung đột phiên bản, giữ bản đang nhập để người dùng xem và tải lại cấu hình mới trước khi lưu lại.
- Cấp quyền **Định nghĩa cấu hình** cho người quản trị key. Các nhóm như Kho có editor theo module tại cùng màn hình hoặc liên kết đến đúng editor. FE dùng thông tin nguồn đã trả từ BE để hiển thị. Nhãn VI/EN và token theo `FE_UI_GUIDE.md`.

## 6. Phân công và phụ thuộc

| Mốc | Chủ trì | Phạm vi và thứ tự |
| --- | --- | --- |
| [S27.6 · SYS/BE nền tảng](https://trello.com/c/OBXh4Sg8) | Võ Quốc Thiện | Migration, catalog, resolver, quyền, API scalar và lịch sử. Bắt đầu trước phần tích hợp runtime. |
| [S27.7 · FE quản trị](https://trello.com/c/mKVADVLW) | Phạm Hữu Lợi | Layout và form theo schema, định nghĩa key, chọn đơn vị và nguồn. Có thể làm bằng mock contract trong khi S27.6 triển khai. |
| [S27.8 · WMS/SD dùng cấu hình hiệu lực](https://trello.com/c/otwGGI11) | Võ Quốc Thiện | Kết nối resolver, giữ dữ liệu S27.1, bảo vệ SO đã giữ, editor kho và hồi quy posting. Phối hợp Lợi tại điểm nối UI. |
| [S27.9 · QA tích hợp](https://trello.com/c/LEibiBiE) | Phúc | Chạy sau khi S27.6–S27.8 tích hợp. Kiểm thử phân quyền, cây, migration, SO và UI desktop/mobile. |

## 7. Tiêu chí nghiệm thu

- Tạo key scalar mới qua API, thấy FE dựng ô nhập đúng kiểu. Kiểm tra `false`, `0`, chuỗi rỗng hợp lệ, nullable bị từ chối, và sai kiểu bị chặn.
- Cây Công ty A → Chi nhánh HN → Điểm bán nhận đúng cha gần nhất theo từng key; ghi đè ở HN và reset cho kết quả đúng. Cấu hình của Công ty B độc lập. Xem trước liệt kê đúng phạm vi được đọc.
- Hai người sửa cùng key có thể phát hiện phiên bản cũ. Kiểm thử quyền xem, sửa, đăng ký key, parent đổi, lịch sử và quyền vào trực tiếp bằng URL.
- Migration giữ cấu hình kho cũ. SO hàng hóa dùng đúng kho hiệu lực, thiếu quyền hoặc chọn kho ngoài cấu hình bị chặn. Xử lý an toàn khi cập nhật cấu hình đồng thời với giữ hàng, xuất và hủy.
- Build BE/FE, kiểm tra dictionary, UI-STD, ChromeHeadless và E2E với PostgreSQL tạm. Kiểm tra giao diện sáng/tối, desktop/mobile và bàn phím.
