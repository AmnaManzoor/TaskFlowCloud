# Deployment

Guide for running TaskFlow in development, Docker, and production-like environments.

## Docker Compose (Local)

```bash
cp .env.example .env   # optional — customize secrets
docker compose up --build
```

Services:

| Service | Port | Description |
| ------- | ---- | ----------- |
| `sqlserver` | 1433 | SQL Server 2022 |
| `api` | 8080 | TaskFlow API |

Volumes:

- `taskflow-sqlserver-data` — database files
- `taskflow-api-logs` — Serilog file output
- `taskflow-api-uploads` — attachment storage

API URL: `http://localhost:8080`  
Swagger (Development env): `http://localhost:8080/swagger`

## Dockerfile

Multi-stage build:

1. **build** — `dotnet restore` + `dotnet publish` (Release)
2. **final** — ASP.NET runtime image, exposes port 8080

## Health Probes

| Endpoint | Purpose | Checks |
| -------- | ------- | ------ |
| `/health/live` | Liveness | Process self-check |
| `/health/ready` | Readiness | SQL Server connectivity |
| `/health` | Combined | All registered checks |

Kubernetes example:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
```

## Production Checklist

- [ ] Set `ASPNETCORE_ENVIRONMENT=Production`
- [ ] Set `Database:ApplyMigrationsOnStartup=false`
- [ ] Run migrations from CI/CD before deployment
- [ ] Configure `Jwt:SecretKey` via secret store
- [ ] Configure `Database:ConnectionString` via secret store
- [ ] Disable `Seed:SeedSuperAdmin` and `Seed:SeedSampleOrganization`
- [ ] Mount durable volume or blob storage for uploads
- [ ] Configure reverse proxy with TLS and forwarded headers
- [ ] Restrict Swagger to Development or protect with auth
- [ ] Configure log aggregation (Application Insights, ELK, etc.)

## Environment Variables

| Variable | Maps To |
| -------- | ------- |
| `Database__ConnectionString` | SQL connection |
| `Database__ApplyMigrationsOnStartup` | Auto-migrate flag |
| `Jwt__SecretKey` | JWT signing key |
| `Jwt__AccessTokenExpirationMinutes` | Token lifetime |
| `Seed__SeedSuperAdmin` | Dev seed flag |

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs restore, build, and test on push/PR.

Recommended pipeline stages for production:

1. Restore & build
2. Unit + integration tests
3. EF migration bundle or scripted `dotnet ef database update`
4. Docker image build & push
5. Deploy with health probe verification

## Manual Migration (Production)

```bash
dotnet ef database update \
  --project src/TaskFlow.Infrastructure \
  --startup-project src/TaskFlow.Api \
  --connection "$DATABASE_CONNECTION_STRING"
```

Or generate a migration bundle:

```bash
dotnet ef migrations bundle \
  --project src/TaskFlow.Infrastructure \
  --startup-project src/TaskFlow.Api \
  --output taskflow-migrate
```

## Azure Migration Points (Description Only)

These are recommended Azure services when moving beyond local/Docker deployment — **not implemented in this repository**:

| Component | Azure Service | Notes |
| --------- | ------------- | ----- |
| API hosting | Azure App Service or Container Apps | Deploy Docker image; configure health probes |
| Database | Azure SQL Database | Managed SQL; connection string via Key Vault reference |
| Secrets | Azure Key Vault | JWT key, SQL credentials |
| File storage | Azure Blob Storage | Replace local attachment storage (ADR-006) |
| Logging | Application Insights + Log Analytics | Serilog sink or OpenTelemetry exporter |
| CI/CD | Azure DevOps or GitHub Actions | Migration job before slot swap |
| Identity | Azure AD B2C (optional) | External identity provider integration |

## Monitoring

- Correlate support tickets using `correlationId` from Problem Details responses.
- Monitor `/health/ready` for database connectivity failures.
- Alert on Serilog `Error` and `Fatal` levels.
