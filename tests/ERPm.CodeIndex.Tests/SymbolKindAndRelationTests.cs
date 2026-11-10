using ERPm.CodeIndex.Indexing;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ERPm.CodeIndex.Tests;

public sealed class SymbolKindClassifierTests
{
    [Fact]
    public void Classifies_namespace_type_and_member_symbols()
    {
        const string source = """
            using System;
            namespace Fixture
            {
                public class Sample
                {
                    public int Field;
                    public int Property { get; set; }
                    public event Action Changed { add { } remove { } }
                    public void Run(int input)
                    {
                        int local = input;
                    }
                }
            }
            """;

        var tree = CSharpSyntaxTree.ParseText(source);
        var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!)
            .Split(Path.PathSeparator)
            .Select(path => MetadataReference.CreateFromFile(path));
        var compilation = CSharpCompilation.Create(
            "SymbolKindFixture",
            [tree],
            references,
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
        var semanticModel = compilation.GetSemanticModel(tree);
        var root = tree.GetRoot();

        var namespaceDeclaration = root.DescendantNodes().OfType<NamespaceDeclarationSyntax>().Single();
        var typeDeclaration = root.DescendantNodes().OfType<ClassDeclarationSyntax>().Single();
        var fieldDeclaration = root.DescendantNodes().OfType<VariableDeclaratorSyntax>()
            .Single(item => item.Identifier.ValueText == "Field");
        var propertyDeclaration = root.DescendantNodes().OfType<PropertyDeclarationSyntax>().Single();
        var eventDeclaration = root.DescendantNodes().OfType<EventDeclarationSyntax>().Single();
        var methodDeclaration = root.DescendantNodes().OfType<MethodDeclarationSyntax>().Single();
        var parameterDeclaration = methodDeclaration.ParameterList.Parameters.Single();
        var localDeclaration = methodDeclaration.DescendantNodes().OfType<VariableDeclaratorSyntax>()
            .Single(item => item.Identifier.ValueText == "local");

        Assert.Equal("namespace", SymbolKindClassifier.GetCategory(semanticModel.GetDeclaredSymbol(namespaceDeclaration)!));
        Assert.Equal("type", SymbolKindClassifier.GetCategory(semanticModel.GetDeclaredSymbol(typeDeclaration)!));
        Assert.Equal("field", SymbolKindClassifier.GetCategory(semanticModel.GetDeclaredSymbol(fieldDeclaration)!));
        Assert.Equal("property", SymbolKindClassifier.GetCategory(semanticModel.GetDeclaredSymbol(propertyDeclaration)!));
        Assert.Equal("event", SymbolKindClassifier.GetCategory(semanticModel.GetDeclaredSymbol(eventDeclaration)!));
        Assert.Equal("method", SymbolKindClassifier.GetCategory(semanticModel.GetDeclaredSymbol(methodDeclaration)!));
        Assert.Equal("parameter", SymbolKindClassifier.GetCategory(semanticModel.GetDeclaredSymbol(parameterDeclaration)!));
        Assert.Equal("local", SymbolKindClassifier.GetCategory(semanticModel.GetDeclaredSymbol(localDeclaration)!));
    }
}

public sealed class ReferenceRelationClassifierTests
{
    [Fact]
    public void Marks_only_invocation_target_and_object_creation_as_calls()
    {
        const string source = """
            class Sample
            {
                void Target<T>() { }
                void Consume(int value) { }
                void Run(Sample instance)
                {
                    Target<int>();
                    instance.ToString();
                    Consume(42);
                    var created = new Sample();
                    Sample implicitCreated = new();
                }
            }
            """;

        var root = CSharpSyntaxTree.ParseText(source).GetRoot();
        var target = root.DescendantNodes().OfType<GenericNameSyntax>()
            .Single(item => item.Identifier.ValueText == "Target");
        var receiver = root.DescendantNodes().OfType<IdentifierNameSyntax>()
            .Single(item => item.Identifier.ValueText == "instance");
        var toString = root.DescendantNodes().OfType<IdentifierNameSyntax>()
            .Single(item => item.Identifier.ValueText == "ToString");
        var argument = root.DescendantNodes().OfType<LiteralExpressionSyntax>()
            .Single(item => item.Token.ValueText == "42");
        var explicitCreation = root.DescendantNodes().OfType<ObjectCreationExpressionSyntax>().Single();
        var implicitCreation = root.DescendantNodes().OfType<ImplicitObjectCreationExpressionSyntax>().Single();

        Assert.Equal("calls", ReferenceRelationClassifier.GetRelation(target));
        Assert.Equal("references", ReferenceRelationClassifier.GetRelation(receiver));
        Assert.Equal("calls", ReferenceRelationClassifier.GetRelation(toString));
        Assert.Equal("references", ReferenceRelationClassifier.GetRelation(argument));
        Assert.Equal("calls", ReferenceRelationClassifier.GetRelation(explicitCreation));
        Assert.Equal("calls", ReferenceRelationClassifier.GetRelation(implicitCreation));
    }
}
