using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Projects;
using TaskFlow.Domain.Enums;

namespace TaskFlow.Application.Interfaces.Projects;

public interface IProjectAccessService
{
    Task<bool> IsSuperAdminAsync(string userId, CancellationToken cancellationToken = default);

    Task<ProjectRole?> GetProjectRoleAsync(
        string userId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task EnsureCanReadProjectAsync(
        string userId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task EnsureCanManageProjectAsync(
        string userId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task EnsureCanManageMembersAsync(
        string userId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task EnsureCanCreateProjectAsync(
        string userId,
        Guid organizationId,
        CancellationToken cancellationToken = default);

    Task EnsureCanDeleteProjectAsync(
        string userId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task EnsureCanTransferOwnershipAsync(
        string userId,
        Guid projectId,
        CancellationToken cancellationToken = default);
}

public interface IProjectService
{
    Task<ProjectResponse> CreateAsync(
        string currentUserId,
        CreateProjectRequest request,
        CancellationToken cancellationToken = default);

    Task<ProjectResponse> UpdateAsync(
        string currentUserId,
        Guid projectId,
        UpdateProjectRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        string currentUserId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task<ProjectResponse> ArchiveAsync(
        string currentUserId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task<ProjectResponse> RestoreAsync(
        string currentUserId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task<ProjectResponse> TransferOwnershipAsync(
        string currentUserId,
        Guid projectId,
        TransferProjectOwnershipRequest request,
        CancellationToken cancellationToken = default);

    Task<ProjectResponse> ChangeStatusAsync(
        string currentUserId,
        Guid projectId,
        ChangeProjectStatusRequest request,
        CancellationToken cancellationToken = default);

    Task<ProjectResponse> ChangePriorityAsync(
        string currentUserId,
        Guid projectId,
        ChangeProjectPriorityRequest request,
        CancellationToken cancellationToken = default);

    Task<ProjectResponse> GetByIdAsync(
        string currentUserId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task<PagedResult<ProjectResponse>> GetAllAsync(
        string currentUserId,
        ProjectListQuery query,
        CancellationToken cancellationToken = default);

    Task<PagedResult<ProjectResponse>> SearchAsync(
        string currentUserId,
        ProjectSearchQuery query,
        CancellationToken cancellationToken = default);

    Task<ProjectMemberResponse> AddMemberAsync(
        string currentUserId,
        Guid projectId,
        AddProjectMemberRequest request,
        CancellationToken cancellationToken = default);

    Task RemoveMemberAsync(
        string currentUserId,
        Guid projectId,
        string userId,
        CancellationToken cancellationToken = default);

    Task<ProjectMemberResponse> UpdateMemberRoleAsync(
        string currentUserId,
        Guid projectId,
        string userId,
        UpdateProjectMemberRoleRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProjectMemberResponse>> GetMembersAsync(
        string currentUserId,
        Guid projectId,
        CancellationToken cancellationToken = default);
}
