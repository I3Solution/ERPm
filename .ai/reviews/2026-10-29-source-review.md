# Rà soát source ERPm ngày 2026-10-29

> Snapshot trước khi sửa. Xem Step 19 và bảng đối chiếu sửa ưu tiên để biết trạng thái hiện hành. Đính chính: SDK10.0.403 nằm ở thư mục người dùng, ngoài PATH; đã dùng SDK này build/test backend.

## Kết luận

ERPm đã có bộ khung ứng dụng và các luồng MVP, nhưng chưa đủ cơ sở nghiệm thu là hệ thống bán hàng, kho và kế toán dùng dữ liệu thật. Cần quay lại ổn định Giai đoạn 1 trước khi mở rộng Giai đoạn 2. Các tỷ lệ 100% trong tài liệu cũ phản ánh việc đã viết code/build ở thời điểm trước, không chứng minh nghiệp vụ hoặc vận hành đã hoàn tất.

Không cần viết lại toàn bộ dự án. Có thể giữ bộ khung 4 projects, giao diện, component biểu mẫu và mô hình chứng từ; cần sửa đồng bộ database, các quy tắc ghi sổ và cách sử dụng Signals.

## Phạm vi và bằng chứng

- Kiểm kê toàn bộ source hiện có trong root, Backend, Frontend và 10 submodule FE; đọc tài liệu kiến trúc, roadmap, status, nhật ký step và lịch sử Git liên quan.
- Phạm vi source gồm 72 file C#, 4 project files, 49 file TypeScript/HTML/SCSS; tổng 14.895 dòng tính cả project files và mã migration sinh tự động. Các file migration/snapshot được đối chiếu cấu trúc với model hiện hành. Không coi `node_modules`, `bin`, `obj`, cache hoặc bundle sinh ra là source nghiệp vụ.
- Đối chiếu DTO/API với service và component FE, cùng SQL DDL, EF model, migration, seeder, cấu hình khởi động, routes, biểu mẫu và styles.
- Tại thời điểm bắt đầu: working tree sạch; các submodule đã có trong checkout, không có dấu hiệu thiếu source vì chưa initialize submodule.
- Mốc Git: root `b275476`, BE `680daf5`, FE `8ca4796`. Lịch sử và step 16–17 ghi nhận thay đổi tới ngày 2026-10-29, trong khi một số status vẫn ghi ngày 2026-10-22/28.
- Phát hiện từ đọc code được phân biệt với kiểm tra thực thi bên dưới. Chưa chạy backend/API, chưa chạy giao dịch trên PostgreSQL, chưa kiểm thử trình duyệt, thiết bị hoặc máy in.

## Giai đoạn phát triển thực tế

| Phần | Đã hiện diện trong source | Phần còn thiếu hoặc chưa nghiệm thu |
| --- | --- | --- |
| Nền tảng BE | 4 projects Clean Architecture, DI, EF, DTO/API envelope, soft-delete, decimal(18,4), dual-key | Migration đồng bộ, xác thực/phân quyền, kiểm thử nghiệp vụ, môi trường build tái lập |
| WMS | Item/category/UOM/attribute API, form tạo item, tồn kho, nhập kho, giá bình quân | Validation, xử lý đồng thời, thống nhất giá vốn, kiểm kê/điều chuyển/xuất kho độc lập, luồng hủy |
| SD | POS, tạo invoice/stock issue/journal, cộng công nợ; entity/API sales order | Các lỗi thanh toán/ghi sổ, tìm kiếm/chiết khấu, kiểm soát tồn, trạng thái chứng từ và hoàn/hủy |
| CRM | Xem/tạo khách hàng và NCC, credit limit và debt balance | Tab/tìm kiếm đúng phản ứng, thực thi hạn mức, sổ công nợ và thu hồi nợ |
| Dashboard | API metrics và màn hình | Loại số demo khỏi kết quả thực, lọc chi nhánh, ngày nghiệp vụ, routes đúng, báo cáo trong roadmap |
| PUR | Entity/DTO và generic CRUD/confirm purchase order | FE hiện là khung tài liệu; chưa có vòng mua–nhận hàng–công nợ–chi tiền hoàn chỉnh |
| ACC | Account, journal, journal lines, một phần auto-post bán hàng | Sổ cái, đối chiếu, reversal, khóa kỳ, kiểm tra bắt buộc khi ghi sổ |
| Mobile | Ionic, layout responsive, in qua trình duyệt | Chưa có cấu hình/dependency Capacitor trong checkout, Android/iOS, scanner native, offline sync, máy in native |
| HRM/MFG/SCM/PM | Thư mục submodule và tài liệu kế hoạch | Chưa có source tính năng |

