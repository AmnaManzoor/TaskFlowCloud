namespace TaskFlow.Application.Common.Configuration;

public sealed class AzureBlobStorageOptions
{
    public const string SectionName = "AzureStorage";

    public string AccountName { get; init; } = string.Empty;

    public string ContainerName { get; init; } = string.Empty;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(AccountName) &&
        !string.IsNullOrWhiteSpace(ContainerName);
}
