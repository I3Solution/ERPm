using System.Text.Json;
using ERPm.CodeIndex.Indexing;
using ERPm.CodeIndex.Models;
using ERPm.CodeIndex.Workspace;

const string usage = """
ERPm Code Index

Commands:
  workspace status
  index repo erpm-be
  find symbol <name-or-pattern>
""";

if (args.Length == 0)
{
    Console.WriteLine(usage);
    return;
}

try
{
    var manifest = new WorkspaceManifestReader().Read();
    var command = args[0].ToLowerInvariant();

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
    if (!string.Equals(repositoryId, "erpm-be", StringComparison.OrdinalIgnoreCase))
    {
        throw new ArgumentException("The initial vertical slice supports only 'erpm-be'.");
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
    var backend = manifest.Repositories.SingleOrDefault(item => item.RepositoryId == "erpm-be")
        ?? throw new InvalidOperationException("ERPm-BE was not found in the recursive submodule manifest.");

    var cacheRoot = Path.Combine(
        manifest.RootPath,
        ".ai",
        "code-index",
        "cache",
        backend.RepositoryId,
        backend.CommitSha);
    if (!Directory.Exists(cacheRoot))
    {
        throw new DirectoryNotFoundException("No current backend index exists. Run 'index repo erpm-be' first.");
    }

    var matches = Directory.GetFiles(cacheRoot, "symbols.jsonl", SearchOption.AllDirectories)
        .SelectMany(File.ReadLines)
        .Select(line => JsonSerializer.Deserialize<IndexRecord>(line, JsonOptions()))
        .Where(record => record is not null
            && record.Name.Contains(pattern, StringComparison.OrdinalIgnoreCase))
        .Take(100)
        .ToArray();

    foreach (var match in matches)
    {
        Console.WriteLine(JsonSerializer.Serialize(match, JsonOptions()));
    }
}

static JsonSerializerOptions JsonOptions() => new()
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    WriteIndented = false
};