Stack đọc từ source: BE nhắm `net10.0`; FE dùng Angular `^17.3.0`, runtime trong `node_modules` là `17.3.12`, Ionic `^8.3.1`. Tài liệu gọi FE là Angular 18 chưa khớp package thực tế.

## Phát hiện cần xử lý

Quy ước: **P1** cần giải quyết trước khi dùng dữ liệu thật; **P2** cần hoàn thiện trong đợt ổn định MVP. Đây là đánh giá mức ưu tiên từ source, không phải kết luận đã quan sát sự cố trong môi trường production.

### F01 — P1: EF migration không tạo được schema mà ứng dụng hiện đang sử dụng

**Vị trí:** `ERPm-BE/src/ERPm.Infrastructure/Persistence/Migrations/20261011071959_Initial_Core_Schema.cs:14`, `ApplicationDbContextModelSnapshot.cs`, `ApplicationDbContext.cs:23`, `ERPm.API/Program.cs:69`.

Migration duy nhất tạo 9 bảng cũ như `accounts`, `items`, `partners`, khóa `Guid/uuid` và tên cột cũ. Model hiện ánh xạ 23 bảng `tbl_*`, khóa `int`, có `ExternalId`, chi nhánh, kho và hóa đơn. Toàn bộ 23 tên bảng hiện hành không có trong migration. Snapshot cũng còn mô hình cũ. Vì vậy đường khởi tạo bằng migration không tái lập được database hiện hành từ checkout này.

Startup chỉ gọi migrate nếu `CanConnect()` trả true, nên database chưa tồn tại cũng không được bootstrap qua nhánh này. Lỗi migration bị bắt rồi chỉ log warning; API tiếp tục chạy. Seeder đang bị comment. SQL thủ công là một đường khác, chưa tạo thành quy trình upgrade thống nhất.

**Cần làm:** xác định database đang có dữ liệu hay database mới; tạo baseline/upgrade phù hợp, kiểm tra từ DB rỗng và DB cũ. Không xóa migration hoặc chạy script reset trên dữ liệu đang sử dụng.

### F02 — P1: API chưa có xác thực và phân quyền dữ liệu

**Vị trí:** `ERPm-BE/src/ERPm.API/Program.cs:14`, `:57`; toàn bộ controllers; `ApplicationDbContext.cs:83`.

Không thấy đăng ký authentication, `UseAuthentication`, `[Authorize]` hoặc fallback policy. `UseAuthorization()` tự nó không bảo vệ các endpoint. Người truy cập được API có thể đọc/ghi dữ liệu qua các route hiện có. `branchId` là bộ lọc do client truyền; bỏ tham số là truy vấn toàn bộ. Query filters chỉ lọc soft-delete, chưa ràng buộc tenant/quyền chi nhánh. `TenantId` hiện chỉ là trường dự phòng.

**Cần làm:** identity, policy theo hành động, phạm vi chi nhánh từ người dùng đã xác thực và kiểm tra quyền ở server. Phân biệt cây chi nhánh phục vụ tổng hợp với quyền truy cập.

### F03 — P1: API bán/nhập kho chưa bảo vệ điều kiện nghiệp vụ đầu vào

**Vị trí:** `SalesInvoiceService.cs:121`, `:149`; `StockService.cs:124`; `ERPm.Application/DTOs/Sales/SalesDtos.cs`; `ERPm.API/Controllers/SD/SalesController.cs`.

Chỉ có kiểm tra danh sách dòng không rỗng ở controller bán hàng/nhập kho; chưa có validator nghiệp vụ cho số lượng dương, giá không âm, discount hợp lệ, enum thanh toán, hàng/kho còn hoạt động và giới hạn nợ. Có dependency FluentValidation nhưng chưa thấy validator/pipeline sử dụng nó.

