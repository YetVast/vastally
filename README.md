# VastAlliance

**Development Shorthand:** `vastally`  
**Parent Umbrella:** Yet Vast Solutions (YVS)  
**Milestone:** V0 Foundation  

VastAlliance is a personal bio-data profile management and administration platform under Yet Vast Solutions, providing flexible structured bio-data collection, central Yet Vast Auth Google sign-in, profile ownership enforcement, and administrative moderation.

---

## Shared Ecosystem Dependencies

Consumes official Yet Vast Solutions shared packages via private GitHub Packages registry (`npm.pkg.github.com`):
- `@yetvast/auth@0.2.0`: Central authentication contracts, OAuth PKCE client, and server JWKS verification.
- `@yetvast/auth-ui@0.2.0`: Reusable authentication and account UI primitives.

Package downloads are authorized via `${NODE_AUTH_TOKEN}` specified in `.npmrc` according to `YVS-STD-2026-PKG-001`.

---

## Quality Verification Commands

All four engineering quality gates are verified and pass:

```bash
# 1. Automated Test Suite (Vitest)
npm test

# 2. Static Typecheck (TypeScript 5)
npm run typecheck

# 3. Linter & Static Analysis (Next.js ESLint)
npm run lint

# 4. Production Next.js Build
npm run build
```

---

## Documentation Index

- [Architecture Overview](docs/architecture/ARCHITECTURE.md)
- [Yet Vast Auth Integration Specification](docs/auth/YETVAST_AUTH_INTEGRATION.md)
- [Profile Data Model & ID Generation](docs/data/PROFILE_DATA_MODEL.md)
- [Authorization & Security Controls](docs/security/AUTHORIZATION_AND_SECURITY.md)
- [Implementation Status Tracker](docs/implementation/IMPLEMENTATION_STATUS.md)
- [Architecture Decision Records (ADRs)](docs/decisions/ARCHITECTURE_DECISIONS.md)
- [V0 Implementation Record](docs/implementation/2026-11-16-vastalliance-v0-foundation.md)
