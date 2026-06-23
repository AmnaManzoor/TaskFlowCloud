namespace TaskFlow.Application.DTOs.Users;

public sealed record UpdateUserProfileRequest(
    string FirstName,
    string LastName,
    string? ProfileImageUrl);

public sealed record UserSummaryResponse(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    string? ProfileImageUrl,
    bool IsActive,
    bool EmailConfirmed,
    bool IsLockedOut,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastLoginAt);

public sealed record UserListQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    string? SortBy = "email",
    bool SortDescending = false,
    bool? IsActive = null);

public sealed record UserDetailResponse(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    string? ProfileImageUrl,
    bool IsActive,
    bool EmailConfirmed,
    bool IsLockedOut,
    IReadOnlyList<string> SystemRoles,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    DateTimeOffset? LastLoginAt);
