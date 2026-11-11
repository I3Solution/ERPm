namespace ERPm.CodeIndex.Models;

public sealed record FrontendIndexRecord(
    int SchemaVersion, string IndexerVersion, string RepositoryId, string CommitSha,
    string Path, string Kind, string SymbolKind, string SymbolId, string Name,
    string? QualifiedName, string Language, int? StartLine, int? EndLine,
    int? StartOffset, int? EndOffset, string? Relation, string? SourceSymbolId,
    string? TargetSymbolId, string Evidence, DateTimeOffset GeneratedAtUtc,
    AngularIndexMetadata? Angular, ApiIndexMetadata? Api);

public sealed record AngularIndexMetadata(
    string Kind, string? Selector, string? Template, IReadOnlyList<string> Styles,
    string? ProvidedIn, string? RoutePath, string? GuardInvocation,
    string? TargetSymbolId, string? LazyImportPath);

public sealed record ApiIndexMetadata(
    string HttpMethod, string UrlKind, string Expression, string? LiteralPath,
    string? ContainingSymbolId);
