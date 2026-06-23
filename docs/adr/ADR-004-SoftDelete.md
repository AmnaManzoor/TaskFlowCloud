# ADR-004: Soft Delete

## Status

Accepted

## Context

Task management data (projects, tasks, comments) should be recoverable and auditable. Hard deletes break referential history and complicate reporting.

## Decision

Implement **soft delete** on applicable entities via `ISoftDeletable` with:

- `IsDeleted` flag
- `DeletedAt` / `DeletedBy` metadata
- EF Core **global query filter** excluding deleted rows by default

Explicit `IgnoreQueryFilters()` is used only when historical references require deleted entity names (e.g. audit summaries).

## Alternatives Considered

| Alternative | Why Not Chosen |
| ----------- | -------------- |
| Hard delete only | Data loss; breaks audit trail integrity |
| Archive tables | Duplicates schema; complicates queries |
| Temporal tables (SQL Server) | Powerful but adds DBA complexity beyond current scope |

## Consequences

**Positive**

- Deleted records remain for audit and potential restore.
- Default queries automatically exclude deleted data.

**Negative**

- Unique indexes must account for soft-deleted rows.
- Developers must remember `IgnoreQueryFilters()` for admin/audit scenarios.
- Database grows unless purge jobs are added later.

## References

- [Database.md](../architecture/Database.md)
