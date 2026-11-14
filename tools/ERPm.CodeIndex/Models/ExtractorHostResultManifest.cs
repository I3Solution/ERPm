namespace ERPm.CodeIndex.Models;

/// <summary>
/// Immutable evidence describing the exact artifact produced by one host invocation.
/// </summary>
public sealed record ExtractorHostResultManifest(
    int ProtocolVersion,
    string InvocationId,
    string SourceId,
    string SourceRevisionId,
    string RepositoryId,
    string CommitSha,
    string TreeId,
    string CaptureManifestId,
    string CaptureManifestSha256,
    string ExtractorId,
    string ExtractorVersion,
    int SourceSchemaVersion,
    string ArtifactFile,
    long ArtifactBytes,
    string ArtifactSha256,
    long RecordCount,
    bool Completed,
    IReadOnlyList<string> Diagnostics);
