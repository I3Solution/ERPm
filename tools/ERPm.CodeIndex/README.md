# ERPm Code Index

Local-first code intelligence CLI for the ERPm umbrella workspace.

## Prerequisites

- The .NET SDK version pinned by the umbrella repository global.json.
- Git.
- ERPm umbrella repository with recursive submodules checked out at their pinned revisions.

## Initial commands

Run from any directory inside the ERPm workspace:

    dotnet run --project tools/ERPm.CodeIndex -- workspace status
    dotnet run --project tools/ERPm.CodeIndex -- index repo erpm-be
    dotnet run --project tools/ERPm.CodeIndex -- find symbol ApplicationDbContext

The first vertical slice supports backend C# definitions and compiler-resolved references. The indexer loads the pinned ERPm-BE/ERPm.sln through MSBuildWorkspace. It refuses to index the backend if the checked-out commit differs from the root gitlink SHA.

## Index format and provenance

Each JSONL record contains:

- Schema and indexer versions.
- Repository ID and exact source commit SHA.
- Repository-relative source path and line span.
- Record kind, stable Roslyn symbol ID, name and fully-qualified display name.
- Typed relationship (when applicable), evidence status and generation timestamp.

The cache key includes repository ID, commit SHA and indexer version. Generated files are written under .ai/code-index/cache/ and must not be committed.

## Current limitations

- The first implementation indexes the backend only.
- Roslyn workspace diagnostics are reported to stderr; projects that fail to compile may be partially indexed.
- Reference records represent compiler-resolved syntax-name references and invocation/object-creation relationships. This is not a complete runtime call graph.
- Dynamic dispatch, reflection, generated source outside loaded compilations and runtime behavior are not resolved.
- The initial CLI is intentionally small; cross-layer traces, frontend and EF metadata are later Phase 2 steps.
