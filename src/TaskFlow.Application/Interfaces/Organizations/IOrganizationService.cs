using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Organizations;
using TaskFlow.Application.DTOs.Teams;

namespace TaskFlow.Application.Interfaces.Organizations;

public interface IOrganizationService
{
    Task<OrganizationResponse> CreateAsync(string currentUserId, CreateOrganizationRequest request, CancellationToken cancellationToken = default);

    Task<OrganizationResponse> UpdateAsync(string currentUserId, Guid organizationId, UpdateOrganizationRequest request, CancellationToken cancellationToken = default);

    Task DeleteAsync(string currentUserId, Guid organizationId, CancellationToken cancellationToken = default);

    Task<OrganizationResponse> GetByIdAsync(string currentUserId, Guid organizationId, CancellationToken cancellationToken = default);

    Task<PagedResult<OrganizationResponse>> GetAllAsync(string currentUserId, OrganizationListQuery query, CancellationToken cancellationToken = default);

    Task<OrganizationMemberResponse> AddMemberAsync(string currentUserId, Guid organizationId, AddOrganizationMemberRequest request, CancellationToken cancellationToken = default);

    Task RemoveMemberAsync(string currentUserId, Guid organizationId, string userId, CancellationToken cancellationToken = default);

    Task<OrganizationMemberResponse> UpdateMemberRoleAsync(string currentUserId, Guid organizationId, string userId, UpdateOrganizationMemberRoleRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OrganizationMemberResponse>> GetMembersAsync(string currentUserId, Guid organizationId, CancellationToken cancellationToken = default);
}

public interface ITeamService
{
    Task<TeamResponse> CreateAsync(string currentUserId, CreateTeamRequest request, CancellationToken cancellationToken = default);

    Task<TeamResponse> UpdateAsync(string currentUserId, Guid teamId, UpdateTeamRequest request, CancellationToken cancellationToken = default);

    Task DeleteAsync(string currentUserId, Guid teamId, CancellationToken cancellationToken = default);

    Task<TeamResponse> GetByIdAsync(string currentUserId, Guid teamId, CancellationToken cancellationToken = default);

    Task<PagedResult<TeamResponse>> GetAllAsync(string currentUserId, TeamListQuery query, CancellationToken cancellationToken = default);

    Task<TeamMemberResponse> AddMemberAsync(string currentUserId, Guid teamId, AddTeamMemberRequest request, CancellationToken cancellationToken = default);

    Task RemoveMemberAsync(string currentUserId, Guid teamId, string userId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TeamMemberResponse>> GetMembersAsync(string currentUserId, Guid teamId, CancellationToken cancellationToken = default);
}

public interface IOrganizationAccessService
{
    Task<bool> IsSuperAdminAsync(string userId, CancellationToken cancellationToken = default);

    Task<Domain.Enums.OrganizationMemberRole?> GetMemberRoleAsync(string userId, Guid organizationId, CancellationToken cancellationToken = default);

    Task EnsureCanReadOrganizationAsync(string userId, Guid organizationId, CancellationToken cancellationToken = default);

    Task EnsureCanManageOrganizationAsync(string userId, Guid organizationId, CancellationToken cancellationToken = default);

    Task EnsureCanManageTeamsAsync(string userId, Guid organizationId, CancellationToken cancellationToken = default);
}
