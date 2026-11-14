# [change] S25.2 & S25.3 — Cập nhật gitlink ERPm-BE và workspace-map sau merge PR #44 và #45

- **Loại**: change
- **Ngày tạo**: 2026-11-14
- **Người làm**: loipham
- **Người yêu cầu**: loipham
- **Trạng thái**: Done
- **Progress aggregation**: v1
- **Liên quan**:
  - Trello `S25.2`: https://trello.com/c/6ZVphKjm
  - Trello `S25.3`: https://trello.com/c/xscVHtTF
  - Trello `S25.2b` (follow-up): https://trello.com/c/W1QLkld1
  - `ERPm-BE` PR #44 (`S25.2` merge `d5cb0771a32e0407cc714e20a45ec751ea800f4a`)
  - `ERPm-BE` PR #45 (`S25.3` merge `299da6239a59f42c52ff6047f5a29f694e77e302`)
- **Phạm vi**: Umbrella repo (`I3Solution/ERPm`) — cập nhật gitlink `ERPm-BE` (`8a9abd6` -> `d5cb077`) và `.ai/context/workspace-map.yaml`.

## 1. Mô tả
Đồng bộ con trỏ submodule `ERPm-BE` và metadata trong umbrella repo `ERPm` sau khi `ERPm-BE` hoàn tất merge PR #45 (`S25.3`) và PR #44 (`S25.2`) lên `ERPm-BE/master`.

## 2. Phân tích
- Trước cập nhật, `ERPm` pin `ERPm-BE` tại `8a9abd62f43988ab3f700d0bb741a668d9050571`.
- Sau khi user merge PR #45 (`299da62`) và PR #44 (`d5cb077`), `ERPm-BE/master` đang ở commit `d5cb0771a32e0407cc714e20a45ec751ea800f4a`.
- Cần bump gitlink `ERPm-BE` và `erpm-be.pinned_revision` trong `.ai/context/workspace-map.yaml` lên `d5cb0771a32e0407cc714e20a45ec751ea800f4a`.
- Không stage hoặc chỉnh sửa `ERPm-FE` (đang có nested submodule dirty sẵn ngoài phạm vi task).

## 3. Features / Milestones
- [x] Xác nhận `ERPm-BE/master` đã chứa `S25.1`, `S25.3` (`299da62`) và `S25.2` (`d5cb077`)
- [x] Cập nhật `.ai/context/workspace-map.yaml` (`erpm-be.pinned_revision` -> `d5cb0771a32e0407cc714e20a45ec751ea800f4a`)
- [x] Cập nhật gitlink `ERPm-BE` lên `d5cb0771a32e0407cc714e20a45ec751ea800f4a`
- [x] Kiểm tra `dotnet build ERPm-BE/ERPm.sln` PASS ở commit `d5cb077`

## 4. Cách làm
1. Tạo nhánh `loipham/s25-2-be-pointer` từ `master` (`84c4b2f`).
2. Cập nhật `erpm-be.pinned_revision` trong `.ai/context/workspace-map.yaml`.
3. Stage riêng `ERPm-BE`, `.ai/context/workspace-map.yaml` và task record này, commit theo quy chuẩn `[update](SD) ...` và push với `push.recurseSubmodules=check`.

## 5. Kiểm tra
- `dotnet build ERPm-BE/ERPm.sln --nologo -v q` tại `d5cb0771a32e0407cc714e20a45ec751ea800f4a`: `Build succeeded. 0 Warning(s), 0 Error(s)`.
- Kiểm tra `git ls-tree HEAD ERPm-BE` trên nhánh `loipham/s25-2-be-pointer` trỏ đúng `d5cb0771a32e0407cc714e20a45ec751ea800f4a`.

## 6. Việc còn lại
- Mở/merge PR cho nhánh `ERPm-BE` `loipham/s25.2-s25.3-docs-done` (`96d7d28`) và nhánh umbrella `ERPm` `loipham/s25-2-be-pointer`.
- Phần follow-up `S25.2b` (vòng đời version Draft -> Active -> Expired và filter `?type=`) theo dõi tại https://trello.com/c/W1QLkld1 trên nhánh `ERPm-BE` `loipham/s25.2b-version-lifecycle-and-filter`.

## 7. Evidence và cập nhật
- 2026-11-14: Hoàn tất đồng bộ gitlink `ERPm-BE` (`d5cb077`) và `.ai/context/workspace-map.yaml` trên nhánh `loipham/s25-2-be-pointer`.
