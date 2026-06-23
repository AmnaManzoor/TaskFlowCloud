using Microsoft.EntityFrameworkCore;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Application.Interfaces.Projects;
using TaskFlow.Application.Interfaces.Tasks;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class TaskAccessService(
    ApplicationDbContext dbContext,
    IProjectAccessService projectAccessService,
    IOrganizationAccessService organizationAccessService) : ITaskAccessService
{
    public async Task<Guid> GetProjectIdAsync(Guid taskId, CancellationToken cancellationToken = default)
    {
        var projectId = await dbContext.Tasks
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(task => task.Id == taskId)
            .Select(task => task.ProjectId)
            .SingleOrDefaultAsync(cancellationToken);

        if (projectId == Guid.Empty)
        {
            throw new KeyNotFoundException("Task not found.");
        }

        return projectId;
    }

    public async Task EnsureCanReadTaskAsync(
        string userId,
        Guid taskId,
        CancellationToken cancellationToken = default)
    {
        var projectId = await GetProjectIdAsync(taskId, cancellationToken);
        await projectAccessService.EnsureCanReadProjectAsync(userId, projectId, cancellationToken);
    }

    public async Task EnsureCanCreateTaskAsync(
        string userId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        if (await projectAccessService.IsSuperAdminAsync(userId, cancellationToken))
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

        var projectRole = await projectAccessService.GetProjectRoleAsync(userId, projectId, cancellationToken);
        if (projectRole is null || !TaskRolePermissions.CanCreateTask(projectRole.Value))
        {
            throw new UnauthorizedAccessException("You do not have permission to create tasks in this project.");
        }
    }

    public async Task EnsureCanManageTaskAsync(
        string userId,
        Guid taskId,
        CancellationToken cancellationToken = default)
    {
        if (await projectAccessService.IsSuperAdminAsync(userId, cancellationToken))
        {
            return;
        }

        var projectId = await GetProjectIdAsync(taskId, cancellationToken);
        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleAsync(entry => entry.Id == projectId, cancellationToken);

        var orgRole = await organizationAccessService.GetMemberRoleAsync(
            userId,
            project.OrganizationId,
            cancellationToken);

        if (orgRole is not null && OrganizationRolePermissions.CanManageProjects(orgRole.Value))
        {
            return;
        }

        var projectRole = await projectAccessService.GetProjectRoleAsync(userId, projectId, cancellationToken);
        if (projectRole is null || !TaskRolePermissions.CanManageAllTasks(projectRole.Value))
        {
            throw new UnauthorizedAccessException("You do not have permission to manage this task.");
        }
    }

    public async Task EnsureCanUpdateTaskAsync(
        string userId,
        Guid taskId,
        CancellationToken cancellationToken = default)
    {
        if (await projectAccessService.IsSuperAdminAsync(userId, cancellationToken))
        {
            return;
        }

        var projectId = await GetProjectIdAsync(taskId, cancellationToken);
        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleAsync(entry => entry.Id == projectId, cancellationToken);

        var orgRole = await organizationAccessService.GetMemberRoleAsync(
            userId,
            project.OrganizationId,
            cancellationToken);

        if (orgRole is not null && OrganizationRolePermissions.CanManageProjects(orgRole.Value))
        {
            return;
        }

        var projectRole = await projectAccessService.GetProjectRoleAsync(userId, projectId, cancellationToken);
        if (projectRole is not null && TaskRolePermissions.CanManageAllTasks(projectRole.Value))
        {
            return;
        }

        if (projectRole is not null && TaskRolePermissions.CanUpdateAssignedTask(projectRole.Value))
        {
            var isAssigned = await dbContext.TaskAssignments
                .AnyAsync(assignment => assignment.TaskId == taskId && assignment.UserId == userId, cancellationToken);

            if (isAssigned)
            {
                return;
            }
        }

        throw new UnauthorizedAccessException("You do not have permission to update this task.");
    }
}
