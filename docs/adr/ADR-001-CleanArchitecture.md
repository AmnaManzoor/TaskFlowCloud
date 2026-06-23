# ADR-001: Clean Architecture

## Status

Accepted

## Context

TaskFlow is an enterprise task management platform expected to grow across multiple feature modules (projects, tasks, notifications, reporting). The codebase must remain testable, maintainable, and suitable for a senior .NET portfolio demonstration.

## Decision

Adopt **Clean Architecture** with four primary layers:

- **Domain** — entities and business rules, zero external dependencies
- **Application** — use-case contracts, DTOs, validation
- **Infrastructure** — EF Core, Identity, JWT, file storage
- **Api** — HTTP surface, middleware, OpenAPI

Dependency direction flows inward: Api → Infrastructure → Application → Domain.

## Alternatives Considered

| Alternative | Why Not Chosen |
| ----------- | -------------- |
| Vertical slice architecture | Higher folder churn for a modular monolith; Clean Architecture better demonstrates layer discipline |
| Traditional N-tier (UI → BLL → DAL) | BLL often becomes a god layer; Application interfaces keep use cases explicit |
| Microservices | Excessive operational complexity for current scope |

## Consequences

**Positive**

- Clear boundaries enable independent testing of Application contracts.
- Infrastructure can be swapped (e.g. blob storage) without Domain changes.
- Portfolio reviewers can quickly identify layer responsibilities.

**Negative**

- More projects and files than a minimal API template.
- Requires discipline to avoid Infrastructure leaking into Application.

## References

- [Architecture.md](../architecture/Architecture.md)
