# Workspace Boundary — Proposed Design

> **Status:** Core isolation boundary accepted by the user on 2026-11-12; detailed identity/ACL/lifecycle choices remain proposed  
> **Date:** 2026-11-12  
> **Scope:** Tenant, Workspace, Project, Source ownership, authorization and isolation  
> **Pilot:** ERPm is a validation workspace/source set, not a platform boundary

## 1. Purpose

Define the first security and ownership boundary for a reusable Enterprise Knowledge Platform.

The design must support multiple organizations, multiple workspaces per organization, multiple projects per workspace, and heterogeneous sources without allowing knowledge, retrieval results, caches or background jobs to leak across boundaries.

This document is a platform-level proposal. It does not create runtime tables, APIs or permissions yet. Those follow only after the boundary contract is reviewed.

## 2. Important terminology distinction

The current ERPm repository uses the word **workspace** for a developer/agent working context: the umbrella Git repository plus its pinned submodules and context metadata under `.ai/context/`.

That developer workspace is not automatically the same thing as the platform's **Knowledge Workspace** entity.

For this design:

- **Agent Workspace Context** means a local checkout and its pinned repository revisions, as described by the existing `.ai/context/workspace-map.yaml`.
- **Knowledge Workspace** means a first-class platform resource and the default data-isolation/retrieval boundary defined below.

Do not map the current YAML field names directly to a database schema without an explicit mapping step.

## 3. Proposed hierarchy

```text
Platform
└── Tenant                         Organization / security administration boundary
    ├── Workspace                  Knowledge isolation and default retrieval boundary
    │   ├── Workspace-level Sources
    │   ├── Project
    │   │   ├── Project-level Sources
    │   │   └── Knowledge / Evidence / Relations
    │   └── Workspace-level Knowledge / Evidence / Relations
    └── Workspace
        └── ...
```

### 3.1 Tenant

A Tenant represents an independently administered organization/customer boundary.

Responsibilities:
- Owns and administers its workspaces.
- Defines tenant-level identity integration and administrative policies.
- Owns tenant-scoped configuration and audit namespace.
- Prevents any implicit data access from another tenant.

A tenant administrator can administer tenant and workspace configuration, but administrative membership does **not** automatically grant permission to read knowledge content. Content access requires a separate grant or an explicitly audited break-glass operation.

### 3.2 Knowledge Workspace

A Workspace is the primary security boundary for knowledge.

Responsibilities:
- Owns projects, sources, ingestion jobs, source revisions and derived knowledge.
- Defines default retrieval policies, source approval rules and workspace membership.
- Provides the required scope for every normal retrieval request.
- Isolates records, artifacts, indexes, caches, queues and audit events from other workspaces.

Every source and every knowledge record belongs to exactly one workspace. A record must never be owned by multiple workspaces.

A workspace is not a folder and not merely a UI grouping. It is an authorization and data-partition boundary.

### 3.3 Project

A Project is a logical product/application/domain grouping within one workspace.

Responsibilities:
- Groups related sources and knowledge.
- Provides an optional narrower authorization boundary.
- Supports project-scoped retrieval without returning knowledge from sibling projects.

A project belongs to exactly one workspace. It cannot be moved across workspaces by changing only its parent ID; such a move is a controlled migration/re-ingestion operation.

Project membership and restrictions may narrow workspace access, but must never widen it.

### 3.4 Source

A Source is a registered external knowledge origin, such as:
- Git repository or repository snapshot.
- Document collection or file store.
- Database metadata/schema export.
- Issue tracker or development-history feed.
- Approved business-knowledge system.

A source belongs to exactly one workspace and may optionally belong to one project:
- `project_id = null`: workspace-shared source.
- `project_id != null`: project-scoped source.

A source has a stable platform ID independent of its mutable name, repository URL, folder path or external identifier.

The connector credential is represented by a secret/configuration reference. Secret values must not be copied into knowledge records, logs, evidence or prompts.

