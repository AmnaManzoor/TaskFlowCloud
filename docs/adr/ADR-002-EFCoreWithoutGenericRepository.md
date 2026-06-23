# ADR-002: EF Core Without Generic Repository

## Status

Accepted

## Context

Many .NET templates introduce `IRepository<T>` abstractions over EF Core. TaskFlow services perform varied queries — pagination, projections, aggregates, and includes — that a generic repository rarely expresses cleanly.

## Decision

Use **`ApplicationDbContext` directly** in Infrastructure service classes. Application layer defines specific service interfaces (`ITaskService`, `IProjectService`) rather than repository interfaces.

## Alternatives Considered

| Alternative | Why Not Chosen |
| ----------- | -------------- |
| Generic `IRepository<T>` | Leaks EF patterns anyway; adds indirection without benefit |
| Specification pattern | Useful for complex filters but adds abstraction weight for current query diversity |
| CQRS with separate read models | Out of scope; reporting uses optimized read queries within services |

## Consequences

**Positive**

- Full LINQ expressiveness without wrapper methods.
- Fewer interfaces to maintain.
- Aligns with Microsoft guidance for EF Core–backed services.

**Negative**

- Services are coupled to EF Core in Infrastructure (acceptable — Application remains EF-free).
- Unit testing services requires in-memory DB or integration tests rather than mocking repositories.

## References

- [Database.md](../architecture/Database.md)
- [CodingStandards.md](../architecture/CodingStandards.md)
