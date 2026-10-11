# 🚀 STEP 00: PHÂN TÍCH KIẾN TRÚC, KẾ HOẠCH TỔNG THỂ & THIẾT LẬP NGUYÊN TẮC PHÁT TRIỂN

> **Thời gian thực hiện:** 2026-10-11  
> **Người thực hiện:** AI Agent  
> **Giai đoạn:** Khởi động dự án (Inception & Architecture Planning)  

---

### 1. Mục tiêu của bước
1. Phân tích bài toán phần mềm kế toán phát triển tinh gọn (Mini ERP / Sales & Inventory) nhưng có khả năng mở rộng không giới hạn thành hệ thống kế toán doanh nghiệp hoàn chỉnh.
2. Thiết lập quy chuẩn kiến trúc cho toàn bộ hệ sinh thái:
   - Backend: C# .NET 8 Clean Architecture.
   - Database: PostgreSQL với thiết kế sẵn sàng cho Bút toán kép (Double-Entry Bookkeeping).
   - Frontend: Angular Standalone + Ionic Framework tối ưu Hybrid (Web Desktop + Mobile App sẵn sàng đóng gói Capacitor).
3. Thiết lập hệ thống tài liệu quản trị AI (`PROJECT_MASTER.md`, `AGENTS.md`, `.ai/` tracking folder).

---

### 2. Phân tích Chuyên sâu Nghiệp vụ Kế toán & Tồn kho có khả năng mở rộng

#### 2.1. Vấn đề của các phần mềm bán hàng thông thường
Hầu hết các phần mềm bán hàng mini (POS) khi bắt đầu thường thiết kế bảng dữ liệu rất đơn giản:
- Bán hàng chỉ lưu bảng `Orders` và trừ thẳng cột `Quantity` trong bảng `Products`.
- Khi doanh nghiệp lớn lên cần tính: **Giá vốn đích danh/Bình quân gia quyền**, **Báo cáo Lợi nhuận gộp**, **Đối chiếu công nợ nhà cung cấp**, **Bút toán Nợ/Có**, hệ thống cũ **hoàn toàn sụp đổ** và phải code lại từ đầu.

#### 2.2. Giải pháp Kiến trúc của ERPm: "Hạt nhân Kế toán ngầm" (Embedded Accounting Kernel)
Dù giao diện người dùng ban đầu chỉ là: **Quản lý Hàng hóa (ITEM) -> Quản lý Khách hàng -> Nhập/Xuất Kho -> Bán hàng POS -> Xem Dashboard**, nhưng bên dưới CSDL áp dụng mô hình chuẩn:
1. **Mô hình Chứng từ (Document / Voucher Header - Lines Pattern):**
   - Mỗi giao dịch là một chứng từ có số hiệu (`Code`), ngày chứng từ (`DocDate`), ngày ghi sổ (`PostingDate`), và trạng thái (`Draft` -> `Posted` -> `Cancelled`).
2. **Nguyên tắc Sổ Tồn kho (Stock Transaction Ledger):**
   - Số tồn kho không bao giờ được cập nhật bằng lệnh update đơn thuần `Stock = Stock - 5`.
   - Mỗi lần xuất/nhập/điều chuyển tạo ra một dòng `StockTransaction` (hoặc `StockIssueItem`, `StockReceiptItem`). Số tồn kho của sản phẩm tại một kho luôn bằng: `Tổng nhập - Tổng xuất`.
3. **Mô hình Bút toán kép (Double-Entry Ledger):**
   - Thiết kế sẵn 2 bảng: `JournalEntries` (Số chứng từ, Ngày, Diễn giải) và `JournalEntryLines` (Tài khoản Nợ/Có, Số tiền).
   - Khi Hóa đơn bán hàng chuyển sang trạng thái `Posted`, hệ thống tự động sinh bút toán:
     - Nợ 111/112/131
     - Có 511, Có 3331
     - Nợ 632 / Có 156 (hạch toán giá vốn)
   - Nhờ đó, việc mở rộng phân hệ Báo cáo Tài chính ở Giai đoạn 3 chỉ đơn giản là mở giao diện Sổ cái và đọc dữ liệu đã tích lũy từ Giai đoạn 1!

