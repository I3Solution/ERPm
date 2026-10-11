# 📝 QUY CHUẨN LƯU VẾT CÁC BƯỚC THỰC HIỆN CỦA AI (`.ai/steps/`)

Thư mục này được sử dụng để **ghi lại nhật ký chi tiết từng bước (Step Log)** mà AI thực hiện trong quá trình phát triển dự án.

---

## 📌 QUY TẮC ĐẶT TÊN FILE
File log được đặt tên theo cú pháp:
```text
step-[số thứ tự 2 chữ số]-[tên_ngắn_gọn_nhiệm_vụ].md
```
*Ví dụ:*
- `step-00-architecture-and-planning.md`
- `step-01-clean-architecture-solution-setup.md`
- `step-02-postgresql-efcore-entities-catalog.md`
- `step-03-frontend-angular-ionic-setup.md`
- `step-04-item-management-crud-api-ui.md`

---

## 📋 MẪU TEMPLATE FILE STEP LOG
Khi AI hoàn thành một Step, copy template sau và điền đầy đủ thông tin:

```markdown
# 🚀 STEP XX: [TÊN BƯỚC / NHIỆM VỤ]

> **Thời gian thực hiện:** YYYY-MM-DD  
> **Người thực hiện:** AI Agent  
> **Giai đoạn / Sprint:** Phase X - Sprint Y  

---

### 1. Mục tiêu của bước
- Mô tả mục tiêu cụ thể cần đạt được trong step này.

### 2. Các thay đổi đã thực hiện
- **Tạo mới các file:**
  - `path/to/file1.cs`
  - `path/to/file2.ts`
- **Sửa đổi các file:**
  - `path/to/existing.cs`
- **Thư viện / Packages đã cài đặt:**
  - Tên package và version.

### 3. Các lệnh đã thực thi
\`\`\`bash
dotnet build
dotnet ef migrations add ...
\`\`\`

### 4. Kết quả kiểm tra & Xác nhận (Verification)
- [x] Build thành công không có lỗi (0 Errors).
- [x] Đã kiểm tra API bằng Swagger / Postman.
- [x] Giao diện hiển thị đúng trên cả màn hình Desktop và Mobile (Responsive).

### 5. Ghi chú kỹ thuật & Hướng đi cho bước tiếp theo
- Điểm lưu ý cho các step sau.
- Nhiệm vụ kế tiếp trong `.ai/status.md`.
```