## 4. Proposed ownership model

| Resource | Required owner fields | Parent rule |
|---|---|---|
| Tenant | `tenant_id` | Root administrative boundary |
| Workspace | `tenant_id`, `workspace_id` | Exactly one tenant |
| Project | `tenant_id`, `workspace_id`, `project_id` | Exactly one workspace |
| Source | `tenant_id`, `workspace_id`, optional `project_id`, `source_id` | Exactly one workspace; optional project must belong to the same workspace |
| SourceRevision | `tenant_id`, `workspace_id`, `source_id`, `revision_id` | Exactly one source and its workspace |
| IngestionJob | `tenant_id`, `workspace_id`, `source_id`, `job_id` | Exactly one source/revision scope |
| KnowledgeRecord | `tenant_id`, `workspace_id`, optional `project_id`, `record_id` | Exactly one workspace; optional project must be in that workspace |
| Evidence | Same workspace as its owning record, plus source/revision locator | Evidence source must belong to the same workspace |
| Relation | Same workspace as the relation owner and both endpoints | Cross-workspace edges are prohibited in v1 |

The repeated `tenant_id` and `workspace_id` values on child records are intentional scope keys for authorization and partition filtering. They must be validated against parent ownership, preferably with composite foreign-key/unique constraints or equivalent transactional validation. They are not independent ownership declarations.

A record derived from multiple sources may have multiple Evidence items, but every evidence item and source revision must still belong to the record's one workspace. Cross-workspace synthesis is out of scope for v1.

## 5. Project and retrieval scope semantics

Every normal retrieval request must specify:
- authenticated principal;
- `tenant_id`;
- `workspace_id`;
- requested scope: workspace or one project;
- requested operation and applicable filters.

No implicit "search all tenants" or "search every workspace this user belongs to" behavior is allowed.

Proposed query rules:

1. **Workspace scope:** return only authorized workspace-level knowledge and knowledge in projects visible to the caller under workspace policy.
2. **Project scope:** return knowledge for the selected project and approved workspace-shared sources. Never include sibling-project records by default.
3. **Restricted project:** a workspace-level read grant alone is insufficient; the caller needs an explicit project grant.
4. **Unknown or missing scope:** reject the request; never guess a default workspace from the principal.
5. **Multiple workspaces:** a future federated query must enumerate and authorize each workspace explicitly. It is not part of the v1 contract.

Project-scoped retrieval should be the normal choice when an agent is working on a known product/project. Workspace-wide retrieval is a separate permission/policy decision, not a side effect of omitting `project_id`.

## 6. Identity and authorization proposal

### 6.1 Principal identity

The platform should consume identities from an external identity provider rather than making the knowledge schema depend on a particular login provider.

A principal may represent:
- human user;
- identity-provider group;
- service account / agent identity.

The stable external identity is the pair `(issuer, subject)` (or an equivalent provider-scoped immutable identifier). Email, display name and username are mutable attributes, not primary keys.

Do not place credentials, access tokens or secrets in principal records or context packets.

### 6.2 Authorization layers

Use role-based grants with resource scope and explicit policy checks.

| Scope | Example role | Responsibility |
|---|---|---|
| Tenant | `tenant_admin` | Tenant and workspace administration; no implicit content read |
| Workspace | `workspace_owner` | Ownership and workspace lifecycle |
| Workspace | `workspace_admin` | Membership, source and policy administration |
| Workspace | `workspace_contributor` | Approved source/ingestion contribution |
| Workspace | `workspace_reader` | Read/query knowledge permitted by workspace policy |
| Project | `project_admin` | Project configuration and membership |
| Project | `project_contributor` | Contribute project knowledge |
| Project | `project_reader` | Read/query that project |

This is a starting role vocabulary, not a finalized permission matrix. Actual authorization checks should evaluate actions such as `workspace.manage`, `source.manage`, `ingestion.run`, `knowledge.read`, `retrieval.query`, `context.generate` and `audit.read`.