Ví dụ trực tiếp từ logic: quantity âm khi bán làm **tăng** tồn; quantity vượt tồn làm tồn âm; không có balance thì vẫn tạo chứng từ và bỏ qua cập nhật tồn. Chưa có chính sách rõ ràng cho các tình huống này. Giá trị giá bán do client gửi được sử dụng trực tiếp. Không phân biệt hàng hóa/dịch vụ/combo khi tạo phiếu xuất và tính giá vốn.

**Cần làm:** validate tại application/service, chốt chính sách tồn âm và quyền sửa giá, kiểm tra loại item và các tham chiếu trước khi ghi sổ.

### F04 — P1: Có nguy cơ mất cập nhật tồn kho/công nợ khi thao tác đồng thời

**Vị trí:** `SalesInvoiceService.cs:150`, `:247`; `StockService.cs:138`; cấu hình `StockBalance` trong `ApplicationDbContext.cs:260`.

Luồng hiện đọc giá trị vào bộ nhớ rồi gán kết quả mới, chưa có concurrency token, khóa dòng hoặc cập nhật có điều kiện. Ví dụ bán và nhập cùng một hàng cùng đọc tồn 10; bán 2 ghi 8, nhập 5 ghi 15: kết quả đúng phải là 13. Đây là phân tích interleaving từ code, chưa chạy stress test DB.

Một lần `SaveChangesAsync` có thể bảo đảm atomic cho nhóm thay đổi của chính lần lưu đó; điều này **không** bảo vệ các phép đọc và tính toán trước đó khỏi giao dịch khác.

**Cần làm:** cập nhật tồn có điều kiện/khóa phù hợp hoặc optimistic concurrency kèm retry toàn use case; kiểm thử bán–bán, bán–nhập và cộng công nợ đồng thời.

### F05 — P1: Mã chứng từ dựa trên COUNT và chưa có idempotency

**Vị trí:** `SalesInvoiceService.cs:71`; `StockService.cs:92`; `ItemsComponent.openCreateModal()` và `PartnersComponent.openCreateModal()`.

Hai request đồng thời có thể đọc cùng COUNT và sinh cùng mã, sau đó một request bị unique constraint từ chối. COUNT cũng không phải bộ cấp số bền vững khi có soft-delete/import. FE sinh SKU/partner code theo độ dài danh sách nên dễ trùng khi tìm kiếm, phân trang hoặc nhiều người dùng. Retry checkout sau khi mất phản hồi có thể tạo hóa đơn thứ hai vì chưa có khóa idempotency.

**Cần làm:** bộ cấp số atomic/sequence theo chính sách nghiệp vụ; unique constraint vẫn giữ làm hàng rào; khóa request để retry trả lại kết quả đã tạo.

### F06 — P1: Giá vốn khi bán không khớp phương pháp giá bình quân nhập kho

**Vị trí:** `StockService.cs:143`; `SalesInvoiceService.cs:124`.

Nhập kho cập nhật `StockBalance.AverageCostPrice` theo kho, nhưng bán lấy `Item.CostPrice`. Ví dụ giá vốn danh mục 10, giá bình quân sau nhập là 20: bán một đơn vị ghi giá vốn 10 trong khi trị giá tồn kho giảm 20. Làm lệch giữa sổ kho và các dòng 632/156 ngay cả khi tổng Nợ/Có của journal bằng nhau.

**Cần làm:** chốt chính sách định giá, dùng cùng nguồn giá vốn cho stock issue, invoice snapshot và journal; kiểm tra đối chiếu tồn đầu + nhập − xuất = tồn cuối theo cả số lượng và giá trị.

### F07 — P1: Thanh toán một phần và tiền khách đưa bị hạch toán không nhất quán

**Vị trí:** `SalesInvoiceService.cs:159`, `:191`; `ERPm-FE/src/app/modules/SD/pos.component.ts:207`.

Hóa đơn 100, trả tiền mặt 40: `RemainingDebt = 60`, partner được cộng nợ 60, nhưng journal Nợ 111 toàn bộ 100 và không có dòng Nợ 131 tương ứng. Nếu trả 0 theo phương thức Cash, backend tự thay thành đã trả đủ. Nếu khách đưa 200 cho hóa đơn 100, `PaidAmount` lưu 200, không phân biệt tiền đưa/tiền nhận thực/tiền thừa. Bán Debt không bắt buộc CustomerId, có thể có khoản phải thu không gắn khách hàng.

