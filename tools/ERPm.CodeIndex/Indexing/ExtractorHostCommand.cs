using System.Text.Json;
using ERPm.CodeIndex.Models;

namespace ERPm.CodeIndex.Indexing;

public static class ExtractorHostCommand
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public static async Task<int> RunAsync(
        Stream input,
        TextWriter standardOutput,
        TextWriter standardError,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var request = await JsonSerializer.DeserializeAsync<ExtractorHostRequest>(
                input, JsonOptions, cancellationToken)
                ?? throw new InvalidDataException("Extractor request is empty.");

            request = ExtractorHostProtocol.ValidateRequest(request);
            Directory.CreateDirectory(request.OutputDirectory);

            var records = await new BackendRoslynIndexer().IndexAsync(
                request.ExecutionWorkspaceRoot,
                request.RepositoryId,
                request.CommitSha,
                cancellationToken);

            var artifactPath = Path.Combine(
                request.OutputDirectory,
                ExtractorHostProtocol.ArtifactFileName);

            await using (var stream = new FileStream(
                artifactPath, FileMode.CreateNew, FileAccess.Write, FileShare.None,
                bufferSize: 81920, FileOptions.Asynchronous | FileOptions.SequentialScan))
            await using (var writer = new StreamWriter(stream))
            {
                foreach (var record in records)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    await writer.WriteLineAsync(JsonSerializer.Serialize(record, JsonOptions));
                }

                await writer.FlushAsync(cancellationToken);
            }

            var manifest = await ExtractorHostProtocol.CreateResultManifestAsync(
                request, artifactPath, records.Count, cancellationToken: cancellationToken);
            await ExtractorHostProtocol.WriteResultManifestAsync(
                request.OutputDirectory, manifest, cancellationToken);

            await standardOutput.WriteLineAsync(
                $"completed invocation={request.InvocationId} records={records.Count}");
            return 0;
        }
        catch (OperationCanceledException)
        {
            await standardError.WriteLineAsync("Extractor invocation cancelled.");
            return 130;
        }
        catch (Exception exception)
        {
            await standardError.WriteLineAsync(exception.ToString());
            return 1;
        }
    }
}
