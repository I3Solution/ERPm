# [change] B6: Playwright E2E specs and CI job

> **Loại:** change
> **Ngày tạo:** 2026-11-15 · **Người làm:** Tester 2 (AI) · **Người yêu cầu:** BA 1
> **Trạng thái:** Doing
> **Progress aggregation:** v1
> **Liên quan:** plan-step-20 (B6, B4), step-20-e2e-db-seed, tests/e2e/README.md
> **Phạm vi:** tests/e2e (config, support, specs), .github/workflows/verify.yml

## 1. Mô tả
- Seed + DB tạm đã có (step 20). Thêm webServer `ng serve`, kịch bản trình duyệt admin / viewer / limited / B4 (đổi cha chi nhánh) và job `e2e` trong verify.yml.

## 3. Features / Milestones
- [x] webServer `ng serve` (proxy `/api` sang API test) trong playwright.config.ts.
- [x] rights.spec: admin / viewer / limited thấy đúng menu, route bị chặn về /forbidden, đăng xuất.
- [x] org-reparent.spec (B4): đổi cha chi nhánh bằng UI; server từ chối vòng lặp.
- [x] Chịu giới hạn đăng nhập 10 lần/phút (Api.login dùng lại phiên, signIn chờ khi 429).
- [ ] Job `e2e` trong verify.yml xanh trên CI.

## 4. Cách làm
- `support/ui.ts` (signIn), `support/api.ts` (cache phiên, retry 429, `del`), hai spec mới, job `e2e` (Postgres service, build API Debug, `npm ci` FE + e2e, `playwright install chromium`, báo cáo upload khi lỗi).

## 5. Kiểm tra
- Local (Postgres Docker :5433, master BE 8e76c18 + FE ecb26ac): `npx playwright test` 9/9 đạt (~1.8 phút). CI: chờ kết quả PR.

## 6. Việc còn lại
- Xem CI xanh; chuyển các kịch bản kiểm tay còn lại thành spec ở PR sau.