**Cần làm:** mô hình hóa số thực thanh toán và tiền thừa; split phần thu tiền/phải thu; validate khách hàng, hạn mức và phương thức. Acceptance cần kiểm tra invoice, partner balance và journal cùng một giao dịch.

### F08 — P1: Chứng từ Posted vẫn có thể thiếu hạch toán

**Vị trí:** `SalesInvoiceService.cs:102`, `:176`, `:195`, `:218`; `StockService.cs:118`.

Nếu thiếu tài khoản 511, hóa đơn vẫn lưu Posted mà không có journal. Thiếu tài khoản khác có thể bỏ qua nhóm dòng doanh thu hoặc giá vốn. API vẫn trả thông báo ghi sổ thành công. Chưa có kiểm tra tập trung journal phải đầy đủ, có dòng hợp lệ, tổng Nợ = tổng Có trước khi post. Nhập kho có Supplier chỉ cập nhật stock và receipt, chưa sinh đối ứng kế toán/công nợ NCC.

**Cần làm:** account mapping bắt buộc trước posting; rollback toàn use case khi không thể ghi sổ. Xác định rõ nghiệp vụ nhập kho đã nằm trong scope kế toán đến mức nào; không coi receipt hiện tại là vòng mua hàng hoàn chỉnh.

### F09 — P1: Dashboard trả số demo dưới hình thức số liệu thực

**Vị trí:** `DashboardService.cs:85`; `ERPm-FE/src/app/core/services/dashboard.service.ts:53`, `:62`.

Backend thay doanh số 0 bằng 18.450.000, số hóa đơn 0 bằng 12, giá trị kho 0 bằng 325.000.000, công nợ 0 bằng 15.200.000. FE còn đổi lỗi API thành response success với mock. Cửa hàng không bán được hàng hoặc API hỏng vẫn có thể hiển thị KPI dương mà không cho biết dữ liệu là demo.

**Cần làm:** số 0 phải giữ nguyên; lỗi phải có trạng thái lỗi. Demo data chỉ dùng trong chế độ demo được nhận diện rõ và tách khỏi kết quả nghiệp vụ.

### F10 — P1: Computed đang đọc biến thường nên lọc và tổng tiền bị giữ cache

**Vị trí:** `pos.component.ts:70`, `:102`, `:115`; `CRM/partners.component.ts:65`; `WMS/inventory.component.ts:126`.

`searchKeyword`, `discountAmount`, `activeTypeTab`, `selectedWarehouseId` là property thường nhưng được đọc trong `computed`. Angular chỉ theo dõi các signal dependency. Sau lần tính đầu, đổi các property trên không làm computed tính lại cho đến khi một dependency signal khác thay đổi.

Đã tái hiện bằng biểu thức trích trực tiếp từ source trên Angular 17.3.12: tìm Pen trong danh sách 2 hàng vẫn trả 2; subtotal 100, đổi discount 20 vẫn ra total 100; chuyển CRM sang tab Customer vẫn trả cả Customer và Supplier. Discount vẫn được đưa vào request nên số tiền FE hiển thị và BE lưu có thể khác nhau.

**Cần làm:** dùng Signals/FormControl chuyển sang signal một cách nhất quán cho state đầu vào; kiểm tra tổng tiền hiển thị, tiền trả và tổng backend.

### F11 — P1: Ghi signal trong reactive context bị Angular hiện tại từ chối

**Vị trí:** `pos.component.ts:90`; `inventory.component.ts:107`; `sales.service.ts:93`; `stock.service.ts:110`; `branch-tree-select.component.ts:32`, `:59`.

Effect của POS gọi `loadInvoices`, effect kho gọi `loadBalances`; cả hai method đồng bộ gọi `isLoading.set(true)`. Angular 17 đang cài mặc định không cho signal write trong effect khi chưa có lựa chọn phù hợp. Callback của hai effect đã được chạy trong watch context tương đương và bị từ chối tại phép ghi này. Việc reload theo chi nhánh có thể dừng trước HTTP request.

`displayedTree` còn cập nhật `expandedIds` ngay bên trong `computed`; đã tái hiện bị từ chối khi tìm tên nhánh khớp. Không nên chữa lỗi computed bằng cách bật quyền ghi: hàm suy diễn cần thuần, việc mở node nên xử lý riêng.

