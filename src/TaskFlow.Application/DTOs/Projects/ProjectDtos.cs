using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.DTOs.Projects;

public sealed record CreateProjectRequest(
    Guid OrganizationId,
    string Name,
    string Code,
    string? Description,
    ProjectStatus Status = ProjectStatus.Draft,
    ProjectPriority Priority = ProjectPriority.Medium,
    DateOnly? StartDate = null,
    DateOnly? EndDate = null,
    DateOnly? EstimatedCompletionDate = null,
    string? OwnerId = null);

public sealed record UpdateProjectRequest(
    string Name,
    string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    DateOnly? EstimatedCompletionDate,
    string RowVersion);

public sealed record TransferProjectOwnershipRequest(string NewOwnerId);

public sealed record ChangeProjectStatusRequest(ProjectStatus Status);

public sealed record ChangeProjectPriorityRequest(ProjectPriority Priority);

public sealed record ProjectSummary(
    int MemberCount,
    int TaskCount,
    string OwnerEmail,
    string OwnerFullName,
    string OrganizationName);

public sealed record ProjectResponse(
    Guid Id,
    Guid OrganizationId,
    string Name,
    string Code,
    string? Description,
    ProjectStatus Status,
    ProjectPriority Priority,
    DateOnly? StartDate,
    DateOnly? EndDate,
    DateOnly? EstimatedCompletionDate,
    string OwnerId,
    bool IsArchived,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    string RowVersion,
    ProjectSummary? Summary = null);

public sealed record ProjectListQuery(
    int Page = 1,
    int PageSize = 20,
    Guid? OrganizationId = null,
    string? Search = null,
    ProjectStatus? Status = null,
    ProjectPriority? Priority = null,
    bool? IsArchived = null,
    string? SortBy = "name",
    bool SortDescending = false);

public sealed record ProjectSearchQuery(
    int Page = 1,
    int PageSize = 20,
    string? Name = null,
    string? Code = null,
    ProjectStatus? Status = null,
    ProjectPriority? Priority = null,
    Guid? OrganizationId = null,
    string? OwnerId = null,
    DateTimeOffset? CreatedFrom = null,
    DateTimeOffset? CreatedTo = null,
    bool? IsArchived = null,
    string? SortBy = "name",
    bool SortDescending = false);

public sealed record AddProjectMemberRequest(
    string UserId,
    ProjectRole Role);

public sealed record UpdateProjectMemberRoleRequest(ProjectRole Role);

public sealed record ProjectMemberResponse(
    Guid Id,
    Guid ProjectId,
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    ProjectRole Role,
    DateTimeOffset JoinedAt);
