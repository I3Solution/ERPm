# [db] Thiết lập Centralized Cloud PostgreSQL miễn phí cho Team (3 người)

> **Loại:** db  
> **Ngày tạo:** 2026-11-02 · **Người làm:** Phúc · **Người yêu cầu:** Phúc (Tech Lead)  
> **Trạng thái:** Done  
> **Liên quan:** Toàn bộ dự án ERPm (BE commit f32bdbb, root commit)  

---

## 1. Mô tả
- **Bối cảnh:** Hiện tại 3 thành viên (Phúc, Thiện, Lợi) đều đang chạy PostgreSQL riêng trên máy local. Dữ liệu Master data (Công ty, Chi nhánh, Phòng ban, Chức danh, Tài khoản nhân sự, Khách hàng, Sản phẩm) và các chứng từ test bị phân mảnh, không đồng bộ được luồng kiểm thử thực tế giữa FE và BE.
- **Yêu cầu:** Thiết lập một cơ sở dữ liệu PostgreSQL tập trung trên Cloud hoàn toàn miễn phí (Serverless PostgreSQL), có tính năng kết nối SSL an toàn, hoạt động 24/7 để cả 3 người cùng trỏ `DefaultConnection` về một nơi.

## 2. Phân tích & Lựa chọn giải pháp
1. **Neon.tech (Đã triển khai thành công):**
   - Host: `ep-summer-art-a1un6qi7-pooler.ap-southeast-1.aws.neon.tech` (Singapore).
   - Database: `neondb`.
   - Kết nối: SSL Mode=Require;Trust Server Certificate=true.
   - Hoạt động 24/7, có connection pooler tự động scale.
2. **Quy chuẩn bảo mật:**
   - Connection string chứa mật khẩu chỉ lưu trong `ERPm-BE/src/ERPm.API/appsettings.local.json` (đã có trong `.gitignore`).
   - Revert mật khẩu khỏi `appsettings.json` để tránh rủi ro commit secret lên Git.

## 3. Cách làm (Quy trình thực hiện)
1. Cấu hình chuỗi kết nối Neon vào `appsettings.local.json`.
2. Sửa `DesignTimeDbContextFactory.cs` (commit `f32bdbb`) để tự động đọc chuỗi kết nối từ `appsettings.local.json` thay vì hardcode localhost.
3. Chạy lệnh `dotnet ef database update`: Đã áp dụng toàn bộ 7 migration (Initial schema, StabilizeMvp, InventoryCarryingValue, IamOrganization, NotificationEngine, DepartmentLevel, DepartmentRole) lên Neon DB.
4. Chạy lệnh `--migrate` với `EssentialDataSeeder`: Đã khởi tạo bảng từ điển đa ngôn ngữ VI/EN, ngôn ngữ, tài khoản kế toán, đơn vị tính, kho mặc định, template thông báo.
5. Tạo tài khoản quản trị `admin` / `Admin@123456`.

## 4. Kiểm tra
- `dotnet ef database update`: 100% migrations applied thành công trên Neon.
- `dotnet run --project src/ERPm.API -- --migrate`: Seed data thành công.
- `dotnet run --project tests/ERPm.Hrm.Verification`: 28/28 checks pass.

## 5. Việc còn lại
- Không. Đã hoàn thành và sẵn sàng chia sẻ cho Thiện, Lợi.

