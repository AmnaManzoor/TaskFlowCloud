using System.Text.Json;
using System.Text.Json.Serialization;

namespace TaskFlow.Infrastructure.Auditing;

public static class AuditValueSerializer
{
    private static readonly HashSet<string> IgnoredProperties = new(StringComparer.OrdinalIgnoreCase)
    {
        "LastViewedAt",
        "LastLoginAt",
        "UpdatedAt",
        "RowVersion",
        "CreatedAt",
        "EditedAt",
        "ReadAt"
    };

    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public static string? Serialize(object? value)
    {
        if (value is null)
        {
            return null;
        }

        var filtered = FilterInsignificantProperties(value);
        return filtered is null ? null : JsonSerializer.Serialize(filtered, SerializerOptions);
    }

    private static object? FilterInsignificantProperties(object value)
    {
        if (value is IDictionary<string, object?> dictionary)
        {
            return dictionary
                .Where(pair => !IgnoredProperties.Contains(pair.Key))
                .ToDictionary(pair => pair.Key, pair => pair.Value);
        }

        var type = value.GetType();
        if (type.IsPrimitive || value is string or Guid or DateTimeOffset or DateTime or decimal)
        {
            return value;
        }

        var properties = type.GetProperties()
            .Where(property => property.CanRead && !IgnoredProperties.Contains(property.Name))
            .ToDictionary(
                property => property.Name,
                property => property.GetValue(value));

        if (properties.Count == 0)
        {
            return null;
        }

        return properties;
    }
}
