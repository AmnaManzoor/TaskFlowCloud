using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TaskFlow.Application.Common.Configuration;
using TaskStatus = TaskFlow.Domain.Enums.TaskStatus;
using TaskFlow.Domain.Constants;
using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;
using TaskFlow.Infrastructure.Identity;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Persistence;

/// <summary>
/// Seeds default roles and optional development SuperAdmin user.
/// </summary>
public sealed class DataSeeder(
    ApplicationDbContext dbContext,
    RoleManager<ApplicationRole> roleManager,
    UserManager<ApplicationUser> userManager,
    IOptions<SeedOptions> seedOptions,
    IOptions<DatabaseOptions> databaseOptions,
    ILogger<DataSeeder> logger)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        if (dbContext.Database.IsRelational())
        {
            if (databaseOptions.Value.ApplyMigrationsOnStartup)
            {
                await dbContext.Database.MigrateAsync(cancellationToken);
            }
        }
        else
        {
            await dbContext.Database.EnsureCreatedAsync(cancellationToken);
        }
        await SeedRolesAsync(cancellationToken);
        await SeedSuperAdminAsync(cancellationToken);
        await SeedSampleOrganizationAsync(cancellationToken);
    }

    private async Task SeedRolesAsync(CancellationToken cancellationToken)
    {
        foreach (var roleName in ApplicationRoles.All)
        {
            if (await roleManager.RoleExistsAsync(roleName))
            {
                continue;
            }

            var result = await roleManager.CreateAsync(new ApplicationRole
            {
                Name = roleName
            });

            if (result.Succeeded)
            {
                logger.LogInformation("Seeded role {RoleName}", roleName);
            }
            else
            {
                logger.LogWarning(
                    "Failed to seed role {RoleName}: {Errors}",
                    roleName,
                    string.Join("; ", result.Errors.Select(error => error.Description)));
            }
        }
    }

    private async Task SeedSuperAdminAsync(CancellationToken cancellationToken)
    {
        var options = seedOptions.Value;
        if (!options.SeedSuperAdmin)
        {
            return;
        }

        var existingUser = await userManager.FindByEmailAsync(options.SuperAdminEmail);
        if (existingUser is not null)
        {
            if (!await userManager.IsInRoleAsync(existingUser, ApplicationRoles.SuperAdmin))
            {
                await userManager.AddToRoleAsync(existingUser, ApplicationRoles.SuperAdmin);
            }

            return;
        }

        var user = new ApplicationUser
        {
            UserName = options.SuperAdminEmail,
            Email = options.SuperAdminEmail,
            FirstName = options.SuperAdminFirstName,
            LastName = options.SuperAdminLastName,
            EmailConfirmed = true,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        var createResult = await userManager.CreateAsync(user, options.SuperAdminPassword);
        if (!createResult.Succeeded)
        {
            logger.LogWarning(
                "Failed to seed SuperAdmin user: {Errors}",
                string.Join("; ", createResult.Errors.Select(error => error.Description)));
            return;
        }

        await userManager.AddToRoleAsync(user, ApplicationRoles.SuperAdmin);
        logger.LogInformation("Seeded SuperAdmin user {Email}", options.SuperAdminEmail);
    }

    private async Task SeedSampleOrganizationAsync(CancellationToken cancellationToken)
    {
        if (!seedOptions.Value.SeedSampleOrganization)
        {
            return;
        }

        if (await dbContext.Organizations.AnyAsync(cancellationToken))
        {
            return;
        }

        var sampleUsers = new (string Email, string FirstName, string LastName, OrganizationMemberRole Role)[]
        {
            ("owner@taskflow.local", "Olivia", "Owner", OrganizationMemberRole.Owner),
            ("admin@taskflow.local", "Adam", "Admin", OrganizationMemberRole.Administrator),
            ("manager@taskflow.local", "Morgan", "Manager", OrganizationMemberRole.Manager),
            ("member1@taskflow.local", "Member", "One", OrganizationMemberRole.Member),
            ("member2@taskflow.local", "Member", "Two", OrganizationMemberRole.Member)
        };

        var userIds = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var sample in sampleUsers)
        {
            var user = await userManager.FindByEmailAsync(sample.Email);
            if (user is null)
            {
                user = new ApplicationUser
                {
                    UserName = sample.Email,
                    Email = sample.Email,
                    FirstName = sample.FirstName,
                    LastName = sample.LastName,
                    EmailConfirmed = true,
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                var createResult = await userManager.CreateAsync(user, "SampleUser123!");
                if (!createResult.Succeeded)
                {
                    logger.LogWarning("Failed to seed sample user {Email}", sample.Email);
                    continue;
                }
            }

            userIds[sample.Email] = user.Id;
        }

        var organization = Organization.Create(
            "TaskFlow Demo Organization",
            "Sample organization for development and testing.",
            null);

        dbContext.Organizations.Add(organization);

        foreach (var sample in sampleUsers)
        {
            if (!userIds.TryGetValue(sample.Email, out var userId))
            {
                continue;
            }

            dbContext.OrganizationMembers.Add(
                OrganizationMember.Create(organization.Id, userId, sample.Role));
        }

        var engineering = Team.Create(organization.Id, "Engineering", "Product engineering team.");
        var product = Team.Create(organization.Id, "Product", "Product management team.");
        dbContext.Teams.AddRange(engineering, product);

        if (userIds.TryGetValue("member1@taskflow.local", out var member1Id))
        {
            dbContext.TeamMembers.Add(TeamMember.Create(engineering.Id, member1Id));
        }

        if (userIds.TryGetValue("member2@taskflow.local", out var member2Id))
        {
            dbContext.TeamMembers.Add(TeamMember.Create(product.Id, member2Id));
        }

        if (userIds.TryGetValue("manager@taskflow.local", out var managerId))
        {
            dbContext.TeamMembers.Add(TeamMember.Create(engineering.Id, managerId));
        }

        if (userIds.TryGetValue("owner@taskflow.local", out var ownerId))
        {
            var sampleProject = Project.Create(
                organization.Id,
                "Demo Project",
                "DEMO-001",
                "Sample project for development and testing.",
                ProjectStatus.Active,
                ProjectPriority.High,
                DateOnly.FromDateTime(DateTime.UtcNow),
                null,
                null,
                ownerId);

            dbContext.Projects.Add(sampleProject);
            dbContext.ProjectMembers.Add(ProjectMember.Create(sampleProject.Id, ownerId, ProjectRole.Owner));

            if (userIds.TryGetValue("admin@taskflow.local", out var adminId))
            {
                dbContext.ProjectMembers.Add(
                    ProjectMember.Create(sampleProject.Id, adminId, ProjectRole.Manager));
            }

            var sampleTask = TaskItem.Create(
                sampleProject.Id,
                "Set up development environment",
                "Configure local development tools and database.",
                TaskStatus.InProgress,
                TaskPriority.High,
                TaskType.Feature,
                DateOnly.FromDateTime(DateTime.UtcNow),
                DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
                8m,
                5,
                null,
                ownerId);

            dbContext.Tasks.Add(sampleTask);
            dbContext.TaskAssignments.Add(TaskAssignment.Create(sampleTask.Id, ownerId, ownerId));

            var featureLabel = TaskLabel.Create("Feature", "#3B82F6");
            dbContext.TaskLabels.Add(featureLabel);
            dbContext.TaskItemLabels.Add(TaskItemLabel.Create(sampleTask.Id, featureLabel.Id));

            dbContext.Checklists.Add(Checklist.Create(sampleTask.Id, "Install .NET SDK", 0));
            dbContext.Checklists.Add(Checklist.Create(sampleTask.Id, "Run database migrations", 1));
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Seeded sample organization {OrganizationId}", organization.Id);
    }
}
