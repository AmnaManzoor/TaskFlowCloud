using System.Net;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskFlow.Application.Common.Authorization;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.SharedKernel.Exceptions;

namespace TaskFlow.Api.Middleware;

/// <summary>
/// Converts unhandled exceptions into RFC 7807 problem details responses.
/// </summary>
public sealed class GlobalExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<GlobalExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context, IAuditTriggerService auditTriggers)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            if (exception is UnauthorizedAccessException unauthorizedException)
            {
                var userId = context.User.FindFirstValue(CustomClaimTypes.UserId)
                    ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier);

                await auditTriggers.LogAuthorizationFailedAsync(
                    userId,
                    unauthorizedException.Message,
                    context.RequestAborted);
            }

            await HandleExceptionAsync(context, exception);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        logger.LogError(exception, "Unhandled exception occurred while processing {RequestPath}", context.Request.Path);

        var (statusCode, title, detail) = exception switch
        {
            ValidationException validationException => (
                HttpStatusCode.BadRequest,
                "Validation failed",
                string.Join("; ", validationException.Errors.Select(error => error.ErrorMessage))),
            DomainException domainException => (
                HttpStatusCode.BadRequest,
                "Domain rule violation",
                domainException.Message),
            InvalidOperationException invalidOperationException => (
                HttpStatusCode.BadRequest,
                "Invalid operation",
                invalidOperationException.Message),
            UnauthorizedAccessException unauthorizedException => (
                HttpStatusCode.Unauthorized,
                "Unauthorized",
                unauthorizedException.Message),
            KeyNotFoundException keyNotFoundException => (
                HttpStatusCode.NotFound,
                "Resource not found",
                keyNotFoundException.Message),
            _ => (
                HttpStatusCode.InternalServerError,
                "An unexpected error occurred",
                "An internal server error occurred. Please try again later.")
        };

        var problemDetails = new ProblemDetails
        {
            Status = (int)statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        };

        problemDetails.Extensions["traceId"] = context.TraceIdentifier;

        context.Response.Clear();
        context.Response.StatusCode = problemDetails.Status.Value;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsJsonAsync(problemDetails);
    }
}
