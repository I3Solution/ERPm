using System.Diagnostics;
using System.Text.Json;
using ERPm.CodeIndex.Models;
using ERPm.CodeIndex.Workspace;

namespace ERPm.CodeIndex.Indexing;

public static class FrontendWorkerRunner
{
    public const string IndexerVersion = "0.1.0";

    public static async Task IndexAsync(WorkspaceManifest manifest)
    {
        if (!manifest.Repositories.Any(item => item.RepositoryId == "erpm-fe"))
        {
            throw new InvalidOperationException("ERPm-FE was not found in the recursive submodule manifest.");
        }

        var workerDirectory = Path.Combine(manifest.RootPath, "tools", "frontend-code-indexer");
        var workerPath = Path.Combine(workerDirectory, "index.mjs");
        var typescriptPackagePath = Path.Combine(workerDirectory, "node_modules", "typescript", "package.json");
        if (!File.Exists(workerPath))
        {
            throw new FileNotFoundException("Frontend indexer worker was not found.", workerPath);
        }

        if (!File.Exists(typescriptPackagePath))
        {
            throw new InvalidOperationException(
                "Frontend indexer dependencies are missing. Run 'npm ci --prefix tools/frontend-code-indexer' from the ERPm root.");
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = "node",
            WorkingDirectory = manifest.RootPath,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        startInfo.ArgumentList.Add(workerPath);

        using var process = new Process { StartInfo = startInfo };
        try
        {
            if (!process.Start())
            {
                throw new InvalidOperationException("Could not start the Node.js frontend indexer worker.");
            }
        }
        catch (System.ComponentModel.Win32Exception exception)
        {
            throw new InvalidOperationException(
                "Node.js was not found on PATH. Install/use Node.js 22 or later, then retry.",
                exception);
        }

        var standardOutputTask = process.StandardOutput.ReadToEndAsync();
        var standardErrorTask = process.StandardError.ReadToEndAsync();
        var manifestJson = JsonSerializer.Serialize(manifest, JsonOptions());
        await process.StandardInput.WriteAsync(manifestJson);
        process.StandardInput.Close();
        await process.WaitForExitAsync();

        var standardOutput = await standardOutputTask;
        var standardError = await standardErrorTask;
        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"Frontend indexer worker failed with exit code {process.ExitCode}.{Environment.NewLine}{standardError}");
        }

        var revisions = manifest.Repositories.ToDictionary(item => item.RepositoryId, StringComparer.Ordinal);
        var recordsByRepository = new Dictionary<string, List<FrontendIndexRecord>>(StringComparer.Ordinal);
        foreach (var line in standardOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            var record = JsonSerializer.Deserialize<FrontendIndexRecord>(line.TrimEnd('\r'), JsonOptions())
                ?? throw new InvalidOperationException("Frontend worker emitted an empty JSON record.");

            if (record.SchemaVersion != 3 || record.IndexerVersion != IndexerVersion)
            {
                throw new InvalidOperationException(
                    $"Unsupported frontend record version {record.SchemaVersion}/{record.IndexerVersion}.");
            }

            if (!revisions.TryGetValue(record.RepositoryId, out var revision)
                || !string.Equals(revision.CommitSha, record.CommitSha, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"Frontend worker emitted a record with an unknown repository or mismatched SHA: {record.RepositoryId}@{record.CommitSha}.");
            }

            if (Path.IsPathRooted(record.Path)
                || record.Path.Replace('\\', '/').Split('/').Any(segment => segment == ".."))
            {
                throw new InvalidOperationException($"Frontend worker emitted a non-relative source path: {record.Path}.");
            }

            if (!recordsByRepository.TryGetValue(record.RepositoryId, out var records))
            {
                records = [];
                recordsByRepository.Add(record.RepositoryId, records);
            }

            records.Add(record);
        }

        foreach (var (repositoryId, records) in recordsByRepository.OrderBy(item => item.Key, StringComparer.Ordinal))
        {
            var revision = revisions[repositoryId];
            var outputDirectory = Path.Combine(
                manifest.RootPath,
                ".ai",
                "code-index",
                "cache",
                revision.RepositoryId,
                revision.CommitSha,
                IndexerVersion);
            Directory.CreateDirectory(outputDirectory);

            var outputPath = Path.Combine(outputDirectory, "symbols.jsonl");
            var temporaryPath = outputPath + ".tmp";
            await using (var stream = File.Create(temporaryPath))
            await using (var writer = new StreamWriter(stream))
            {
                foreach (var record in records)
                {
                    await writer.WriteLineAsync(JsonSerializer.Serialize(record, JsonOptions()));
                }
            }

            File.Move(temporaryPath, outputPath, overwrite: true);
            Console.WriteLine($"Indexed {records.Count} frontend records from {repositoryId}@{revision.CommitSha}");
            Console.WriteLine($"Output: {Path.GetRelativePath(manifest.RootPath, outputPath)}");
        }

        if (!string.IsNullOrWhiteSpace(standardError))
        {
            Console.Error.WriteLine(standardError.Trim());
        }
    }

    private static JsonSerializerOptions JsonOptions() => new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };
}