**Cần làm:** tách tải dữ liệu/side effect khỏi biểu thức suy diễn, tránh vô tình track state dịch vụ; xác minh bằng integration test trên phiên bản Angular thực tế. Các kiểm tra hiện tại chạy không DOM, chưa thay thế kiểm thử điều hướng trình duyệt.

### F12 — P1: Chi nhánh trên chứng từ có thể khác chi nhánh sở hữu kho

**Vị trí:** `SalesInvoiceService.cs:77`; `StockService.cs:96`; `pos.component.ts:216`.

Server tin BranchId client gửi nếu > 0, chỉ suy ra từ warehouse khi BranchId không có. FE lấy chi nhánh đang chọn, nhưng kho mặc định là kho đầu tiên trong tập đã bao gồm các nhánh con. Chọn nhánh cha có thể tạo invoice/journal thuộc cha, trong khi tồn giảm ở kho thuộc con. API cũng chấp nhận hai ID thuộc hai nhánh không liên quan nếu đều tồn tại.

**Cần làm:** định nghĩa chi nhánh phát sinh cụ thể khi thao tác ghi, kiểm tra kho/chi nhánh/quyền tại server, tách scope xem tổng hợp khỏi scope lập chứng từ. Không fallback kho ID 1 khi chưa có kho phù hợp.

### F13 — P1: Script ghi là production nhưng xóa toàn bộ bảng nghiệp vụ

**Vị trí:** `ERPm-BE/database/erpm_schema.sql:3`, `:40`.

Script bắt đầu bằng hàng loạt `DROP TABLE ... CASCADE`, gồm invoices, stock documents và journals. Nếu dùng lại như script nâng cấp sẽ mất dữ liệu kể cả Posted. Không có transaction bao toàn bộ script. Lượt review không chạy script này.

**Cần làm:** phân biệt reset cho database thử nghiệm với migration không mất dữ liệu; hướng dẫn startup không đưa reset vào đường nâng cấp. Đây là rủi ro trực tiếp từ nội dung file hiện có, không khẳng định đã xảy ra mất dữ liệu.

### F14 — P2: Sales/Purchase order mới có CRUD khung, thiếu use case xử lý đơn

**Vị trí:** `ERPm.API/Controllers/SD/SalesOrdersController.cs:15`, `PUR/PurchaseOrdersController.cs:15`; `BaseCrudService.cs:74`, `:99`; DTO order và entities.

Các controller dùng generic service mặc định, chưa có override tính `SubTotal/TotalAmount`, sinh số đơn hoặc kiểm soát chuyển trạng thái. DTO cho phép bỏ OrderNumber nhưng entity/DB yêu cầu mã. Dù gửi mã hợp lệ, chưa có logic tính header totals từ các dòng. GET mặc định không Include các dòng đơn. Confirm cũng dùng DTO update toàn bộ thay vì command trạng thái riêng; không chặn confirm đơn Cancelled/Completed. Chưa nên coi đây là phân hệ đặt hàng hoàn chỉnh.

**Cần làm:** service/use case riêng cho order aggregate, tính toán server, load detail đầy đủ, bảo vệ chuyển trạng thái và giới hạn sửa/xóa. Chưa khẳng định mất dòng khi confirm vì chưa chạy EF integration test.

### F15 — P2: So sánh JSONB chỉ đếm số key nên có thể bỏ sót cập nhật thuộc tính

**Vị trí:** `ApplicationDbContext.cs:56`, `:173`; `ItemService.cs` phần UpdateItemAsync.

`ValueComparer<Dictionary<string, object>>` coi hai dictionary bằng nhau khi cùng Count, không so key/value. Đổi `{color: "Đỏ"}` thành `{color: "Đen"}` có thể không đánh dấu property Attributes đã thay đổi. Snapshot chỉ shallow copy, cũng không bảo vệ tốt dữ liệu object lồng nhau.

**Cần làm:** so sánh nội dung và snapshot phù hợp với JSON được hỗ trợ; kiểm thử lưu lại một thuộc tính mà số key không đổi trên PostgreSQL.

### F16 — P2: Contract từ điển BE và FE không khớp

**Vị trí:** `ERPm.Application/DTOs/Localization/LocalizationDtos.cs:13`; `LocalizationController.cs:31`; `localization.service.ts:520`, `:528`.

