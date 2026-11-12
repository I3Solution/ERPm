using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ERPm.CodeIndex.Indexing;
using ERPm.CodeIndex.Models;
using Xunit;

namespace ERPm.CodeIndex.Tests;

public sealed class ExtractorHostProtocolTests : IDisposable
{
    private readonly string _root = Path.Combine(
        Path.GetTempPath(), "erpm-extractor-host-tests", Guid.NewGuid().ToString("N"));
    private readonly string _workspace;
    private readonly string _output;

    public ExtractorHostProtocolTests()
    {
        _workspace = Path.Combine(_root, "workspace");
        _output = Path.Combine(_root, "artifacts");
        Directory.CreateDirectory(_workspace);
        File.WriteAllText(Path.Combine(_workspace, "Fixture.sln"), "Microsoft Visual Studio Solution File");
    }

    [Fact]
    public void Serializes_backend_records_using_camel_case_schema_fields()
    {
        var record = new IndexRecord(
            2, "0.2.0", "erpm-be", new string("a"[0], 40), "src/Example.cs",
            "definition", "class", "symbol:example", "Example", "global::Example",
            "C#", 1, 5, null, null, null, null, "verified", DateTimeOffset.UtcNow);

        using var document = JsonDocument.Parse(ExtractorHostProtocol.SerializeRecord(record));

        Assert.True(document.RootElement.TryGetProperty("schemaVersion", out _));
        Assert.True(document.RootElement.TryGetProperty("repositoryId", out _));
        Assert.False(document.RootElement.TryGetProperty("SchemaVersion", out _));
    }

    [Fact]
    public void Accepts_a_valid_v1_request_and_normalizes_paths()
    {
        var validated = ExtractorHostProtocol.ValidateRequest(CreateRequest());

        Assert.Equal(Path.GetFullPath(_workspace), validated.ExecutionWorkspaceRoot);
        Assert.Equal(Path.GetFullPath(_output), validated.OutputDirectory);
    }

    [Fact]
    public void Rejects_an_unsupported_protocol_version()
    {
        var request = CreateRequest() with { ProtocolVersion = 2 };

        var exception = Assert.Throws<InvalidDataException>(
            () => ExtractorHostProtocol.ValidateRequest(request));

        Assert.Contains("Unsupported extractor protocol", exception.Message);
    }

    [Fact]
    public void Rejects_an_unsupported_backend_source_schema()
    {
        var request = CreateRequest() with { SourceSchemaVersion = 1 };

        Assert.Throws<InvalidDataException>(
            () => ExtractorHostProtocol.ValidateRequest(request));
    }

    [Fact]
    public void Rejects_a_short_commit_sha()
    {
        var request = CreateRequest() with { CommitSha = "abc123" };

        Assert.Throws<InvalidDataException>(
            () => ExtractorHostProtocol.ValidateRequest(request));
    }

    [Fact]
    public void Rejects_a_malformed_capture_manifest_digest()
    {
        var request = CreateRequest() with { CaptureManifestSha256 = "not-a-digest" };

        Assert.Throws<InvalidDataException>(
            () => ExtractorHostProtocol.ValidateRequest(request));
    }

    [Fact]
    public void Rejects_output_inside_the_execution_workspace()
    {
        var request = CreateRequest() with
        {
            OutputDirectory = Path.Combine(_workspace, "output")
        };

        Assert.Throws<InvalidDataException>(
            () => ExtractorHostProtocol.ValidateRequest(request));
    }

    [Fact]
    public void Rejects_a_workspace_without_a_root_solution()
    {
        File.Delete(Path.Combine(_workspace, "Fixture.sln"));
        var request = CreateRequest();

        Assert.Throws<InvalidDataException>(
            () => ExtractorHostProtocol.ValidateRequest(request));
    }

    [Fact]
    public void Rejects_multiple_root_solutions()
    {
        File.WriteAllText(Path.Combine(_workspace, "Another.sln"), "solution");

        Assert.Throws<InvalidDataException>(
            () => ExtractorHostProtocol.ValidateRequest(CreateRequest()));
    }

