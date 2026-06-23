using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Application.Interfaces.Projects;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class ProjectAccessService(
    ApplicationDbContext dbContext,
    IOrganizationAccessService organizationAccessService) : IProjectAccessService
{
    public Task<bool> IsSuperAdminAsync(string userId, CancellationToken cancellationToken = default) =>
        organizationAccessService.IsSuperAdminAsync(userId, cancellationToken);

    public async Task<ProjectRole?> GetProjectRoleAsync(
        string userId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        if (await IsSuperAdminAsync(userId, cancellationToken))
        {
            return ProjectRole.Owner;
        }

        var member = await dbContext.ProjectMembers
            .AsNoTracking()
            .SingleOrDefaultAsync(
                entry => entry.ProjectId == projectId && entry.UserId == userId,
                cancellationToken);

        return member?.Role;
    }

    public async Task EnsureCanReadProjectAsync(
        string userId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        if (await IsSuperAdminAsync(userId, cancellationToken))
        {
            return;
        }

        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        var orgRole = await organizationAccessService.GetMemberRoleAsync(
            userId,
            project.OrganizationId,
            cancellationToken);

        if (orgRole is not null && OrganizationRolePermissions.CanManageProjects(orgRole.Value))
        {
            return;
        }

        var projectRole = await GetProjectRoleAsync(userId, projectId, cancellationToken);
        if (projectRole is null || !ProjectRolePermissions.CanRead(projectRole.Value))
        {
            throw new UnauthorizedAccessException("You do not have access to this project.");
        }
    }

    public async Task EnsureCanManageProjectAsync(
        string userId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        if (await IsSuperAdminAsync(userId, cancellationToken))
        {
            return;
        }

        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        var orgRole = await organizationAccessService.GetMemberRoleAsync(
            userId,
            project.OrganizationId,
            cancellationToken);

        if (orgRole is not null && OrganizationRolePermissions.CanManageProjects(orgRole.Value))
        {
            return;
        }

        var projectRole = await GetProjectRoleAsync(userId, projectId, cancellationToken);
        if (projectRole is null || !ProjectRolePermissions.CanManageProject(projectRole.Value))
        {
            throw new UnauthorizedAccessException("You do not have permission to manage this project.");
        }
    }

    public async Task EnsureCanManageMembersAsync(
        string userId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        if (await IsSuperAdminAsync(userId, cancellationToken))
        {
            return;
        }

        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        var orgRole = await organizationAccessService.GetMemberRoleAsync(
            userId,
            project.OrganizationId,
            cancellationToken);

        if (orgRole is not null && OrganizationRolePermissions.CanManageProjects(orgRole.Value))
        {
            return;
        }

        var projectRole = await GetProjectRoleAsync(userId, projectId, cancellationToken);
        if (projectRole is null || !ProjectRolePermissions.CanManageMembers(projectRole.Value))
        {
            throw new UnauthorizedAccessException("You do not have permission to manage project members.");
        }
    }

    public async Task EnsureCanCreateProjectAsync(
        string userId,
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        if (await IsSuperAdminAsync(userId, cancellationToken))
        {
            return;
        }

        var orgRole = await organizationAccessService.GetMemberRoleAsync(
            userId,
            organizationId,
            cancellationToken);

        if (orgRole is null || !OrganizationRolePermissions.CanManageProjects(orgRole.Value))
        {
            throw new UnauthorizedAccessException("You do not have permission to create projects in this organization.");
        }
    }

    public async Task EnsureCanDeleteProjectAsync(
        string userId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        if (await IsSuperAdminAsync(userId, cancellationToken))
        {
            return;
        }

        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        var orgRole = await organizationAccessService.GetMemberRoleAsync(
            userId,
            project.OrganizationId,
            cancellationToken);

        if (orgRole is not null && OrganizationRolePermissions.CanManageProjects(orgRole.Value))
        {
            return;
        }

        var projectRole = await GetProjectRoleAsync(userId, projectId, cancellationToken);
        if (projectRole is null || !ProjectRolePermissions.CanDeleteOrArchive(projectRole.Value))
        {
            throw new UnauthorizedAccessException("You do not have permission to delete this project.");
        }
    }

    public async Task EnsureCanTransferOwnershipAsync(
        string userId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        if (await IsSuperAdminAsync(userId, cancellationToken))
        {
            return;
        }

        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleOrDefaultAsync(entry => entry.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        var orgRole = await organizationAccessService.GetMemberRoleAsync(
            userId,
            project.OrganizationId,
            cancellationToken);

        if (orgRole is not null && OrganizationRolePermissions.CanManageProjects(orgRole.Value))
        {
            return;
        }

        var projectRole = await GetProjectRoleAsync(userId, projectId, cancellationToken);
        if (projectRole != ProjectRole.Owner)
        {
            throw new UnauthorizedAccessException("Only the project owner can transfer ownership.");
        }
    }
}
