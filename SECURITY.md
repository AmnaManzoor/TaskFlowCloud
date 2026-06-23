# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

**Do not open public GitHub issues for security vulnerabilities.**

If you discover a security issue, please report it responsibly:

1. Email the maintainers (replace with your contact) or use GitHub private vulnerability reporting if enabled.
2. Include steps to reproduce, impact assessment, and suggested fix if available.
3. Allow reasonable time for remediation before public disclosure.

## Security Practices

TaskFlow implements the following controls:

- **Authentication:** JWT bearer tokens with configurable expiration; refresh token rotation.
- **Authorization:** Role- and membership-based access checks in dedicated access services.
- **Input validation:** FluentValidation on all API inputs; file upload size and extension checks.
- **Error handling:** RFC 7807 Problem Details without stack traces in production responses.
- **Logging:** Structured Serilog output; avoid logging passwords, tokens, or connection secrets.
- **Configuration:** Secrets supplied via environment variables or secret stores — never committed.

## Deployment Recommendations

- Set `ASPNETCORE_ENVIRONMENT=Production`.
- Set `Database:ApplyMigrationsOnStartup=false` and run migrations from CI/CD.
- Use strong, unique `Jwt:SecretKey` (≥ 32 bytes of entropy).
- Terminate TLS at a reverse proxy; configure forwarded headers.
- Restrict SQL Server network access to application subnets only.
- Mount upload storage on durable volumes or migrate to blob storage (see ADR-006).

## Known Limitations

- Local file storage for attachments (not suitable for multi-instance deployments without shared storage).
- REST polling for notifications (no WebSocket push).
- Rate limiting is not enabled by default — configure at the edge in production.
