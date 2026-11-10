# ERPm Context Engineering --- Implementation Plan

**Version:** 1.0\
**Date:** 2026-11-10\
**Repository baseline:** `I3Solution/ERPm` --- branch `master`\
**Purpose:** Reduce coding-agent context overhead and improve the
accuracy, continuity, and traceability of task execution across ERPm
repositories.

------------------------------------------------------------------------

## 1. Executive Summary

ERPm is a multi-repository project coordinated through an Umbrella
repository. Coding agents such as Claude Code and Antigravity currently
need to discover relevant repositories, modules, documentation, API
flows, database dependencies, and tests for each task.

The initial repository audit identified four main sources of context
inefficiency:

1.  **Excessive mandatory documentation loading:** global and
    repository-level instructions direct agents to read large
    architecture and status documents even when only a small part is
    relevant.
2.  **Stale or duplicated project knowledge:** status and architecture
    documents contain historical or outdated information that can
    conflict with the checked-out source.
3.  **Missing cross-repository dependency map:** the relationship
    between FE modules, BE layers, shared contracts, dictionaries, and
    database artifacts is not represented in a machine-queryable form.
4.  **Repeated code exploration:** agents rediscover symbols, callers,
    API paths, and dependencies that could be indexed and retrieved
    precisely.

The proposed solution is an **ERPm Context Engineering layer** that sits
above the existing development workflow. It does not replace Git,
branches, PRs, task records, plans, steps, reviews, or verification
procedures.

The implementation is incremental:

-   Phase 1: optimize existing context instructions and establish
    authoritative project metadata.
-   Phase 2: build language-aware code and dependency indexes.
-   Phase 3: expose context retrieval through an agent-agnostic MCP
    server.
-   Phase 4: add business-knowledge retrieval, automated freshness
    checks, and effectiveness metrics.

**Initial recommendation:** implement Phase 1 first, then validate its
impact before investing in the indexing and MCP layers.

------------------------------------------------------------------------

## 2. Goals and Non-Goals

### 2.1 Goals

-   Reduce irrelevant tokens loaded before an agent begins a task.
-   Make the Umbrella repository the authoritative entry point for
    workspace topology and pinned repository revisions.
-   Route tasks to the smallest reasonable set of domains and
    repositories.
-   Retrieve code by symbol, reference, dependency, and API flow instead
    of reading entire repositories.
-   Preserve cross-repository correctness for FE, BE, database, shared
    dictionaries, and tests.
-   Keep Claude Code, Antigravity, and future agents compatible with the
    same context source.
-   Make context reproducible and traceable to exact Git commit SHAs.
-   Measure context efficiency and task quality rather than relying on
    subjective impressions.

### 2.2 Non-Goals

The first implementation will not:

-   Replace the current task/step/plan workflow.
-   Automatically modify business logic or make implementation decisions
    on behalf of the coding agent.
-   Build a general-purpose RAG system over every source file.
-   Require a central cloud service or external vector database.
-   Force every task through every context tool.
-   Impose an arbitrary maximum number of files per task.
-   Treat generated indexes as the source of truth; Git source remains
    authoritative.

------------------------------------------------------------------------

## 3. Repository Baseline and Audit Findings

The initial audit used the Umbrella repository's `master` branch and the
exact FE/BE gitlink revisions recorded by that root commit.

### 3.1 Baseline revisions

  --------------------------------------------------------------------------------------------
  Repository              Revision                                     Role
  ----------------------- -------------------------------------------- -----------------------
  `I3Solution/ERPm`       `a87ffcb2638075f7496b48bc615bd6c516d95db1`   Umbrella repository

  `I3Solution/ERPm-BE`    `38763b0b67b96d5998dda76cd71e7015b458b5f4`   Backend submodule

  `I3Solution/ERPm-FE`    `427ac894cdcf22a3f83ad11c8ac87d817cbec126`   Frontend submodule
  --------------------------------------------------------------------------------------------

These are audit baseline revisions, not permanent pins for future
development. Any generated context packet must record the actual
revisions checked out when the packet is built.

### 3.2 Verified repository structure

-   Root repository: project-level instructions, plans, tasks, reviews,
    CI, documentation, and FE/BE gitlinks.
-   Backend: .NET solution organized into Domain, Application,
    Infrastructure, and API areas.
-   Frontend: Angular/Ionic application with shared/core areas and
    feature modules.
-   Frontend feature repositories include ACC, CRM, HRM, MFG, PM, PUR,
    SCM, SD, WMS, and DASHBOARD.
-   Some frontend code, including SYS-related functionality, is
    maintained directly inside the FE repository rather than as a
    separate feature submodule.