    [Fact]
    public async Task Host_rejects_request_larger_than_protocol_limit()
    {
        var oversizedRequest = new MemoryStream(Encoding.UTF8.GetBytes(new string('x', 64 * 1024 + 1)));
        using var standardOutput = new StringWriter();
        using var standardError = new StringWriter();

        var exitCode = await ExtractorHostCommand.RunAsync(
            oversizedRequest, standardOutput, standardError);

        Assert.Equal(1, exitCode);
        Assert.Contains("exceeds the 65536-byte limit", standardError.ToString());
    }

    [Fact]
    public async Task Result_manifest_binds_exact_request_lineage_and_artifact_bytes()
    {
        Directory.CreateDirectory(_output);
        var artifactPath = Path.Combine(_output, ExtractorHostProtocol.ArtifactFileName);
        var artifact = "{\"kind\":\"code.file\"}\n{\"kind\":\"code.symbol\"}\n";
        await File.WriteAllTextAsync(artifactPath, artifact, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));

        var request = ExtractorHostProtocol.ValidateRequest(CreateRequest());
        var manifest = await ExtractorHostProtocol.CreateResultManifestAsync(
            request, artifactPath, recordCount: 2);

        var expectedHash = Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(artifact))).ToLowerInvariant();

        Assert.Equal(request.InvocationId, manifest.InvocationId);
        Assert.Equal(request.SourceId, manifest.SourceId);
        Assert.Equal(request.SourceRevisionId, manifest.SourceRevisionId);
        Assert.Equal(request.CommitSha, manifest.CommitSha);
        Assert.Equal(request.TreeId, manifest.TreeId);
        Assert.Equal(request.CaptureManifestId, manifest.CaptureManifestId);
        Assert.Equal(request.CaptureManifestSha256, manifest.CaptureManifestSha256);
        Assert.Equal(2, manifest.RecordCount);
        Assert.Equal(new FileInfo(artifactPath).Length, manifest.ArtifactBytes);
        Assert.Equal(expectedHash, manifest.ArtifactSha256);
        Assert.True(manifest.Completed);
    }

    [Fact]
    public async Task Writes_result_manifest_as_machine_readable_json()
    {
        Directory.CreateDirectory(_output);
        var artifactPath = Path.Combine(_output, ExtractorHostProtocol.ArtifactFileName);
        await File.WriteAllTextAsync(artifactPath, "{\"kind\":\"code.file\"}\n");

        var request = ExtractorHostProtocol.ValidateRequest(CreateRequest());
        var manifest = await ExtractorHostProtocol.CreateResultManifestAsync(
            request, artifactPath, recordCount: 1);

        await ExtractorHostProtocol.WriteResultManifestAsync(_output, manifest);

        var json = await File.ReadAllTextAsync(
            Path.Combine(_output, ExtractorHostProtocol.ResultManifestFileName));
        var roundTrip = JsonSerializer.Deserialize<ExtractorHostResultManifest>(
            json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(roundTrip);
        Assert.Equal(manifest.InvocationId, roundTrip.InvocationId);
        Assert.Equal(manifest.ArtifactSha256, roundTrip.ArtifactSha256);
        Assert.Equal(manifest.RecordCount, roundTrip.RecordCount);
        Assert.Equal(manifest.CaptureManifestSha256, roundTrip.CaptureManifestSha256);
        Assert.True(roundTrip.Completed);
    }

    private ExtractorHostRequest CreateRequest() => new()
    {
        ProtocolVersion = ExtractorHostProtocol.CurrentProtocolVersion,
        InvocationId = "invocation-test-001",
        SourceId = "source-erpm-be",
        SourceRevisionId = "revision-erpm-be-001",
        RepositoryId = "erpm-be",
        CommitSha = new string('a', 40),
        TreeId = new string('b', 40),
        CaptureManifestId = "capture-manifest-001",
        CaptureManifestSha256 = new string('c', 64),
        ExecutionWorkspaceRoot = _workspace,
        OutputDirectory = _output,
        ExtractorId = "roslyn-backend",
        ExtractorVersion = "0.1.0",
        SourceSchemaVersion = 2
    };

    public void Dispose()
    {
        if (Directory.Exists(_root))
        {
            Directory.Delete(_root, recursive: true);
        }
    }
}
