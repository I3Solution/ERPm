using System.Text.Json;
using ERPm.CodeIndex.Indexing;
using ERPm.CodeIndex.Models;
using ERPm.CodeIndex.Workspace;

const string usage = """
ERPm Code Index

Commands:
  workspace status
  index repo erpm-be
  index repo erpm-fe
  extractor-host
  find symbol <name-or-pattern>
""";

if (args.Length == 0)
{
    Console.WriteLine(usage);
    return;
}

try
{
    var command = args[0].ToLowerInvariant();

    // The host is intentionally independent from the legacy umbrella workspace manifest.
    if (command == "extractor-host" && args.Length == 1)
    {
        Environment.ExitCode = await ExtractorHostCommand.RunAsync(
            Console.OpenStandardInput(),
            Console.Out,
            Console.Error);
        return;
    }

    var manifest = new WorkspaceManifestReader().Read();

    switch (command)
    {
        case "workspace" when args.Length == 2 && args[1] == "status":
            Console.WriteLine(JsonSerializer.Serialize(manifest, JsonOptions()));
            break;

        case "index" when args.Length == 3 && args[1] == "repo":
            await IndexRepositoryAsync(args[2], manifest);
            break;

        case "find" when args.Length >= 3 && args[1] == "symbol":
            FindSymbols(manifest, string.Join(' ', args.Skip(2)));
            break;

        default:
            Console.WriteLine(usage);
            Environment.ExitCode = 2;
            break;
    }
}
catch (Exception exception)
{
    Console.Error.WriteLine(exception.Message);
    Environment.ExitCode = 1;
}

static async Task IndexRepositoryAsync(string repositoryId, WorkspaceManifest manifest)
{
    if (string.Equals(repositoryId, "erpm-fe", StringComparison.OrdinalIgnoreCase))
    {
        await FrontendWorkerRunner.IndexAsync(manifest);
        return;
    }

    if (!string.Equals(repositoryId, "erpm-be", StringComparison.OrdinalIgnoreCase))
    {
        throw new ArgumentException("Supported repositories are 'erpm-be' and 'erpm-fe'.");
    }

    var revision = manifest.Repositories.SingleOrDefault(item => item.RepositoryId == "erpm-be")
        ?? throw new InvalidOperationException("ERPm-BE was not found in the recursive submodule manifest.");

    var repositoryPath = Path.GetFullPath(Path.Combine(manifest.RootPath, revision.RelativePath));
    var actualSha = GitCommand.Run(repositoryPath, "rev-parse", "HEAD");
    if (!string.Equals(actualSha, revision.CommitSha, StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException(
            $"ERPm-BE revision mismatch. Expected {revision.CommitSha}, found {actualSha}. Run git submodule update --init --recursive.");
    }

    var records = await new BackendRoslynIndexer().IndexAsync(
        repositoryPath,
        revision.RepositoryId,
        revision.CommitSha);

    var outputDirectory = Path.Combine(
        manifest.RootPath,
        ".ai",
        "code-index",
        "cache",
        revision.RepositoryId,
        revision.CommitSha,
        BackendRoslynIndexer.IndexerVersion);
    Directory.CreateDirectory(outputDirectory);

    var outputPath = Path.Combine(outputDirectory, "symbols.jsonl");
    await using (var stream = File.Create(outputPath))
    await using (var writer = new StreamWriter(stream))
    {
        foreach (var record in records)
        {
            await writer.WriteLineAsync(JsonSerializer.Serialize(record, JsonOptions()));
        }
    }

    Console.WriteLine($"Indexed {records.Count} records from {revision.RepositoryId}@{revision.CommitSha}");
    Console.WriteLine($"Output: {Path.GetRelativePath(manifest.RootPath, outputPath)}");
}

static void FindSymbols(WorkspaceManifest manifest, string pattern)
{
    var matchCount = 0;
    var backend = manifest.Repositories.SingleOrDefault(item => item.RepositoryId == "erpm-be");
    if (backend is not null)
    {
        var backendIndexPath = Path.Combine(
            manifest.RootPath,
            ".ai",
            "code-index",
            "cache",
            backend.RepositoryId,
            backend.CommitSha,
            BackendRoslynIndexer.IndexerVersion,
            "symbols.jsonl");

        if (File.Exists(backendIndexPath))
        {
            var backendMatches = File.ReadLines(backendIndexPath)
                .Select(line => JsonSerializer.Deserialize<IndexRecord>(line, JsonOptions()))
                .Where(record => record is not null
                    && (record.Name.Contains(pattern, StringComparison.OrdinalIgnoreCase)
                        || record.QualifiedName?.Contains(pattern, StringComparison.OrdinalIgnoreCase) == true))
                .OrderBy(record => record!.Kind == "definition" ? 0 : 1)
                .ThenBy(record => record!.Path, StringComparer.Ordinal)
                .ThenBy(record => record!.StartLine)
                .Take(100);

            foreach (var match in backendMatches)
            {
                Console.WriteLine(JsonSerializer.Serialize(match, JsonOptions()));
                matchCount++;
            }
        }
    }

    foreach (var frontend in manifest.Repositories
        .Where(item => item.RepositoryId == "erpm-fe"
            || item.RepositoryId.StartsWith("erpm-fe-", StringComparison.Ordinal))
        .OrderBy(item => item.RepositoryId, StringComparer.Ordinal))
    {
        var frontendIndexPath = Path.Combine(
            manifest.RootPath,
            ".ai",
            "code-index",
            "cache",
            frontend.RepositoryId,
            frontend.CommitSha,
            FrontendWorkerRunner.IndexerVersion,
            "symbols.jsonl");

        if (!File.Exists(frontendIndexPath))
        {
            continue;
        }

        var frontendMatches = File.ReadLines(frontendIndexPath)
            .Select(line => JsonSerializer.Deserialize<FrontendIndexRecord>(line, JsonOptions()))
            .Where(record => record is not null
                && (record.Name.Contains(pattern, StringComparison.OrdinalIgnoreCase)
                    || record.QualifiedName?.Contains(pattern, StringComparison.OrdinalIgnoreCase) == true))
            .OrderBy(record => record!.Kind == "definition" ? 0 : 1)
            .ThenBy(record => record!.Path, StringComparer.Ordinal)
            .ThenBy(record => record!.StartLine)
            .Take(100);

        foreach (var match in frontendMatches)
        {
            Console.WriteLine(JsonSerializer.Serialize(match, JsonOptions()));
            matchCount++;
        }
    }

    if (matchCount == 0)
    {
        Console.Error.WriteLine($"No indexed symbols matched '{pattern}'. Index the relevant repository first.");
    }
}

static JsonSerializerOptions JsonOptions() => new()
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    WriteIndented = false
};
