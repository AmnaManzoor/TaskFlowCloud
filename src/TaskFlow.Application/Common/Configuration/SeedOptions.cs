namespace TaskFlow.Application.Common.Configuration;

/// <summary>
/// Development seed configuration for default roles and optional SuperAdmin user.
/// </summary>
public sealed class SeedOptions
{
    public const string SectionName = "Seed";

    public bool SeedSuperAdmin { get; init; }

    public string SuperAdminEmail { get; init; } = "superadmin@taskflow.local";

    public string SuperAdminPassword { get; init; } = "SuperAdmin123!";

    public string SuperAdminFirstName { get; init; } = "Super";

    public string SuperAdminLastName { get; init; } = "Admin";

    public bool SeedSampleOrganization { get; init; }
}
