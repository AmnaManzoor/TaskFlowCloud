# Architecture

TaskFlow follows **Clean Architecture** (Onion Architecture) with explicit dependency direction: inner layers never depend on outer layers.

## Layer Responsibilities

| Layer | Project | Responsibility |
| ----- | ------- | -------------- |
| Domain | `TaskFlow.Domain` | Entities, enums, domain constants, invariants |
| Application | `TaskFlow.Application` | DTOs, interfaces, validators, options, use-case contracts |
| Infrastructure | `TaskFlow.Infrastructure` | EF Core, Identity, JWT, file storage, service implementations |
| API | `TaskFlow.Api` | HTTP endpoints, middleware, Swagger, health checks |
| Shared Kernel | `TaskFlow.SharedKernel` | Cross-cutting primitives (`Result<T>`, `DomainException`) |

## Clean Architecture Diagram

```mermaid
flowchart TB
    subgraph Presentation["Presentation (TaskFlow.Api)"]
        EP[Minimal API Endpoints]
        MW[Middleware Pipeline]
        SW[Swagger / OpenAPI]
    end

    subgraph Application["Application (TaskFlow.Application)"]
        IF[Service Interfaces]
        DTO[DTOs & Validators]
        OPT[Options & Configuration]
    end

    subgraph Domain["Domain (TaskFlow.Domain)"]
        ENT[Entities & Enums]
        RULES[Business Rules]
    end

    subgraph Infrastructure["Infrastructure (TaskFlow.Infrastructure)"]
        EF[EF Core DbContext]
        ID[ASP.NET Identity]
        JWT[JWT Token Service]
        FS[Local File Storage]
        SVC[Service Implementations]
    end

    EP --> IF
    MW --> EP
    SVC --> IF
    SVC --> ENT
    EF --> ENT
    ID --> ENT
    IF --> ENT
    DTO --> ENT
```

## Overall Solution Architecture

```mermaid
flowchart LR
    Client[Client / Swagger UI]
    API[TaskFlow.Api]
    APP[TaskFlow.Application]
    INF[TaskFlow.Infrastructure]
    DB[(SQL Server)]
    FS[Local File Storage]

    Client -->|HTTPS + JWT| API
    API --> APP
    API --> INF
    INF --> APP
    INF --> DB
    INF --> FS
```

## Cross-Cutting Concerns

- **Validation:** FluentValidation in Application; auto-validation + endpoint filters in API.
- **Errors:** Global exception middleware returns RFC 7807 Problem Details with `correlationId`.
- **Logging:** Serilog with structured properties, request logging, and correlation ID enrichment.
- **Audit:** `IAuditTriggerService` records immutable audit entries after successful mutations.
- **Notifications:** `INotificationTriggerService` creates in-app notifications after domain events.
- **Access control:** Dedicated `*AccessService` classes enforce organization/project/task/report scope.

## Design Principles

1. **No generic repository** — EF Core `DbContext` is used directly in services (see ADR-002).
2. **Result pattern** — Expected failures return `Result`/`Result<T>` instead of throwing.
3. **Soft delete** — Entities implement soft delete with global query filters (see ADR-004).
4. **Optimistic concurrency** — Row version tokens on aggregate roots (see ADR-005).
5. **Trigger services** — Side effects (audit, notifications) are invoked after `SaveChangesAsync`.

## Request Pipeline

```mermaid
sequenceDiagram
    participant C as Client
    participant RL as Request Logging
    participant EX as Exception Middleware
    participant AU as Authentication
    participant AC as Audit Context
    participant AZ as Authorization
    participant H as Endpoint Handler

    C->>RL: HTTP Request
    RL->>EX: Forward
    EX->>AU: Forward
    AU->>AC: Capture IP / UserAgent / CorrelationId
    AC->>AZ: Forward
    AZ->>H: Authorized handler
    H-->>C: JSON / ProblemDetails
```

## Module Map

| Module | Primary Services | API Prefix |
| ------ | ---------------- | ---------- |
| Auth | `AuthService`, `JwtTokenService` | `/api/auth` |
| Organizations | `OrganizationService` | `/api/organizations` |
| Teams | `TeamService` | `/api/teams` |
| Users | `UserManagementService` | `/api/users` |
| Projects | `ProjectService` | `/api/projects` |
| Tasks | `TaskService` | `/api/tasks` |
| Comments | `CommentService` | `/api/comments` |
| Attachments | `AttachmentService` | `/api/attachments` |
| Notifications | `NotificationService` | `/api/notifications` |
| Audit | `AuditLogService`, `ActivityHistoryService` | `/api/auditlogs`, `/api/activity` |
| Dashboard | `DashboardService` | `/api/dashboard` |
| Reports | `ReportService` | `/api/reports` |

## Lifecycle Diagrams

### Project Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Planning: Create project
    Planning --> Active: Start work
    Active --> OnHold: Pause
    OnHold --> Active: Resume
    Active --> Completed: All tasks done
    Active --> Cancelled: Cancel project
    Planning --> Cancelled: Cancel before start
    Completed --> [*]
    Cancelled --> [*]
```

### Task Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Todo: Create task
    Todo --> InProgress: Start work
    InProgress --> InReview: Submit for review
    InReview --> InProgress: Changes requested
    InReview --> Done: Approved
    InProgress --> Done: Complete directly
    Todo --> Done: Fast-track complete
    Done --> [*]
    Todo --> Cancelled: Cancel
    InProgress --> Cancelled: Cancel
    Cancelled --> [*]
```

## Related Documents

- [FolderStructure.md](FolderStructure.md)
- [CodingStandards.md](CodingStandards.md)
- [Authentication.md](Authentication.md)
- [Database.md](Database.md)
- [Deployment.md](Deployment.md)
