# 🤖 AGENTS.MD: HƯỚNG DẪN DÀNH CHO AI AGENT TRONG DỰ ÁN ERPM

Chào bạn AI Assistant, bạn đang làm việc trên dự án **ERPm** - Phần mềm Quản trị Bán hàng, Tồn kho & Kế toán mở rộng (C# .NET 10, PostgreSQL, Angular + Ionic Hybrid).

---

## 📌 QUY TẮC HOẠT ĐỘNG BẮT BUỘC

1. **Đọc tài liệu cốt lõi trước khi thực hiện nhiệm vụ:**
   - [PROJECT_MASTER.md](PROJECT_MASTER.md): Tài liệu kiến trúc chuẩn, quy ước code và mô hình dữ liệu.
   - [.ai/roadmap.md](.ai/roadmap.md): Lộ trình phát triển qua các Sprint.
   - [.ai/status.md](.ai/status.md): Trạng thái hiện tại của dự án và các việc cần làm tiếp theo.

2. **Quy chuẩn lưu vết từng Step vào thư mục `.ai/steps/`:**
   - Mỗi khi bạn hoàn thành một tính năng, cấu hình hoặc sửa đổi kiến trúc lớn, bạn **PHẢI** tạo hoặc cập nhật file log theo định dạng:
     `.ai/steps/step-[số thứ tự]-[tên-ngắn-gọn].md`
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
   - **Bắt buộc với repo có Submodule (`ERPm-FE` và các `ERPm-FE-<MODULE>`, cả repo gốc `ERPm`):** trước khi push, chạy một lần
     ```
     git config push.recurseSubmodules check
     ```
     Lệnh này chặn ngay nếu con trỏ submodule trỏ tới một commit mà submodule đó chưa push lên remote của chính nó — đây là lỗi hay gặp nhất khi làm việc nhiều repo (commit con nằm trên máy nhưng quên `git push` trong repo con trước khi push repo cha). Đã từng xảy ra 3 lần trong step 20 (SD/CRM lúc merge, CRM, WMS lúc gán quyền IAM), khiến CI báo `upload-pack: not our ref` / `repository not found` và PR không chạy được kiểm tra tự động.
     - Thứ tự push đúng: **luôn push submodule con trước**, rồi mới push repo cha đang trỏ tới commit đó.
     - Nghi CI đỏ ngay ở bước tải code (checkout): so trực tiếp con trỏ mà repo cha đang trỏ với các nhánh trên remote của submodule, ví dụ `git ls-remote <remote-submodule> | grep <hash>`; thiếu thì vào đúng submodule đó `git push`.
     - Submodule đang ở trạng thái "detached HEAD" (sau `git submodule update`, sau khi kiểm tay...): `git push origin <nhánh>` **không đẩy gì** và không báo lỗi rõ nếu có cờ `-q`. Đẩy đúng bằng `git push origin HEAD:refs/heads/<nhánh>`, rồi so `git rev-parse HEAD` với `git ls-remote origin refs/heads/<nhánh>` để chắc chắn remote đã nhận đúng commit, trước khi mở PR ở repo cha.

6. **Quy tắc ghi chép theo loại Task:**
   - Mỗi việc thuộc đúng một loại dưới đây và được ghi ở đúng nơi tương ứng. Viết bằng Tiếng Việt.

     | Loại | Khi nào | Ghi ở đâu | Tag commit |
     | :--- | :--- | :--- | :--- |
     | **Step** (tính năng lớn theo roadmap) | Nhiều tầng/nhiều ngày, có đặc tả | Đặc tả: `.ai/plans/plan-step-XX-[ten].md` (tick `- [x]` từng Task khi xong). Log: `.ai/steps/step-XX-[ten].md` | `[add]` / `[update]` |
     | **change** (thay đổi yêu cầu) | Đổi nghiệp vụ/đặc tả đã chốt | Thuộc step đang làm: thêm mục "Thay đổi yêu cầu" (ngày, người yêu cầu, lý do, phạm vi) vào plan của step đó. Không thuộc step nào: `.ai/tasks/change-*.md` | `[update]` |
     | **bug** (sửa lỗi) | Lỗi logic, giao diện, build, SQL | `.ai/tasks/bug-*.md`: hiện tượng, cách tái hiện, nguyên nhân gốc, cách sửa, test chống tái phát | `[fix]` |
     | **refactor** | Tái cấu trúc, không đổi nghiệp vụ | `.ai/tasks/refactor-*.md`: lý do, phạm vi, bằng chứng không đổi hành vi (test trước/sau) | `[refactor]` |
     | **db** (schema, migration, seed riêng lẻ) | Không nằm trong một step | `.ai/tasks/db-*.md`: migration, ảnh hưởng dữ liệu cũ, cách rollback | `[db]` |
     | **spike** (khảo sát, so sánh phương án) | Cần tìm hiểu trước khi quyết | `.ai/tasks/spike-*.md`: câu hỏi, phương án, kết luận/đề xuất | `[docs]` |
     | **review** (rà soát mã/tài liệu) | Đánh giá chất lượng, đối chiếu | `.ai/reviews/YYYY-MM-DD-[ten].md` | `[docs]` |

   - **Tên file task:** `.ai/tasks/[loai]-YYYYMMDD-[ten-ngan].md`, theo mẫu [`.ai/tasks/_TEMPLATE.md`](.ai/tasks/_TEMPLATE.md). Trường `Trạng thái` chỉ dùng: `Todo` / `Doing` / `Blocked` / `Done`.
   - **Task làm dở hoặc bị chặn:**
     - Thuộc một step: ghi vào mục **"Việc còn lại"** ở cuối file plan của step đó (task, trạng thái, ghi chú, đang chờ ai/việc gì).
     - Task riêng lẻ: để `Trạng thái: Blocked` hoặc `Doing` trong file task, ghi rõ việc còn lại.
     - `.ai/status.md` chỉ ghi một dòng ở **In-Progress** / **Next Steps** và trỏ link tới plan hoặc file task, không chép lại chi tiết.
   - **Khi xong:** chuyển trạng thái sang `Done`, ghi kết quả kiểm tra và commit liên quan, rồi thêm một dòng vào **Completed** của `.ai/status.md`.
   - Việc nhỏ (sửa chính tả, đổi một nhãn) không cần file task; commit message đúng tag là đủ.

7. **Quy tắc tạo card Trello:**
   - **Nguồn chuẩn:** đặc tả nằm trong repo (plan của step hoặc file `.ai/tasks/`). Trello chỉ để theo dõi tiến độ. Mỗi card có link tới đúng mục trong plan / file task, không chép lại toàn bộ đặc tả. Không ghi tên khách hàng vào card hay label.
   - **Cột:**

     | Cột | Ý nghĩa | `Trạng thái` trong repo |
     | :--- | :--- | :--- |
     | Backlog | Đã ghi nhận, chưa lên kế hoạch | — |
     | Todo | Sẵn sàng làm, đủ đặc tả | `Todo` |
     | Doing | Đang làm (mỗi người tối đa 2 card) | `Doing` |
     | Blocked | Bị chặn; ghi rõ đang chờ card / người nào | `Blocked` |
     | Review | Đã push nhánh, chờ review / merge | `Doing` |
     | Done | Đã merge master và đạt nghiệm thu | `Done` |

   - **Tên card:** `[tag](MODULE) <MÃ> <tiêu đề ngắn>`
     - `tag` giống commit;
     - `MÃ` là `S20.6.1` cho task thuộc step, hoặc `BUG-YYYYMMDD` / `DB-…` / `SPIKE-…` / `REF-…` / `CHG-…` cho task lẻ.
     - Ví dụ: `[db](IAM) S20.6.1 Bảng tbl_SYS_DepartmentRole`.
   - **Label:**
     - Loại: `Step` · `change` · `bug` · `refactor` · `db` · `spike` · `review`
     - Tầng: `BE` · `FE` · `DB` · `Docs`
     - Module: `IAM` · `HRM` · `SYS` · `SD` · `ACC`…
     - Ưu tiên: `P1 Lõi` · `P2` · `P3 Mở rộng`
   - **Mô tả card:**
     ```
     Liên quan: <link plan/task trên GitHub> – mục <Task XX>
     Phụ thuộc: <mã card> | Không
     Nhánh: <ten>/<step>-<ngan>
     Việc phải làm: <copy từ plan/task>
     Nghiệm thu: <copy từ plan/task>
     Commit: BE xxxxxxx · FE xxxxxxx · root xxxxxxx (điền khi xong)
     ```
   - **Checklist bắt buộc mỗi card:**
     - Clean Architecture; comment trong code bằng tiếng Anh.
     - Có nhãn và lỗi VI/EN.
     - Build và test:
       - BE: `dotnet build` 0 warning / 0 error, `ERPm.Verification` đạt hết;
       - FE: `npm run build` 0 error.
     - Commit đúng tag.
     - Đã tick `- [x]` trong plan (hoặc file task chuyển `Done`) và ghi commit.
     - Đã cập nhật `.ai/status.md`.
   - **Chuyển cột:**
     - Còn phụ thuộc chưa xong thì để **Blocked**.
     - Chỉ kéo sang **Done** khi đã merge master và đủ checklist.
     - Đổi yêu cầu giữa chừng: ghi mục "Thay đổi yêu cầu" trong plan rồi comment lên card.
     - **Bắt buộc (Lợi, 2026-11-01): mỗi lần chuyển cột (trạng thái) của card phải comment kèm SHA commit liên quan** (BE/FE/root, commit nào có thì ghi commit đó — không có commit thật thì ghi lý do, ví dụ "chờ review"). Không chuyển cột mà không có comment SHA, để ai xem card cũng tra được đúng mã nguồn ứng với trạng thái đó.

8. **Quy tắc Phối hợp Nhóm 3 người (Phúc, Thiện, Lợi) & Chế độ Tự kiểm tra Tự merge PR (Autonomous Merge):**
   - **Phân vai trách nhiệm (RACI):**
     - **Phúc (Tech Lead / Architect):** Lập Kế hoạch Step tổng (.ai/plans/plan-step-XX.md), chốt **API Contract** trước khi bắt đầu code, tạo và phân công card Trello cho các thành viên, rà soát kiến trúc định kỳ (Periodic Architectural Review) và hỗ trợ giải quyết các bài toán kỹ thuật/xung đột phức tạp khi thành viên yêu cầu.
     - **Thiện (Developer):** Thực thi các task Backend (hoặc Module phụ trách) bám sát đúng API Contract, tự kiểm tra đạt 100% verification tests, tự merge PR của mình vào master và báo cáo commit cho Phúc.
     - **Lợi (Developer):** Thực thi các task Frontend (hoặc Module phụ trách), sử dụng Mock Data bám sát API Contract để dựng UI/Form/Signals hoàn chỉnh độc lập, tự kiểm tra build & giao diện, tự merge PR của mình vào master và báo cáo commit cho Phúc.
   - **Chế độ Tự kiểm tra & Tự merge PR (Self-Verification & Autonomous Merge Policy - Áp dụng chính thức từ 2026-11-01):**
     - **Toàn quyền tự chủ (Autonomous Merge):** Các thành viên (Thiện, Lợi, Phúc) được toàn quyền **tự xem lại kết quả, tự kiểm tra nghiệm thu và tự merge PR của chính mình vào nhánh master** trên cả repo con (ERPm-BE, ERPm-FE, các submodule) và repo cha (ERPm), **không cần chờ Phúc review từng PR** nhằm tối đa hóa tốc độ phát triển độc lập.
     - **Kỷ luật Tự kiểm tra bắt buộc trước khi Merge (Self-Verification Mandatory Checklist):**
       1. **BE:** `dotnet build` đạt 0 warning / 0 error; `ERPm.Verification` (và test domain như `ERPm.Hrm.Verification`) đạt 100%.
       2. **FE:** `npm run build` đạt 0 error; Karma unit tests đạt 100% (nếu có).
       3. **UI / Nghiệp vụ:** Tự chạy thử trên trình duyệt local, thao tác các tính năng vừa code, đảm bảo không vỡ layout responsive (Desktop & Mobile) và không có lỗi console.
       4. **Submodule pointer:** Tuân thủ tuyệt đối quy tắc `git config push.recurseSubmodules check` — **luôn push submodule con trước**, rồi mới push repo cha đang trỏ tới commit đó.
       5. **Code comments:** 100% comment trong source code bằng Tiếng Anh.
       6. **Đa ngôn ngữ (i18n):** Đồng bộ đầy đủ từ điển VI/EN ở cả `system_dictionary.json` và `system.json`.
     - **Kỷ luật Truy vết & Báo cáo sau khi Merge (Post-Merge Accountability):**
       1. **Trello:** Chuyển card sang cột **Done**, bắt buộc comment kèm SHA commit liên quan (BE / FE / root).
       2. **Plan Step:** Tick `- [x]` trong plan của Step (`.ai/plans/plan-step-XX.md`) kèm mã SHA commit.
       3. **Status:** Cập nhật 1 dòng vào mục `Completed` trong `.ai/status.md`.
       4. **Thông báo Lead:** Báo Phúc commit/PR cuối vừa merge để Phúc nắm tiến độ tổng thể dự án.
   - **Nguyên tắc "Contract-First" để làm việc độc lập:**
     - Mọi tính năng kết nối FE-BE **bắt buộc phải có bảng API Contract** trong file plan của Step trước khi bắt đầu code (gồm Endpoint URL, Method, Request DTO mẫu, Response DTO mẫu và mã Error codes).
     - **FE (Lợi):** Dựa vào Contract để tạo ngay TypeScript Interface, viết Mock Service trả về Observable/Signal data mẫu. Dựng xong toàn bộ UI, form validation, adaptive responsive độc lập.
     - **BE (Thiện):** Dựa vào Contract để tạo Entity, Migration, Service và Controller trả về đúng cấu trúc JSON đã cam kết.
     - **Khi tích hợp:** FE chỉ cần chuyển cờ gọi từ Mock Service sang HttpClient gọi API thật.
   - **Hai mô hình phân chia task linh hoạt:**
     - *Mô hình theo tầng (Layer-based):* Áp dụng cho tính năng lõi/hạ tầng sâu. Thiện làm toàn bộ Backend trên repo `ERPm-BE`; Lợi làm toàn bộ Frontend trên repo `ERPm-FE` (không bao giờ chạm chung file code).
     - *Mô hình theo phân hệ dọc (Vertical Slice):* Áp dụng cho tính năng nghiệp vụ độc lập. Thiện làm trọn gói Module A (BE + FE của module đó); Lợi làm trọn gói Module B (BE + FE của module đó).
   - **Quy tắc Đặt tên Nhánh & Submodules:**
     - Đặt tên nhánh cá nhân: `<tên-người>/<step>-<nội-dung-ngắn>` (Ví dụ: `thien/s20-be-iam`, `loi/s20-fe-roles`).
     - Tuân thủ nghiêm ngặt quy tắc push Submodule con trước khi push repo cha (`git config push.recurseSubmodules check`).
---

## 📂 THƯ MỤC AI CẦN BIẾT
- `.ai/` : Thư mục lưu vết kế hoạch và tiến độ của AI.
- `.ai/plans/` : Đặc tả và chia Task của từng Step (kèm mục "Việc còn lại").
- `.ai/steps/` : Nơi lưu chi tiết từng bước thực thi.
- `.ai/tasks/` : Task lẻ không thuộc Step (bug, change, refactor, db, spike).
- `.ai/reviews/` : Biên bản rà soát.
- `PROJECT_MASTER.md` : Single Source of Truth về kiến trúc và coding conventions.
