using System.Text.Json;
using Json.Schema;
using Xunit;

namespace ERPm.CodeIndex.Tests;

public sealed class FrontendIndexRecordSchemaTests
{
    private static readonly string SchemaPath = Path.GetFullPath(Path.Combine(
        AppContext.BaseDirectory, "..", "..", "..", "..", "..",
        ".ai", "code-index", "schema", "index-record-v3.schema.json"));
    private static readonly JsonSchema Schema = JsonSchema.FromText(File.ReadAllText(SchemaPath));

    [Theory]
    [InlineData("angular")]
    [InlineData("api")]
    public void Accepts_typed_frontend_observations(string observationKind)
    {
        var record = observationKind == "angular"
            ? CreateRecord("""
                "kind":"angular","symbolKind":"component",
                "angular":{"kind":"component","selector":"app-sample","template":"sample.html","styles":["sample.scss"],"providedIn":null,"routePath":null,"guardInvocation":null,"targetSymbolId":null,"lazyImportPath":null},
                "api":null
                """)
            : CreateRecord("""
                "kind":"api","symbolKind":"apiClient","angular":null,
                "api":{"httpMethod":"GET","urlKind":"literal","expression":"'/api/v1/items'","literalPath":"/api/v1/items","containingSymbolId":"ts:service:items"}
                """);
        AssertValid(record);
    }

    [Fact]
    public void Accepts_interpolated_api_without_fabricated_literal_path()
    {
        var record=CreateRecord("""
            "kind":"api","symbolKind":"apiClient","angular":null,
            "api":{"httpMethod":"GET","urlKind":"interpolated","expression":"`${this.apiUrl}/${id}`","literalPath":null,"containingSymbolId":"ts:service:items"}
            """);
        AssertValid(record);
    }

    [Fact]
    public void Rejects_dynamic_api_with_literal_path()
    {
        var record=CreateRecord("""
            "kind":"api","symbolKind":"apiClient","angular":null,
            "api":{"httpMethod":"GET","urlKind":"dynamic","expression":"url","literalPath":"/guessed/path","containingSymbolId":null}
            """);
        AssertInvalid(record);
    }

    [Fact]
    public void Rejects_mismatched_angular_and_api_payloads()
    {
        var record=CreateRecord("""
            "kind":"angular","symbolKind":"component","angular":null,
            "api":{"httpMethod":"GET","urlKind":"literal","expression":"'/api/items'","literalPath":"/api/items","containingSymbolId":null}
            """);
        AssertInvalid(record);
    }

    [Fact]
    public void Rejects_extra_properties_and_invalid_revision_identity()
    {
        var record=CreateRecord("""
            "kind":"definition","symbolKind":"class","angular":null,"api":null,
            "unexpectedMetadata":{}
            """).Replace(new string('a',40),"not-a-commit-sha");
        AssertInvalid(record);
    }

    private static string CreateRecord(string specificProperties) => $$"""
        {
          "schemaVersion":3,"indexerVersion":"0.1.0",
          "repositoryId":"erpm-fe-src-app-modules-crm",
          "commitSha":"{{new string('a',40)}}",
          "path":"src/app/modules/CRM/partner.service.ts",
          "symbolId":"ts:service:partner","name":"PartnerService",
          "qualifiedName":"PartnerService","language":"typescript",
          "startLine":1,"endLine":20,"startOffset":0,"endOffset":420,
          "relation":null,"sourceSymbolId":null,"targetSymbolId":null,
          "evidence":"verified","generatedAtUtc":"2026-11-11T00:00:00Z",
          {{specificProperties}}
        }
        """;

    private static void AssertValid(string json)
    {
        var result=Schema.Evaluate(JsonDocument.Parse(json).RootElement, new EvaluationOptions { RequireFormatValidation = true });
        Assert.True(result.IsValid);
    }

    private static void AssertInvalid(string json)
    {
        var result=Schema.Evaluate(JsonDocument.Parse(json).RootElement);
        Assert.False(result.IsValid);
    }
}