### 3.3 Findings to address

  ------------------------------------------------------------------------------
  ID                Finding                Impact              Proposed response
  ----------------- ---------------------- ------------------- -----------------
  F-01              Root instructions      High context        Replace mandatory
                    require reading large  overhead            full reads with a
                    global documents                           concise bootstrap
                                                               and conditional
                                                               references

  F-02              Root status document   High noise and      Separate current
                    is large and mixes     stale-state risk    status from
                    current state with                         historical
                    history                                    records

  F-03              FE and BE have their   Duplicate context   Define document
                    own overlapping        and possible        ownership and
                    architecture/status    conflicts           precedence
                    documents                                  

  F-04              Some                   Agents may follow   Generate
                    architecture/version   outdated            technical facts
                    statements disagree    assumptions         from source
                    with checked-out                           manifests and
                    manifests                                  validate docs

  F-05              FE/BE/module           Repeated cross-repo Create workspace,
                    dependencies are not   discovery           repository, and
                    represented as a                           domain registries
                    queryable registry                         

  F-06              Agents repeatedly      Repeated            Add
                    search for symbols and exploration and     language-aware
                    callers                token cost          code indexing

  F-07              Root CI compares       Hidden              Record this as an
                    shared dictionary      cross-repository    explicit
                    files across FE and BE dependency          integration
                                                               dependency

  F-08              One nested HRM gitlink Checkout/baseline   Verify with a
                    revision could not be  uncertainty         clean recursive
                    resolved through the                       submodule
                    GitHub API during the                      checkout and CI
                    audit                                      
  ------------------------------------------------------------------------------

### 3.4 Important baseline qualification

The audit confirmed repository trees and selected documents at the
revisions listed above. It did not perform a complete semantic review of
every source file, API, migration, or business rule. Domain mappings and
dependency relationships must therefore be verified from actual imports,
API calls, project references, database mappings, and tests before they
are treated as authoritative.

------------------------------------------------------------------------

## 4. Target Architecture

### 4.1 Conceptual architecture

``` text
Coding Agents
  Claude Code / Antigravity / Future Agents
                |
                v
       ERPm Context Interface
                |
                v
          Context Router
       - classify task
       - resolve domain
       - select repositories
       - determine required evidence
                |
                v
        Context Retrieval Layer
       +---------------------------+
       | Workspace / Repo Registry |
       | Domain / Integration Map  |
       | Code Intelligence Index   |
       | Documentation Search      |
       | Git / Test Metadata       |
       +---------------------------+
                |
                v
        Context Packet Builder
                |
                v
        Coding Agent Execution
                |
                v
        Validation / Feedback
```

### 4.2 Four context layers

1.  **Project Map** --- workspace topology, repository ownership, pinned
    revisions, module boundaries, and integration relationships.
2.  **Code Intelligence** --- symbols, definitions, references, callers,
    imports, inheritance, project references, and API flows.
3.  **Context Retrieval** --- search and retrieval tools that select
    only relevant documents, source files, symbols, and tests.
4.  **Context Policy** --- rules governing exploration depth, evidence,
    scope expansion, freshness, and provenance.

### 4.3 Scope hierarchy

The router should reason through the following hierarchy:

``` text
Workspace
  -> Business Domain
      -> Repository
          -> Project / Package
              -> File
                  -> Symbol
```

-   Workspace is the entry point.
-   Domain is the task-routing unit.
-   Repository is the source retrieval and versioning unit.
-   Symbol is the preferred code-reading unit.
-   Context Packet is the agent handoff unit.

A task may cross domains or repositories when source evidence proves a
dependency. The router must not artificially block legitimate
cross-module changes.

------------------------------------------------------------------------

## 5. Target Directory Structure

The implementation should extend the existing `.ai/` structure rather
than create a parallel documentation system.

``` text
ERPm/
├── AGENTS.md
├── PROJECT_MASTER.md
├── .ai/
│   ├── context/
│   │   ├── README.md
│   │   ├── workspace-map.yaml
│   │   ├── repository-registry.yaml
│   │   ├── domain-registry.yaml
│   │   ├── integration-map.yaml
│   │   ├── context-policy.md
│   │   └── schemas/
│   │       ├── workspace.schema.json
│   │       ├── repository.schema.json
│   │       ├── domain.schema.json
│   │       └── context-packet.schema.json
│   ├── generated/
│   │   ├── workspace-snapshot.json
│   │   ├── code-index/
│   │   └── context-packets/
│   ├── tasks/
│   ├── plans/
│   ├── steps/
│   ├── reviews/
│   └── history/
│       └── status/
└── tools/
    └── context/
        ├── README.md
        ├── config/
        ├── scripts/
        └── tests/
```

The `tools/context/` location is a proposal. Before implementation,
inspect existing scripts and tooling conventions to avoid duplicating an
established location.

### 5.1 Ownership rules

  -----------------------------------------------------------------------
  Artifact                Source of truth         Update method
  ----------------------- ----------------------- -----------------------
  Workspace topology      Git submodule           Generated/validated
                          configuration and       
                          repository metadata     

  Current repository      Actual checked-out Git  Generated
  revision                HEAD and gitlink        

  Domain ownership        Reviewed domain         Maintained with review
                          registry                

  Technical dependencies  Source code, project    Indexed
                          files, imports, API     
                          contracts               

  Business rules          Approved domain         Curated
                          documentation and       
                          implementation evidence 

  Current project status  Concise status file     Updated by workflow

  Historical status       Archived                Append/archive
                          task/step/review        
                          records                 

  Code index              Source code at a        Generated and
                          specific revision       disposable

  Context packet          Task + repository       Generated per task
                          state + retrieved       
                          evidence                
  -----------------------------------------------------------------------

