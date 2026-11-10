# ERPm Context Policy

## 1. Core model

Use four levels:

- **Workspace** — identify the umbrella repo and pinned child revisions.
- **Domain** — route the task to the relevant business module or platform area.
- **Repository** — retrieve source from the repository that owns it.
- **Symbol** — read exact definitions, references, callers and tests.

The workspace is the entry point; domain is the routing unit; repository is the retrieval boundary; symbol is the code-reading unit.

## 2. Progressive retrieval

1. Parse the task into objective, acceptance criteria, affected behavior and likely domain.
2. Read root bootstrap and current status only.
3. Resolve the owning repository from `.ai/context/`.
4. Search for routes, API clients, types, symbols, tests and database mappings before opening large files.
5. Read the definition and direct dependencies first.
6. Expand to transitive dependencies only when code references or test behavior require it.
7. Read broad architecture documents only for cross-cutting, architectural, contract or schema changes.

Do not impose an arbitrary maximum file count. Expand scope when evidence requires it and record why.

## 3. Source precedence

When information conflicts, use this precedence:

1. Checked-out source and Git metadata at the exact revision being changed.
2. Explicit API/schema contracts and migrations at that revision.
3. Current task plan and current status.
4. Architecture documentation.
5. Historical step logs, reviews and archived status.

Historical notes are useful for rationale but never prove current behavior by themselves.

## 4. Context packet

Before a multi-file or cross-repository implementation, prepare a compact packet containing:

- task objective and acceptance criteria;
- root HEAD and each relevant submodule SHA;
- repository/domain scope;
- relevant file paths and symbols with evidence;
- API contracts, DB impact and direct dependencies;
- tests and verification commands;
- files explicitly out of scope;
- unknowns and assumptions.

Keep packets task-specific. Do not copy entire source files or large documents when a path, symbol, excerpt and revision are sufficient.

## 5. Freshness and provenance

Every generated index or packet must record:

- repository identifier;
- exact commit SHA;
- generation timestamp;
- source paths/symbols;
- retrieval reason;
- confidence/status (`verified`, `partial`, `unknown`).

Invalidate or rebuild generated metadata when its source commit changes. Never silently combine results from different revisions.

## 6. Cross-repository expansion

Expand from FE to BE when an API client, endpoint, DTO, dictionary or shared contract requires it. Expand from BE to FE when a route/client/UX contract is in scope. Expand to database artifacts when an entity mapping, migration, query or persistence behavior is involved.

Do not load every repository just because the task starts at the umbrella root.

## 7. Agent report

Before coding, report the resolved scope and evidence. After coding, report any scope expansion, changed contracts, tests run, tests not run and remaining unknowns.
