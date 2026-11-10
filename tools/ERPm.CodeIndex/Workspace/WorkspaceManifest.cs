namespace ERPm.CodeIndex.Workspace;

public sealed record RepositoryRevision(string RepositoryId, string RelativePath, string CommitSha);

public sealed record WorkspaceManifest(
    string RootPath,
    string RootCommitSha,
    DateTimeOffset GeneratedAtUtc,
    IReadOnlyList<RepositoryRevision> Repositories);