Backend trả `data: {languageCode, entries}`, FE khai báo `data` là dictionary phẳng rồi spread trực tiếp. Bản dịch DB không ghi đè đúng vào dictionary; fallback có sẵn che lỗi. Kiểm tra phép merge với response đúng contract BE cho thấy key thử vẫn hiển thị fallback, không dùng giá trị trong entries.

Ngoài ra còn text Việt hard-code trong dashboard, hóa đơn, placeholder, form validation, backend message và comments. Một số key dashboard đang dùng không có trong fallback. Chưa có xử lý Accept-Language phía BE. Yêu cầu i18n/comment English chưa hoàn thành 100%.

**Cần làm:** thống nhất DTO, đọc `entries`, thêm contract test, kiểm tra key thiếu và dùng thông báo theo resource. Sửa nội dung comment source theo quy định hiện tại.

### F17 — P2: Phân trang bị bỏ ở FE và state item bị chia sẻ sai phạm vi

**Vị trí:** `ItemService.cs:50`; `ERPm-FE/src/app/core/services/item.service.ts:130`, `:138`; `items.component.html:114`.

API mặc định trả 20 item; FE chỉ giữ `data.items`, bỏ tổng số/trang và vẽ một nút trang 1. POS chỉ tìm cục bộ trong tập item đang có nên hàng ngoài trang đầu không tìm thấy. `ItemService` là singleton, cùng một signal `items` dùng cho tìm kiếm catalog, POS và chọn item nhập kho; dữ liệu tra cứu màn hình này có thể bị request màn hình khác thay thế. Request tìm kiếm chưa hủy response cũ, có nguy cơ response tới chậm ghi đè kết quả mới.

**Cần làm:** phân trang/thông tin tổng đúng; endpoint/search cho POS; state theo mục đích màn hình; debounce và hủy request cũ khi tìm kiếm.

### F18 — P2: Các shortcut dashboard trỏ tới route không tồn tại

**Vị trí:** `dashboard/dashboard.component.html:112`; `ERPm-FE/src/app/app.routes.ts:8`.

Các link `/wms/catalog`, `/sd/pos`, `/wms/inventory`, `/crm/partners` không có trong router; router hiện dùng `/catalog`, `/sales`, `/inventory`, `/partners`. Chúng đi vào wildcard rồi quay về dashboard. Đã kiểm tra tập route/link bằng script, chưa kiểm thử trình duyệt.

**Cần làm:** thống nhất routes sau refactor module; kiểm tra điều hướng từ sidebar, shortcut và deep link.

### F19 — P2: Dashboard chưa nhất quán về chi nhánh, ngày và trạng thái

**Vị trí:** `dashboard.component.ts:19`; `DashboardService.cs:22`, `:47`, `:56`.

Component tải metrics không truyền chi nhánh và không theo dõi selector. Backend có lọc cho một số query, nhưng low-stock và customer debt vẫn là toàn hệ thống. Hôm nay tính từ UTC 00:00, nên nếu ngày nghiệp vụ theo Việt Nam sẽ sai trong khoảng 00:00–06:59. Query doanh thu không lọc Posted và không có cận trên ngày; khi thêm Draft/Cancelled có thể bị cộng vào số liệu.

**Cần làm:** chốt timezone/ngày nghiệp vụ, định nghĩa phạm vi KPI và chỉ lấy trạng thái hợp lệ. Nếu master data/công nợ chủ đích dùng chung, nhãn và báo cáo phải nói rõ phạm vi.

### F20 — P2: Kiểm thử và tự động kiểm tra chưa đủ để bảo vệ refactor

**Vị trí:** `ERPm-FE/src/app/app.component.spec.ts:20`; cấu trúc solution/repository.

Chưa thấy project test BE hoặc CI pipeline trong checkout. FE chỉ có test template mặc định, còn truy cập `app.title` và mong `Hello, client`, không khớp component thật; kiểm tra TypeScript test fail TS2339. TestBed cũng chưa cấu hình các dependency mà component hiện sử dụng. Build production không biên dịch/kiểm tra phần spec này nên build xanh không chứng minh tests xanh.

**Cần làm:** trước hết có test PostgreSQL cho posting, concurrency, payment và migrations; test component cho tính tổng/tìm kiếm; bỏ hoặc sửa test scaffolding không còn ý nghĩa. Chưa chạy Karma vì test compilation đã fail.

