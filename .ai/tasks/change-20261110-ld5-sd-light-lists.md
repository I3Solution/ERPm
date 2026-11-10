# [update] Danh sách SD nhẹ: dòng tóm tắt, lọc ngày, tìm và sắp xếp ở server (LD.5, phần BE)

> **Loại:** change (Step 24, luồng A)
> **Ngày tạo:** 2026-11-10 · **Người làm:** Thiện (Dev 1) · **Người yêu cầu:** BA
> **Trạng thái:** Doing (BE chờ tester và merge; FE chưa làm, chờ khung LD.1)
> **Liên quan:** [plan Step 24](../plans/plan-step-24-fe-list-detail-and-integration.md) · nhánh `thien/ld5-sd-list-summaries` (BE, root)

## 1. Phát hiện khi đọc code
Danh sách báo giá, trả hàng và bảng giá vốn đã nhẹ (các lớp dịch vụ không nạp dòng hàng cho danh sách; dòng chỉ có ở chi tiết). Chỉ **danh sách đơn bán nạp toàn bộ dòng** (`Include(Items)`), nên mới nặng. Phân trang, từ khóa, trạng thái và sắp xếp đã có ở server; thiếu lọc theo ngày và cách gọi gọn.

## 2. Thay đổi (tương thích ngược: chỉ thêm tham số, DTO giữ nguyên)
Tham số mới của mọi danh sách dùng `BaseFilterQuery` (đơn, báo giá, trả hàng, bảng giá...):
| Tham số | Ý nghĩa |
| :--- | :--- |
| `summary=true` | Danh sách đơn bán không nạp dòng hàng (`items` rỗng); các danh sách khác đã nhẹ nên bỏ qua |
| `from`, `to` | Lọc theo ngày chứng từ (đơn: `OrderDate`, báo giá: `QuotationDate`, trả hàng: `ReturnDate`, bảng giá: `EffectiveFrom`); `to` tính hết ngày đó (UTC) |
| `q` | Viết tắt của `keyword` |
| `sort` | `field` tăng dần, `-field` giảm dần (thay cho `sortBy` + `isAscending`) |
Đã có sẵn: `pageIndex`, `pageSize` (tối đa 200), `status`.

## 3. Đo trước/sau (Verification, DB local, 13 đơn trong đó 1 đơn 40 dòng)
- Danh sách đơn đầy đủ: 22.530 byte; `summary=true`: 9.631 byte (giảm 57%). Mức giảm tăng theo số dòng hàng của các đơn trong trang.

## 4. Kiểm tra
- `dotnet build`: 0 warning, 0 error; `ERPm.Verification` 387 check đạt (thêm 7): summary giữ mọi cột trừ dòng, nhỏ hơn bản đầy đủ, lọc ngày, `q`, `sort` có dấu trừ, phân trang, báo giá cùng bộ lọc ngày.

## 5. Việc còn lại
- **FE:** `sd.service.ts` đang tải một trang 200 dòng đầy đủ cho từng danh sách; cần chuyển sang `summary=true`, truyền `pageIndex/pageSize/q/status/from/to/sort` theo khung list-page của Dev 2 (LD.1) và giữ trạng thái trên query params. Chưa làm vì chờ LD.1 vào master.
- Tester kiểm API; Thiện gõ merge.
