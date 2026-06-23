# ADR-005: Optimistic Concurrency

## Status

Accepted

## Context

Multiple users may edit the same task or project concurrently. Last-write-wins without detection causes silent data loss.

## Decision

Use **optimistic concurrency** with SQL Server row versioning:

- `RowVersion` (`byte[]`) on aggregate root entities
- EF Core `[Timestamp]` / `IsRowVersion()` configuration
- Clients send current row version on update; conflicts return **409 Conflict**

## Alternatives Considered

| Alternative | Why Not Chosen |
| ----------- | -------------- |
| Pessimistic locking | Poor scalability; holds DB locks during user think time |
| Last-write-wins | Silent overwrites unacceptable for task management |
| Event sourcing | Operational complexity out of scope |

## Consequences

**Positive**

- Detects concurrent edits without long-held locks.
- Standard EF Core pattern with minimal code.

**Negative**

- Clients must handle conflict responses and refresh stale data.
- Row version must flow through DTOs on update endpoints.

## References

- [CodingStandards.md](../architecture/CodingStandards.md)