Generated files must never silently override source code or reviewed
documentation.

------------------------------------------------------------------------

## 6. Phase 1 --- Context Optimization and Metadata Foundation

**Priority:** Highest\
**Estimated effort:** 3--5 implementation days, excluding review and
unexpected cleanup\
**Primary outcome:** Agents start with a small, reliable bootstrap and
retrieve only relevant project knowledge.

### 6.1 Workstream 1: Audit and simplify agent instructions

**Tasks**

1.  Review root `AGENTS.md`, FE `AGENTS.md`, and BE `AGENTS.md`.
2.  Identify mandatory reads, duplicated instructions, stale statements,
    and repository-specific rules.
3.  Define instruction precedence:
    -   Root instructions: workspace-wide rules and bootstrap.
    -   FE instructions: frontend-specific conventions.
    -   BE instructions: backend-specific conventions.
    -   Module instructions: only when a module has genuinely distinct
        rules.
4.  Keep `AGENTS.md` concise and operational.
5.  Replace broad "read all documents" rules with conditional lookup
    instructions.
6.  Preserve critical safety, coding, testing, and Git workflow
    requirements.
7.  Verify compatibility with Claude Code and Antigravity instruction
    discovery.

**Acceptance criteria**

-   A simple FE-only task does not require loading BE architecture
    documentation.
-   A BE-only task does not require loading FE module documentation.
-   A cross-stack task can still discover both sides and their
    contracts.
-   No critical coding or verification rule is lost.
-   Instructions identify where to retrieve authoritative information.

### 6.2 Workstream 2: Separate current state from history

**Tasks**

1.  Review root, FE, and BE `.ai/status.md`.
2.  Define a concise current-status format.
3.  Move completed historical records to an archive or retain them in
    existing task/step records.
4.  Remove duplicated historical summaries from current status.
5.  Add `last_verified_at`, relevant commit SHA, and source references
    where practical.
6.  Define who or what updates current status after task completion or
    merge.

**Suggested current status format**

``` markdown
# Current Status

- Last updated:
- Verified commit:
- Current step:
- Active tasks:
- Blockers:
- Next actions:
- Relevant plan links:
```

**Acceptance criteria**

-   Current status contains only information useful for deciding the
    next action.
-   Completed work is not lost.
-   Historical records are discoverable by task, step, or date.
-   Status does not claim to describe a newer revision than the one it
    was verified against.

### 6.3 Workstream 3: Establish document authority and freshness

**Tasks**

1.  Define which file owns each type of information.
2.  Remove duplicated technical facts where they can be derived from
    manifests.
3.  Add a lightweight validation script for version statements and
    repository topology.
4.  Mark uncertain or unverified statements explicitly.
5.  Add a documentation review checklist to relevant PRs or verification
    workflows.

**Precedence proposal**

1.  Checked-out source and build manifests for technical facts.
2.  Git submodule configuration and actual gitlinks for repository
    topology.
3.  Reviewed domain/integration registry for ownership and cross-system
    relationships.
4.  `PROJECT_MASTER.md` for approved architecture and conventions.
5.  Current status for progress state.
6.  Historical notes for context only.

A lower-precedence document must not silently contradict a
higher-precedence source.

### 6.4 Workstream 4: Build Workspace Map and Repository Registry

**Workspace Map responsibilities**

-   Identify the Umbrella root.
-   Enumerate FE and BE repositories.
-   Enumerate nested feature submodules.
-   Identify local (non-submodule) feature areas.
-   Record repository paths and default branches.
-   Record actual checked-out HEADs and root gitlink SHAs.
-   Detect missing, dirty, or unresolved submodules.

**Repository Registry example**

``` yaml
repositories:
  - id: erpm-root
    name: ERPm
    path: .
    role: umbrella
    branch: master

  - id: erpm-fe
    name: ERPm-FE
    path: ERPm-FE
    role: frontend
    kind: git-submodule

  - id: erpm-be
    name: ERPm-BE
    path: ERPm-BE
    role: backend
    kind: git-submodule
```

The final schema must support nested submodules and local module
directories. The example above is illustrative, not the complete
registry.

**Acceptance criteria**

-   A single command can print the workspace topology.
-   The output distinguishes gitlinks from normal directories.
-   The output records actual checked-out revisions.
-   The tool detects unresolved or mismatched submodule states.
-   The result can be consumed by scripts and agents.

### 6.5 Workstream 5: Build Domain Registry and Integration Map

**Tasks**

1.  Identify domains from existing source, routes, API endpoints,
    services, and task history.
