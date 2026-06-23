# Database

TaskFlow uses **Entity Framework Core** with **SQL Server** as the primary store. Integration tests use an in-memory EF provider.

## Entity Relationship Diagram

```mermaid
erDiagram
    Organization ||--o{ OrganizationMember : has
    Organization ||--o{ Team : has
    Organization ||--o{ Project : owns
    Team ||--o{ TeamMember : has
    Project ||--o{ ProjectMember : has
    Project ||--o{ TaskItem : contains
    TaskItem ||--o{ TaskAssignment : has
    TaskItem ||--o{ TaskComment : has
    TaskItem ||--o{ Attachment : has
    TaskItem ||--o{ Checklist : has
    TaskItem ||--o{ TaskDependency : links
    TaskItem ||--o{ TaskItemLabel : tagged
    TaskLabel ||--o{ TaskItemLabel : used_by
    TaskComment ||--o{ Mention : contains
    ApplicationUser ||--o{ OrganizationMember : joins
    ApplicationUser ||--o{ Notification : receives
    ApplicationUser ||--o{ RefreshToken : has
    ApplicationUser ||--o{ AuditLog : performs
    ApplicationUser ||--o{ ActivityHistory : generates
```

## Key Schema Features

| Feature | Implementation |
| ------- | -------------- |
| Soft delete | `ISoftDeletable` + global query filter |
| Optimistic concurrency | `RowVersion` byte array on aggregates |
| Auditing | `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy` on base entities |
| Identity | ASP.NET Core Identity tables via `ApplicationUser` |

## Migrations

Create a migration after entity or configuration changes:

```bash
dotnet ef migrations add <MigrationName> \
  --project src/TaskFlow.Infrastructure \
  --startup-project src/TaskFlow.Api
```

Apply migrations:

```bash
dotnet ef database update \
  --project src/TaskFlow.Infrastructure \
  --startup-project src/TaskFlow.Api
```

### Startup Migration Behavior

`Database:ApplyMigrationsOnStartup` controls whether migrations run when the API starts:

| Environment | Default | Recommendation |
| ----------- | ------- | -------------- |
| Development | `true` | Convenient local setup |
| Docker Compose | `true` | Demo / local containers |
| Production | `false` | Run from CI/CD or init job |

## Configuration

```json
{
  "Database": {
    "ConnectionString": "Server=...;Database=TaskFlowDb;...",
    "ApplyMigrationsOnStartup": true,
    "EnableSensitiveDataLogging": false,
    "EnableDetailedErrors": false,
    "UseInMemory": false
  }
}
```

Environment variable: `Database__ConnectionString`.

## Seeding

`DataSeeder` runs after migrations:

- Always seeds **Identity roles**.
- Optionally seeds SuperAdmin and sample organization when `Seed:SeedSuperAdmin` / `Seed:SeedSampleOrganization` are `true` (Development only).

## Query Performance Guidelines

- List endpoints use server-side pagination (`Skip`/`Take`).
- Read queries use `AsNoTracking()`.
- Dashboard and report queries project aggregates in SQL.
- Avoid N+1: batch load related data or use explicit includes.

## Health Check

SQL connectivity is verified by the `sqlserver` health check tagged `ready`, exposed at `/health/ready`.
