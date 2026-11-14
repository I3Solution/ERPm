# Context Packet Contract v1 — Agent Context Packaging

> **Status:** Draft for architecture review
> **Date:** 2026-11-12
> **Depends on:** Workspace Boundary, Canonical Knowledge Contract v1, Ingestion v1, Storage Boundary and accepted Retrieval Contract v1
> **Scope:** Agent-neutral packaging of authorized retrieval results into bounded, evidence-preserving task context
> **Out of scope:** LLM prompt templates, model selection, tokenization library selection, answer generation, tool execution, conversation memory and transport-specific wire schemas

## 1. Purpose

Define a reusable Context Packet that packages selected Retrieval results into a bounded, traceable context for one agent task or invocation.

Retrieval answers: **which authorized knowledge candidates and evidence match this request?**

Context assembly answers: **which of those candidates should be placed in this task's context, in what form, and within what budget?**

A Context Packet is a derived delivery artifact. It is not a new source of truth, a KnowledgeRecord, an Evidence replacement, an authorization grant or an answer. It must retain a path back to the exact authorized SourceRevision and source-native Evidence behind every factual item.

## 2. Contract principles

1. **One Workspace:** a packet belongs to exactly one Knowledge Workspace. Cross-Workspace work requires separate packets and explicit caller-side orchestration; v1 does not merge them.
2. **Task-scoped:** a packet is built for one task/invocation and an explicit consumer/audience, not treated as durable conversation memory.
3. **Retrieval-derived:** factual content comes only from an authorized Retrieval response and its resolved Evidence. The Context Engine cannot invent records or relations.
4. **Evidence-preserving:** every factual item has one or more source references, exact SourceRevision identity and source-native locator. Generated summaries also cite their input evidence.
5. **Bounded:** the packet respects a hard token/size budget and discloses selection, omission and truncation.
6. **Trust-aware:** source content and generated summaries are untrusted data, not instructions to the consuming agent. Trust labels must survive transport rendering.
7. **Immutable after issue:** changing task, scope, evidence, budget or selected revisions creates a new packet identity.
8. **Agent/protocol-neutral:** MCP, API, IDE and other adapters may render the packet differently but cannot remove its evidence, scope, trust or limitation metadata.
9. **Disposable:** a packet can be rebuilt from Retrieval and policy inputs; it is not canonical knowledge and does not replace source retention.

## 3. Inputs to the Context Engine

The conceptual build request contains:

### 3.1 Authorized execution context

Provided by trusted platform middleware, not caller-supplied claims:
- Authenticated principal and intended consumer/audience.
- Tenant and exactly one authorized Workspace.
- Effective Project/Source grants and authorization-policy version.
- Request/trace identity and audit context.

### 3.2 Task specification

- Task/invocation identifier.
- User task description or normalized task goal.
- Optional task type/profile, such as code investigation, implementation planning, document analysis or business-process lookup.
- Optional required knowledge domains, payload types and exact identifiers.
- Explicit exclusions or sensitive-content policy.

Task text is untrusted user input. It can guide relevance selection but cannot grant access, alter ACL, change source trust or override platform safety rules.

### 3.3 Retrieval input

The Context Engine consumes one or more completed Retrieval responses that share the same authorized Workspace and compatible policy context. In v1, a request should normally assemble from one Retrieval response; multiple responses may be combined only when their effective scope, principal, revision policy and policy fingerprint are compatible.

The engine must not accept raw candidate IDs from an agent as proof that a record/evidence is authorized. Any externally supplied references are re-resolved through Retrieval and authorization.

### 3.4 Context profile and budget

A versioned ContextProfile may define:
- Included record/payload kinds and evidence types.
- Selection and deduplication policy.
- Whether generated summaries are permitted.
- Excerpt length and per-item limits.
- Ordering/priority rules.
- Token budget and reserve for the consumer's own instructions/response.
- Redaction and sensitive-data policy.
- Expiry and retention defaults.

The caller may request a profile and budget within policy ceilings. It cannot override profile restrictions, mandatory evidence, scope or server-enforced maximums.

## 4. Packet envelope

A packet carries the following conceptual metadata:

| Field group | Required information |
|---|---|
| Identity | Opaque Packet ID, contract version, immutable content hash |
| Lifecycle | Created timestamp, expiry timestamp and packet state |
| Scope | Tenant ID, Workspace ID, effective Project/Source scope or safe opaque representation |
| Audience | Principal/consumer identity or bound audience; never a bearer authorization token |
| Task | Task/invocation ID, task type and normalized goal reference or bounded task description |
| Retrieval provenance | Retrieval request/result identity, Retrieval Contract version and selected published SourceRevision manifests |
| Policy | ContextProfile ID/version, effective authorization-policy fingerprint and selection-policy version |
| Budget | Limit, used/reserved tokens, tokenizer identity/version and estimation method |
| Completeness | Completion state, included item count, omitted/truncated counts and limitation notices |