### F21 — P2: Cấu hình triển khai và lỗi API còn ở mức phát triển

**Vị trí:** các FE core services; `ERPm.API/appsettings.json`; `ExceptionHandlingMiddleware.cs:34`; `launchSettings.json`.

FE hard-code `http://localhost:5000` trong nhiều service: máy người dùng/mobile sẽ gọi chính máy đó, HTTPS deployment cũng không phù hợp. Cấu hình DB có password và bật Include Error Detail; middleware đưa `exception.Message` ra response và mọi exception thành HTTP 500. CORS mở toàn bộ origin. Swagger đặt ở root trong code nhưng launch URL/tài liệu còn `/swagger`.

**Cần làm:** API base URL theo môi trường hoặc proxy; phân loại lỗi validation/not-found/conflict; response lỗi không lộ chi tiết nội bộ; secrets theo môi trường; origin theo triển khai. Không sao chép giá trị password vào báo cáo.

### F22 — P2: Tài liệu và tiêu chí hoàn thành đang đi trước source

**Vị trí:** root/BE/FE `.ai/status.md`, roadmap, README và PROJECT_MASTER; các step cũ.

Root roadmap chưa đánh dấu các sprint đã triển khai nhưng status gần như mọi mục 100%. Có chỗ dùng .NET 8/10 và Angular 18/17 lẫn nhau; status FE vẫn mô tả 5 submodule cũ trong khi .gitmodules có 10 module hiện hành. Hướng dẫn chạy còn `src/ERPm.API`, `client/`, `database/` tại root dù code đã chuyển vào BE/FE. Hai nhật ký cùng số step 13. Commit gần đây chưa theo cú pháp `[tag]` đã quy định.

**Cần làm:** cập nhật trạng thái theo acceptance có bằng chứng; giữ lịch sử cũ nhưng gắn nhãn rõ; dùng lệnh chạy thực tế theo layout hiện tại. Báo cáo này và status root mới là mốc đánh giá 2026-10-29.

## Khoảng trống thiết kế cần đưa vào backlog

- Có enum Draft/Posted/Cancelled nhưng chưa có vòng đời post/cancel/reversal đầy đủ. Không thấy endpoint sửa/xóa invoice Posted hiện tại, nên không kết luận đang có API hard-delete invoice; tuy nhiên chưa có hàng rào tập trung để bảo vệ khi mở rộng tính năng. SQL reset vẫn là ngoại lệ nguy hiểm đã nêu F13.
- Auditing chỉ tự điền thời gian; chưa có current-user service điền CreatedBy/LastModifiedBy/DeletedBy. Đây là điểm cần hoàn thiện cùng authentication.
- SalesInvoiceItem chưa snapshot đầy đủ tên hàng/đơn vị: lịch sử lấy tên từ danh mục hiện tại, đổi tên/xóa mềm item có thể làm cách hiển thị chứng từ cũ thay đổi.
- Nhập kho lặp cùng ItemId trong một request khi chưa có balance: query DB không tìm các entity mới Added chưa lưu, có nguy cơ tạo trùng cặp kho/item rồi lỗi unique constraint. Nên gộp dòng hoặc quản lý balance trong bộ nhớ theo khóa trong cùng use case; cần integration test.
- Generic CRUD chưa thực hiện Keyword và SortBy như mô tả API; page size không có giới hạn trên. Không dùng generic CRUD trực tiếp để thay thế use case giao dịch tài chính.
- GIN indexes có trong SQL thủ công nhưng chưa được khai báo tương ứng trong EF model. Cần đồng bộ cùng F01; không kết luận database đang chạy thiếu index vì chưa kiểm tra database thật.
- Layout đã có token/theme, bảng desktop và phần responsive, nhưng dropdown tùy biến còn thiếu thao tác keyboard/ARIA; một số input chưa nối label-for/id; viewport tắt zoom. Cần kiểm thử responsive và accessibility trên browser thật.
- In hóa đơn hiện gọi `window.print()`; chưa có CSS `@media print`/`@page` trong source, chưa cấu hình K80/A4/A5 hoặc in native. Không coi là nghiệm thu in nhiệt.
- Dependency Dapper hiện chưa thấy được sử dụng cho query báo cáo; không bắt buộc thay EF bằng Dapper khi chưa có số liệu đo hiệu năng.

