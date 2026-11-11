# [change] Xây dựng Task Progress Validator

> **Loại:** change  
> **Ngày tạo:** 2026-11-11 · **Người làm:** Lợi (`loipham`) · **Người yêu cầu:** Project  
> **Trạng thái:** Doing  
> **Liên quan:** [Task Progress Automation](../plans/roadmap-enterprise-knowledge-platform.md), [Task Template](_TEMPLATE.md)  
> **Phạm vi:** Root repository; `.ai/tasks/`, `tools/`, CI validation

## 1. Mô tả
- Xây dựng validator kiểm tra task records theo naming convention và Markdown template hiện có.
- Bảo đảm validator tương thích với các task records lịch sử; không ép chuyển đổi sang schema mới.
- Chuẩn bị nền tảng cho PR validation bắt buộc.

## 2. Phân tích
- Repository đã có quy ước `.ai/tasks/<type>-YYYYMMDD-*.md` và template Markdown.
- Task status hiện dùng `Todo`, `Doing`, `Blocked`, `Done`; một số record có thể bổ sung ghi chú sau trạng thái.
- Validator cần phân biệt lỗi cấu trúc thực sự với nội dung mô tả linh hoạt của task.

## 3. Cách làm
- [ ] Khảo sát toàn bộ task records hiện có.
- [ ] Xây dựng validator Python chỉ dùng standard library.
- [ ] Thêm test tự động cho naming, metadata, required sections và status.
- [ ] Chạy validator trên toàn bộ task records hiện có và xử lý false positives.

## 4. Kiểm tra
- Chưa chạy.

## 5. Việc còn lại
- Tích hợp validator vào PR workflow ở bước tiếp theo.

## 6. Evidence và cập nhật
- Commit / PR đã merge: Chưa có.
- CI / workflow run và kết quả: Chưa chạy.
- Ngày cập nhật cuối: 2026-11-11
- Phân biệt rõ kết quả khảo sát, triển khai và xác minh thực tế.