2.  Map each domain to FE modules and BE projects/namespaces.
3.  Identify shared capabilities such as authentication, dictionaries,
    files, notifications, and reporting.
4.  Record cross-repository contracts and dependencies.
5.  Mark inferred mappings as `unverified` until confirmed by code
    evidence.
6.  Add evidence references such as source paths, symbols, API routes,
    and tests.

**Suggested domain entry**

``` yaml
domains:
  - id: sales-order
    name: Sales Order
    status: verified
    frontend:
      repository: erpm-fe
      module: SD
    backend:
      repository: erpm-be
      projects:
        - ERPm.API
        - ERPm.Application
        - ERPm.Domain
        - ERPm.Infrastructure
    dependencies:
      - partner
      - inventory
    evidence:
      - path: ERPm-FE/src/app/modules/SD
        reason: feature module
```

Do not treat this example as an assertion that every listed dependency
is already verified. Confirm actual API and source relationships before
setting `status: verified`.

**Acceptance criteria**

-   Common task types can be routed to an initial domain scope.
-   Every verified mapping has source evidence.
-   Uncertain relationships are explicitly marked.
-   The registry can represent one domain spanning multiple
    repositories.

### 6.6 Workstream 6: Define Context Policy

The policy should establish progressive exploration:

1.  Read the concise root bootstrap.
2.  Resolve task type and likely domain.
3.  Read only the selected repository/module instructions.
4.  Search symbols, API routes, and relevant documents.
5.  Read definitions and direct dependencies.
6.  Expand to transitive dependencies only when evidence requires it.
7.  Build a context packet with sources, revisions, unknowns, and
    validation steps.
8.  Record scope expansion and newly discovered dependencies.

**Acceptance criteria**

-   Agents explain why they expand beyond the initial scope.
-   Agents do not read entire repositories by default.
-   Agents can still expand without arbitrary file-count limits.
-   Important unknowns are surfaced rather than guessed.

### 6.7 Phase 1 deliverables

-   Simplified root/FE/BE agent instructions.
-   Current-status format and historical organization.
-   Document authority and freshness policy.
-   Workspace Map and Repository Registry.
-   Initial Domain Registry and Integration Map.
-   Context Policy.
-   Workspace validation script.
-   A small set of representative task walkthroughs.

------------------------------------------------------------------------

## 7. Phase 2 --- Code Intelligence and Dependency Indexing

**Priority:** High after Phase 1\
**Estimated effort:** 1--3 weeks for a useful first version, depending
on tooling and language-server integration\
**Primary outcome:** Agents can retrieve exact code evidence without
repeatedly scanning large source trees.

### 7.1 Backend indexing

Use Roslyn and .NET build/project metadata where possible.

Index:

-   Projects and project references.
-   Namespaces and types.
-   Classes, interfaces, records, enums, methods, and properties.
-   Definitions and references.
-   Callers and callees where resolvable.
-   Inheritance and interface implementations.
-   Dependency injection registrations.
-   API controllers, routes, request/response types.
-   EF Core entities, configurations, DbSets, and migrations.
-   Test-to-production-code relationships where practical.

**Important:** use semantic compilation where possible. Text search
remains useful as a fallback, but it is not a substitute for symbol
resolution.

### 7.2 Frontend indexing

Use the TypeScript Compiler API and Angular-aware metadata.

Index:

-   Angular projects and module/submodule boundaries.
-   Components, directives, pipes, and services.
-   TypeScript symbols and references.
-   Imports and dependency relationships.
-   Routes and lazy-loaded feature boundaries.
-   API service methods and HTTP endpoints.
-   DTO/interfaces and shared models.
-   Template component usage and bindings where supported.
-   i18n keys and dictionary references.

### 7.3 Database and contract indexing

Index:

-   EF Core migrations.
-   Entity-to-table mappings.
-   Columns, keys, indexes, and relationships.
-   PostgreSQL schema snapshots or introspection output.
-   API request/response contracts.
-   Shared dictionaries and other synchronized files.
-   FE-to-BE endpoint references.

The index must distinguish: - Declared relationship. - Observed
source-code usage. - Inferred relationship. - Manually reviewed business
dependency.

### 7.4 Index storage

Start with a local, versioned, queryable representation such as SQLite
or JSONL plus a small search index. Choose the storage only after
measuring repository size, update time, and query patterns.

Each index must include:

-   Repository identity.
-   Commit SHA.
-   Indexer version.
-   Timestamp.
-   Source path.
-   Symbol identity.
-   Evidence/provenance.
-   Confidence or resolution status.

Never reuse an index if its repository SHA does not match the
checked-out source unless the tool explicitly reports it as stale.

### 7.5 Incremental updates

-   Detect changed files from Git.
-   Re-index affected projects or modules.
-   Rebuild dependency edges affected by changed symbols.
-   Re-index after branch switches or submodule pointer changes.
-   Provide a full rebuild command for recovery.
-   Keep index generation deterministic where practical.