---

### 3. Đánh giá Công nghệ Frontend Hybrid: Tại sao chọn Ionic + Angular?

Người dùng yêu cầu Web App chạy mượt, giao diện thuận tiện cho Mobile và build Mobile sau này:

| Giải pháp | Đánh giá | Quyết định |
| :--- | :--- | :---: |
| **Ionic Framework + Angular** | - Cung cấp sẵn hơn 100 Mobile UI components tối ưu touch, gestures, transitions.<br>- Hỗ trợ Responsive Layout (màn hình lớn tự động chuyển sang Desktop split-view/sidebar).<br>- Tích hợp hoàn hảo với **Capacitor** để đóng gói ra iOS/Android chỉ bằng 1 câu lệnh.<br>- Tận dụng 100% sức mạnh của Angular 18 (Standalone components, Signals, Typed Forms). | **Lựa chọn số 1 (Đã chốt)** |
| **Flutter** | Cần viết 2 codebase khác nhau (Dart cho Mobile/Web và C# cho API). Giao diện Web của Flutter nặng và SEO/Desktop kém hơn Angular. | Không chọn |
| **React Native** | Không tương thích với stack Angular của dự án. | Không chọn |
| **Angular Material thuần** | Giao diện Desktop rất đẹp nhưng trên Mobile cảm ứng, navigation bar và camera barcode scanner rất khó tối ưu như Ionic. | Không chọn |

---

### 4. Thiết kế Kiến trúc Đa ngôn ngữ (i18n) Anh - Việt
Hệ thống giải quyết triệt để 2 bài toán:
1. **Từ điển tĩnh (Static UI Dictionary):**
   - Bảng `app_languages` (`code`, `name`, `is_default`, `is_active`) quản lý danh sách ngôn ngữ.
   - Bảng `app_dictionaries` (`language_code`, `category`, `key`, `value`) lưu trữ các nhãn giao diện, nút bấm, tiêu đề cột và thông báo lỗi.
   - API trả về bundle từ điển để Frontend cache (LocalStorage/IndexedDB) và dịch tức thời qua Pipe/Signal.
2. **Dữ liệu danh mục động (Dynamic Master Data Localization):**
   - Tên sản phẩm, đơn vị tính, danh mục, mẫu in hóa đơn song ngữ sử dụng cột `Translations` (JSONB) trong PostgreSQL: `{"vi": "Áo thun cotton", "en": "Cotton T-shirt"}`.
   - Tránh phình to số bảng join, truy vấn cực nhanh nhờ GIN index của PostgreSQL.

---

### 5. Các file đã tạo trong bước này
- `PROJECT_MASTER.md`: Bộ quy chuẩn toàn diện về kiến trúc, coding standards, database schema, hybrid UI, chuẩn đa ngôn ngữ và quy tắc AI.
- `AGENTS.md`: Chỉ dẫn cho AI Agents đọc và làm việc tự động trong workspace.
- `.ai/roadmap.md`: Lộ trình chi tiết từng Sprint từ Giai đoạn 1 đến Giai đoạn 4.
- `.ai/status.md`: Bảng theo dõi tiến độ và Architectural Decisions (ADR-01 đến ADR-04).
- `.ai/steps/README.md`: Hướng dẫn và template chuẩn cho việc lưu vết của AI.
- `.ai/steps/step-00-architecture-and-planning.md`: Bản ghi chi tiết bước phân tích này.

---

### 6. Kế hoạch tiếp theo (Step 01)
1. Tái cấu trúc solution .NET 8 sang mô hình Clean Architecture 4 tầng:
   - `ERPm.Domain`
   - `ERPm.Application`
   - `ERPm.Infrastructure`
   - `ERPm.API`
2. Tạo các Entity cơ bản cho phân hệ ITEM (`Item`, `Category`, `UnitOfMeasure`), Partner (`Partner`), và Localization (`AppLanguage`, `AppDictionary`).
3. Cài đặt các thư viện Npgsql EF Core và Dapper.
