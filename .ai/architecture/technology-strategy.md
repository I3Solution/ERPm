# ADR — Technology Strategy for Enterprise Knowledge Platform

> **Status:** Accepted direction — runtime implementation remains gated by vertical-slice design and benchmark
> **Date:** 2026-11-12
> **Scope:** Independent reusable Enterprise Knowledge Platform; ERPm is a pilot Workspace, not the product boundary

## 1. Context

The platform serves multiple tenants, workspaces, projects, source families and AI clients. It must not inherit the implementation language or domain assumptions of its first pilot. Current work has established language-neutral architecture and contracts; there is no production Core Runtime that needs migration.

The technology strategy must support a durable platform core, predictable concurrency and operations, AI/ML ecosystem access, multilingual extensions, contract stability, security isolation and incremental delivery without premature microservices.

## 2. Proposed decision

1. **Go is the primary implementation language for the Core Platform.**
2. **Python is the specialized AI/ML Runtime language** for model-centric and experimentation-heavy capabilities.
3. **Extensions are multilingual.** Go, Python, C#, TypeScript and other languages may implement supported extension contracts.
4. **Contracts remain language-neutral and versioned.** JSON Schema, stable API/event contracts and MCP define interoperability. SDKs are convenience layers, not contract authorities.
5. **Start with a Go modular monolith.** Logical module ownership comes first; split processes/services only when isolation, scaling, release cadence or operational evidence justifies it.
6. **Do not create all runtime modules now.** Add the minimum foundation and one approved vertical slice only after the architecture boundary is agreed.

This is a technology direction, not a commitment to deploy every logical module as a separate Go service.

## 3. Responsibility and language boundaries

| Capability | Primary implementation | Boundary |
|---|---|---|
| Control Plane and Workspace lifecycle | Go | Tenant, Workspace, Project, Source, policy and configuration |
| Identity integration and authorization | Go | Provider-neutral principal/action/scope enforcement |
| Ingestion orchestration | Go | Run state, retries, checkpoints, publication coordination |
| Canonical Knowledge and publication | Go | Typed persistence boundary, revision lineage, atomic visibility |
| Retrieval and Context orchestration | Go | Scope enforcement, retrieval composition, evidence and Context Packet |
| Projection lifecycle | Go | Profile/run/manifest/status and adapter orchestration |
| Platform API and MCP Gateway | Go | Stable external interfaces |
| Audit and operational telemetry | Go | Cross-cutting platform behavior |
| Embedding, reranking, inference, ML evaluation | Python where ecosystem fit requires | Isolated AI/ML runtime behind explicit contracts |
| Custom AI processors | Python or multilingual extension | Must declare model/dependency versions and preserve lineage |
| Connector, Extractor, Processor, Validator, Agent Tool | Multilingual | Controlled extension execution model |
| Existing Roslyn and TypeScript indexers | Keep current implementation | Integrate through adapters; do not rewrite for language uniformity |

Go is the Core default, not a ban on specialized libraries or delegation. Python is not the owner of general platform business logic simply because a stage uses a model.

## 4. Why Go for Core

Go is preferred as a greenfield Core candidate because of its simple concurrency model, compact deployment artifacts, mature backend/networking ecosystem, operational tooling and relatively small language surface for a multi-contributor codebase.

This is a fit-for-purpose preference, not a claim that Go is universally faster, safer or more scalable than C#.

## 5. Why Python remains specialized

Python has a broader ecosystem for model experimentation, ML frameworks, embedding/reranking workflows, evaluation and data-science tooling.

Python capabilities must stay behind explicit runtime boundaries:
- versioned input/output contracts and pinned dependencies/model revisions;
- bounded time, memory, concurrency and payload size;
- explicit Workspace/Source/SourceRevision lineage;
- no direct write access to canonical storage or publication pointers;
- output returns to the trusted Core validation/publication path;
- credentials are resolved by the platform and never embedded in artifacts/prompts.

A Python process must not bypass Core-owned authorization, validation or publication invariants.

## 6. Multilingual extension architecture

Do not load arbitrary customer code inside the Core process. The preferred initial boundary is an independently supervised process/container communicating through a versioned protocol.

Evaluate API/HTTP or gRPC for synchronous typed calls, event contracts for asynchronous work, and MCP for agent-facing tools/capability discovery. MCP is not a universal replacement for internal stage contracts.

Extension contracts must define identity/type/version, supported contract versions, input/output schema, declared capabilities, workload identity, resource scope, timeout/cancellation, concurrency/resource limits, idempotency/retry behavior, provenance, output hashes, health/telemetry, trust/approval lifecycle and failure isolation.

SDKs for Go/Python/C#/TypeScript may be added when real consumers exist. SDKs must conform to the same canonical contract definitions and must not fork them.

## 7. Proposed repository layout when runtime begins

Do not create these directories merely to reserve names. Introduce them with the first approved vertical slice.

