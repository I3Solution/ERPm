# [change] S25.2b — Đồng bộ từ điển FE/BE và cập nhật gitlink ERPm-BE & ERPm-FE

- **Loại**: change
- **Ngày tạo**: 2026-11-14
- **Người làm**: loipham
- **Người yêu cầu**: loipham
- **Trạng thái**: Done
- **Progress aggregation**: v1
- **Liên quan**:
  - Trello `S25.2b`: https://trello.com/c/W1QLkld1
  - `ERPm-BE` PR #56 (`9fdfe6206025c710e93e1e1908ea16577ceead04`) và `ERPm-BE/master` (`44307c462719b43606dcf05a038bf189a4369e78`)
  - `ERPm-FE` PR #47 (`267efd47044d194692e9a910b95adcdc4b631a24`)
- **Phạm vi**: Umbrella repo (`I3Solution/ERPm`) — cập nhật gitlink `ERPm-BE` (`d5cb077` -> `44307c4`), `ERPm-FE` (`be49953` -> `267efd4`) và `.ai/context/workspace-map.yaml`.

## 1. Mô tả
Sau khi merge `ERPm-BE` PR #56 (S25.2b vòng đời phiên bản bảng giá, CRUD draft items & lọc theo `Type`) và `ERPm-FE` PR #47 (đồng bộ `src/assets/i18n/system.json` khớp byte-for-byte với `ERPm-BE/master`), cập nhật con trỏ submodule `ERPm-BE` và `ERPm-FE` cùng `workspace-map.yaml` tại umbrella repo `ERPm`.

## 2. Phân tích
- `ERPm-BE/master` đang ở commit `44307c462719b43606dcf05a038bf189a4369e78` (bao gồm `9fdfe62` PR #56 S25.2b và `44307c4` PR #51).
- `ERPm-FE/master` đang ở commit `267efd47044d194692e9a910b95adcdc4b631a24` (PR #47 đồng bộ đầy đủ `system.json` khớp từng byte với `ERPm-BE/master`).
- Cập nhật đồng thời cả hai gitlink và `erpm-be.pinned_revision` / `erpm-fe.pinned_revision` trong `.ai/context/workspace-map.yaml` để job `Verify shared dictionaries` (`cmp`), `backend`, `frontend` và `code-index` trên umbrella CI đồng bộ.

## 3. Features / Milestones
- [x] Merge `ERPm-BE` PR #56 (`9fdfe62`) và đồng bộ `ERPm-BE/master` (`44307c4`)
- [x] Đồng bộ `ERPm-FE/src/assets/i18n/system.json` và merge `ERPm-FE` PR #47 (`267efd4`)
- [x] Cập nhật `.ai/context/workspace-map.yaml` (`erpm-be.pinned_revision` -> `44307c4`, `erpm-fe.pinned_revision` -> `267efd4`)
- [x] Cập nhật gitlink `ERPm-BE` và `ERPm-FE` trên nhánh `loipham/s25-2b-be-fe-pointers`

## 4. Cách làm
1. Tạo nhánh `loipham/s25-2b-be-fe-pointers` từ `origin/master` (`eaf6bf8`).
2. Cập nhật `pinned_revision` cho `erpm-be` và `erpm-fe` trong `.ai/context/workspace-map.yaml`.
3. Stage riêng `ERPm-BE`, `ERPm-FE`, `.ai/context/workspace-map.yaml` và task record này, commit với `[update](SD) ...` và push với `push.recurseSubmodules=check`.

## 5. Kiểm tra
- Kiểm tra byte-for-byte `ERPm-FE/src/assets/i18n/system.json` vs `ERPm-BE/src/ERPm.Infrastructure/Persistence/Seeders/system_dictionary.json`: khớp 100%.
- `ERPm-BE` PR #56 CI (`Verify backend`): PASS (2/2 checks xanh).
- `ERPm-FE` PR #47 CI (`Verify frontend`): PASS (2/2 checks xanh).
- `dotnet run --project tools/ERPm.CodeIndex -- workspace status`: kiểm tra tại umbrella repo.
- `python -m unittest discover -s tests/progress -v`: kiểm tra task progress generator.

## 6. Việc còn lại
- Mở PR về `ERPm/master`, theo dõi CI umbrella xanh và merge.

## 7. Evidence và cập nhật
- 2026-11-14: Hoàn tất đồng bộ từ điển BE/FE và cập nhật gitlink `ERPm-BE` (`44307c4`) + `ERPm-FE` (`267efd4`).
