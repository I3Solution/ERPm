# ERPm — AI Agent Bootstrap

Bạn đang làm việc trong workspace ERPm, gồm umbrella repository và các repository con. Tài liệu này là **điểm vào/routing**, không phải yêu cầu đọc toàn bộ tài liệu dự án ở mọi task.

## 1. Bootstrap — đọc theo thứ tự

1. Xác định repository hiện tại, branch, HEAD và trạng thái working tree.
2. Đọc [workspace map](.ai/context/README.md) và [context policy](.ai/context/context-policy.md).
4. Dựa vào task để chọn đúng domain/repository. Chỉ đọc phần liên quan trong `PROJECT_MASTER.md`, roadmap, plan, task và source code.
5. Trước khi sửa code, lập danh sách scope dự kiến và xác nhận các dependency trực tiếp. Mở rộng phạm vi khi có bằng chứng kỹ thuật.

**Không mặc định đọc toàn bộ** `PROJECT_MASTER.md`, `.ai/roadmap.md`, toàn bộ plan hoặc toàn bộ source tree. Các tài liệu này được truy xuất theo chủ đề/phần liên quan. Nếu task thay đổi kiến trúc, contract, schema hoặc quy tắc dùng chung, phải đọc thêm các phần chuẩn tương ứng.

## 2. Workspace và source of truth

- Umbrella repo: `I3Solution/ERPm`, nhánh tích hợp `master`.
- Backend: `ERPm-BE`; frontend: `ERPm-FE`. Root gitlink SHA là revision được pin cho workspace, không tự ý thay bằng HEAD mới nhất của repo con.
- Metadata trong `.ai/context/` mô tả routing và quan hệ đã xác minh. Khi có khác biệt, Git tree/gitlink và source code tại revision đang checkout là sự thật; cập nhật metadata sau khi xác minh.
- `PROJECT_MASTER.md` là nguồn quy ước kiến trúc/kỹ thuật dùng chung. `AGENTS.md` tại repository con bổ sung quy tắc cục bộ; nếu xung đột, dừng và báo rõ thay vì tự chọn.

## 3. Quy tắc Git bắt buộc

- **Không sửa, commit hoặc push trực tiếp trên `master`.**
- Tạo nhánh cá nhân từ `master` mới nhất: `loipham/*`, `thien/*`, hoặc `phuc/*` đúng người thực hiện.
- Commit message: `[tag] nội dung` hoặc `[tag](MODULE) nội dung`; tag hợp lệ: `add`, `update`, `fix`, `refactor`, `db`, `docs`.
- Với submodule: commit/push repo con trước, sau đó mới cập nhật gitlink ở repo cha. Bật `git config push.recurseSubmodules check` trước khi push.
- Mở PR về `master`; kiểm tra xung đột và chạy lại kiểm thử sau khi đồng bộ master.

## 4. Kỷ luật kỹ thuật

- BE: .NET 10, Clean Architecture; business logic không đặt trong Controller.
- DB: PostgreSQL; tiền tệ/số lượng dùng `decimal(18,4)` theo chuẩn hiện hành; giữ auditing/soft-delete theo domain; không hard-delete giao dịch đã Posted.
- FE: Angular + Ionic; ưu tiên standalone components, Signals, Reactive Forms và component chuẩn của dự án. Tuân thủ quy tắc FE cụ thể trong `ERPm-FE/AGENTS.md`.
- Mọi comment trong source code phải bằng tiếng Anh.
- UI text và thông báo phải tuân thủ i18n; đồng bộ dictionary FE/BE khi thay đổi.
- Sự kiện nghiệp vụ cần notification phải theo `docs/NOTIFICATION_INTEGRATION_GUIDE.md`.
- Không tự suy đoán module từ tên file; trace endpoint/API ownership khi cần phân loại.

## 5. Task records và verification

- Step plan: `.ai/plans/plan-step-XX-*.md`.
- Step log: `.ai/steps/step-XX-*.md`.
- Task record: `.ai/tasks/<type>-YYYYMMDD-*.md` theo `.ai/tasks/_TEMPLATE.md`. Giữ nguyên naming convention hiện có; không tự tạo TASK ID hoặc đổi sang YAML/JSON.
- Review: `.ai/reviews/YYYY-MM-DD-*.md`.
- Mỗi Agent/developer khi nhận task có thay đổi đáng kể về code, kiến trúc, cấu hình, CI/CD hoặc tài liệu phải tạo/cập nhật task record riêng ngay từ đầu. Task record phải được đưa vào PR có thay đổi tiến độ tương ứng.
- Nếu một task tiếp tục qua nhiều PR hoặc nhiều feature trên cùng branch, luôn cập nhật **cùng task record**, không tạo record trùng lặp. Giữ danh sách feature/milestone trong mục checklist của template; đánh dấu từng feature khi hoàn thành.
- Mỗi Agent chỉ cập nhật task record của công việc mình phụ trách; không sửa record của Agent khác nếu không có bàn giao rõ ràng.
- Các thay đổi typo/format thuần túy hoặc thao tác máy móc không làm thay đổi hành vi/nội dung có thể miễn task record. Nếu không chắc, tạo record.
- Trạng thái task dùng đúng: `Todo`, `Doing`, `Blocked`, `Done`. Chỉ đánh dấu `Done` khi phần việc thực tế hoàn tất, có verification evidence và tất cả feature checklist có theo dõi đã được đánh dấu hoàn thành. Không ghi PASS nếu chưa chạy kiểm tra.

## 6. Context packet trước khi code

Với task vượt quá một file hoặc liên quan nhiều repo, trước khi triển khai phải tóm tắt:
- mục tiêu và acceptance criteria;
- repo + exact HEAD/gitlink SHA;
- file/symbol/API/DB liên quan và bằng chứng;
- dependency trực tiếp, test cần chạy;
- phạm vi không đụng tới và unknowns.

Xem [Context Policy](.ai/context/context-policy.md) để biết cách mở rộng scope và ghi provenance.
