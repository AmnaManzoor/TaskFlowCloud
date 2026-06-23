using System.Security.Claims;
using TaskFlow.Application.Common.Auditing;
using TaskFlow.Application.Common.Authorization;

namespace TaskFlow.Api.Middleware;

public sealed class AuditContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IAuditContextAccessor auditContextAccessor)
    {
        var userId = context.User.FindFirstValue(CustomClaimTypes.UserId)
            ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier);

        auditContextAccessor.Set(new AuditContext(
            userId,
            context.Connection.RemoteIpAddress?.ToString(),
            context.Request.Headers.UserAgent.ToString(),
            context.TraceIdentifier));

        await next(context);
    }
}
