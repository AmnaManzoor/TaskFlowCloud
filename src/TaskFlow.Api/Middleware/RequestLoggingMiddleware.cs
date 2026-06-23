using System.Diagnostics;
using Serilog;
using Serilog.Context;

namespace TaskFlow.Api.Middleware;

/// <summary>
/// Logs structured request and response metadata for each HTTP request.
/// </summary>
public sealed class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();

        using (LogContext.PushProperty("RequestId", context.TraceIdentifier))
        using (LogContext.PushProperty("CorrelationId", context.TraceIdentifier))
        using (LogContext.PushProperty("RequestPath", context.Request.Path.Value))
        using (LogContext.PushProperty("RequestMethod", context.Request.Method))
        {
            logger.LogInformation(
                "HTTP {RequestMethod} {RequestPath} started",
                context.Request.Method,
                context.Request.Path);

            try
            {
                await next(context);
            }
            finally
            {
                stopwatch.Stop();

                logger.LogInformation(
                    "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {ElapsedMilliseconds} ms",
                    context.Request.Method,
                    context.Request.Path,
                    context.Response.StatusCode,
                    stopwatch.ElapsedMilliseconds);
            }
        }
    }
}
