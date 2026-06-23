# Changelog

All notable changes to TaskFlow are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Production configuration profile (`appsettings.Production.json`).
- Health probe endpoints: `/health/live` and `/health/ready`.
- Architecture documentation under `docs/architecture/`.
- Architecture Decision Records under `docs/adr/`.
- GitHub issue/PR templates and CI workflow.
- Docker upload volume and `.env.example` for secrets.
- Configurable `Database:ApplyMigrationsOnStartup`.

### Changed

- Improved Swagger API description and structured request logging (correlation ID).
- HSTS and forwarded headers enabled outside Development/Testing.
- `.gitignore` excludes runtime uploads and coverage output.

### Security

- Production defaults disable auto-migration and development seed data.
- Documented secret management via environment variables.

## [1.0.0] - 2026-06-22

### Added

- Initial TaskFlow release: organizations, projects, tasks, comments, attachments.
- Notifications, audit logs, activity history, dashboard, and reporting modules.
- JWT authentication with refresh tokens and role-based authorization.
- Docker Compose stack with SQL Server.
- Unit and integration test suites.