### 6.3 Inheritance and restriction

Proposed default:
- Workspace grants apply to workspace-shared sources and non-restricted projects.
- A project may be marked restricted; access then requires an explicit project grant.
- Source policy may further restrict a source, but may not grant access to a principal who lacks the containing workspace/project permission.
- Explicit deny takes precedence over allow.
- Tenant administration, workspace administration and content-reading permission remain separate capabilities.
- Administrative emergency access, if required, must be time-bounded, reason-coded and audited.

Avoid creating project membership rows for every workspace member unless a project is explicitly restricted. This keeps the common case simple while allowing sensitive projects to narrow access.

## 7. Source-level authorization modes

A connector may access an upstream system using a service credential. That credential does not prove that every platform user is allowed to read all indexed content.

Each source therefore needs an explicit access mode. Initial proposal:

- **workspace_managed:** the source owner has approved the content for access governed by workspace/project policy.
- **mirror_upstream:** retrieval must also enforce the upstream source's user/group permissions using a trustworthy identity mapping.

If upstream ACLs cannot be mapped and enforced, the source must not be exposed as generally readable under `mirror_upstream`. It must remain restricted to an explicitly approved audience or ingestion must be blocked.

The connector's service identity and the requesting user's identity must never be conflated.

## 8. IDs, keys and naming

Recommendations:
- Use opaque, globally unique platform IDs for Tenant, Workspace, Project, Source, SourceRevision, Job and KnowledgeRecord.
- UUID is a technology-neutral baseline; UUIDv7 is a candidate if time ordering is useful, to be confirmed in a technology ADR.
- Never encode tenant names, emails, repository paths or other sensitive data in IDs.
- Human-readable slugs are unique only within their parent scope and are mutable.
- Preserve external identifiers separately, scoped by source/connector.
- Use composite uniqueness/ownership constraints for parent-child relationships, for example `(tenant_id, workspace_id, project_id)`.

An ID is not an authorization token. Every object lookup must still authorize the caller against the resource's tenant/workspace/project ownership.

## 9. Source revision and ingestion ownership

A Source has a stable identity; its content changes are represented by immutable SourceRevision entries.

Examples:
- Git source: exact commit SHA, never a moving branch name.
- Document source: upstream version ID where available, otherwise a stable content hash plus connector metadata.
- Database metadata source: a captured schema snapshot/version and content hash.

Re-ingesting the same source revision with a new extractor or schema version is a new ingestion run, not a mutation of the original revision identity.

Ingestion jobs must carry explicit tenant/workspace/source/revision identifiers. Workers must validate those relationships when starting and before publishing results. They must not infer workspace ownership from a repository URL, branch name or caller-supplied untrusted payload.

## 10. Isolation enforcement requirements

Workspace isolation must be enforced end-to-end, not only in the API controller.

| Layer | Required enforcement |
|---|---|
| API | Authenticate principal; authorize tenant/workspace/project and action on every request |
| Control store | Parent/child ownership constraints; tenant/workspace-scoped reads and writes |
| Artifact store | Workspace-scoped object keys and authorization before download |
| Structured store | Mandatory tenant/workspace predicates and validated parent ownership |
| Full-text/vector search | Apply tenant/workspace/ACL filters before candidate results are exposed; post-filtering alone is insufficient |
| Relationship retrieval | Both endpoints and the relationship must satisfy the same workspace authorization |
| Ingestion queue/worker | Explicit scope IDs; validate source/revision ownership before processing and publish |
| Cache | Include tenant, workspace, project scope, source revision, ACL/policy version and index/schema version in cache partition keys |
| Context Packet | Carry authorized scope and source provenance; do not mix workspaces |
| Logs/telemetry | Avoid content/secret leakage; scope audit events and redact sensitive payloads |

Revoking a membership, changing a project restriction or changing source ACLs must invalidate or bypass stale authorization-sensitive cache entries and search permissions.

