# 🤖 AGENTS.MD: HƯỚNG DẪN DÀNH CHO AI AGENT TRONG DỰ ÁN ERPM

Chào bạn AI Assistant, bạn đang làm việc trên dự án **ERPm** - Phần mềm Quản trị Bán hàng, Tồn kho & Kế toán mở rộng (C# .NET 10, PostgreSQL, Angular + Ionic Hybrid).

---

## 📌 QUY TẮC HOẠT ĐỘNG BẮT BUỘC

1. **Đọc tài liệu cốt lõi trước khi thực hiện nhiệm vụ:**
   - [PROJECT_MASTER.md](file:///d:/WORKING%20PLACE/ERPm/PROJECT_MASTER.md): Tài liệu kiến trúc chuẩn, quy ước code và mô hình dữ liệu.
   - [.ai/roadmap.md](file:///d:/WORKING%20PLACE/ERPm/.ai/roadmap.md): Lộ trình phát triển qua các Sprint.
   - [.ai/status.md](file:///d:/WORKING%20PLACE/ERPm/.ai/status.md): Trạng thái hiện tại của dự án và các việc cần làm tiếp theo.

2. **Quy chuẩn lưu vết từng Step vào thư mục `.ai/steps/`:**
   - Mỗi khi bạn hoàn thành một tính năng, cấu hình hoặc sửa đổi kiến trúc lớn, bạn **PHẢI** tạo hoặc cập nhật file log theo định dạng:
     `d:/WORKING PLACE/ERPm/.ai/steps/step-[số thứ tự]-[tên-ngắn-gọn].md`
   - File log cần nêu rõ:
     - Mục tiêu của step.
     - Danh sách file đã tạo / chỉnh sửa.
     - Các lệnh đã chạy (ví dụ `dotnet build`, `dotnet ef migrations add ...`).
     - Kết quả kiểm tra (Verification).
     - Hướng đi cho step tiếp theo.

3. **Cập nhật `.ai/status.md`:**
   - Sau khi ghi log step, cập nhật lại trạng thái: Chuyển các việc đã làm sang **Completed**, cập nhật **In-Progress** và **Next Steps**.

4. **Kỷ luật Kỹ thuật (Technical Discipline):**
   - **Backend (.NET 10):** Tuân thủ Clean Architecture (`Domain` -> `Application` -> `Infrastructure` -> `API`). Không nhồi nhét business logic vào Controllers.
   - **Database (PostgreSQL):** Tiền tệ & số lượng bắt buộc dùng `decimal(18, 4)`. Hỗ trợ Soft-delete và Auditing.
   - **Kế toán & Kho:** Không hard-delete chứng từ giao dịch tài chính đã ghi sổ (`Posted`). Thiết kế bảng sẵn sàng cho Double-Entry Ledger.
   - **Frontend (Angular + Ionic):** Standalone components, Signals, thiết kế Responsive Adaptive (hỗ trợ cả Mobile màn hình nhỏ và Desktop bảng dữ liệu lớn). Toàn bộ Form nhập liệu lưu dữ liệu bắt buộc dùng `FormGroup` (`ReactiveFormsModule`) kết hợp bộ component chuẩn hóa `<app-form-control>` (`FormControlComponent`) và `<app-input-control>` (`InputControlComponent`) nhận `type`, `dataSource`.
   - **Đa ngôn ngữ (i18n):** Mọi thông báo lỗi, nhãn giao diện và master data (Item, Category) phải tuân thủ chuẩn đa ngôn ngữ Anh - Việt qua từ điển `app_dictionaries` và JSONB translations.
   - **Code Comments (English Only):** Toàn bộ comment trong mã nguồn (Backend C#, Frontend TypeScript/HTML/SCSS, SQL scripts) bắt buộc 100% bằng Tiếng Anh (English comments only). Không viết comment tiếng Việt trong source code.

5. **Quy tắc Git Commit (Commit Message Convention):**
   - Mọi lệnh `git commit` trên repo gốc, `ERPm-BE`, `ERPm-FE` và các Submodules bắt buộc tuân thủ cú pháp:
     `[tag] nội dung commit` hoặc `[tag](MODULE) nội dung commit`
   - **Bộ 6 Tag chuẩn:**
     - `[add]`: Thêm mới tính năng, bảng, API, màn hình, thành phần.
     - `[update]`: Cập nhật nghiệp vụ, nâng cấp cấu trúc, thay đổi yêu cầu hoặc tối ưu hiệu năng/UI.
     - `[fix]`: Sửa lỗi (bug logic, lỗi giao diện, lỗi build/SQL).
     - `[refactor]`: Tái cấu trúc mã nguồn (gom hàm, tách file) không làm thay đổi nghiệp vụ.
     - `[db]`: Thay đổi riêng về SQL Schema, EF Migration, Index, Seed data.
     - `[docs]`: Cập nhật tài liệu (`PROJECT_MASTER.md`, `AGENTS.md`, `.ai/`).

---

## 📂 THƯ MỤC AI CẦN BIẾT
- `.ai/` : Thư mục lưu vết kế hoạch và tiến độ của AI.
- `.ai/steps/` : Nơi lưu chi tiết từng bước thực thi.
- `PROJECT_MASTER.md` : Single Source of Truth về kiến trúc và coding conventions.
