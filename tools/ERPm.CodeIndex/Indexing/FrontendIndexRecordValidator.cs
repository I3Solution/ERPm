using System.Text.Json;
using Json.Schema;

namespace ERPm.CodeIndex.Indexing;

public static class FrontendIndexRecordValidator
{
    public static void Validate(JsonElement record, JsonSchema schema, int lineNumber)
    {
        var result = schema.Evaluate(record, new EvaluationOptions
        {
            RequireFormatValidation = true
        });

        if (!result.IsValid)
        {
            throw new InvalidOperationException(
                $"Frontend worker emitted a record that does not satisfy schema v3 at stdout line {lineNumber}.");
        }
    }
}
