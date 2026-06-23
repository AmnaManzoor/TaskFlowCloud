namespace TaskFlow.Application.Common.Configuration;

/// <summary>
/// Strongly typed logging configuration bound from application settings.
/// </summary>
public sealed class LoggingOptions
{
    public const string SectionName = "LoggingOptions";

    public string LogFilePath { get; init; } = "logs/taskflow-.log";

    public string RollingInterval { get; init; } = "Day";

    public bool EnableRequestLogging { get; init; } = true;
}
