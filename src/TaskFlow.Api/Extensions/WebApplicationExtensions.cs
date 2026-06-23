using Microsoft.Extensions.DependencyInjection;
using TaskFlow.Api.Endpoints;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Api.Extensions;

public static class WebApplicationExtensions
{
    public static async Task InitializeDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
        await seeder.SeedAsync();
    }

    public static WebApplication MapApiEndpoints(this WebApplication app)
    {
        app.MapAuthEndpoints();
        app.MapOrganizationEndpoints();
        app.MapProjectEndpoints();
        app.MapTaskEndpoints();
        app.MapCommentEndpoints();
        app.MapAttachmentEndpoints();
        app.MapNotificationEndpoints();
        app.MapAuditEndpoints();
        app.MapDashboardEndpoints();
        app.MapTeamEndpoints();
        app.MapUserEndpoints();
        return app;
    }
}
