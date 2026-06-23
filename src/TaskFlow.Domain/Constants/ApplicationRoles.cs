namespace TaskFlow.Domain.Constants;

/// <summary>
/// Default application role names.
/// </summary>
public static class ApplicationRoles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string Member = "Member";

    public static readonly IReadOnlyList<string> All =
    [
        SuperAdmin,
        Admin,
        Manager,
        Member
    ];
}
