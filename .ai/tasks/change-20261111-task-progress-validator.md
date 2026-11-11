# [change] Xây dựng Task Progress Validator

> **Loại:** change  
> **Ngày tạo:** 2026-11-11 · **Người làm:** Lợi (`loipham`) · **Người yêu cầu:** Project  
> **Trạng thái:** Done  
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
- [x] Khảo sát toàn bộ task records hiện có (38 records).
- [x] Xây dựng validator Python chỉ dùng standard library.
- [x] Thêm 7 test tự động cho naming, metadata, required sections, status và legacy compatibility.
- [x] Chạy validator trên toàn bộ 38 task records hiện có; hỗ trợ các metadata format lịch sử.

## 4. Kiểm tra
- GitHub Actions job `task-progress` thành công ở run [#42988504795](https://github.com/I3Solution/ERPm/actions/runs/42988504795): validator quét 38 task records và unit tests đều pass.
- Validator hỗ trợ chế độ mặc định tương thích task lịch sử và `--strict` cho task mới/cập nhật theo template hiện tại.

## 5. Việc còn lại
- Xây dựng PR-diff validation để bắt buộc task record hợp lệ cho thay đổi có ý nghĩa; đây là task/phase tiếp theo.
- Xây dựng Status Generator và post-merge aggregation.

## 6. Evidence và cập nhật
- Commit / PR đã merge: Chưa có.
- CI / workflow run và kết quả: Chưa chạy.
- Ngày cập nhật cuối: 2026-11-11
- Phân biệt rõ kết quả khảo sát, triển khai và xác minh thực tế.
