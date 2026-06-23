using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.FileProviders;
using Microsoft.OpenApi;
using Serilog;
using Serilog.Events;
using TaskFlow.Api.Middleware;
using TaskFlow.Application;
using TaskFlow.Application.Common.Configuration;
using TaskFlow.Infrastructure;

namespace TaskFlow.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<LoggingOptions>(configuration.GetSection(LoggingOptions.SectionName));

        services.AddProblemDetails();
        services.AddEndpointsApiExplorer();

        services.AddFluentValidationAutoValidation();
        services.AddFluentValidationClientsideAdapters();

        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "TaskFlow API",
                Version = "v1",
                Description = """
                    Enterprise task management REST API built with Clean Architecture.

                    ## Authentication
                    Obtain a JWT via `POST /api/auth/login` and pass it as `Authorization: Bearer {token}`.

                    ## Pagination
                    List endpoints accept `pageNumber` (default 1) and `pageSize` (default 20, max 100).

                    ## Errors
                    Failures return RFC 7807 Problem Details with a `correlationId` extension for support.
                    """
            });

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Description = "Enter a valid JWT bearer token.",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT"
            });

            options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("Bearer", document)] = []
            });
        });

        services
            .AddApplication()
            .AddInfrastructure(configuration);

        var healthChecks = services.AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live"]);

        if (!configuration.GetSection(DatabaseOptions.SectionName).GetValue<bool>("UseInMemory"))
        {
            healthChecks.AddSqlServer(
                configuration.GetSection(DatabaseOptions.SectionName)["ConnectionString"]
                    ?? throw new InvalidOperationException("Database connection string is not configured."),
                name: "sqlserver",
                tags: ["db", "sql", "ready"]);
        }

        return services;
    }

    public static WebApplicationBuilder ConfigureSerilog(this WebApplicationBuilder builder)
    {
        var loggingOptions = builder.Configuration
            .GetSection(LoggingOptions.SectionName)
            .Get<LoggingOptions>() ?? new LoggingOptions();

        builder.Host.UseSerilog((context, services, configuration) =>
        {
            configuration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                .Enrich.FromLogContext()
                .Enrich.WithProperty("Application", "TaskFlow.Api")
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .MinimumLevel.Override("System", LogEventLevel.Warning)
                .WriteTo.Console(
                    outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
                .WriteTo.File(
                    path: loggingOptions.LogFilePath,
                    rollingInterval: RollingInterval.Day,
                    outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}");
        });

        return builder;
    }

    public static WebApplication ConfigurePipeline(this WebApplication app)
    {
        app.UseSerilogRequestLogging(options =>
        {
            options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
            {
                diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
                diagnosticContext.Set("UserAgent", httpContext.Request.Headers.UserAgent.ToString());
                diagnosticContext.Set("CorrelationId", httpContext.TraceIdentifier);
            };
        });

        app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

        var loggingOptions = app.Configuration
            .GetSection(LoggingOptions.SectionName)
            .Get<LoggingOptions>() ?? new LoggingOptions();

        if (loggingOptions.EnableRequestLogging)
        {
            app.UseMiddleware<RequestLoggingMiddleware>();
        }

        if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
        {
            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
            });
            app.UseHsts();
        }

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(options =>
            {
                options.SwaggerEndpoint("/swagger/v1/swagger.json", "TaskFlow API v1");
            });
        }

        app.UseStaticFiles();

        var fileStorage = app.Configuration
            .GetSection(FileStorageOptions.SectionName)
            .Get<FileStorageOptions>() ?? new FileStorageOptions();

        var uploadsPhysicalPath = Path.Combine(app.Environment.ContentRootPath, fileStorage.ProfileImagesPath);
        Directory.CreateDirectory(uploadsPhysicalPath);

        var attachmentsPhysicalPath = Path.Combine(app.Environment.ContentRootPath, fileStorage.AttachmentsPath);
        Directory.CreateDirectory(attachmentsPhysicalPath);

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(uploadsPhysicalPath),
            RequestPath = fileStorage.ProfileImagesPublicPath
        });

        app.UseHttpsRedirection();
        app.UseAuthentication();
        app.UseMiddleware<AuditContextMiddleware>();
        app.UseAuthorization();

        var healthCheckOptions = new HealthCheckOptions
        {
            ResponseWriter = HealthCheckResponseWriter.WriteResponse
        };

        app.MapHealthChecks("/health", healthCheckOptions);
        app.MapHealthChecks("/health/live", new HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains("live"),
            ResponseWriter = HealthCheckResponseWriter.WriteResponse
        });
        app.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains("ready"),
            ResponseWriter = HealthCheckResponseWriter.WriteResponse
        });

        app.MapApiEndpoints();

        return app;
    }
}