~~~text
/
├── .ai/
│   ├── architecture/
│   ├── plans/
│   ├── schemas/
│   └── tasks/
├── platform/
│   └── core-go/
│       ├── cmd/
│       ├── internal/
│       │   ├── controlplane/
│       │   ├── identity/
│       │   ├── ingestion/
│       │   ├── knowledge/
│       │   ├── retrieval/
│       │   ├── projection/
│       │   └── integration/
│       ├── pkg/
│       └── go.mod
├── runtimes/
│   └── ai-python/
│       ├── src/
│       ├── tests/
│       └── pyproject.toml
├── extensions/
│   ├── sdk-go/
│   ├── sdk-python/
│   ├── sdk-dotnet/
│   └── sdk-typescript/
└── tests/
    ├── contract/
    ├── integration/
    └── conformance/
~~~

Layout rules:
- Keep .ai/schemas as the source of truth during architecture/contract work; do not duplicate schemas into a contracts directory without a packaging/versioning need.
- Go internal packages own implementation details. Avoid one Go module per logical module until independent release boundaries are demonstrated.
- Python communicates through contracts; it does not import Go internals or use shared database tables as an integration mechanism.
- SDKs are optional and incremental. Do not create empty placeholder packages for every architecture box.

## 8. Contract and compatibility policy

- Existing Canonical Knowledge, Ingestion, Retrieval, Context Packet, Projection and Evidence schemas remain unchanged by this language decision.
- Version contracts independently from implementation releases.
- Define backward/forward compatibility before publishing public extension SDKs.
- Reject unsupported major contract versions; preserve extension fields only where each contract explicitly permits them.
- Maintain conformance fixtures/tests for every runtime and SDK.
- Generated Go structs, Python dataclasses or C# classes are implementation artifacts, never the cross-language wire contract.

## 9. Security and tenancy

- Workspace isolation and ACL checks remain Core-owned invariants.
- Extensions receive minimum capabilities scoped to the exact Workspace/Project/Source and invocation.
- Do not pass broad platform database credentials to extensions.
- Extension output is untrusted until schema, lineage, provenance, completeness and policy validation succeed.
- No extension publishes canonical knowledge or changes readiness pointers directly.
- Runtime isolation, egress restrictions, artifact access and quotas must be validated before customer extensions are enabled.

## 10. Alternatives considered

### C#/.NET Core + Python AI/ML
Mature enterprise backend, async/concurrency, Microsoft integration and AI abstractions. Technically viable. Not the preferred greenfield default because the platform should be independent of the pilot's .NET stack. Retain as a benchmark fallback if team efficiency, integration or measured workload favors it.

### Go Core + Python AI/ML (proposed)
Clean independent Core direction, straightforward deployment and concurrency model, with Python retained where AI ecosystem matters. Costs include multi-language toolchains, extension isolation, and potentially weaker Go ecosystem coverage for some enterprise/AI libraries. Preferred conditionally on vertical-slice evidence.

### Python for the entire platform
Strongest direct AI/ML access and fast experimentation, but risks mixing model-centric dependencies with platform control-plane logic and requires deliberate concurrency/operational discipline. Not preferred for Core.

### Polyglot microservices from day one
Maximum per-component language freedom, but premature network boundaries, deployment/observability/security overhead and distributed consistency costs. Reject initially.

## 11. Validation plan and decision gates

Before treating the choice as production-final:
1. Implement one representative Go Core vertical slice, not only a synthetic microbenchmark.
2. Integrate existing backend/frontend code extractors through adapters without changing their analysis semantics.
3. Exercise a Python runtime contract using a bounded AI/ML capability or deterministic test double.
4. Prove authorization with at least two Workspaces and differing ACLs.
5. Test duplicate webhook delivery, retry/restart, partial chunk failure and whole-SourceRevision publication.
6. Measure throughput, p50/p95 latency, CPU/memory, cold start, operational complexity and developer cycle time.
7. Compare a small C# reference implementation if results could change the decision.
8. Define numeric targets and test environment before benchmarking.

Revisit the choice if Go cannot meet integration/security/operability needs without disproportionate complexity, or measured C# delivery/performance is materially better for the actual workload.

## 12. Consequences

Benefits: independent Core direction, AI/ML ecosystem isolated from business logic, multilingual customer extensions and reusable contracts.

Costs/risks: multiple toolchains and conformance matrices, process/container isolation complexity, cross-runtime observability and dependency governance, and a larger public extension security/compatibility surface.

## 13. Decision status

This ADR records the direction accepted by the platform owner on 2026-11-12: Go for Core, Python for specialized AI/ML and language-neutral multilingual extensions. Runtime implementation details, numeric benchmark targets and extension execution protocol still require validation.

Accepted direction: Go is the primary Core language; Python is the specialized AI/ML Runtime; extensions remain multilingual and isolated from the Core process; the initial Core deployment is a modular monolith; existing language-neutral contracts remain unchanged; runtime scaffolding is deferred until the first vertical-slice design is approved.
