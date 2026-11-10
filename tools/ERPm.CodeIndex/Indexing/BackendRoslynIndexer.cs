using ERPm.CodeIndex.Models;
using Microsoft.Build.Locator;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.MSBuild;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ERPm.CodeIndex.Indexing;

public sealed class BackendRoslynIndexer
{
    public const string IndexerVersion = "0.2.0";
    public const int SchemaVersion = 2;

    public async Task<IReadOnlyList<IndexRecord>> IndexAsync(
        string repositoryPath,
        string repositoryId,
        string commitSha,
        CancellationToken cancellationToken = default)
    {
        if (!MSBuildLocator.IsRegistered)
        {
            MSBuildLocator.RegisterDefaults();
        }

        var solutionPath = Directory.GetFiles(repositoryPath, "*.sln", SearchOption.TopDirectoryOnly)
            .SingleOrDefault()
            ?? throw new FileNotFoundException($"Expected one solution file in '{repositoryPath}'.");

        using var workspace = MSBuildWorkspace.Create();
        var diagnostics = new List<string>();
        workspace.RegisterWorkspaceFailedHandler(diagnostic =>
            diagnostics.Add(diagnostic.ToString() ?? "Unknown workspace diagnostic."));

        var solution = await workspace.OpenSolutionAsync(solutionPath, cancellationToken: cancellationToken);
        var generatedAt = DateTimeOffset.UtcNow;
        var records = new List<IndexRecord>();
        var includedTreeCount = 0;
        var excludedTreeCount = 0;

        foreach (var project in solution.Projects.OrderBy(item => item.Name, StringComparer.Ordinal))
        {
            cancellationToken.ThrowIfCancellationRequested();

            Compilation? compilation;
            try
            {
                compilation = await project.GetCompilationAsync(cancellationToken);
            }
            catch (Exception exception)
            {
                diagnostics.Add($"Compilation failed for {project.Name}: {exception.Message}");
                continue;
            }

            if (compilation is null)
            {
                diagnostics.Add($"No compilation was produced for {project.Name}.");
                continue;
            }

            var includedTrees = new HashSet<SyntaxTree>();
            foreach (var syntaxTree in compilation.SyntaxTrees)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var sourceText = await syntaxTree.GetTextAsync(cancellationToken);
                if (GeneratedSourceFilter.ShouldInclude(
                    syntaxTree.FilePath,
                    repositoryPath,
                    sourceText.ToString()))
                {
                    includedTrees.Add(syntaxTree);
                    includedTreeCount++;
                }
                else
                {
                    excludedTreeCount++;
                }
            }

            AddNamespaceMembers(
                compilation.Assembly.GlobalNamespace,
                repositoryPath,
                repositoryId,
                commitSha,
                generatedAt,
                includedTrees,
                records);

            foreach (var syntaxTree in includedTrees)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var semanticModel = compilation.GetSemanticModel(syntaxTree);
                var root = await syntaxTree.GetRootAsync(cancellationToken);

                foreach (var node in root.DescendantNodes())
                {
                    if (node is not (SimpleNameSyntax
                        or ObjectCreationExpressionSyntax
                        or ImplicitObjectCreationExpressionSyntax))
                    {
                        continue;
                    }

                    var symbol = node switch
                    {
                        ObjectCreationExpressionSyntax creation =>
                            semanticModel.GetSymbolInfo(creation, cancellationToken).Symbol,
                        ImplicitObjectCreationExpressionSyntax implicitCreation =>
                            semanticModel.GetSymbolInfo(implicitCreation, cancellationToken).Symbol,
                        _ => semanticModel.GetSymbolInfo(node, cancellationToken).Symbol
                    };

                    if (symbol is null)
                    {
                        continue;
                    }

                    var span = syntaxTree.GetLineSpan(node.Span);
                    var relation = ReferenceRelationClassifier.GetRelation(node);
                    var enclosingSymbol = semanticModel.GetEnclosingSymbol(node.SpanStart, cancellationToken);

                    records.Add(new IndexRecord(
                        SchemaVersion,
                        IndexerVersion,
                        repositoryId,
                        commitSha,
                        GetRepositoryRelativePath(syntaxTree.FilePath, repositoryPath),
                        "reference",
                        SymbolKindClassifier.GetCategory(symbol),
                        CreateSymbolId(symbol),
                        node.ToString(),
                        symbol.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat),
                        "C#",
                        span.StartLinePosition.Line + 1,
                        span.EndLinePosition.Line + 1,
                        relation,
                        enclosingSymbol is null ? null : CreateSymbolId(enclosingSymbol),
                        enclosingSymbol is null ? null : SymbolKindClassifier.GetCategory(enclosingSymbol),
                        CreateSymbolId(symbol),
                        "verified",
                        generatedAt));
                }
            }
        }

        Console.Error.WriteLine(
            $"Backend source filtering: included {includedTreeCount} syntax trees; excluded {excludedTreeCount} generated/out-of-repository trees.");

        if (diagnostics.Count > 0)
        {
            Console.Error.WriteLine($"Roslyn workspace diagnostics ({diagnostics.Count}):");
            foreach (var diagnostic in diagnostics)
            {
                Console.Error.WriteLine($"  - {diagnostic}");
            }
        }

        return records
            .DistinctBy(item => (item.Path, item.StartLine, item.EndLine, item.Kind, item.SymbolId, item.Relation))
            .OrderBy(item => item.Path, StringComparer.Ordinal)
            .ThenBy(item => item.StartLine)
            .ThenBy(item => item.SymbolId, StringComparer.Ordinal)
            .ToArray();
    }

    private static void AddNamespaceMembers(
        INamespaceSymbol namespaceSymbol,
        string repositoryPath,
        string repositoryId,
        string commitSha,
        DateTimeOffset generatedAt,
        ISet<SyntaxTree> includedTrees,
        ICollection<IndexRecord> records)
    {
        foreach (var member in namespaceSymbol.GetMembers())
        {
            if (member is INamespaceSymbol childNamespace)
            {
                AddNamespaceMembers(
                    childNamespace, repositoryPath, repositoryId, commitSha,
                    generatedAt, includedTrees, records);
                continue;
            }

            AddSymbolAndMembers(
                member, repositoryPath, repositoryId, commitSha,
                generatedAt, includedTrees, records);
        }
    }

    private static void AddSymbolAndMembers(
        ISymbol symbol,
        string repositoryPath,
        string repositoryId,
        string commitSha,
        DateTimeOffset generatedAt,
        ISet<SyntaxTree> includedTrees,
        ICollection<IndexRecord> records)
    {
        var sourceLocation = symbol.Locations.FirstOrDefault(location =>
            location.IsInSource
            && location.SourceTree is not null
            && includedTrees.Contains(location.SourceTree));

        if (sourceLocation?.SourceTree is not null)
        {
            var span = sourceLocation.SourceTree.GetLineSpan(sourceLocation.SourceSpan);
            records.Add(new IndexRecord(
                SchemaVersion,
                IndexerVersion,
                repositoryId,
                commitSha,
                GetRepositoryRelativePath(sourceLocation.SourceTree.FilePath, repositoryPath),
                "definition",
                SymbolKindClassifier.GetCategory(symbol),
                CreateSymbolId(symbol),
                symbol.Name,
                symbol.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat),
                "C#",
                span.StartLinePosition.Line + 1,
                span.EndLinePosition.Line + 1,
                null,
                null,
                null,
                null,
                null,
                "verified",
                generatedAt));
        }

        if (symbol is INamedTypeSymbol namedType)
        {
            foreach (var member in namedType.GetMembers())
            {
                if (!member.IsImplicitlyDeclared)
                {
                    AddSymbolAndMembers(
                        member, repositoryPath, repositoryId, commitSha,
                        generatedAt, includedTrees, records);
                }
            }
        }
    }

    private static string CreateSymbolId(ISymbol symbol)
    {
        var documentationId = DocumentationCommentId.CreateDeclarationId(symbol);
        return $"roslyn:{symbol.ContainingAssembly?.Identity.Name}:{documentationId ?? symbol.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat)}";
    }

    private static string GetRepositoryRelativePath(string sourcePath, string repositoryPath) =>
        Path.GetRelativePath(repositoryPath, sourcePath).Replace('\\', '/');
}
