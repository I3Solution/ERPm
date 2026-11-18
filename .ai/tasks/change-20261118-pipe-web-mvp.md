# [change] Pipe-web MVP: web local xem ticket /pipe, số liệu, tìm kiếm từ khóa

> **Loại:** change
> **Ngày tạo:** 2026-11-18 · **Người làm:** Thiện (AI) · **Người yêu cầu:** Thiện (PO)
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Pipeline:** stage=DEV · round=BA/TA:1, DEV/TEST:0 · gate=none
> **PR/SHA:** chưa mở (nhánh thien/pipe-web-mvp)
> **Env:** none (node --no-warnings tools/pipe-web/server.mjs, cổng 4500)
> **Metrics:** BA=? · TA=? · DESIGN=? · DEV=?/~40p · TEST=? · REPORT=?

## 1. Mô tả
Web local chỉ đọc cho cơ chế /pipe. Nguồn dữ liệu là `.ai/tasks/*.md` (khối Pipeline, Metrics, P-LESSON), nạp vào SQLite FTS5 trong bộ nhớ. Không thêm DB, không phụ thuộc ngoài (Node 22 `node:sqlite`). Bind 127.0.0.1.

## 3. Features / Milestones
- [x] F1 Danh sách ticket + chi tiết (đọc nguyên file)
- [x] F2 Bảng theo stage (BA/TA/DESIGN/DEV/TEST/REPORT)
- [x] F3 Số liệu: ticket qua /pipe, tổng token và phút đã ghi, đếm theo trạng thái
- [x] F4 Tìm từ khóa FTS5 (mã định danh như BE#87 không vỡ cú pháp) + tab Bài học (P-LESSON)
- [x] F5 Tester độc lập kiểm trình duyệt (1366/390, sáng/tối)
- [ ] F6 (sau) Lọc metadata trong ô tìm, đo số vòng Dev⇄Tester, thời gian chờ cổng
- [ ] F7 (sau) Điều khiển agent từ web (`claude -p`), vector nếu tìm từ khóa trượt

## P-PO
Thiện chốt: Node + SQLite, MVP chỉ xem và tìm, từ khóa + metadata, chưa vector (2026-11-18). Tham chiếu: D:\Tian\wiki\notes\RAG trong AI Agent.html (kho nhỏ, nhiều mã định danh nên từ khóa trúng hơn vector).

## P-DEV
Một file `tools/pipe-web/server.mjs` + `index.html`. API: /api/tasks, /api/task, /api/search, /api/lessons, /api/stats, /api/reindex. Metrics chỉ cộng ô có số, "?" tính 0, không bịa. Tự kiểm: 59 ticket đọc được, tìm "BE#87" ra kết quả, 3 bài học. Chưa có tester.

## P-TEST
- Tester độc lập, 90d7b73, 2026-11-18: PASS 1-8 (Playwright 1366/390 x sáng/tối: không tràn ngang, 0 lỗi console, màu chữ/nền tương phản).
- Ticket: thẻ tổng quan + 61 thẻ; chi tiết khớp byte với file. Stage: 1 DEV + 4 REPORT khớp dòng Pipeline. Bài học: 3 ticket (đúng, loại "none").
- Tìm: BE#87 (2), treasury (4), overflow (2); a"b, *, (, rỗng, NEAR( đều 200 không 500; ô trống về danh sách.
- Số liệu 67k token / 77 phút = TEST 67k + 12p + ~25p + ~40p (phút "~" xấp xỉ vẫn được cộng; nếu chỉ tính ô số chính xác thì 12p). Ghi chú nhỏ.
- Bảo mật: ../../AGENTS.md, %2e%2e%5c, C:/..., _TEMPLATE.md đều 404; bind 127.0.0.1:4500; HTML trong ticket hiển thị dạng chữ, không thực thi. Nạp lại thấy/mất file tạm; đã xóa.
- Không kiểm: tìm kiếm với từ khóa FTS lạ như "AND" (trả README, hợp lệ), hiển thị thực tế trên trình duyệt khác Chromium, thiết bị thật, hiệu năng nhiều ticket.
