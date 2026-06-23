namespace TaskFlow.Application.DTOs.Teams;

public sealed record CreateTeamRequest(
    Guid OrganizationId,
    string Name,
    string? Description);

public sealed record UpdateTeamRequest(
    string Name,
    string? Description);

public sealed record TeamResponse(
    Guid Id,
    Guid OrganizationId,
    string Name,
    string? Description,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt);

public sealed record TeamListQuery(
    Guid? OrganizationId = null,
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    string? SortBy = "name",
    bool SortDescending = false);

public sealed record AddTeamMemberRequest(
    string UserId);

public sealed record TeamMemberResponse(
    Guid Id,
    Guid TeamId,
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    DateTimeOffset JoinedAt);