### 7.6 Phase 2 acceptance criteria

-   Find a symbol definition by qualified or partial name.
-   Find references/callers for supported languages.
-   Trace a representative FE API call to the corresponding BE endpoint.
-   Trace a representative BE entity to EF configuration and migration.
-   Identify stale indexes by comparing commit SHAs.
-   Produce evidence-backed results with source paths and line ranges
    where available.
-   Demonstrate lower exploration time on selected real tasks.

------------------------------------------------------------------------

## 8. Phase 3 --- ERPm Context MCP

**Priority:** After Phase 1 and a useful Phase 2 index\
**Estimated effort:** 1--2 weeks for a focused initial server\
**Primary outcome:** Different coding agents consume the same context
retrieval capabilities.

### 8.1 Proposed MCP tools

  -----------------------------------------------------------------------
  Tool                                Responsibility
  ----------------------------------- -----------------------------------
  `get_workspace_map`                 Return workspace topology and
                                      repository revisions

  `get_repo_state`                    Report branch, HEAD, dirty state,
                                      and submodule status

  `resolve_task_scope`                Suggest domains and repositories
                                      for a task

  `search_business_context`           Search curated business rules and
                                      project docs

  `search_code_symbols`               Search types, methods, components,
                                      services, and symbols

  `get_symbol_details`                Return definition and relevant
                                      metadata

  `get_symbol_references`             Return callers, references, and
                                      implementations

  `trace_api_flow`                    Trace FE API usage to BE endpoints
                                      and contracts

  `trace_database_impact`             Trace entities, mappings, and
                                      migrations

  `get_test_coverage_context`         Find relevant tests and
                                      verification commands

  `build_context_packet`              Assemble task-specific context and
                                      evidence

  `record_context_feedback`           Record missing, irrelevant, or
                                      incorrect context
  -----------------------------------------------------------------------

### 8.2 Initial minimum viable toolset

Do not implement all tools at once. Start with:

1.  `get_workspace_map`
2.  `get_repo_state`
3.  `resolve_task_scope`
4.  `search_code_symbols`
5.  `get_symbol_references`
6.  `build_context_packet`

Add API/database tracing when the index supports it reliably.

### 8.3 Context Packet schema

A packet should contain:

``` yaml
task:
  id: TASK-XXX
  objective: "..."
  task_type: feature

workspace:
  root_commit: "..."
  repositories:
    - id: erpm-fe
      commit: "..."
    - id: erpm-be
      commit: "..."

scope:
  domains: []
  repositories: []
  modules: []

evidence:
  documents: []
  files: []
  symbols: []
  api_contracts: []
  database_objects: []
  tests: []

constraints: []
known_dependencies: []
unknowns: []
scope_expansion_reasons: []

validation:
  commands: []
  expected_checks: []
```

The packet should link to source evidence rather than copy large files
into the packet.

### 8.4 MCP design principles

-   Agent-agnostic protocol and data model.
-   Read-only retrieval by default.
-   No hidden source modifications.
-   Explicit repository SHA and index freshness.
-   Structured results with evidence and confidence.
-   Bounded result sizes with pagination or targeted expansion.
-   Clear errors for missing repositories, stale indexes, or unresolved
    symbols.
-   Local-first operation where practical.

------------------------------------------------------------------------

## 9. Phase 4 --- Context Intelligence and Continuous Maintenance

**Priority:** Later\
**Primary outcome:** Context stays accurate as ERPm evolves.

### Capabilities

-   RAG for curated business rules, ADRs, and historical decisions.
-   Automatic index refresh after merge or submodule pointer updates.
-   Stale-document detection.
-   Registry validation against source and Git metadata.
-   Context feedback loop.
-   Task-level context quality metrics.
-   Optional GitHub webhook integration.
-   Optional orchestration through n8n or another workflow engine if it
    adds measurable value.

### RAG boundaries

Use RAG for: - Business rules. - Architecture decisions. - Process
documentation. - Historical decisions and task records. - Explanations
that are not directly represented by code.

Do not rely on RAG as the primary mechanism for: - Exact symbol
lookup. - Call hierarchy. - Type resolution. - Import/reference
tracing. - Database object relationships already available from schema
metadata.

------------------------------------------------------------------------

## 10. Context Packet Generation Workflow

``` text
1. Receive task
      |
2. Read concise workspace bootstrap
      |
3. Inspect current Git/submodule state
      |
4. Classify task and resolve likely domain
      |
5. Select repositories and modules
      |
6. Search business context and code symbols
      |
7. Trace direct dependencies and contracts
      |
8. Expand scope when source evidence requires it
      |
9. Retrieve relevant tests and validation commands
      |
10. Build Context Packet with SHA and provenance
      |
11. Agent reviews packet and identifies unknowns
      |
12. Agent implements and validates
      |
13. Record missing/irrelevant context feedback
```

The router proposes an initial scope; the coding agent remains
responsible for reviewing the evidence and determining whether
additional exploration is needed.

