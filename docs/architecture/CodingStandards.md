# Coding Standards

Conventions used across the TaskFlow solution.

## General

- Target **.NET 10** with nullable reference types enabled.
- Use **file-scoped namespaces** and **primary constructors** where the codebase already does.
- Prefer **async/await** for all I/O; pass `CancellationToken` through service and repository calls.
- Keep methods focused; extract private helpers when logic exceeds ~40 lines.
- Add XML documentation on public Application interfaces and shared models.

## Architecture Rules

1. **Domain** must not reference Application, Infrastructure, or Api.
2. **Application** defines interfaces; **Infrastructure** implements them.
3. **Api** endpoints delegate to services — no direct `DbContext` usage in endpoints.
4. Do not add a generic repository abstraction (see ADR-002).
5. Cross-cutting side effects use trigger services after persistence succeeds.

## Error Handling

```csharp
// Expected business failure
return Result.Failure<TaskResponse>("Task not found.");

// Unexpected failure — let GlobalExceptionHandlingMiddleware handle
throw new DomainException("Invariant violated.");
```

- Map `Result` failures to appropriate HTTP status codes in endpoints.
- Never expose stack traces or internal details in production Problem Details.
- Include `correlationId` from `HttpContext.TraceIdentifier` in error responses.

## Validation

- All request DTOs have FluentValidation validators in `TaskFlow.Application/Validators`.
- Validators are registered via assembly scanning in `AddApplication()`.
- Endpoints may use `ValidationFilter<T>` for explicit pre-handler validation.

## Dependency Injection

- Register services in `TaskFlow.Infrastructure/DependencyInjection.cs`.
- Use **scoped** lifetime for services using `DbContext`.
- Bind configuration with `IOptions<T>` and strongly typed option classes.

## EF Core

- Use `AsNoTracking()` for read-only queries.
- Use `.Include()` / `.ThenInclude()` deliberately; prefer split queries for large graphs.
- Project to DTOs with `.Select()` instead of loading full entities when possible.
- Respect global query filters for soft-deleted entities; use `IgnoreQueryFilters()` only when required (e.g. audit summaries).

## API Conventions

| Scenario | Status Code |
| -------- | ----------- |
| Success with body | 200 OK |
| Created | 201 Created |
| No content | 204 No Content |
| Validation error | 400 Bad Request (ProblemDetails) |
| Unauthorized | 401 Unauthorized |
| Forbidden | 403 Forbidden |
| Not found | 404 Not Found |
| Conflict | 409 Conflict |
| Server error | 500 Internal Server Error |

Pagination defaults: `pageNumber=1`, `pageSize=20`, maximum `pageSize=100`.

## Logging

- Use structured logging: `_logger.LogInformation("Created task {TaskId} for project {ProjectId}", taskId, projectId)`.
- Do **not** log passwords, JWT tokens, or connection strings.
- Use `LogLevel.Warning` for recoverable issues; `LogLevel.Error` for exceptions.

## Testing

- Unit tests for validators and pure logic.
- Integration tests for HTTP endpoints using `WebApplicationFactory`.
- Test naming: `{Method}_{Scenario}_{ExpectedResult}`.

## TaskStatus Ambiguity

`System.Threading.Tasks.TaskStatus` conflicts with `TaskFlow.Domain.Enums.TaskStatus`. Use:

```csharp
using TaskStatus = TaskFlow.Domain.Enums.TaskStatus;
```

in files referencing the domain enum.
