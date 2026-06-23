# ADR-006: File Storage

## Status

Accepted

## Context

TaskFlow supports profile images and task attachments. Files must be stored durably and served to authorized users.

## Decision

Use **local filesystem storage** under configurable paths:

- Profile images: `uploads/profiles` (static file middleware)
- Attachments: `wwwroot/uploads` (metadata in `Attachment` entity)

Paths and size limits are bound via `FileStorageOptions`. Docker Compose mounts a named volume for uploads.

## Alternatives Considered

| Alternative | Why Not Chosen |
| ----------- | -------------- |
| Azure Blob Storage | Cloud-specific; out of scope for portable portfolio project |
| Database BLOB columns | Poor performance and backup characteristics for large files |
| S3-compatible storage | Requires additional SDK and credentials for local dev |

## Consequences

**Positive**

- Zero external dependencies for local and Docker development.
- Simple implementation suitable for single-instance deployment.

**Negative**

- Multi-instance deployments require shared storage (NFS, blob migration).
- No built-in CDN integration.
- Backup strategy must include upload volumes separately from SQL.

## Future Path

Migrate to Azure Blob Storage or S3 by implementing `IFileStorageService` without changing Domain/Application contracts.

## References

- [Deployment.md](../architecture/Deployment.md)
