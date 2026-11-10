using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ERPm.CodeIndex.Indexing;

public static class SymbolKindClassifier
{
    public static string GetCategory(ISymbol symbol) => symbol.Kind switch
    {
        SymbolKind.Namespace => "namespace",
        SymbolKind.NamedType => "type",
        SymbolKind.Method => "method",
        SymbolKind.Field => "field",
        SymbolKind.Property => "property",
        SymbolKind.Event => "event",
        SymbolKind.Parameter => "parameter",
        SymbolKind.Local => "local",
        SymbolKind.TypeParameter => "typeParameter",
        _ => "other"
    };
}

public static class ReferenceRelationClassifier
{
    public static string GetRelation(SyntaxNode node) =>
        node is ObjectCreationExpressionSyntax
            or ImplicitObjectCreationExpressionSyntax
            || node is SimpleNameSyntax simpleName && IsInvocationTarget(simpleName)
            ? "calls"
            : "references";

    private static bool IsInvocationTarget(SimpleNameSyntax node)
    {
        foreach (var invocation in node.Ancestors().OfType<InvocationExpressionSyntax>())
        {
            var expression = invocation.Expression;
            if (expression.Span == node.Span)
            {
                return true;
            }

            if (expression is MemberAccessExpressionSyntax memberAccess
                && memberAccess.Name.Span == node.Span)
            {
                return true;
            }

            if (expression is MemberBindingExpressionSyntax memberBinding
                && memberBinding.Name.Span == node.Span)
            {
                return true;
            }
        }

        return false;
    }
}