------------------------------------------------------------------------

## 11. Context Policy for Coding Agents

The following rules should be adopted across supported agents.

### 11.1 Before implementation

-   Confirm root branch, commit, and working-tree state.
-   Confirm nested submodule state for repositories in scope.
-   Read the task and only the relevant plan/step.
-   Use the workspace/domain registry to select an initial scope.
-   Search for symbols and API contracts before opening broad source
    files.
-   Read relevant definitions and direct dependencies.
-   Identify tests and validation requirements.

### 11.2 During implementation

-   Expand scope only when imports, references, API calls, contracts,
    tests, or business rules justify it.
-   Record why a new repository or module is included.
-   Do not assume similarly named modules have identical
    responsibilities.
-   Do not treat stale generated indexes as current.
-   Do not replace source evidence with assumptions from old task
    summaries.

### 11.3 Before completion

-   Run relevant tests/build/verification.
-   Report repositories and modules changed.
-   Report database/API/dictionary impact.
-   Report validation performed and not performed.
-   Record newly discovered dependencies or missing documentation.
-   Update current status only when the existing workflow requires it.

### 11.4 Scope expansion rule

There should be no arbitrary maximum file count. Instead, every
expansion should be justified by one or more of:

-   A symbol reference or caller relationship.
-   An import or project dependency.
-   An API request/response contract.
-   A database relationship or migration.
-   A test dependency.
-   A documented business rule.
-   A reproducible build or runtime failure.

------------------------------------------------------------------------

## 12. Metrics and Evaluation

Measure the current workflow before and after implementation using
comparable tasks.

  -----------------------------------------------------------------------
  Metric                  Definition              Desired direction
  ----------------------- ----------------------- -----------------------
  Bootstrap tokens        Tokens loaded before    Down
                          task-specific           
                          exploration             

  Exploration tokens      Tokens spent searching  Down
                          and reading source/docs 

  Context preparation     Time from task receipt  Down
  time                    to implementation-ready 
                          context                 

  Relevant retrieval      Retrieved items judged  Up
  ratio                   relevant to the task    

  Duplicate exploration   Repeated discovery of   Down
                          the same facts across   
                          agents                  

  Scope expansion count   Additional              Track, not blindly
                          domains/repos opened    minimize
                          after initial routing   

  Missing dependency rate Relevant dependencies   Down
                          discovered late or      
                          missed                  

  Context correction rate Incorrect or stale      Down
                          context that agents     
                          must correct            

  Task completion quality Review findings,        Improve
                          regressions, and        
                          validation outcomes     

  Index freshness         Queries served from     Up
                          matching source         
                          revisions               
  -----------------------------------------------------------------------

### Evaluation set

Use at least these representative task categories:

1.  FE-only UI change inside one feature module.
2.  BE-only API/business-rule change.
3.  Full-stack feature touching FE, BE, and database.
4.  Shared dictionary/i18n change.
5.  Cross-module integration change.
6.  Bug fix requiring investigation through tests and references.

For each task, compare the baseline workflow with the optimized
workflow. Keep task complexity as similar as practical.

------------------------------------------------------------------------

## 13. Risks and Mitigations

  -----------------------------------------------------------------------
  Risk                    Consequence             Mitigation
  ----------------------- ----------------------- -----------------------
  Incorrect domain        Router omits required   Evidence-backed
  mapping                 code                    registry; mark
                                                  uncertain mappings

  Stale code index        Agent sees outdated     SHA validation and
                          references              automatic invalidation

  Overly aggressive       Important business      Progressive expansion
  context reduction       rules are missed        and explicit unknowns

  Duplicate documentation Conflicting             Ownership and
                          instructions remain     precedence rules

  Language tooling        Indexer takes too long  Deliver
  complexity              to build                backend/frontend slices
                                                  independently

  MCP overengineering     Tooling cost exceeds    Start with six core
                          benefit                 tools

  Agent-specific behavior Claude and Antigravity  Shared schemas and
                          retrieve different      common MCP interface
                          context                 

  Git submodule drift     Context does not match  Record root gitlinks
                          actual checkout         and nested HEADs

  RAG false positives     Irrelevant historical   Restrict RAG to curated
                          facts enter context     knowledge and return
                                                  provenance
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 14. Proposed Milestones

  -----------------------------------------------------------------------
  Milestone               Scope                   Exit condition
  ----------------------- ----------------------- -----------------------
  M0 --- Baseline         Record revisions,       Reproducible baseline
                          workflow, and metrics   captured

  M1 --- Instruction      Root/FE/BE bootstrap    Agents load only
  cleanup                 and precedence          relevant instructions

  M2 --- State and        Current status,         Workspace can be
  metadata                workspace map, repo     validated automatically
                          registry                

  M3 --- Domain map       Domain registry and     Representative tasks
                          integration map         route to correct
                                                  initial scope

  M4 --- Code index MVP   Roslyn and TypeScript   Definitions and
                          symbol indexes          references can be
                                                  queried

  M5 --- Dependency       API, database, and test Representative
  tracing                 relationships           end-to-end flows can be
                                                  traced

  M6 --- Context MCP MVP  Core retrieval and      Claude Code and
                          packet tools            Antigravity can consume
                                                  packets

  M7 --- Continuous       RAG, freshness,         Context updates and
  intelligence            feedback, metrics       quality can be
                                                  monitored
  -----------------------------------------------------------------------