## Kết quả kiểm tra đã chạy

| Kiểm tra | Kết quả | Ý nghĩa và giới hạn |
| --- | --- | --- |
| `git status --short`, `git submodule status --recursive`, logs root/BE/FE | Checkout ban đầu sạch, submodule đã có | Không fetch/push hoặc thay pointer |
| `dotnet --info` | SDK 8.0.400; không có SDK 10 trong kết quả | Giới hạn máy hiện tại |
| `dotnet build ERPm.sln --no-restore` trong BE | Fail NETSDK1045 ở 4 projects | Chưa xác minh compile/restore với .NET 10; không dùng lỗi này để kết luận source C# sai |
| `npm.cmd run build` trong FE, lần đầu | Fail tải font Google vì kết nối mạng bị hạn chế | Lỗi môi trường build; không thay config để che lỗi |
| Chạy lại production build với kết nối mạng được cấp phép | Exit 0, initial bundle 707,29 kB; 2 warning | Budget 500 kB vượt 207,29 kB; Stencil empty-glob. Không phải build 0 warning |
| `.\node_modules\.bin\tsc.cmd --noEmit -p tsconfig.spec.json` | Fail TS2339 tại app.component.spec.ts:20 | Tests chưa qua bước compile; không chạy Karma tiếp |
| Node + Angular runtime: trích biểu thức computed từ source POS/CRM | Tái hiện total và bộ lọc giữ cache sai | Không DOM/API; không phải e2e |
| Node + Angular `createWatch`, callback effect trích source | POS/Inventory bị từ chối ghi signal | Dùng cùng cơ chế watch và mặc định không cho ghi của Angular đang cài |
| Node + TypeScript transpile biểu thức displayedTree thật | Tái hiện signal write bị từ chối trong computed khi tìm nhánh | Không DOM |
| Đối chiếu routes/shortcut và phép merge bundle localization | Phát hiện route thiếu và contract sai | Kiểm tra cấu trúc/cục bộ |
| Đối chiếu model/migration/SQL bằng script đọc file | Model 23 bảng, migration 9 bảng cũ; SQL hiện cũng khai báo 23 bảng | Không thực thi DDL, không xác minh DB production |

Các phép tái hiện chạy bằng script Node truyền qua stdin; không thêm dependency hoặc sửa source ứng dụng. Không chạy SQL reset, migration, seeder hay giao dịch tài chính. Không cài SDK hoặc thay đổi cấu hình hệ thống.

## Thứ tự xử lý đề xuất và điều kiện nghiệm thu

1. **Ổn định môi trường và schema:** có SDK 10 phù hợp, restore/build BE thật; thống nhất migrations với model; bootstrap DB thử nghiệm rỗng và upgrade bản cũ không mất dữ liệu; kiểm tra seed cần thiết.
2. **Sửa lỗi hành vi FE rõ ràng:** computed/effect, tính tổng và chiết khấu, routes, i18n contract, phân trang. Kiểm tra trên browser cả mobile/desktop.
3. **Bảo vệ dữ liệu thật:** authentication/phân quyền; validation và warehouse/branch consistency; số chứng từ và idempotency; concurrency kho/công nợ.
4. **Đối chiếu kho–kế toán:** thống nhất costing, thanh toán một phần/tiền thừa, tài khoản bắt buộc, vòng đời Posted và reversal. Test phải kiểm tra cả invoice/stock/partner/journal, không chỉ HTTP 200.
5. **Làm dashboard và hồ sơ tiến độ phản ánh dữ liệu thật:** bỏ demo fallback; ngày/trạng thái/phạm vi chi nhánh đúng; CI build/test; cập nhật tài liệu theo acceptance rồi mới tiếp tục PUR/Sổ quỹ.

Tiêu chí tối thiểu: DB mới chạy được từ checkout; dữ liệu 0 hiển thị 0; bán/nhập không tạo tồn sai khi chạy đồng thời; giảm tồn và ghi giá vốn cùng phương pháp; thanh toán 0/một phần/đủ/thừa đúng cả sổ và công nợ; retry không nhân đôi chứng từ; người dùng không đọc/ghi ngoài quyền; FE không báo lỗi reactive context và không hiển thị tổng tiền cũ.
