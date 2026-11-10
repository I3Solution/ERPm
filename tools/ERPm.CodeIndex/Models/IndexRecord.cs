namespace ERPm.CodeIndex.Models;

public sealed record IndexRecord(
    int SchemaVersion,
    string IndexerVersion,
    string RepositoryId,
    string CommitSha,
    string Path,
    string Kind,
    string SymbolId,
    string Name,
    string? QualifiedName,
    string Language,
    int StartLine,
    int EndLine,
    string? Relation,
    string? TargetSymbolId,
    string Evidence,
    DateTimeOffset GeneratedAtUtc);
