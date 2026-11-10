# ERPm Context Workspace

Đây là điểm vào metadata cho coding agents. Mục tiêu là định tuyến task tới đúng domain và repository, không thay thế source code hoặc tài liệu kiến trúc.

## Thứ tự tra cứu

1. [Workspace map](workspace-map.yaml) — umbrella repo, submodules và revision pin.
2. [Repository registry](repository-registry.yaml) — vai trò, ownership và quy tắc truy xuất của từng repo.
3. [Domain registry](domain-registry.yaml) — module/domain routing.
4. [Integration map](integration-map.yaml) — các điểm nối FE/BE/dictionary đã có bằng chứng.
5. [Context policy](context-policy.md) — progressive retrieval, provenance và context packet.

## Quy tắc độ tin cậy

- Git HEAD, gitlink và source tại revision đang checkout là dữ liệu thực tế.
- Metadata là bản đồ điều hướng, không phải bằng chứng thay thế code.
- Mỗi entry có trạng thái `verified`, `partial` hoặc `unknown`; không nâng mức tin cậy nếu chưa kiểm chứng.
- Mọi thay đổi topology/submodule/API ownership phải cập nhật metadata trong cùng PR hoặc task record.