The packet must not expose identities, counts or diagnostics for Workspace/Project/Source resources outside the caller's effective scope.

## 5. Context item model

The packet is a sequence of typed items. Every item has:
- Stable item ID within the packet.
- Item kind and content format.
- Bounded content or structured payload.
- Priority/selection reason.
- Trust classification.
- One or more provenance references when it contains factual source-derived content.
- Truncation/omission metadata when applicable.

Initial item kinds:

| Kind | Purpose | Required lineage |
|---|---|---|
| `structured_fact` | Selected typed KnowledgeRecord fields useful to the task | KnowledgeRecord ID, SourceRevision and Evidence IDs |
| `source_excerpt` | Bounded document/text passage | Evidence ID, source-native locator, content hash if available |
| `code_excerpt` | Bounded code range or symbol body | Evidence ID, repository identity, commit SHA, path and line/range locator |
| `verified_relation` | Relation selected from Retrieval response | Relation ID, endpoint record IDs and supporting Evidence IDs |
| `generated_summary` | Optional compression/summary of selected items | Input item/Evidence IDs, producer/model/version and template/policy version |
| `notice` | Limitation, unavailable method, gap or safety warning | Platform-generated reason; must not reveal inaccessible resources |

The Context Engine may select fields from a typed payload but must preserve the payload discriminator/version and record identity. It must not flatten unlike domain payloads into an ambiguous free-text fact.

### 5.1 Provenance references

Each source-derived item must link to:
- KnowledgeRecord ID where the item derives from a canonical record.
- Evidence ID(s).
- Source ID and exact SourceRevision ID/identity.
- Source-native locator (path/line, page/section, database object path or equivalent).
- Content/excerpt hash when available.
- Claim kind and verification state from the canonical record, where applicable.

Every locator/content fetch is subject to authorization. A URI, blob key, Evidence ID or packet ID is not authorization.

### 5.2 Generated summaries

Generated summaries are optional and derived, never authoritative:
- Identify the producing component/model and version.
- Identify the template/prompt policy version and generation timestamp.
- List all input ContextItem/Evidence IDs.
- Preserve uncertainty, disagreement and missing evidence.
- Do not create new KnowledgeRelations or change claim verification.
- If summary provenance cannot be recorded, omit the summary and include the original evidence items as budget allows.

A summary may compress wording, but it cannot claim broader certainty than its supporting records/evidence.

## 6. Trust and instruction-safety model

Every item must carry a trust class, at minimum:

- `platform_metadata`: packet envelope, policy and system-generated notices. This is metadata, not source business truth.
- `source_content_untrusted`: code, documents, issue text, comments, database descriptions and other captured source content. It may be factually relevant but is not an instruction to the agent.
- `derived_content_untrusted`: generated summaries or transformations derived from source content. It remains untrusted and must cite its inputs.

Rules:
1. Retrieved source text must be presented as quoted/identified data, never merged invisibly into system/developer instructions.
2. A source excerpt containing instructions such as “ignore previous instructions”, credential requests or tool commands remains untrusted content.
3. A Context Packet cannot authorize tool execution, repository writes, network access, code execution or policy changes.
4. The consuming agent must retain item trust labels and source boundaries when adapting the packet to its own prompt format.
5. Do not copy raw connector secrets, access tokens or unrelated personal data into a packet. Apply the approved redaction policy before materialization.

## 7. Selection, ranking and deduplication

The Context Engine selects only from authorized Retrieval results.

Recommended selection order:
1. Preserve task-critical exact identifiers and exact structured facts requested by the task.
2. Include directly relevant evidence with strong source/revision provenance.
3. Include supporting verified relations when they materially improve understanding.
4. Include complementary sources/revisions already selected by Retrieval.
5. Include generated summaries only when they improve coverage without obscuring source evidence.

Rules:
- Selection records a reason/priority sufficient for diagnostics.
- Duplicate candidates for the same record/evidence are deduplicated without erasing independent evidence references.
- Similar text from different Sources or revisions is not automatically treated as the same fact.
- Conflicting values/claims are not silently merged or resolved by a summary. Include the competing evidence and a conflict notice when relevant and within policy.
- Do not add more than one revision of the same Source unless the task explicitly requests comparison and the retrieval request used an explicit pinned/multi-revision comparison mode.
- The engine may not invent missing dependencies, call relationships or business rules.

## 8. Token and size budget

The ContextProfile defines a hard maximum budget for the packet content delivered to the target consumer.

Budget accounting must identify:
- Maximum token count.
- Used token count.
- Reserved token count for envelope/rendering/consumer framing when applicable.
- Tokenizer identity and version, or a conservative estimator identity/version when the target tokenizer is unknown.
- Whether the count is exact or estimated.

