using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.Common.Configuration;
using TaskFlow.Application.Interfaces;
using TaskFlow.Application.Interfaces.Identity;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Application.Interfaces.Projects;
using TaskFlow.Application.Interfaces.Tasks;
using TaskFlow.Application.Interfaces.Collaboration;
using TaskFlow.Application.Interfaces.Notifications;
using TaskFlow.Application.Interfaces.Dashboard;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Application.Interfaces.Storage;
using TaskFlow.Application.Interfaces.Users;
using TaskFlow.Domain.Constants;
using TaskFlow.Application.Common.Auditing;
using TaskFlow.Infrastructure.Auditing;
using TaskFlow.Infrastructure.Identity;
using TaskFlow.Infrastructure.Persistence;
using TaskFlow.Infrastructure.Services;
using TaskFlow.Infrastructure.Services.Reporting;

namespace TaskFlow.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<DatabaseOptions>(configuration.GetSection(DatabaseOptions.SectionName));
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<SeedOptions>(configuration.GetSection(SeedOptions.SectionName));
        services.Configure<FileStorageOptions>(configuration.GetSection(FileStorageOptions.SectionName));

        var databaseOptions = configuration
            .GetSection(DatabaseOptions.SectionName)
            .Get<DatabaseOptions>()
            ?? throw new InvalidOperationException("Database configuration is missing.");

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            if (databaseOptions.UseInMemory)
            {
                options.UseInMemoryDatabase(databaseOptions.InMemoryDatabaseName);
            }
            else
            {
                options.UseSqlServer(
                    databaseOptions.ConnectionString,
                    sqlOptions => sqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));
            }

            if (databaseOptions.EnableSensitiveDataLogging)
            {
                options.EnableSensitiveDataLogging();
            }

            if (databaseOptions.EnableDetailedErrors)
            {
                options.EnableDetailedErrors();
            }
        });

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>());

        services
            .AddIdentity<ApplicationUser, ApplicationRole>(options =>
            {
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = true;
                options.User.RequireUniqueEmail = true;

                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.AllowedForNewUsers = true;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                var jwtOptions = configuration
                    .GetSection(JwtOptions.SectionName)
                    .Get<JwtOptions>()
                    ?? throw new InvalidOperationException("JWT configuration is missing.");

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidAudience = jwtOptions.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey)),
                    ClockSkew = TimeSpan.Zero,
                    RoleClaimType = ClaimTypes.Role
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(AuthorizationPolicies.RequireAuthenticated, policy =>
                policy.RequireAuthenticatedUser());

            options.AddPolicy(AuthorizationPolicies.RequireSuperAdmin, policy =>
                policy.RequireRole(ApplicationRoles.SuperAdmin));

            options.AddPolicy(AuthorizationPolicies.RequireAdmin, policy =>
                policy.RequireRole(ApplicationRoles.SuperAdmin, ApplicationRoles.Admin));

            options.AddPolicy(AuthorizationPolicies.RequireManager, policy =>
                policy.RequireRole(
                    ApplicationRoles.SuperAdmin,
                    ApplicationRoles.Admin,
                    ApplicationRoles.Manager));

            options.AddPolicy(AuthorizationPolicies.RequireMember, policy =>
                policy.RequireRole(
                    ApplicationRoles.SuperAdmin,
                    ApplicationRoles.Admin,
                    ApplicationRoles.Manager,
                    ApplicationRoles.Member));
        });

        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IRefreshTokenService, RefreshTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IOrganizationAccessService, OrganizationAccessService>();
        services.AddScoped<IOrganizationService, OrganizationService>();
        services.AddScoped<IProjectAccessService, ProjectAccessService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<ITaskAccessService, TaskAccessService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<ICollaborationAccessService, CollaborationAccessService>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<IAttachmentService, AttachmentService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<INotificationPublisher, NotificationPublisher>();
        services.AddScoped<INotificationTriggerService, NotificationTriggerService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IAuditContextAccessor, AuditContextAccessor>();
        services.AddScoped<IAuditLogPublisher, AuditLogPublisher>();
        services.AddScoped<IActivityRecorder, ActivityRecorder>();
        services.AddScoped<IAuditAccessService, AuditAccessService>();
        services.AddScoped<IAuditTriggerService, AuditTriggerService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IActivityHistoryService, ActivityHistoryService>();
        services.AddScoped<ReportingQueryScope>();
        services.AddScoped<IReportingAccessService, ReportingAccessService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<ITeamService, TeamService>();
        services.AddScoped<IUserManagementService, UserManagementService>();
        services.AddScoped<IProfileImageStorage, LocalProfileImageStorage>();
        services.AddScoped<DataSeeder>();

        return services;
    }
}
