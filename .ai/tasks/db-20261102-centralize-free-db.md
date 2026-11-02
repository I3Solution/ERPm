# [db] Thiết lập Centralized Cloud PostgreSQL miễn phí cho Team (3 người)

> **Loại:** db  
> **Ngày tạo:** 2026-11-02 · **Người làm:** Phúc · **Người yêu cầu:** Phúc (Tech Lead)  
> **Trạng thái:** Doing  
> **Liên quan:** Toàn bộ dự án ERPm (BE, FE, DB sync giữa Phúc, Thiện, Lợi)  

---

## 1. Mô tả
- **Bối cảnh:** Hiện tại 3 thành viên (Phúc, Thiện, Lợi) đều đang chạy PostgreSQL riêng trên máy local. Dữ liệu Master data (Công ty, Chi nhánh, Phòng ban, Chức danh, Tài khoản nhân sự, Khách hàng, Sản phẩm) và các chứng từ test bị phân mảnh, không đồng bộ được luồng kiểm thử thực tế giữa FE và BE.
- **Yêu cầu:** Thiết lập một cơ sở dữ liệu PostgreSQL tập trung trên Cloud hoàn toàn miễn phí (Serverless PostgreSQL), có tính năng kết nối SSL an toàn, hoạt động 24/7 để cả 3 người cùng trỏ `DefaultConnection` về một nơi.

## 2. Phân tích & Lựa chọn giải pháp
1. **Neon.tech (Đề xuất số 1):**
   - Bản miễn phí: 0.5 GB lưu trữ, 100 giờ tính toán active/tháng (với tính năng tự ngủ khi idle và tự thức dậy sau 500ms khi có request gọi tới).
   - Tương thích 100% với EF Core & Npgsql trên .NET 10.
   - Hỗ trợ Connection Pooling sẵn (PgBouncer trên port 6543 hoặc port 5432).
2. **Supabase.com (Đề xuất số 2):**
   - Bản miễn phí: 500 MB lưu trữ, có Web UI Table Editor xem dữ liệu trực quan rất mạnh mẽ.
   - Chạy ổn định 24/7.
3. **Quy chuẩn bảo mật:**
   - Connection string chứa mật khẩu chỉ lưu trong `ERPm-BE/src/ERPm.API/appsettings.local.json` (đã có trong `.gitignore`).
   - Tuyệt đối không commit credential lên repository.

## 3. Cách làm (Quy trình thực hiện)
1. Khởi tạo Project PostgreSQL trên nền tảng Cloud (Neon / Supabase).
2. Lấy chuỗi kết nối Npgsql chuẩn (.NET EF Core).
3. Cập nhật `appsettings.local.json` trên máy Phúc.
4. Chạy `dotnet ef database update` để migrate toàn bộ 23+ bảng của hệ thống lên Cloud DB.
5. Chạy seed data cơ bản (Tập đoàn, Công ty, Chi nhánh, Admin, Từ điển).
6. Chia sẻ connection string nội bộ cho Thiện và Lợi cấu hình vào máy cá nhân.

## 4. Kiểm tra
- `dotnet ef database update` thành công không lỗi.
- `dotnet run --project tests/ERPm.Verification` kiểm tra kết nối và truy vấn đạt.
- 3 máy cùng đọc được danh sách User / Chi nhánh / Mặt hàng.

## 5. Việc còn lại
- Đang thực hiện: Phúc tạo tài khoản và project Cloud DB, lấy connection string.
