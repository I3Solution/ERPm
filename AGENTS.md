# ERPm — AI Agent Bootstrap

Bạn đang làm việc trong workspace ERPm, gồm umbrella repository và các repository con. Tài liệu này là **điểm vào/routing**, không phải yêu cầu đọc toàn bộ tài liệu dự án ở mọi task.

## 1. Bootstrap — đọc theo thứ tự

1. Xác định repository hiện tại, branch, HEAD và trạng thái working tree.
2. Đọc [workspace map](.ai/context/README.md) và [context policy](.ai/context/context-policy.md).
3. Đọc [current status](.ai/status.md) để biết trạng thái hiện hành.
4. Dựa vào task để chọn đúng domain/repository. Chỉ đọc phần liên quan trong `PROJECT_MASTER.md`, roadmap, plan, task và source code.
5. Trước khi sửa code, lập danh sách scope dự kiến và xác nhận các dependency trực tiếp. Mở rộng phạm vi khi có bằng chứng kỹ thuật.

**Không mặc định đọc toàn bộ** `PROJECT_MASTER.md`, `.ai/roadmap.md`, `.ai/status.md`, toàn bộ plan hoặc toàn bộ source tree. Các tài liệu này được truy xuất theo chủ đề/phần liên quan. Nếu task thay đổi kiến trúc, contract, schema hoặc quy tắc dùng chung, phải đọc thêm các phần chuẩn tương ứng.

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
- Task record: `.ai/tasks/<type>-YYYYMMDD-*.md` theo `.ai/tasks/_TEMPLATE.md`. Giữ nguyên naming convention hiện có; không tự tạo hệ thống TASK ID hoặc đổi sang YAML/JSON.
- Review: `.ai/reviews/YYYY-MM-DD-*.md`.
- Current status: `.ai/status.md`; đây là báo cáo tổng hợp của dự án, không phải nơi Agent cập nhật tiến độ task.
- Quy tắc bắt buộc: mỗi Agent/developer khi nhận một task có thay đổi đáng kể đối với code, kiến trúc, cấu hình, CI/CD hoặc tài liệu dự án phải tạo/cập nhật một task record riêng ngay từ đầu công việc. Task record phải được commit trong cùng PR với thay đổi tương ứng. Nếu task tiếp tục qua nhiều PR, cập nhật record hiện có thay vì tạo record trùng lặp.
- Dùng task record hiện có khi tiếp tục một task; không tạo file mới chỉ để né cập nhật record. Với công việc thuộc step/plan lớn, task record phải liên kết tới step/plan tương ứng.
- Các thay đổi máy móc, typo/format thuần túy hoặc thao tác không làm thay đổi hành vi/nội dung dự án có thể miễn task record. Nếu không chắc, tạo record.
- Agent chỉ sửa task record của công việc mình thực hiện; không sửa `.ai/status.md` trực tiếp và không sửa progress record của Agent khác nếu không được giao.
- Trạng thái dùng đúng các giá trị trong template: `Todo`, `Doing`, `Blocked`, `Done`. Chỉ đánh dấu `Done` khi phần việc thực tế hoàn tất; ghi rõ kiểm tra đã chạy, kết quả, commit/PR và việc còn lại. Không ghi PASS nếu chưa chạy kiểm tra.
- PR validation sẽ kiểm tra task record theo rule này. Sau khi PR được merge vào `master`, automation sẽ tổng hợp các task records đã merge để cập nhật `.ai/status.md`. Task record là nguồn dữ liệu tiến độ; `.ai/status.md` là output được sinh tự động.
- Nếu task record không hợp lệ hoặc thiếu, Agent phải bổ sung trước khi yêu cầu review/merge; không dùng status chung để thay thế task record.

## 6. Context packet trước khi code

Với task vượt quá một file hoặc liên quan nhiều repo, trước khi triển khai phải tóm tắt:
- mục tiêu và acceptance criteria;
- repo + exact HEAD/gitlink SHA;
- file/symbol/API/DB liên quan và bằng chứng;
- dependency trực tiếp, test cần chạy;
- phạm vi không đụng tới và unknowns.

Xem [Context Policy](.ai/context/context-policy.md) để biết cách mở rộng scope và ghi provenance.
