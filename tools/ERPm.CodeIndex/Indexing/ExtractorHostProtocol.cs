using System.Security.Cryptography;
using System.Text.Json;
using ERPm.CodeIndex.Models;

namespace ERPm.CodeIndex.Indexing;

public static class ExtractorHostProtocol
{
    public const int CurrentProtocolVersion = 1;
    public const string ArtifactFileName = "records.jsonl";
    public const string ResultManifestFileName = "result-manifest.json";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    private static readonly JsonSerializerOptions RecordJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public static string SerializeRecord(IndexRecord record) =>
        JsonSerializer.Serialize(record, RecordJsonOptions);

    public static ExtractorHostRequest ValidateRequest(ExtractorHostRequest? request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.ProtocolVersion != CurrentProtocolVersion)
        {
            throw new InvalidDataException(
                $"Unsupported extractor protocol version '{request.ProtocolVersion}'. Expected {CurrentProtocolVersion}.");
        }

        RequireValue(request.InvocationId, nameof(request.InvocationId));
        RequireValue(request.SourceId, nameof(request.SourceId));
        RequireValue(request.SourceRevisionId, nameof(request.SourceRevisionId));
        RequireValue(request.RepositoryId, nameof(request.RepositoryId));
        if (!IsHex(request.TreeId, 40))
        {
            throw new InvalidDataException("treeId must be a full 40-character Git object ID.");
        }
        RequireValue(request.CaptureManifestId, nameof(request.CaptureManifestId));
        RequireValue(request.ExtractorId, nameof(request.ExtractorId));
        RequireValue(request.ExtractorVersion, nameof(request.ExtractorVersion));

        if (!IsHex(request.CommitSha, 40))
        {
            throw new InvalidDataException("commitSha must be a full 40-character Git object ID.");
        }

        if (!IsHex(request.CaptureManifestSha256, 64))
        {
            throw new InvalidDataException("captureManifestSha256 must be a 64-character SHA-256 digest.");
        }

        if (request.SourceSchemaVersion != BackendRoslynIndexer.SchemaVersion)
        {
            throw new InvalidDataException(
                "Unsupported backend source schema version. Expected " + BackendRoslynIndexer.SchemaVersion + ".");
        }

        var workspaceRoot = Path.GetFullPath(request.ExecutionWorkspaceRoot);
        var outputDirectory = Path.GetFullPath(request.OutputDirectory);
        if (!Directory.Exists(workspaceRoot))
        {
            throw new DirectoryNotFoundException(
                $"Execution workspace does not exist: '{workspaceRoot}'.");
        }

        var rootSolutions = Directory.GetFiles(workspaceRoot, "*.sln", SearchOption.TopDirectoryOnly);
        if (rootSolutions.Length != 1)
        {
            throw new InvalidDataException(
                "Execution workspace must contain exactly one solution at its root.");
        }

        if (IsSameOrChildPath(outputDirectory, workspaceRoot))
        {
            throw new InvalidDataException(
                "OutputDirectory must be outside the execution workspace so extraction cannot mutate the source snapshot.");
        }

        return request with
        {
            ExecutionWorkspaceRoot = workspaceRoot,
            OutputDirectory = outputDirectory
        };
    }

    public static async Task<ExtractorHostResultManifest> CreateResultManifestAsync(
        ExtractorHostRequest request,
        string artifactPath,
        long recordCount,
        IReadOnlyList<string>? diagnostics = null,
        CancellationToken cancellationToken = default)
    {
        if (recordCount < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(recordCount));
        }

        var fullArtifactPath = Path.GetFullPath(artifactPath);
        var expectedPath = Path.GetFullPath(Path.Combine(request.OutputDirectory, ArtifactFileName));
        if (!string.Equals(fullArtifactPath, expectedPath, PathComparison))
        {
            throw new InvalidDataException("Artifact path does not match the protocol-defined output file.");
        }

        var fileInfo = new FileInfo(fullArtifactPath);
        if (!fileInfo.Exists)
        {
            throw new FileNotFoundException("Extractor artifact was not created.", fullArtifactPath);
        }

        await using var stream = new FileStream(
            fullArtifactPath, FileMode.Open, FileAccess.Read, FileShare.Read,
            bufferSize: 81920, FileOptions.Asynchronous | FileOptions.SequentialScan);
        var digest = await SHA256.HashDataAsync(stream, cancellationToken);

        return new ExtractorHostResultManifest(
            CurrentProtocolVersion,
            request.InvocationId,
            request.SourceId,
            request.SourceRevisionId,
            request.RepositoryId,
            request.CommitSha,
            request.TreeId,
            request.CaptureManifestId,
            request.CaptureManifestSha256,
            request.ExtractorId,
            request.ExtractorVersion,
            request.SourceSchemaVersion,
            ArtifactFileName,
            fileInfo.Length,
            Convert.ToHexString(digest).ToLowerInvariant(),
            recordCount,
            true,
            diagnostics ?? Array.Empty<string>());
    }

    public static async Task WriteResultManifestAsync(
        string outputDirectory,
        ExtractorHostResultManifest manifest,
        CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(outputDirectory);
        var path = Path.Combine(outputDirectory, ResultManifestFileName);
        await using var stream = new FileStream(
            path, FileMode.CreateNew, FileAccess.Write, FileShare.None,
            bufferSize: 4096, FileOptions.Asynchronous);
        await JsonSerializer.SerializeAsync(stream, manifest, JsonOptions, cancellationToken);
        await stream.FlushAsync(cancellationToken);
    }

    private static void RequireValue(string? value, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidDataException($"{field} is required.");
        }
    }

    private static bool IsHex(string? value, int length) =>
        value is { Length: var actualLength }
        && actualLength == length
        && value.All(Uri.IsHexDigit);

    private static bool IsSameOrChildPath(string candidate, string parent)
    {
        var relative = Path.GetRelativePath(parent, candidate);
        return relative == "."
            || (!Path.IsPathRooted(relative)
                && relative != ".."
                && !relative.StartsWith($"..{Path.DirectorySeparatorChar}", PathComparison));
    }

    private static StringComparison PathComparison =>
        OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
}
