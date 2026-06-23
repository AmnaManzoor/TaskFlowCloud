# ADR-003: Authentication Strategy

## Status

Accepted

## Context

TaskFlow requires authenticated API access with role-based authorization across organizations, projects, and teams. Clients include SPA/mobile frontends consuming REST endpoints.

## Decision

Use **JWT Bearer authentication** with **ASP.NET Core Identity** for credential storage and **refresh tokens** for session renewal.

- Access tokens: short-lived, signed with symmetric key (`Jwt:SecretKey`)
- Refresh tokens: stored in database, rotatable, revocable
- Roles: Identity roles mapped to domain role constants

## Alternatives Considered

| Alternative | Why Not Chosen |
| ----------- | -------------- |
| Cookie-based sessions | Less suitable for SPA/mobile API consumers |
| OAuth2/OIDC external provider only | Adds dependency on IdP for MVP; can integrate later |
| API keys | Insufficient for user-scoped authorization model |

## Consequences

**Positive**

- Stateless API scaling (access token validation without server session store).
- Industry-standard pattern familiar to portfolio reviewers.
- Refresh tokens enable secure long-lived sessions.

**Negative**

- Symmetric key management requires secure secret storage in production.
- Token revocation requires refresh token blacklist/expiry checks.
- No built-in WebSocket auth extension (out of scope).

## References

- [Authentication.md](../architecture/Authentication.md)