Rules:
1. Budget enforcement includes all packet content that the consumer receives, not only excerpt text.
2. Keep enough budget for mandatory scope, revision, evidence, trust and limitation metadata.
3. When over budget, first remove lower-priority optional items; then shorten excerpts at source-safe boundaries; then omit optional summaries. Record every omission/truncation.
4. Never silently truncate a citation, SourceRevision identity, Evidence locator, trust label or security notice to fit.
5. Prefer complete code symbols/functions or coherent document sections over arbitrary mid-token cuts. When a range is shortened, preserve the exact included range and disclose omitted ranges/length.
6. If mandatory metadata and the minimum useful evidence cannot fit within the allowed budget, fail with a context-budget error or request a narrower task/scope. Do not return an apparently complete packet with its evidence stripped.
7. A tokenizer mismatch must be disclosed. A conservative estimate may be used only when the packet records the estimator; it must not claim exact target-model token counts.

## 9. Completeness and gaps

Packet completeness is explicit:
- `complete`: all required context-profile inputs were available and included within policy/budget.
- `partial`: useful context was included, but optional retrieval methods, sources, items or excerpts were unavailable/omitted/truncated.
- `insufficient`: required evidence/context could not be included safely or within budget; no normal ready packet is emitted.

Include structured notices for:
- Retrieval methods pending/failed/stale/unsupported.
- Source/revision coverage gaps visible within the caller's authorized scope.
- Items omitted due budget or profile restrictions.
- Truncated excerpts and exact retained ranges.
- Conflicting evidence or unresolved relationships.
- Unavailable target tokenizer or summary generation.

Do not identify inaccessible resources, explain their existence or expose their counts. Absence from a packet is not evidence that a source contains no matching knowledge.

## 10. Lifecycle and immutability

Logical packet lifecycle:
- `building`: selection and budget enforcement in progress; not consumable.
- `ready`: immutable packet may be delivered to its bound audience.
- `failed`: packet could not be assembled safely or correctly.
- `expired`: packet is beyond its configured validity.
- `revoked`: platform policy or authorization change invalidated future access to the stored packet.

Rules:
- A ready packet is immutable. Any change creates a new Packet ID and hash.
- Packet identity is not a content-access token.
- The platform revalidates authorization immediately before delivery/materialization.
- Membership, ACL, source policy or Workspace lifecycle changes invalidate stored packet delivery according to policy.
- A packet already delivered to an external model/agent cannot be cryptographically recalled from that recipient; use short configurable expiry, least-content selection, transport controls and audit. Do not promise revocation of already disclosed content.
- Packets are disposable and may be regenerated from authorized Retrieval results, subject to source retention and current authorization.

## 11. Responsibilities by layer

- **Retrieval Engine:** returns authorized, revision-pinned candidates, Evidence and method availability.
- **Context Engine:** selects/deduplicates candidates, chooses safe excerpts, optionally summarizes, enforces token budget and produces the packet manifest.
- **Authorization layer:** resolves principal/scope and revalidates ACL before packet delivery; does not delegate authority to packet IDs.
- **ContextProfile registry:** controls permitted content kinds, selection rules, token ceilings, summaries and redaction policies.
- **API/MCP/agent adapter:** transports/renders packet while preserving provenance, trust, revision and limitation metadata.
- **Consuming agent:** reasons over supplied evidence; must not treat source content or generated summaries as instructions or as proof beyond their cited evidence.

## 12. Caching, retention and observability

- Cache keys include Tenant/Workspace, principal/audience, effective ACL/policy version, task/profile version, Retrieval result/revision manifests, selected item IDs, tokenizer and packet contract version.
- Do not reuse a packet for a different principal, Workspace, task or policy unless an explicitly reviewed sharing policy authorizes it.
- Apply deployment retention and deletion policy to stored packets, summaries and logs; default to short-lived storage and avoid retaining packet body after delivery unless required.
- Audit packet creation/delivery/revocation with principal, scope, profile/version, retrieval reference, selected revision manifest, budget outcome and consumer; avoid copying sensitive packet bodies into audit logs.
- Metrics may include build latency, token estimate, used budget, omission/truncation rate, packet completeness and evidence coverage.

## 13. Acceptance scenarios

