# [spike] Quy tắc code C# của HRM9 nào áp dụng được cho ERPm

> **Loại:** spike
> **Ngày tạo:** 2026-10-31 · **Người làm:** Thiện (cùng AI) · **Người yêu cầu:** Thiện
> **Trạng thái:** Done (phần khảo sát). Các đề xuất ở mục 5 chờ nhóm quyết định.
> **Liên quan:** `PROJECT_MASTER.md` §2.2 (quy tắc C#), Step 20 (phạm vi dữ liệu / IAM), Step 21 (Notification Engine, outbox)

## 1. Mô tả
- Câu hỏi: HRM9 là hệ thống chạy thật nhiều năm (.NET Framework, MVC5, stored procedure, SQL Server). Trong bộ quy tắc backend của nó, quy tắc nào đáng đưa vào ERPm (.NET 10, EF Core, PostgreSQL), quy tắc nào không nên copy, và ERPm đã có sẵn phần nào?
- Nguồn đã đọc: wiki HRM9 (`rules/hrm9-backend-coding-rules`, `rules/coding-naming-conventions`, `patterns/backend-save-changes`, `backend-bulk-operations`, `backend-create-queryable`, `backend-object-mapping`, `backend-data-access`) và `AGENTS.md` của backend HRM9.
- Chỉ lấy **nguyên tắc**. Cách làm cụ thể của HRM9 (store, `object[]`, MVC) không áp dụng.

## 2. Phân tích

### 2.1 Nên áp dụng (12 quy tắc, xếp theo giá trị)
| # | Quy tắc | Vì sao (HRM9 đã trả giá) | Làm trong ERPm |
|---|---|---|---|
| 1 | **Trace trước khi sửa.** Đổi một trường thì liệt kê đủ mọi chỗ chứa nó rồi mới sửa | HRM9 có 8 tầng; thêm cột mà sót một tầng thì mất dữ liệu âm thầm, và là lý do PR bị trả nhiều nhất | Một trường mới đi qua: Entity → cấu hình EF + migration → DTO Create/Update/Response → Mapster → FE service/model → cột lưới/form → khoá từ điển vi + en (cả hai file từ điển) |
| 2 | **Không truy vấn DB trong `foreach`/`for`.** Lấy cả lô một lần, tra bằng `Dictionary`/`HashSet` | Là quy tắc review bắt buộc của HRM9; N+1 là lỗi hiệu năng số 1 khi dữ liệu lớn | `ids.Contains(...)` rồi `.ToDictionary(x => x.Id)` |
| 3 | **Query chỉ đọc dùng `AsNoTracking()`**, trả DTO bằng `Select`/`ProjectToType`, không nạp cả entity | Tương đương luật `ProxyCreationEnabled = false` của HRM9 | Mọi hàm `List/Get/Report/Export` |
| 4 | **Một cửa duy nhất cho truy vấn có phân quyền dữ liệu.** Không ai gọi thẳng `context.Employees` trong query nghiệp vụ | `CreateQueryable` của HRM9 tự áp: lọc xoá mềm + phạm vi dữ liệu của user + loại nhân viên đã nghỉ. Nhờ vậy không màn nào quên lọc | Một extension kiểu `.ForScope(scope)` dựa trên DataScope của Step 20. Danh mục dùng chung thì **liệt kê rõ** ngoại lệ, không để mặc định là "không lọc" |
| 5 | **Xoá mềm mọi nơi, lọc ở một chỗ** | HRM9 phải nhớ viết `IsDelete = 0` trong từng store nên hay quên | ERPm đã có `HasQueryFilter(!IsDeleted)` và chỉ mục duy nhất `HasFilter("is_deleted = false")`. Entity mới **phải** có cả hai. `IgnoreQueryFilters()` chỉ dùng có chủ đích, ghi lý do |
| 6 | **Lỗi âm thầm cần test bắt.** HRM9 liệt kê 3 loại không báo lỗi: cột SP mới không map, tham số SP sai thứ tự, thiếu khoá dịch | Review code tĩnh không thấy; chỉ lộ khi nhìn giao diện hoặc số liệu sai | Bản ERPm: (a) Mapster thiếu thành viên đích, (b) Dapper không khớp tên cột, (c) khoá từ điển vi/en thiếu hoặc lệch giữa hai file, (d) enum thêm giá trị mà chưa có nhãn. Mỗi loại một check trong `tests/ERPm.Verification` |
| 7 | **Kiểm tra hợp lệ toàn bộ trước khi ghi**, lỗi trả mã có dịch | `OnValidateData` trước `UpdateOrCreate` | ERPm đã làm bằng `BusinessException` + `ApiExceptionMiddleware` + FluentValidation. Giữ nguyên, **không** chuyển sang kiểu `ActionStatus` của HRM9 |
| 8 | **Danh sách phân trang phía server, có trần kích thước trang, cột sắp xếp trong danh sách cho phép.** Xuất file dùng chung bộ lọc với danh sách, có "xuất mục đã chọn" và "xuất tất cả" | HRM9 buộc store `_list` có `@IsExport/@ValueFields/@ListIds`; thiếu trần thì một màn kéo cả bảng lên | Một `PagedRequest` + `PagedResult<T>` dùng chung; hàm xuất nhận cùng `FilterQuery` |
| 9 | **Hiệu ứng phụ chạy sau commit và không được mất** (gửi mail, đồng bộ hệ thống ngoài, tính lại dữ liệu phụ thuộc) | HRM9 dùng `Task.Run` sau `SaveChanges`: tiến trình sập là mất việc, không thử lại được. **Đây là chỗ HRM9 làm chưa tốt** | ERPm đã có outbox cho thông báo (`NotificationOutbox` + `NotificationOutboxWorker`, Step 21). Khi cần hiệu ứng phụ khác, mở rộng cơ chế này, không dùng `Task.Run` |
| 10 | **Khoá kỳ kiểm ngay trong đường lưu.** Kỳ công/lương/kế toán đã khoá thì mọi ghi vào kỳ đó bị chặn ở một chỗ | `CheckLock()` là bước 2 của pipeline lưu HRM9 nên không màn nào qua mặt được | `SaveChangesAsync` của ERPm đã chặn chứng từ đã ghi sổ. Khi làm HRM/Payroll, mở rộng cùng chỗ đó cho kỳ công và kỳ lương |
| 11 | **Nhật ký thay đổi theo từng trường** (ai sửa trường nào, từ giá trị nào sang giá trị nào) cho dữ liệu nhạy cảm: lương, hợp đồng, quá trình công tác, tài khoản | `OnChangeTracking` + `Sys_DataLog` của HRM9 là thứ cần khi có tranh chấp | Làm trong `SaveChangesAsync` bằng `ChangeTracker`, bật theo cấu hình cho từng entity |
| 12 | **Import chịu lỗi:** một dòng sai không làm hỏng cả file, báo lại đúng dòng sai | `InsertArrayTrying` của HRM9 chia đôi lô đến khi cô lập được dòng lỗi | Kiểm tra từng dòng **trước** khi ghi và trả danh sách lỗi theo dòng. Lô lớn dùng `AddRange` hoặc Npgsql `COPY` |

### 2.2 Quy ước nhỏ nên giữ
- `FirstOrDefault(pred)` thay `Where(pred).FirstOrDefault()`; `Any()` thay `Count() > 0`; `Count(pred)` thay `Where(pred).Count()`. Với `IQueryable` EF dịch giống nhau, nhưng với `List` trong bộ nhớ thì có khác.
- Cần tra theo khoá nhiều lần thì dùng `Dictionary`/`HashSet`.
- Không để biến, hàm, `using` thừa. Không `catch {}` rỗng. Không chèn `#region` vào giữa một `#region` đang mở.
- Không copy mẫu từ màn khác khi chưa đọc nó làm gì.

### 2.3 Không nên copy từ HRM9
| HRM9 làm | Vì sao không |
|---|---|
| Logic nghiệp vụ trong stored procedure, truyền tham số bằng `object[]` theo thứ tự | Sai thứ tự không báo lỗi. ERPm dùng EF và DTO có kiểu |
| `try/catch` + log trong **mỗi** hàm rồi `throw` | Log trùng nhiều lần. ERPm đã có `ApiExceptionMiddleware` làm một chỗ |
| Hằng số `IN_HOA_GẠCH_DƯỚI` | Chuẩn .NET là PascalCase; giữ `PROJECT_MASTER.md` §2.2 |
| Một `DbContext` hơn 1.500 thực thể, một controller hơn 10.000 dòng | Khó đọc, khó review. `ApplicationDbContext` của ERPm đã 888 dòng và cấu hình thực thể nằm chung file; nên tách `IEntityTypeConfiguration<T>` theo module trước khi lớn thêm |
| `NOLOCK` | Chỉ có nghĩa với SQL Server; PostgreSQL dùng MVCC, không đọc bẩn |
| Chia nhỏ payload JSON (`RequestChunk`) | Giải quyết giới hạn của MVC5. ASP.NET Core dùng phân trang, stream hoặc tải file lên |
| `Task.Run` sau khi lưu để gửi đồng bộ | Mất việc khi sập (xem quy tắc 9) |
| Khoá dịch ghép tay `{Enum}__{Giá trị}` ở ba nơi khác nhau | ERPm chỉ giữ một từ điển; thêm check như 6(d) |
| Không có test tự động (chính tài liệu HRM9 thừa nhận) | ERPm đã có `ERPm.Verification` và `ERPm.Hrm.Verification`; mỗi quy tắc nên có một check |

### 2.4 ERPm đã có sẵn
| Hạng mục | Ở đâu |
|---|---|
| Lọc xoá mềm toàn cục + chỉ mục duy nhất có điều kiện | `ApplicationDbContext` (`HasQueryFilter`) |
| Audit thời gian/người tạo-sửa, sinh UUIDv7 | `SaveChangesAsync` |
| Chặn sửa/xoá chứng từ đã ghi sổ, buộc đi bằng huỷ/đảo bút toán | `SaveChangesAsync` |
| Đổi lỗi DB thành 409 có mã dịch (trùng khoá, vi phạm tham chiếu, xung đột đồng thời) | `ApiExceptionMiddleware` |
| CRUD khung có điểm móc `Before/After Create/Update/Delete`, `ApplyFilters` | `BaseCrudService` |
| Outbox cho thông báo | `NotificationOutbox`, `NotificationOutboxWorker` |
| `Nullable` bật ở mọi project | các `.csproj` |
| Kiểm tra bằng chương trình riêng | `tests/ERPm.Verification`, `tests/ERPm.Hrm.Verification` |

## 3. Cách làm
- Chỉ đọc tài liệu và đối chiếu code, **không sửa code ERPm**.
- Đối chiếu bằng tìm kiếm trong `ERPm-BE/src`: `HasQueryFilter`, `AsNoTracking` (34 chỗ dùng), `SaveChangesAsync`, `ApiExceptionMiddleware`, `BaseCrudService`, outbox, cấu hình `Nullable`, gói NuGet (FluentValidation, Mapster, Dapper).
- Quét truy vấn trong vòng lặp: 9 chỗ nghi vấn, đọc lại từng chỗ.

## 4. Kiểm tra
- Các mục ở 2.4 đã mở file đối chiếu, không suy từ tên.
- Truy vấn trong vòng lặp: `SalesCancellationService` đọc `StockBalances` cho từng nhóm hàng trong `foreach` (xác nhận). `RoleService` gọi `ValidateScopeAsync` trong `foreach`, **chưa kiểm** hàm đó có truy vấn DB hay không. Các chỗ còn lại là vòng kiểm tra hợp lệ, không truy vấn DB.
- Chưa có thay đổi code nên không có test chạy.

## 5. Việc còn lại
Các đề xuất, chưa làm, chờ nhóm quyết định:

| # | Việc | Độ khó | Lợi |
|---|---|---|---|
| 1 | Bật `TreatWarningsAsErrors` riêng cho cảnh báo nullable (`CS86xx`) | Dễ | Bắt lỗi null lúc build |
| 2 | Check Mapster: `RequireDestinationMemberSource = true` và gọi `Compile()` trong `ERPm.Verification` | Dễ | Bắt lỗi trường mới bị bỏ sót giữa Entity và DTO |
| 3 | Check từ điển: mọi giá trị enum và mọi khoá `error.*` có đủ vi + en, hai file từ điển giống nhau | Dễ | Bắt lỗi "hiện khoá thô" |
| 4 | Soát `SalesCancellationService` (lấy số dư kho theo lô, vẫn giữ khoá từng dòng nếu cần) và `RoleService.ValidateScopeAsync` | Vừa | Hàng nhiều thì nhanh hơn |
| 5 | Một cửa truy vấn có phạm vi dữ liệu (quy tắc 4) khi làm HRM | Vừa | Không màn nào quên lọc phạm vi |
| 6 | Mở rộng outbox hiện có cho hiệu ứng phụ ngoài thông báo (quy tắc 9) | Vừa | Không mất việc khi sập |
| 7 | Nhật ký thay đổi theo trường cho lương, hợp đồng, QTCT (quy tắc 11) | Vừa | Có bằng chứng khi tranh chấp |
| 8 | Tách cấu hình thực thể khỏi `ApplicationDbContext` | Vừa | File dài 888 dòng và sẽ tăng nhanh |

Cách dùng khi review PR: đọc bảng 2.1 theo thứ tự, mỗi dòng trả lời có / không / không liên quan. Đổi một trường thì chạy quy tắc 1. Thấy `foreach` có `await context.` thì xem quy tắc 2.
