namespace TaskFlow.Application.Common.Authorization;

/// <summary>
/// Authorization policy names used across the API.
/// </summary>
public static class AuthorizationPolicies
{
    public const string RequireAuthenticated = "RequireAuthenticated";
    public const string RequireSuperAdmin = "RequireSuperAdmin";
    public const string RequireAdmin = "RequireAdmin";
    public const string RequireManager = "RequireManager";
    public const string RequireMember = "RequireMember";
}
