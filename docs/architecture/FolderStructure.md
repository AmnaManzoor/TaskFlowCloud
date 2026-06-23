# Folder Structure

## Repository Root

```text
TaskFlowCloud/
├── .github/                 # CI workflow, issue/PR templates
├── docs/
│   ├── architecture/        # Architecture guides (this folder)
│   └── adr/                 # Architecture Decision Records
├── src/
├── tests/
├── docker-compose.yml
├── Dockerfile
├── Directory.Build.props
├── global.json
├── LICENSE
├── README.md
└── TaskFlow.slnx
```

## Source Projects

### TaskFlow.Api

```text
TaskFlow.Api/
├── Endpoints/           # Static endpoint mapping classes per module
├── Extensions/          # DI, pipeline, Serilog, health response writer
├── Middleware/          # Exception handling, request logging, audit context
├── Program.cs
└── appsettings*.json
```

### TaskFlow.Application

```text
TaskFlow.Application/
├── Common/
│   ├── Configuration/   # Strongly typed options (Database, Jwt, Seed, FileStorage)
│   ├── Models/          # PagedQuery, PagedResult
│   └── Mapping/         # Mapster profiles
├── DTOs/                # Request/response records grouped by feature
├── Interfaces/          # Service and access-service contracts
├── Validators/          # FluentValidation rules
└── DependencyInjection.cs
```

### TaskFlow.Domain

```text
TaskFlow.Domain/
├── Constants/           # Role names, policy names
├── Entities/            # Aggregate roots and child entities
├── Enums/               # TaskStatus, Priority, etc.
└── Common/              # Base entity types (soft delete, concurrency)
```

### TaskFlow.Infrastructure

```text
TaskFlow.Infrastructure/
├── Identity/            # ApplicationUser, ApplicationRole
├── Persistence/
│   ├── Configurations/  # EF entity configurations
│   ├── Migrations/
│   ├── ApplicationDbContext.cs
│   └── DataSeeder.cs
├── Services/            # Feature service implementations
│   ├── Access/          # Organization, Project, Task, Reporting, Audit access
│   └── Triggers/        # Audit and notification triggers
└── DependencyInjection.cs
```

### TaskFlow.SharedKernel

```text
TaskFlow.SharedKernel/
├── Result.cs
└── DomainException.cs
```

## Tests

```text
tests/
├── TaskFlow.UnitTests/           # Validators, domain helpers, unit logic
└── TaskFlow.IntegrationTests/  # WebApplicationFactory API tests
```

## Naming Conventions

| Artifact | Pattern | Example |
| -------- | ------- | ------- |
| Entity | PascalCase noun | `TaskItem`, `Organization` |
| Service interface | `I{Name}Service` | `ITaskService` |
| Service implementation | `{Name}Service` | `TaskService` |
| Access service | `I{Name}AccessService` | `IProjectAccessService` |
| DTO | `{Action}{Entity}Request/Response` | `CreateTaskRequest` |
| Validator | `{Dto}Validator` | `CreateTaskRequestValidator` |
| Endpoint class | `{Module}Endpoints` | `TaskEndpoints` |
| Migration | `{Timestamp}_{Description}` | `20260622120000_AddAuditLogs` |

## Endpoint Organization

Each module exposes a static class with `Map{Module}Endpoints(this WebApplication app)` registered from `WebApplicationExtensions.MapApiEndpoints`.

Common endpoint patterns:

- `GET /api/{resource}` — paginated list with `pageNumber`, `pageSize`, optional filters
- `GET /api/{resource}/{id}` — single resource
- `POST /api/{resource}` — create (201 Created)
- `PUT /api/{resource}/{id}` — full update
- `PATCH /api/{resource}/{id}` — partial update where supported
- `DELETE /api/{resource}/{id}` — soft delete (204 No Content)

## Configuration Files

| File | Purpose |
| ---- | ------- |
| `appsettings.json` | Base defaults (development-friendly) |
| `appsettings.Development.json` | Verbose logging, seed data enabled |
| `appsettings.Production.json` | Hardened defaults, no auto-seed |
| `appsettings.Testing.json` | In-memory database for integration tests |

Environment variables override using `Section__Key` syntax (e.g. `Jwt__SecretKey`).
