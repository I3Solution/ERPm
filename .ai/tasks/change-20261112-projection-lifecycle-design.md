# [change] Thiết kế Search Projection Lifecycle v1

> **Loại:** change  
> **Ngày tạo:** 2026-11-12 · **Người làm:** AI Agent (ChatGPT) · **Người yêu cầu:** User  
> **Trạng thái:** Doing — schemas, fixtures and semantic tests added; latest CI pending  
> **Progress aggregation:** v1  
> **Liên quan:** .ai/architecture/ingestion-pipeline.md, .ai/architecture/retrieval-contract.md, .ai/architecture/storage-boundary.md, .ai/architecture/projection-lifecycle.md  
> **Phạm vi:** Root repository — independent full-text/vector projection lifecycle

## 1. Mô tả

Định nghĩa reusable lifecycle cho full-text và vector projections sau khi Canonical Knowledge publication thành công. Mỗi projection có profile/version, build run, immutable manifest và readiness riêng theo SourceRevision. Retrieval phải biết chính xác projection nào được phép sử dụng cho từng revision được chọn.

Không chọn search/vector vendor, embedding provider, queue, physical index layout hoặc triển khai runtime builder trong task này.

## 2. Phân tích

- Canonical Knowledge là source of truth; search/vector là derived, rebuildable projections.
- Canonical publication và projection readiness độc lập; projection failure không rollback canonical publication.
- Full-text và vector là hai logical adapters có lifecycle/version/readiness độc lập.
- Projection chỉ được build từ một PublicationManifest đã commit, không đọc staging/unpublished revision.
- ProjectionManifest phải trace được đến đúng Tenant/Workspace/Source/SourceRevision, PublicationManifest, profile version, builder version và definition fingerprint.
- Chỉ manifest khớp desired revision/profile fingerprint mới được Retrieval sử dụng.
- ProjectionStatus là readiness snapshot cho một SourceRevision + projection kind; chỉ `ready` có `eligibleForRetrieval=true`.
- Retrieval per-revision coverage: required method thiếu projection trên bất kỳ selected revision nào phải trả capability-unavailable; optional method có thể chạy trên ready subset và báo Partial coverage.
- Candidate ACL/source/revision filters phải được áp dụng trước khi thông tin/hit content rời khỏi projection store.

## 3. Features / Milestones

- [x] Định nghĩa ProjectionProfile, ProjectionRun, ProjectionManifest và ProjectionStatus logical contracts.
- [x] Định nghĩa definition fingerprint inputs cho full-text analyzer/field mapping và vector model/dimensions/chunking.
- [x] Định nghĩa independent build, retry, idempotency, immutable output và readiness-pointer transition.
- [x] Định nghĩa pending/building/ready/failed/stale semantics và no-stale-fallback rule.
- [x] Mở rộng Retrieval result method reports để thể hiện readiness theo từng SourceRevision.
- [x] Định nghĩa required/optional projection behavior và cursor/cache projection version binding.
- [x] Tạo JSON Schema Draft 2020-12 cho Profile, Run, Manifest và Status.
- [x] Thêm valid fixtures và semantic tests cho lineage, count reconciliation, fingerprint và readiness eligibility.
- [ ] Chờ CI xác nhận và review chi tiết proposed contract với user.
- [ ] Hoàn thiện numeric performance/quality/cost targets và operational reindex details sau benchmark.

Giữ nguyên các feature đã hoàn thành; chỉ bổ sung feature khi scope thực sự mở rộng.

## 4. Cách làm

- Dựa trên accepted Storage v1 decision: full-text/vector là logical projection adapters độc lập.
- Dựa trên accepted Retrieval v1 semantics: structured baseline, full-text/vector optional hoặc required theo request, per-source/revision readiness phải được báo cáo.
- Tách ProjectionRun khỏi IngestionRun; projection retries không reopen canonical ingestion.
- Tạo `.ai/architecture/projection-lifecycle.md`.
- Mở rộng Retrieval Contract và Storage Boundary.
- Không sửa `.ai/status.md`, không thêm runtime worker/indexer/database/API.

## 5. Kiểm tra

- ProjectionProfile fixture pins kind, builder, source payload versions, config fingerprint và definition fingerprint.
- ProjectionRun/Manifest fixtures cùng trỏ đến PublicationManifest `manifest-001`, SourceRevision `revision-001`.
- Semantic checks reconcile `indexed + skipped + failed = eligible`, output artifact counts và minimum indexed ratio.
- ProjectionStatus `ready` chỉ hợp lệ khi Manifest trùng desired SourceRevision, PublicationManifest, profile version và fingerprint.
- Retrieval semantic tests kiểm tra per-revision status coverage, required projection failure và optional stale projection Partial behavior.
- JSON documents đã được kiểm tra parse qua GitHub source retrieval; CI semantic/schema run cho commit mới đang chờ.
- Chưa có runtime projection builder, physical index generation, performance/quality benchmark hoặc Workspace integration test.

## 6. Việc còn lại

- Chờ và xử lý CI mới trên PR #70.
- Review status aggregation semantics khi nhiều selected revisions có readiness khác nhau.
- Hoàn thiện integration test sau khi có platform runtime: R2 publish while R1 build lags, ACL revoke, profile/model upgrade, build crash before ready-pointer commit.
- Chọn embedding/analyzer providers và physical index topology chỉ sau technology ADR/benchmark.

## 7. Evidence và cập nhật

- PR: [#70](https://github.com/I3Solution/ERPm/pull/70), đang mở.
- Baseline Ingestion Stage CI: [Run #926](https://github.com/I3Solution/ERPm/actions/runs/43156485888), 5/5 jobs success tại commit `52a75c94b9c4b49e295a18fe5f7939be7ae46e9c`.
- Projection contract CI: pending cho commit mới.
- Tài liệu chính: `.ai/architecture/projection-lifecycle.md`.
- Retrieval integration: `.ai/architecture/retrieval-contract.md`.
- Ngày cập nhật cuối: 2026-11-12.
