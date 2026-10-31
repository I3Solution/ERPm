# [bug] CI backend đỏ: từ điển FE `system.json` lệch BE `system_dictionary.json`

> **Loại:** bug
> **Ngày tạo:** 2026-10-31 · **Người làm:** Thiện (phiên BA) · **Người yêu cầu:** Thiện
> **Trạng thái:** Done
> **Liên quan:** ERPm-FE `83c1278` (master), `d715eea` (nhánh `thien/step20-fe-auth`); BE `3d82ab5`, `fcd1723` (step 20); `.github/workflows/verify.yml` bước "Verify shared dictionaries"

## 1. Mô tả
- **Hiện tượng:** mọi lần chạy "Verify ERPm" ở root đều đỏ ở job `backend`, bước `Verify shared dictionaries`:
  `cmp ERPm-FE/src/assets/i18n/system.json ERPm-BE/src/ERPm.Infrastructure/Persistence/Seeders/system_dictionary.json` trả mã thoát 1.
  Các bước build và test phía sau bị bỏ qua.
- **Cách tái hiện:** push bất kỳ commit nào lên root, hoặc so mã băm git của 2 file trên master.
- **Môi trường:** GitHub Actions `ubuntu-latest`, 2026-10-31.

## 2. Phân tích
- Step 20 phía BE (`3d82ab5`, `fcd1723`) thêm 12 khóa (6 khóa × en/vi) vào file BE nhưng không thêm vào file FE:
  - `error.iam.escalation`, `error.iam.company_scope`, `error.iam.policy_invalid`, `error.iam.system_role`;
  - `error.hrm.user_linked`, `error.hrm.department_level_order`.
- Ngoài 12 khóa đó, 2 file không có khác biệt nào khác.
- Lỗi này có từ trước nhưng bị che: trước khi Phúc thêm secret `SUBMODULES_TOKEN`, CI hỏng ngay ở bước checkout.
- Lưu ý khi so ở máy Windows: `cmp` có thể báo lệch do CRLF ở working copy. Muốn so đúng thì so mã băm git: `git rev-parse <commit>:<đường dẫn>`.

## 3. Cách làm
- Chép nguyên file BE `system_dictionary.json` (BE `029e3e9`) đè lên FE `src/assets/i18n/system.json`.
  - FE master: `83c1278`;
  - nhánh `thien/step20-fe-auth`: `d715eea` (phiên thực thi).
  - Hai blob có cùng mã băm `494caa0`.
- Root: bump con trỏ ERPm-FE lên `83c1278`.
- **Chống tái phát:** khi thêm hoặc sửa khóa từ điển ở BE thì sửa cả 2 file trong **cùng PR**, rồi so mã băm git trước khi push. Điểm này đã thêm vào checklist card Trello (AGENTS.md mục 7: "Có nhãn và lỗi VI/EN").

## 4. Kiểm tra
- `git rev-parse` của 2 file đều ra `494caa05c845726017494725804495255c007c5f`.
- Lần chạy Actions sau khi push lên root master: xem mục 5.

## 5. Việc còn lại
- Xác nhận lần chạy Actions mới của root master xanh cả 2 job.
