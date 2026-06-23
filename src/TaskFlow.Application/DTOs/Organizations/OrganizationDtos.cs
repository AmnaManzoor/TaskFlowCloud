using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.DTOs.Organizations;

public sealed record CreateOrganizationRequest(
    string Name,
    string? Description,
    string? LogoUrl);

public sealed record UpdateOrganizationRequest(
    string Name,
    string? Description,
    string? LogoUrl,
    bool IsActive);

public sealed record OrganizationResponse(
    Guid Id,
    string Name,
    string? Description,
    string? LogoUrl,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt);

public sealed record OrganizationListQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    string? SortBy = "name",
    bool SortDescending = false,
    bool? IsActive = null);

public sealed record AddOrganizationMemberRequest(
    string UserId,
    OrganizationMemberRole Role);

public sealed record UpdateOrganizationMemberRoleRequest(
    OrganizationMemberRole Role);

public sealed record OrganizationMemberResponse(
    Guid Id,
    Guid OrganizationId,
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    OrganizationMemberRole Role,
    DateTimeOffset JoinedAt);
