using System.Text.RegularExpressions;

namespace ERPm.CodeIndex.Workspace;

public sealed class WorkspaceManifestReader
{
    private static readonly Regex SubmoduleLine = new(
        @"^(?<state>[ +\-U])(?<sha>[0-9a-f]{40})\s+(?<path>\S+)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public WorkspaceManifest Read(string? startDirectory = null)
    {
        var rootPath = FindWorkspaceRoot(startDirectory ?? Environment.CurrentDirectory);
        var rootSha = GitCommand.Run(rootPath, "rev-parse", "HEAD");
        var status = GitCommand.Run(rootPath, "submodule", "status", "--recursive");
        var revisions = new List<RepositoryRevision>();

        foreach (var line in status.Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries))
        {
            var match = SubmoduleLine.Match(line);
            if (!match.Success)
            {
                throw new InvalidOperationException($"Cannot parse submodule status line: {line}");
            }

            var state = match.Groups["state"].Value;
            if (state != " ")
            {
                throw new InvalidOperationException(
                    $"Submodule '{match.Groups["path"].Value}' is not at its pinned revision (state '{state}'). Run git submodule update --init --recursive.");
            }

            var path = match.Groups["path"].Value.Replace('\\', '/');
            revisions.Add(new RepositoryRevision(
                ToRepositoryId(path),
                path,
                match.Groups["sha"].Value));
        }

        return new WorkspaceManifest(
            rootPath,
            rootSha,
            DateTimeOffset.UtcNow,
            revisions.OrderBy(item => item.RelativePath, StringComparer.Ordinal).ToArray());
    }

    public static string FindWorkspaceRoot(string startDirectory)
    {
        var current = new DirectoryInfo(Path.GetFullPath(startDirectory));
        while (current is not null)
        {
            var hasUmbrellaMetadata = File.Exists(Path.Combine(current.FullName, ".gitmodules"))
                && File.Exists(Path.Combine(current.FullName, ".ai", "context", "README.md"))
                && Directory.Exists(Path.Combine(current.FullName, "ERPm-BE"));

            if (hasUmbrellaMetadata)
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new DirectoryNotFoundException(
            "Could not locate the ERPm umbrella workspace. Start the command inside the umbrella repository or one of its checked-out submodules.");
    }

    private static string ToRepositoryId(string path) =>
        path.Replace('\\', '/').Replace('/', '-').ToLowerInvariant();
}
