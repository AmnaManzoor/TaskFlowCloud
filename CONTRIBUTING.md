# Contributing to TaskFlow

Thank you for your interest in contributing. This document outlines how to work on the codebase effectively.

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- SQL Server (local, Docker, or LocalDB)
- Optional: Docker Desktop for containerized runs

## Getting Started

1. Fork and clone the repository.
2. Copy `.env.example` to `.env` when using Docker Compose.
3. Run migrations (see [README.md](README.md#database-migrations)).
4. Start the API: `dotnet run --project src/TaskFlow.Api`.

## Development Workflow

1. Create a feature branch from `main`.
2. Make focused changes that preserve Clean Architecture boundaries.
3. Add or update tests for behavior you change.
4. Run `dotnet build` and `dotnet test` before opening a pull request.
5. Update documentation when configuration, endpoints, or architecture change.

## Coding Standards

Follow [docs/architecture/CodingStandards.md](docs/architecture/CodingStandards.md). Key rules:

- Domain has no infrastructure dependencies.
- Use `Result<T>` for expected failures; exceptions for unexpected errors.
- Prefer async/await with `CancellationToken` on I/O paths.
- Use FluentValidation for request validation.
- Do not introduce generic repositories.

## Pull Requests

Use the pull request template. Ensure:

- CI passes (build + tests).
- No secrets committed.
- Swagger/API docs updated when endpoints change.
- Migrations included when schema changes.

## Reporting Issues

Use the bug report template and include reproduction steps, expected vs actual behavior, and environment details.

## Security

Report vulnerabilities privately — see [SECURITY.md](SECURITY.md).
