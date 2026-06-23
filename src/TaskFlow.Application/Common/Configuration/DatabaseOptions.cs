namespace TaskFlow.Application.Common.Configuration;

/// <summary>
/// Strongly typed database configuration bound from application settings.
/// </summary>
public sealed class DatabaseOptions
{
    public const string SectionName = "Database";

    public string ConnectionString { get; init; } = string.Empty;

    public bool EnableSensitiveDataLogging { get; init; }

    public bool EnableDetailedErrors { get; init; }

    public bool UseInMemory { get; init; }

    public string InMemoryDatabaseName { get; init; } = "TaskFlowInMemory";

    /// <summary>
    /// When true, applies EF Core migrations during application startup.
    /// Disable in production and run migrations from CI/CD or an init job instead.
    /// </summary>
    public bool ApplyMigrationsOnStartup { get; init; } = true;
}