## 11. Lifecycle proposal

Initial lifecycle concepts:

- Tenant: `active`, `suspended`, `deleting`.
- Workspace: `active`, `suspended`, `archived`, `deleting`.
- Project: `active`, `archived`.
- Source: `active`, `paused`, `disabled`, `error`.

The exact state machine, soft-delete behavior, retention and restore semantics are deferred to the storage/lifecycle design. A suspended or archived resource must not become retrievable merely because its old index still exists.

## 12. ERPm pilot mapping — illustrative only

A possible pilot mapping is:

- one tenant representing the organization that owns the pilot;
- one Knowledge Workspace for the ERPm knowledge boundary;
- one or more Projects representing separately governed products/domains if needed;
- sources for the root umbrella repository and the pinned backend/frontend repositories.

This is an example to validate the model, not an assertion that the current `.ai/context/workspace-map.yaml` is already a platform Tenant/Workspace/Project registry.

The existing local repository map remains authoritative for developer navigation and exact pinned Git revisions. The future platform Source registration must ingest those repositories at explicit revisions and preserve the gitlink relationships as source evidence.

## 13. Acceptance scenarios

Before implementing runtime authorization, the design and later tests must cover:

1. A principal in Tenant A cannot read or infer records, artifacts, counts or search results from Tenant B.
2. A principal in Workspace A cannot query Workspace B by guessing a record, source, revision or job ID.
3. A project-scoped caller cannot receive knowledge from a sibling project.
4. A project-restricted caller is denied unless explicitly granted that project.
5. Workspace-shared sources can be included in project queries only when workspace policy allows them.
6. A tenant/workspace administrator cannot read restricted content merely by holding an administrative role.
7. A `mirror_upstream` source does not expose content when upstream ACL enforcement is unavailable.
8. Revoked membership or changed ACLs prevents access even when a cache or vector index contains an older candidate.
9. A worker rejects an ingestion event whose source/revision does not belong to the declared workspace.
10. A relation whose endpoint is outside the caller's authorized workspace/project scope is not returned.
11. A cross-workspace Context Packet is rejected unless a future explicit federation contract authorizes each scope.
12. Cache keys and storage paths cannot collide across tenants or workspaces.

## 14. Accepted boundary decision

The following core principle was explicitly accepted by the platform owner on 2026-11-12:

- **Knowledge Workspace is the primary data-isolation boundary.**
- **Project is an optional narrower authorization boundary inside one Workspace.**
- Project permissions cannot widen access beyond the containing Workspace.
- Cross-workspace knowledge access remains denied by default.

This acceptance settles the platform's primary workspace/project boundary. It does not approve every role name, Tenant deployment assumption, upstream ACL strategy, ID format or lifecycle state below.

## 15. Remaining decisions to review before implementation

The proposed baseline is intentionally conservative. Review these decisions explicitly:

1. Is Tenant always an organization boundary, including single-organization/self-hosted deployments?
2. Should workspace-level grants see all non-restricted projects, while project-only grants see only their project plus approved workspace-shared knowledge?
3. Should workspace-shared sources be available inside project-scoped retrieval by default, subject to policy?
4. Which first-pilot sources require `mirror_upstream` ACL enforcement versus `workspace_managed` access?
5. Which identity provider/group model must be supported in the first implementation?
6. Is UUIDv7 acceptable as the default platform ID, or should the ID format remain unspecified until technology selection?

Until reviewed, these remaining items are proposals rather than final implementation requirements.

## 16. Out of scope

- Physical database schema and migrations.
- Exact REST/gRPC/MCP API routes.
- Complete role-permission matrix and policy language.
- Cross-tenant or cross-workspace sharing/federation.
- User provisioning/SCIM and identity-provider integration implementation.
- Connector-specific ACL synchronization implementation.
- Deployment topology and choice of database/search/vector products.

These follow after the boundary is accepted and the Canonical Knowledge Contract is designed.