Milestones may overlap where implementation dependencies permit, but
Phase 1 should establish the schemas and ownership rules before Phase
2/3 build on them.

------------------------------------------------------------------------

## 15. Immediate Next Actions

At the time this plan was drafted, the next implementation cycle focused only on Phase 1. The execution outcome is recorded in Section 18.

### Task 1 --- Establish a clean baseline

-   [ ] Clone or update the Umbrella repository at the intended working
    branch.
-   [ ] Run recursive submodule initialization/update.
-   [ ] Record root and nested submodule SHAs.
-   [ ] Investigate the unresolved HRM gitlink revision.
-   [ ] Confirm CI can reproduce the expected checkout.

### Task 2 --- Instruction audit

-   [ ] Review root, FE, and BE `AGENTS.md`.
-   [ ] Identify mandatory reads and duplicate rules.
-   [ ] Define root/FE/BE instruction ownership.
-   [ ] Draft concise bootstrap instructions.
-   [ ] Validate with one FE-only and one BE-only task.

### Task 3 --- Status and document freshness

-   [ ] Define current-status schema.
-   [ ] Separate current state from completed history.
-   [ ] Verify version facts against project manifests.
-   [ ] Define document authority and precedence.
-   [ ] Add freshness metadata where appropriate.

### Task 4 --- Workspace and domain metadata

-   [ ] Define YAML/JSON schemas.
-   [ ] Generate workspace topology from Git.
-   [ ] Create repository registry.
-   [ ] Create initial domain registry.
-   [ ] Record cross-repository integration dependencies.
-   [ ] Mark unverified relationships.

### Task 5 --- Validate the Phase 1 outcome

-   [ ] Select representative tasks.
-   [ ] Record bootstrap and exploration token estimates.
-   [ ] Compare context relevance and preparation time.
-   [ ] Review missed dependencies and incorrect assumptions.
-   [ ] Approve or revise Phase 1 before starting full indexing.

------------------------------------------------------------------------

## 16. Definition of Done

Phase 1 is complete when:

1.  Root, FE, and BE instructions have clear ownership and no
    unnecessary mandatory full-document reads.
2.  Current status is concise and separated from historical records.
3.  Workspace topology can be generated and validated from Git state.
4.  Repository metadata records actual revisions and submodule health.
5.  Domain and integration registries exist with evidence and
    verification status.
6.  Context policy defines progressive exploration and scope expansion.
7.  At least three representative tasks have been tested.
8.  Measurements show whether context preparation has improved.
9.  Existing build, test, PR, and verification workflows remain intact.

The overall Context Engineering initiative is successful when agents can
begin with a small, reliable context, retrieve the exact evidence needed
for a task, expand scope safely across repositories, and explain the
source and revision behind their decisions.

------------------------------------------------------------------------

## 17. Key Design Decisions to Confirm

These are decisions for implementation planning, not blockers to
starting Phase 1.

1.  **Indexer runtime:** .NET-based service, TypeScript/Node-based
    service, or a small polyglot toolset.
2.  **Index storage:** SQLite versus JSONL/search-index files.
3.  **Execution model:** local CLI first, then MCP server; or MCP from
    the beginning.
4.  **Index location:** generated files inside the workspace versus an
    external local cache.
5.  **Automation:** Git hooks, CI workflow, GitHub webhook, or scheduled
    refresh.
6.  **Domain ownership:** who reviews and approves domain/integration
    registry changes.

**Recommended defaults:** local-first CLI, generated index outside
tracked source where practical, SQLite for queryable metadata if
measurements justify it, and MCP only after the retrieval functions
prove useful through CLI workflows.

------------------------------------------------------------------------


---

## 18. Implementation Progress

**Last updated:** 2026-11-10

### Phase 1 — Context Optimization

**Implementation complete**

The Phase 1 implementation and available static/integration validation have been completed and merged into the Umbrella repository.

| Change | Repository | Result |
|---|---|---|
| FE agent-instruction bootstrap | `I3Solution/ERPm-FE`, PR #28 | Merged |
| BE agent-instruction bootstrap | `I3Solution/ERPm-BE`, PR #39 | Merged |
| Root context metadata and policy | `I3Solution/ERPm`, PR #54 | Merged |
| Validation records and status reconciliation | `I3Solution/ERPm`, PR #55 | Merged |

Key merge references:

- Root Phase 1 implementation: `6c3204172ade56ac6b575f38d34dc38f8b85d049`
- Phase 1 validation records: `3c3a57183122ca556fcdca5e19650f220273bb46`
- FE instruction revision pinned by the root implementation: `dbeaf66687454452886201bb669df1e25478d893`
- BE instruction revision pinned by the root implementation: `56385da65226f72c3b66f9c839e2fc430ce85210`

Validation completed:

- Recursive submodule checkout was verified by the user, including nested feature repositories.
- Root GitHub Actions completed successfully for the Phase 1 root merge: backend and frontend jobs passed.
- The four context metadata YAML files passed YAML parsing.
- FE and BE instruction files were reviewed at the exact revisions pinned by the root repository.

Deferred validation and follow-up:

- A representative real-task benchmark for context/token reduction has not yet been run; it is deferred until a suitable real task is available.
- Domain ownership and deeper FE endpoint → BE route/DTO/auth/error mappings remain partially verified and must be expanded with source evidence and domain-owner input.
- Roadmap/step numbering reconciliation remains a documentation follow-up.

**Phase 1 exit note:** implementation and available static/integration checks are complete. The empirical benchmark and remaining domain/integration evidence are tracked as follow-up work; they are not claimed as completed.

### Phase 2 — Code Intelligence and Dependency Indexing

**Next planned phase — not started**

Phase 2 is the next planned implementation stage. Its initial scope is:

1. **Backend:** evaluate and implement Roslyn-based indexing for .NET projects, symbols, definitions, references, callers, dependency injection, API routes/DTOs, EF mappings, migrations, and tests.
2. **Frontend:** evaluate and implement TypeScript Compiler API / Angular-aware indexing for projects, feature boundaries, components, services, routes, imports, symbols, and references.
3. **Database:** define a schema/object index for tables, columns, keys, views, procedures, migrations, and code-to-database references.
4. **Common index model:** agree on identifiers, repository-relative paths, source commit SHAs, provenance, and freshness rules.
5. **MVP retrieval:** expose a local CLI/query interface first; validate retrieval usefulness before committing to an MCP server.
6. **Evaluation:** benchmark on real ERPm tasks for retrieval precision, context preparation time, token usage, and missed dependencies.

Phase 2 must build on the existing workspace/domain metadata and preserve the source-of-truth rule: Git source and build/database manifests remain authoritative; generated indexes are disposable and tied to exact revisions.

**Phase 2 start condition:** agree on the MVP scope, runtime/tooling choices, index storage, and first representative task set before implementation.


### Phase 2 — Code Intelligence & Dependency Indexing

**Status:** Planning started; implementation not yet started.

- Phase 2 plan: [plan-phase2-code-intelligence.md](plan-phase2-code-intelligence.md).
- Initial implementation slice: Step 2.1 shared index contract/workspace manifest + Step 2.2 Backend Roslyn vertical slice.
- Baseline verified against root merge `5a43143a12d99ab5709d1d23d07225e98bbf783d`, BE `56385da65226f72c3b66f9c839e2fc430ce85210`, and FE `dbeaf66687454452886201bb669df1e25478d893`.
- Phase 2 will index exact recursive gitlink revisions and reject mixed-SHA results.
- No application source changes are included in the planning step. Implementation will use separate PRs with tests and measured outcomes.

**Document status:** Proposed implementation plan; Phase 1 complete and Phase 2 planning started.\
**Next review:** After the first Phase 2 vertical slice.


---

## 19. Phase 2 implementation update — 2026-11-10

This section supersedes the earlier Phase 2 status snapshot in Section 18 where it described Phase 2 as not started or the initial backend implementation as unverified.

### Verified progress

- Phase 2 architecture/implementation plan merged: PR #57.
- Initial Code Index CLI merged: PR #58; merge commit `d72119b308d6d11f4ba886e4368ab2f53616cb53`.
- User confirmed PR #58 CI passed.
- User ran `workspace status`; all 12 root/recursive submodule repositories matched their expected pinned revisions.
- User ran the real backend index command successfully against `ERPm-BE@56385da65226f72c3b66f9c839e2fc430ce85210`, producing 148,944 records under the ignored local cache.
- User queried `BaseCrudController` and inspected aggregate/sample statistics for definitions, references, calls, generated paths and source symbol IDs.

### Current state

The initial backend indexer is operational for the tested workspace and symbol query. Its quality is not yet accepted as complete: generated source contributes 1,661 baseline records, and symbol-kind/source-context behavior needs fixture coverage and clearer classification.

- Detailed follow-up plan: [Backend Indexer Quality](plan-step-2.2-backend-indexer-quality.md).
- Step log: [Step 2.2 Backend Indexer Quality](../steps/step-2.2-backend-indexer-quality.md).
- Implementation has not started in this follow-up branch.
- Frontend and database indexers remain deferred until the backend indexer's quality acceptance criteria are met.

### Safety and evidence

The existing `0.1.0` index cache is the comparison baseline and must not be deleted or overwritten. No application source changes, submodule gitlink changes, production database access, or `global.json` changes are part of this quality follow-up. The real re-index comparison and fixture tests remain pending.