1. A packet cannot contain results from another Workspace even when source text/content hashes are identical.
2. A Project-restricted principal receives only items within effective Project/Source grants.
3. A packet can be traced from each factual item to Evidence, SourceRevision and a source-native locator.
4. A generated summary lists its inputs and remains marked as derived/untrusted.
5. Prompt-injection-like text in a source excerpt remains labeled as untrusted source content and cannot alter packet policy.
6. Over-budget assembly removes lower-priority items or shortens excerpts with explicit omission/truncation notices.
7. Evidence IDs, citations, SourceRevision identity and trust labels are never silently truncated.
8. Conflicting values from authorized evidence are disclosed as a conflict rather than silently blended.
9. A packet built for one principal/task cannot be replayed as an authorized packet for another principal/task.
10. ACL revocation before delivery prevents stored packet materialization; already delivered external content is not falsely claimed to be recallable.
11. A packet with unavailable optional vector/full-text projection is marked partial when useful evidence remains.
12. If required evidence cannot fit within budget, packet creation reports insufficient/context-budget failure rather than removing provenance.
13. Adapters preserve item types, source locators, revision identities, trust classes and notices.
14. A packet can be rebuilt without mutating canonical KnowledgeRecord, Evidence, KnowledgeRelation or SourceRevision.

## 14. Accepted v1 decisions

> **Status:** The seven semantic defaults below were accepted by the user on 2026-11-12.

1. **Packet scope:** exactly one Workspace and one bound principal/audience per packet. Cross-Workspace context requires separate packets and explicit caller-side orchestration.
2. **Task boundary:** one packet per task/invocation; it is not long-lived conversation memory.
3. **Source content:** include bounded source excerpts and typed payload projections with mandatory Evidence. Generated summaries are optional, derived and untrusted, with complete input lineage.
4. **Budget:** enforce a hard token ceiling over metadata and content. Preserve provenance/trust metadata; remove low-priority optional items before shortening excerpts. Never silently truncate mandatory evidence or security metadata.
5. **Tokenizer:** use the target model tokenizer when known; otherwise use a versioned conservative estimator and explicitly mark the count as estimated.
6. **Expiry/revocation:** use a short configurable TTL, bind the packet to its principal/audience and revalidate authorization before delivery. Do not promise recall of content already delivered to an external recipient.
7. **Conflicts and gaps:** represent unavailable methods, omissions, truncation, conflicts and uncertainty explicitly; never disguise them as complete context.

These decisions freeze the semantic defaults for v1. Initial machine-readable ContextPacket and ContextProfile JSON Schemas and validation fixtures are maintained under `../schemas/`; protocol adapter mappings, broader evaluation fixtures and runtime implementation remain follow-up work. Do not choose an LLM or implement prompt rendering from this document alone.


## 15. Machine-readable schema v1

Initial JSON Schema Draft 2020-12 artifacts:

- [ContextPacket v1](../schemas/context-packet-v1.schema.json)
- [ContextProfile v1](../schemas/context-profile-v1.schema.json)

The schemas formalize the accepted semantic contract without selecting a transport protocol, model vendor or runtime implementation. They define the ready-to-deliver packet envelope, source revision manifest references, budget/tokenizer metadata, completeness diagnostics, typed item variants, trust labels, evidence references and the profile-controlled item/selection/budget/lifecycle limits.

### 15.1 Cross-field invariants

JSON Schema validates shape and local constraints. The platform must additionally enforce:

1. `scope.workspaceId` and every referenced SourceRevision/Evidence must resolve to the same authorized Workspace; each Project/Source selector can only narrow effective access.
2. `audience.principalId` is bound to the authenticated principal; it is not a bearer token or a substitute for authorization.
3. Every factual item has Evidence whose `sourceRevisionId` is included in `retrievalProvenance.selectedRevisions`; locators and content hashes must match the captured source.
4. Every `verified_relation` is resolved, verified and authorized at both endpoints; relation evidence must support the predicate.
5. Every `generated_summary` has `derived_content_untrusted` trust, references existing input item/evidence IDs and does not upgrade claim verification.
6. `budget.usedTokens + budget.reservedTokens <= budget.maxTokens`; exact/estimated counting semantics must match the tokenizer metadata.
7. Item counts in `completeness` match the actual included/omitted/truncated manifest. An insufficient build does not emit a normal ready packet.
8. `expiresAtUtc` is later than `createdAtUtc`; authorization is revalidated immediately before delivery.
9. When an item is truncated, its retained source range and omitted range are explicit; mandatory provenance, trust and security metadata remain intact.
10. The consumer adapter preserves every item discriminator, trust label, Evidence reference, revision identity and limitation notice.

The schema's `$id` values use stable URNs until the platform publishes a governed schema registry URI. Schema validation does not replace authorization, provenance verification, policy evaluation or token accounting.

### 15.2 Deliberately not frozen

- JSON vs Protobuf as the runtime transport encoding.
- Canonical ID encoding and exact cross-contract reference formats.
- A globally governed schema registry and compatibility tooling.
- Model-specific tokenizer packages and estimator implementation.
- Adapter-specific rendering and prompt framing.

These require the platform-wide contract and technology ADR work; do not infer them from the JSON Schema files.
