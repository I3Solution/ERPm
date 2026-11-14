namespace ERPm.CodeIndex.Models;

/// <summary>
/// Versioned, language-neutral invocation envelope supplied by the platform Core.
/// Paths are invocation-local and must never be treated as platform authorization.
/// </summary>
public sealed record ExtractorHostRequest
{
    public required int ProtocolVersion { get; init; }
    public required string InvocationId { get; init; }
    public required string SourceId { get; init; }
    public required string SourceRevisionId { get; init; }
    public required string RepositoryId { get; init; }
    public required string CommitSha { get; init; }
    public required string TreeId { get; init; }
    public required string CaptureManifestId { get; init; }
    public required string CaptureManifestSha256 { get; init; }
    public required string ExecutionWorkspaceRoot { get; init; }
    public required string OutputDirectory { get; init; }
    public required string ExtractorId { get; init; }
    public required string ExtractorVersion { get; init; }
    public required int SourceSchemaVersion { get; init; }
}
