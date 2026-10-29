# Đối chiếu sửa ưu tiên — Step 19

Người dùng xác nhận chỉ có dữ liệu thử nghiệm, dùng tài khoản nội bộ. Đây là cập nhật sau snapshot Step 18.

| Phát hiện | Thay đổi | Bằng chứng / giới hạn |
| --- | --- | --- |
| F01 | Migration/snapshot và SQL đã đồng bộ; giữ UUID/FK/legacy. | DB mới và fixture UUID cũ đạt; DB script thủ công cần adoption riêng. |
| F02 | Account nội bộ, password hash/lockout, bearer, role/scope, audit/revoke. | HTTP anonymous/viewer/scope/revoke đạt; UI quản trị user chưa có. |
| F03 | Validate qty/price/item/stock/payment/credit/accounts, hạn chế override giá. | Số âm/tồn thiếu/missing-account rollback đạt; Combo chờ BOM. |
| F04 | Transaction retry, advisory locks theo kho/item/partner, clear tracker. | 4 bán + 4 nhập đồng thời không mất tồn. |
| F05 | Sequence và RequestId/hash/khóa chống lặp. | Replay/conflict đạt; UUID request bắt buộc, không được rỗng. |
| F06 | Bình quân kho, InventoryValue/CostAmount, phân bổ hết phần dư khi xuất hết. | Nhập 3@1 + 4@2, trị giá tồn 11, xuất hết giá vốn 11, tồn giá trị 0. |
| F07 | Tách tender/paid/change, cash/bank/debt/nợ còn lại. | 0/một phần/thừa tiền và journal cash/131 đạt. |
| F08 | Accounts + journal cân bằng bắt buộc, receipt156/331 hoặc opening156/411, bất biến/reversal. | Thiếu account rollback; hủy/retry và chống sửa header/detail đạt. |
| F09 | Bỏ số demo/fallback dashboard. | DB rỗng trả0; API lỗi không biến thành doanh thu giả. |
| F10 | Lọc/tổng POS/CRM/kho bằng Signals và forms. | Chrome totals/discount/search thay đổi ngay. |
| F11 | Computed thuần, effect dùng untracked phù hợp. | Chrome branch computed và render POS không NG0600. |
| F12 | Warehouse owner branch/scope kiểm tra server, FE kho thực. | Không fallback kho1; commands/queries qua scope. |
| F13 | SQL reference không DROP/reset, migrate rõ ràng, startup không nuốt lỗi. | Giữ DB cũ, tạo DB local mới. |
| F14 | Use case order riêng, loadlines/totals/Draft/Confirmed và khóa update/delete/confirm. | HTTP totals/confirm/repeat đạt; fulfilment/thu chi vẫn backlog. |
| F15 | Deep JSON equality/snapshot. | Đổi color red→blue cùng key vẫn persist PostgreSQL. |
| F16 | Đọc entries, chung JSON238 key mỗi VI/EN và seed app_dictionaries, error codes/Accept-Language. | Chrome contract/UTF-8 đạt; không thiếu static template key hay error code VI/EN. |
| F17 | Phân trang/cap200, state theo component, hủy request cũ, remote SKU/barcode/bản dịch. | Build/type-check/Chrome lookup đạt; chọn được hàng ngoài trang đầu qua tìm kiếm. |
| F18 | Shortcut tới routes thật, lazy routes. | Production build đạt; full E2E navigation chưa chạy. |
| F19 | Ngày Việt Nam UTC+7, Posted invoices, scope stock/debt/top-selling. | DB/scope tests đạt; dashboard dùng InventoryValue. |
| F20 | Verification PostgreSQL/API, 7 Chrome regressions, CI root/BE/FE. | 44 BE và7 FE đạt local; GitHub workflow chưa chạy remote. |
| F21 | Secrets local/env, /api proxy, CORS allowlist, error envelope, token keys/certificate. | API startup/auth đã chạy; cert/HTTPS/backup production còn cấu hình. |
| F22 | Status/roadmap/master/readme/AGENTS và log BE/FE/4 module theo source thực. | Không đánh dấu mọi phase hoàn thành; chưa commit/push/deploy. |

Các khoảng trống bổ sung đã xử lý: audit theo user, snapshot tên hàng/đơn vị, gộp item trùng khi nhập, generic keyword/sort/page cap, EF GIN indexes, label/input IDs, viewport zoom, dropdown keyboard và CSS print. Chưa nghiệm thu native printer, accessibility/mobile E2E đầy đủ, Dapper reporting hay Phase2–4 đầy đủ.

Bằng chứng/lệnh: [Step 19](../steps/step-19-stabilization-and-internal-accounts.md). Chạy: [hướng dẫn local](../../docs/LOCAL_DEVELOPMENT.md).
